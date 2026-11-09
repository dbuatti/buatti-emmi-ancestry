#!/usr/bin/env python3
"""Reconcile manually sent replies with prepared correspondence drafts.

Detects when an outgoing Gmail message fulfils a prepared draft, without
sending or modifying anything.

Usage:
  python3 scripts/reconcile-sent-replies.py              # dry-run (report only)
  python3 scripts/reconcile-sent-replies.py --apply       # write sent status to draft JSON
  python3 scripts/reconcile-sent-replies.py --json       # JSON output

Matching signals (all must be considered; no single signal is sufficient):
  1. Same Gmail thread ID as the draft's source thread.
  2. Outgoing direction.
  3. Sent after the last relevant inbound message.
  4. Same recipient as the prepared draft.
  5. Body similarity (normalised prefix overlap or Jaccard on tokens).
  6. Subject correspondence.

Match confidence:
  - exact: body prefix match >= 80% or Jaccard >= 0.6
  - high: body prefix match >= 50% or Jaccard >= 0.4
  - medium: same thread + recipient + date order, body similarity >= 0.2
  - low/none: insufficient evidence

A sent message that is merely in the same thread does NOT automatically
complete every prepared draft. Each draft is matched independently.

No Gmail writes, no sends, no DB changes, no family-data changes.
"""
import argparse
import json
import os
import re
import sqlite3
import sys
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
DRAFTS_DIR = os.path.join(ROOT, "correspondence", "extracted", "drafts")
THREADS_PATH = os.path.join(ROOT, "correspondence", "extracted", "threads.json")

GMAIL_DRAFT_SENT_STATUSES = {"sent", "completed"}


def load_json(path, default=None):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default if default is not None else {}


def norm_text(text):
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"\s+", " ", text).strip()
    return text


def body_similarity(draft_body, sent_body):
    """Return (prefix_ratio, jaccard) between two bodies."""
    if not draft_body or not sent_body:
        return 0.0, 0.0
    d = norm_text(draft_body)
    s = norm_text(sent_body)
    # prefix ratio: how much of the draft's first 200 chars appear in sent
    prefix_len = min(200, len(d))
    prefix = d[:prefix_len]
    prefix_hits = sum(1 for i in range(len(prefix)) if i < len(s) and prefix[i] == s[i])
    prefix_ratio = prefix_hits / prefix_len if prefix_len else 0.0
    # jaccard on word tokens
    dt = set(d.split())
    st = set(s.split())
    if not dt or not st:
        return prefix_ratio, 0.0
    jaccard = len(dt & st) / len(dt | st)
    return prefix_ratio, jaccard


def find_sent_replies(draft, conn, excluded_msg_ids=None):
    """Find outbound messages that may fulfil this draft. Returns list of candidates."""
    excluded_msg_ids = excluded_msg_ids or set()
    thread_id = draft.get("thread_id", "").replace("_new", "")
    if not thread_id:
        return []

    # Get messages in this thread
    rows = conn.execute(
        "SELECT id, direction, from_email, to_json, subject, body_text, sent_at, received_at, gmail_message_id "
        "FROM messages WHERE gmail_thread_id=? ORDER BY COALESCE(received_at, sent_at)",
        (thread_id,)).fetchall()

    if not rows:
        return []

    # Last inbound message timestamp
    last_inbound_ts = None
    for r in rows:
        if r["direction"] == "in":
            ts = r["received_at"] or r["sent_at"]
            if ts and (last_inbound_ts is None or ts > last_inbound_ts):
                last_inbound_ts = ts

    # Draft recipient
    draft_recipient = (draft.get("recipient_email") or "").lower()
    if not draft_recipient and draft.get("recipient"):
        import re
        m = re.search(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", draft.get("recipient", ""))
        if m:
            draft_recipient = m.group(0).lower()

    # Required actions from the draft's provenance or detect from source
    required_actions = draft.get("required_actions") or []
    # Also check if the draft text references required actions

    candidates = []
    for r in rows:
        if r["direction"] != "out":
            continue
        if r["id"] in excluded_msg_ids:
            continue
        sent_ts = r["sent_at"] or r["received_at"]
        # must be after last inbound
        if last_inbound_ts and sent_ts and sent_ts <= last_inbound_ts:
            continue
        # recipient check
        to_emails = []
        try:
            to = json.loads(r["to_json"] or "[]")
            to_emails = [e.get("email", "").lower() for e in to if e.get("email")]
        except (ValueError, TypeError):
            pass
        recipient_match = False
        if draft_recipient and to_emails:
            recipient_match = draft_recipient in to_emails
        elif not draft_recipient:
            recipient_match = True  # no recipient to compare

        # body similarity
        prefix_ratio, jaccard = body_similarity(draft.get("draft_text", ""), r["body_text"])

        # subject correspondence
        subject_match = False
        draft_subj = (draft.get("subject_suggestion") or "").lower()
        sent_subj = (r["subject"] or "").lower()
        if draft_subj and sent_subj:
            draft_terms = set(draft_subj.split())
            sent_terms = set(sent_subj.split())
            if draft_terms & sent_terms:
                subject_match = True
        elif not draft_subj:
            subject_match = True  # no subject to compare

        # Action verification: check if sent message addresses required actions
        action_verified = False
        action_evidence = []
        if required_actions:
            sent_body_lower = (r["body_text"] or "").lower()
            for action in required_actions:
                action_id = action.get("id", "")
                required_terms = action.get("required_terms", [])
                if not required_terms:
                    # no specific terms — can't verify
                    continue
                # check if any group of required terms is present in sent body
                for term_group in required_terms:
                    if all(term.lower() in sent_body_lower for term in term_group):
                        action_verified = True
                        action_evidence.append(action_id)
                        break
            # if no required_actions had terms, fall back to similarity only
            if not any(a.get("required_terms") for a in required_actions):
                action_verified = True  # no terms to check
        else:
            # no required actions recorded — similarity only
            action_verified = True

        # Determine confidence
        if prefix_ratio >= 0.8 or jaccard >= 0.6:
            # Require action verification for auto-reconciliation eligibility
            if action_verified:
                confidence = "exact"
            else:
                confidence = "high"  # downgrade: similarity high but action not verified
        elif prefix_ratio >= 0.5 or jaccard >= 0.4:
            confidence = "high"
        elif recipient_match and subject_match and (prefix_ratio >= 0.2 or jaccard >= 0.2):
            confidence = "medium"
        elif recipient_match and subject_match and last_inbound_ts and sent_ts:
            confidence = "low"
        else:
            confidence = "none"

        if confidence in ("exact", "high", "medium", "low") and (recipient_match or not draft_recipient):
            candidates.append({
                "message_id": r["id"],
                "gmail_message_id": r["gmail_message_id"],
                "sent_at": sent_ts,
                "recipient": to_emails,
                "recipient_match": recipient_match,
                "subject_match": subject_match,
                "prefix_ratio": round(prefix_ratio, 3),
                "jaccard": round(jaccard, 3),
                "confidence": confidence,
                "action_verified": action_verified,
                "action_evidence": action_evidence,
                "body_preview": (r["body_text"] or "")[:200],
            })

    return candidates, last_inbound_ts


def classify_match(candidates):
    """Classify the match: exact, high, ambiguous, or none."""
    if not candidates:
        return "none", None, []
    # filter to meaningful matches
    meaningful = [c for c in candidates if c["confidence"] in ("exact", "high", "medium")]
    if not meaningful:
        return "none", None, candidates
    if len(meaningful) == 1:
        return meaningful[0]["confidence"], meaningful[0], meaningful
    # multiple candidates: check if top two have same confidence
    meaningful.sort(key=lambda c: (0 if c["confidence"] == "exact" else 1 if c["confidence"] == "high" else 2, -c["prefix_ratio"]))
    if meaningful[0]["confidence"] == meaningful[1]["confidence"]:
        return "ambiguous", None, meaningful
    return meaningful[0]["confidence"], meaningful[0], meaningful


def main():
    ap = argparse.ArgumentParser(description="Reconcile manually sent replies with prepared drafts.")
    ap.add_argument("--apply", action="store_true", help="Write sent status to draft JSON (default: report only)")
    ap.add_argument("--json", action="store_true", help="JSON output")
    ap.add_argument("--thread", default=None, help="Scope to a specific thread ID")
    args = ap.parse_args()

    conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    conn.row_factory = sqlite3.Row

    # Load all drafts
    drafts = []
    for fname in sorted(os.listdir(DRAFTS_DIR)):
        if not fname.endswith(".json"):
            continue
        path = os.path.join(DRAFTS_DIR, fname)
        try:
            d = json.load(open(path))
            drafts.append((fname, path, d))
        except (OSError, ValueError):
            continue

    # Scope to thread if specified
    if args.thread:
        drafts = [(f, p, d) for f, p, d in drafts if d.get("thread_id", "").replace("_new", "") == args.thread]

    results = []
    used_sent_ids = set()  # one-to-one: a sent message reconciles at most one draft

    for fname, path, draft in drafts:
        # Skip drafts that are already marked as sent
        if draft.get("sent_message_id") or draft.get("gmail_draft_status") == "sent":
            results.append({"file": fname, "status": "already_completed",
                           "thread_id": draft.get("thread_id"),
                           "recipient": draft.get("recipient"),
                           "readiness": draft.get("readiness"),
                           "draft": draft})
            continue

        # Protect blocked and suppressed drafts
        is_blocked = draft.get("readiness") == "blocked"
        is_suppressed = bool(draft.get("suppressed")) or bool(
            (draft.get("provenance", {}).get("suggested_new_correspondence") or {}).get("suppressed"))
        if is_blocked or is_suppressed:
            candidates, last_inbound_ts = find_sent_replies(draft, conn, excluded_msg_ids=used_sent_ids)
            match_type, best, all_candidates = classify_match(candidates)
            result = {
                "file": fname,
                "thread_id": draft.get("thread_id"),
                "recipient": draft.get("recipient"),
                "readiness": draft.get("readiness"),
                "match_type": match_type,
                "best_match": best,
                "all_candidates": all_candidates,
                "last_inbound_ts": last_inbound_ts,
                "status": "protected_blocked" if is_blocked else "protected_suppressed",
                "protected_reason": "blocked draft" if is_blocked else "suppressed draft",
            }
            results.append(result)
            if best and match_type in ("exact", "high", "medium"):
                used_sent_ids.add(best["message_id"])
            continue

        candidates, last_inbound_ts = find_sent_replies(draft, conn, excluded_msg_ids=used_sent_ids)
        match_type, best, all_candidates = classify_match(candidates)

        result = {
            "file": fname,
            "thread_id": draft.get("thread_id"),
            "recipient": draft.get("recipient"),
            "readiness": draft.get("readiness"),
            "match_type": match_type,
            "best_match": best,
            "all_candidates": all_candidates,
            "last_inbound_ts": last_inbound_ts,
        }

        # Only exact matches with action verification are auto-reconciled
        if match_type == "exact" and best and best.get("action_verified", False):
            result["status"] = "sent_match"
            if args.apply:
                draft["sent_message_id"] = best["message_id"]
                draft["sent_gmail_message_id"] = best["gmail_message_id"]
                draft["sent_at"] = best["sent_at"]
                draft["sent_recipient"] = best["recipient"]
                draft["match_confidence"] = best["confidence"]
                draft["match_type"] = match_type
                draft["reconciled_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
                draft["readiness"] = "sent"
                draft["review_status"] = "sent"
                with open(path, "w", encoding="utf-8") as f:
                    json.dump(draft, f, indent=2, ensure_ascii=False)
                    f.write("\n")
                result["applied"] = True
                used_sent_ids.add(best["message_id"])
            else:
                result["applied"] = False
        elif match_type == "exact" and best and not best.get("action_verified", True):
            result["status"] = "possible_sent_reply"
            result["reason"] = "exact similarity but action not verified"
        elif match_type in ("high", "medium", "low"):
            result["status"] = "possible_sent_reply"
        elif match_type == "ambiguous":
            result["status"] = "possible_sent_reply"
        else:
            result["status"] = "no_match"

        results.append(result)
        if best and match_type in ("exact", "high", "medium"):
            used_sent_ids.add(best["message_id"])

    conn.close()

    if args.json:
        print(json.dumps(results, indent=2, ensure_ascii=False, default=str))
        return 0

    # Human-readable report
    print("=== SENT REPLY RECONCILIATION ===")
    print("Drafts examined: %d" % len(results))
    for r in results:
        print()
        print("  %s" % r["file"])
        print("    thread: %s | recipient: %s | readiness: %s" % (
            r["thread_id"], r["recipient"], r["readiness"]))
        print("    match: %s" % r["status"])
        if r.get("best_match"):
            bm = r["best_match"]
            print("    best candidate: msg %s (sent %s)" % (bm["message_id"], bm["sent_at"]))
            print("    confidence: %s (prefix=%.2f jaccard=%.2f)" % (
                bm["confidence"], bm["prefix_ratio"], bm["jaccard"]))
            print("    recipient_match: %s | subject_match: %s" % (
                bm["recipient_match"], bm["subject_match"]))
        if r.get("all_candidates"):
            print("    candidates: %d" % len(r["all_candidates"]))
        if r.get("applied"):
            print("    -> APPLIED: draft marked as sent")
    print()
    print("Statuses: %s" % {s: sum(1 for r in results if r["status"] == s)
                            for s in set(r["status"] for r in results)})
    return 0


if __name__ == "__main__":
    sys.exit(main())
