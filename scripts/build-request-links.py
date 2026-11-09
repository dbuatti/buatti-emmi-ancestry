#!/usr/bin/env python3
"""Step 2: reply-to-request linkage for correspondence.

Builds correspondence/extracted/request-links.json (sidecar, no schema change).
Links outbound research requests to inbound replies, PEC events and supplied
documents across separate Gmail threads, using deterministic signals.

Idempotent: human-confirmed fulfilment, manually approved links, reviewed
ambiguity decisions and human notes are preserved across rebuilds. Derived
values are recomputed; human values are never overwritten.

Event kinds (kept distinct):
  request_sent, pec_accepted, pec_delivered, protocol_registered,
  substantive_response_received, document_supplied, fulfilment_confirmed

A PEC delivery receipt is NOT evidence of document supply or fulfilment.

No Gmail writes, no sends, no familyData changes, no commits.
"""
import argparse
import datetime
import hashlib
import json
import os
import re
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
EXTRACTED = os.path.join(ROOT, "correspondence", "extracted")
THREADS_PATH = os.path.join(EXTRACTED, "threads.json")
ACTIONS_PATH = os.path.join(EXTRACTED, "actions.json")
GATE_PATH = os.path.join(EXTRACTED, "attachment-gate.json")
ANALYSIS_DIR = os.path.join(EXTRACTED, "analysis")
OUT = os.path.join(EXTRACTED, "request-links.json")

GENERIC_PROTOS = {"", "prot", "n", "nr", "no"}


def now_iso():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def load_json(path, default=None):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default if default is not None else {}


def norm_inst(s):
    s = (s or "").lower().strip()
    s = re.sub(r"\bcomune\s+di\b", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def norm_person(s):
    toks = (s or "").lower().replace(",", " ").split()
    return " ".join(sorted(set(toks)))


def event_kinds(msg, is_source, has_docs, gate_entry):
    kinds = []
    direction = msg.get("direction")
    subject = (msg.get("subject") or "").lower()
    if direction == "out":
        if is_source:
            kinds.append("request_sent")
        return kinds
    # inbound
    is_receipt = any(k in subject for k in [
        "ricevuta", "conferma di ricezione", "avvenuta protocollazione",
        "delivery status notification", "avvenuta consegna", "notifica avvenuta",
    ])
    is_delivery = any(k in subject for k in ["avvenuta consegna", "delivery status notification", "delivered"])
    has_proto = ("prot" in subject) or ("reg_ufficiale" in subject) or ("reg ufficiale" in subject)
    # protocol number in subject bracket?
    if re.search(r"\d{4,}(?:/\d{4})?", subject):
        has_proto = True
    if has_docs:
        kinds.append("document_supplied")
    if is_receipt:
        if is_delivery:
            kinds.append("pec_delivered")
        else:
            kinds.append("pec_accepted")
    if has_proto and is_receipt:
        kinds.append("protocol_registered")
    if has_proto and not is_receipt and not has_docs:
        # a non-receipt inbound carrying a protocol -> registration notice
        kinds.append("protocol_registered")
    # substantive response: inbound that is not a pure receipt, or that carries documents
    if not is_receipt or has_docs:
        kinds.append("substantive_response_received")
    # dedup
    out = []
    for k in kinds:
        if k not in out:
            out.append(k)
    return out


def requested_items_for_thread(thread, analyses):
    items = []
    seen = set()
    for a in (thread.get("actions") or []):
        owner = (a.get("owner") or "").lower()
        if owner in ("them", "institution", "theirs"):
            desc = a.get("description") or a.get("value") or ""
            if desc and desc not in seen:
                seen.add(desc)
                items.append({"description": desc, "status": a.get("status") or "open",
                              "evidence_msg": a.get("evidence_msg")})
    for mid in (thread.get("message_ids") or []):
        an = analyses.get(mid, {})
        for ar in (an.get("actions_requested") or []):
            val = ar.get("value") if isinstance(ar, dict) else str(ar)
            if val and val not in seen:
                seen.add(val)
                items.append({"description": val, "status": "open",
                              "evidence_msg": mid})
    return items


def is_request_thread(thread, analyses):
    """An outbound enquiry counts as a sent request only if there is evidence
    of an actual enquiry (actions_requested or institutional actions). A
    lifeEvent with known_no_record is a research need, not a sent request."""
    has_outbound = bool(thread.get("last_outbound"))
    if not has_outbound:
        return False
    items = requested_items_for_thread(thread, analyses)
    if items:
        return True
    # fallback: thread classification implies a request was sent
    # (we don't have classification here; check actions.json later)
    return False


def build_requests(threads, analyses, actions_data):
    requests = []
    for tid, t in threads.items():
        if not is_request_thread(t, analyses):
            continue
        items = requested_items_for_thread(t, analyses)
        sent_at = t.get("last_outbound") or t.get("last_activity")
        # source message = last outbound message in thread
        out_msgs = [m for m in (t.get("message_ids") or [])]
        # find outbound msg id from db? we don't have direction here; use last_outbound timestamp match via analysis
        # Use the thread's message_ids; source message is the one whose analysis has actions_requested, else last
        source_msg = None
        for mid in (t.get("message_ids") or []):
            an = analyses.get(mid, {})
            if an.get("actions_requested"):
                source_msg = mid
                break
        if source_msg is None and t.get("message_ids"):
            source_msg = t["message_ids"][-1]
        persons = list(t.get("person_names") or [])
        inst = t.get("institution")
        protos = []
        for p in (t.get("protocol_refs") or []):
            v = p.get("value") if isinstance(p, dict) else p
            if v:
                protos.append(v)
        rid_seed = "%s|%s|%s|%s" % (norm_inst(inst), "|".join(sorted(persons)),
                                    "|".join(sorted(i["description"] for i in items)),
                                    (sent_at or "")[:10])
        rid = "req-" + hashlib.sha256(rid_seed.encode()).hexdigest()[:12]
        requests.append({
            "request_id": rid,
            "source_thread": tid,
            "source_message_id": source_msg,
            "institution": inst,
            "institution_norm": norm_inst(inst),
            "person_names": persons,
            "person_norm": [norm_person(p) for p in persons],
            "record_refs": list(t.get("record_refs") or []),
            "requested_items": items,
            "sent_at": sent_at,
            "protocol_refs": protos,
            "status": "open",
            "linked_replies": [],
            "linked_events": [],
            "linked_attachments": [],
            "fulfilment": "unverified",
            "fulfilment_confirmed_by": None,
            "fulfilment_confirmed_at": None,
            "ambiguous": False,
            "ambiguity_candidates": [],
            "ambiguity_reviewed": False,
            "ambiguity_decision": None,
            "needs_review": False,
            "review_reason": None,
            "reviewed_at": None,
            "reviewed_by": None,
            "rejected_links": [],
            "human_notes": None,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        })
    return requests


def signal_eval(req, cand_thread, cand_msgs, gate):
    """Return (matched, contradictory, missing, confidence)."""
    matched = []
    contradictory = []
    missing = []
    # protocol overlap
    cand_protos = []
    for p in (cand_thread.get("protocol_refs") or []):
        v = p.get("value") if isinstance(p, dict) else p
        if v:
            cand_protos.append(v)
    proto_overlap = [p for p in req["protocol_refs"] if p in cand_protos]
    if req["protocol_refs"] and cand_protos:
        if proto_overlap:
            matched.append({"signal": "protocol_exact", "value": proto_overlap})
        else:
            missing.append("protocol_overlap")
    else:
        missing.append("protocol_refs_on_one_side")
    # institution match
    cand_inst = norm_inst(cand_thread.get("institution"))
    if cand_inst and req["institution_norm"]:
        if cand_inst == req["institution_norm"]:
            matched.append({"signal": "institution_exact", "value": cand_inst})
        else:
            contradictory.append({"signal": "institution_mismatch",
                                 "request": req["institution_norm"], "candidate": cand_inst})
    else:
        missing.append("institution")
    # person overlap
    cand_persons = [norm_person(p) for p in (cand_thread.get("person_names") or [])]
    person_overlap = [p for p in req["person_norm"] if p in cand_persons]
    if req["person_norm"] and cand_persons:
        if person_overlap:
            matched.append({"signal": "person_overlap", "value": person_overlap})
        else:
            contradictory.append({"signal": "person_mismatch",
                                 "request": req["person_norm"], "candidate": cand_persons})
    else:
        missing.append("person_names")
    # document type overlap
    req_text = " ".join(i["description"] for i in req["requested_items"]).lower()
    cand_title = (cand_thread.get("title") or cand_thread.get("subject") or "").lower()
    doc_keywords = ["morte", "death", "nascita", "birth", "matrimonio", "marriage",
                    "battesimo", "baptism", "diploma", "laurea"]
    # canonicalise bilingual document-type keywords so Italian and English
    # descriptions of the same document type are not treated as a mismatch
    canon = {"morte": "death", "death": "death", "nascita": "birth", "birth": "birth",
             "matrimonio": "marriage", "marriage": "marriage",
             "battesimo": "baptism", "baptism": "baptism",
             "diploma": "diploma", "laurea": "degree"}
    req_kw = sorted({canon[k] for k in doc_keywords if k in req_text})
    cand_kw = sorted({canon[k] for k in doc_keywords if k in cand_title})
    kw_overlap = [k for k in req_kw if k in cand_kw]
    if req_kw and cand_kw:
        if kw_overlap:
            matched.append({"signal": "document_type_overlap", "value": kw_overlap})
        else:
            contradictory.append({"signal": "document_type_mismatch",
                                 "request": req_kw, "candidate": cand_kw})
    else:
        missing.append("document_type_keywords")
    # date order
    try:
        if req["sent_at"] and cand_thread.get("last_activity"):
            rd = datetime.datetime.fromisoformat(req["sent_at"].replace("Z", "+00:00"))
            cd = datetime.datetime.fromisoformat(cand_thread["last_activity"].replace("Z", "+00:00"))
            if cd >= rd:
                matched.append({"signal": "date_order_ok", "value": "%s >= %s" % (cd.date(), rd.date())})
            else:
                contradictory.append({"signal": "date_order_wrong", "value": "%s < %s" % (cd.date(), rd.date())})
    except (ValueError, TypeError):
        missing.append("dates")
    # date proximity
    try:
        if req["sent_at"] and cand_thread.get("last_activity"):
            rd = datetime.datetime.fromisoformat(req["sent_at"].replace("Z", "+00:00"))
            cd = datetime.datetime.fromisoformat(cand_thread["last_activity"].replace("Z", "+00:00"))
            days = (cd - rd).days
            if 0 <= days <= 180:
                matched.append({"signal": "date_proximity", "value": "%d days" % days})
            elif days > 180:
                missing.append("date_proximity_far")
    except (ValueError, TypeError):
        pass
    # confidence: protocol match is high, but must not override contradictory evidence
    high_signals = [m for m in matched if m["signal"].startswith("protocol")]
    medium_signals = [m for m in matched if m["signal"] in ("institution_exact", "person_overlap",
                                                           "document_type_overlap", "date_order_ok",
                                                           "date_proximity")]
    if high_signals and not contradictory:
        confidence = "high"
    elif len(medium_signals) >= 2 and not contradictory:
        confidence = "medium"
    elif medium_signals and not contradictory:
        confidence = "low"
    else:
        confidence = "none"
    # protocol match must not override contradictory person/institution/subject evidence
    if contradictory and high_signals:
        confidence = "medium" if len(medium_signals) >= 1 else "low"
    return matched, contradictory, missing, confidence


# Fix signal name: record protocol match under "protocol_exact"
# We'll patch signal_eval usage by renaming in the loop below.
def _normalize_signals(matched):
    for m in matched:
        if m["signal"] == "protocol_exact":
            pass
    return matched


def classify_events_for_thread(thread, gate, is_source_thread, source_msg_id):
    events = []
    seen = set()
    for mid in (thread.get("message_ids") or []):
        # gate entry
        ge = gate.get("messages", {}).get(str(mid)) if gate else None
        has_docs = bool(ge and ge.get("has_documents"))
        # we need message direction/subject/timestamp from db; load from threads chronology
        chron = None
        for c in (thread.get("chronology") or []):
            if c.get("message_id") == mid:
                chron = c
                break
        if not chron:
            continue
        direction = chron.get("direction")
        subject = chron.get("subject") or ""
        date = chron.get("date")
        msg = {"id": mid, "direction": direction, "subject": subject}
        is_src = (mid == source_msg_id)
        kinds = event_kinds(msg, is_src, has_docs, ge)
        for k in kinds:
            key = (mid, k)
            if key in seen:
                continue
            seen.add(key)
            events.append({
                "kind": k,
                "message_id": mid,
                "thread_id": thread.get("gmail_thread_id") or thread.get("thread_id"),
                "date": date,
                "evidence": (chron.get("evidence") or "")[:300],
                "source": "derived",
            })
    return events


def merge_preserve(old_req, new_req):
    """Preserve human-confirmed fields across rebuilds."""
    if not old_req:
        return new_req
    # fulfilment (human-confirmed)
    if old_req.get("fulfilment_confirmed_by"):
        new_req["fulfilment"] = old_req.get("fulfilment", new_req["fulfilment"])
        new_req["fulfilment_confirmed_by"] = old_req.get("fulfilment_confirmed_by")
        new_req["fulfilment_confirmed_at"] = old_req.get("fulfilment_confirmed_at")
    # item statuses (human-set fulfilled)
    old_items = {i.get("description"): i for i in (old_req.get("requested_items") or [])}
    for it in new_req["requested_items"]:
        oi = old_items.get(it["description"])
        if oi and oi.get("status") in ("fulfilled", "partially_fulfilled"):
            it["status"] = oi["status"]
            it["fulfilled_by"] = oi.get("fulfilled_by")
            it["fulfilled_at"] = oi.get("fulfilled_at")
    # linked_replies: preserve human-confirmed ones
    old_confirmed = [lr for lr in (old_req.get("linked_replies") or []) if lr.get("human_confirmed")]
    # derived links are replaced; confirmed ones are merged in
    new_keys = {(lr.get("thread_id"), lr.get("message_id")) for lr in new_req["linked_replies"]}
    for lr in old_confirmed:
        if (lr.get("thread_id"), lr.get("message_id")) not in new_keys:
            new_req["linked_replies"].append(lr)
    # ambiguity review
    if old_req.get("ambiguity_reviewed"):
        new_req["ambiguity_reviewed"] = True
        new_req["ambiguity_decision"] = old_req.get("ambiguity_decision")
    # review state
    if old_req.get("reviewed_at"):
        new_req["needs_review"] = False
        new_req["reviewed_at"] = old_req.get("reviewed_at")
        new_req["reviewed_by"] = old_req.get("reviewed_by")
        new_req["review_reason"] = old_req.get("review_reason")
    # (if not reviewed, keep the freshly derived needs_review/review_reason)
    # rejected links
    if old_req.get("rejected_links"):
        new_req["rejected_links"] = list(old_req.get("rejected_links"))
    # human notes
    if old_req.get("human_notes"):
        new_req["human_notes"] = old_req.get("human_notes")
    # linked_events: merge human-added events (source == "human")
    old_human_events = [e for e in (old_req.get("linked_events") or []) if e.get("source") == "human"]
    new_keys_e = {(e.get("message_id"), e.get("kind")) for e in new_req["linked_events"]}
    for e in old_human_events:
        if (e.get("message_id"), e.get("kind")) not in new_keys_e:
            new_req["linked_events"].append(e)
    # preserve created_at
    if old_req.get("created_at"):
        new_req["created_at"] = old_req["created_at"]
    new_req["updated_at"] = now_iso()
    return new_req


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--confirm-fulfilled", default=None, metavar="REQUEST_ID")
    ap.add_argument("--confirm-link", nargs=3, metavar=("REQUEST_ID", "THREAD_ID", "MESSAGE_ID"),
                    help="Manually approve a reply link: request_id thread_id message_id")
    ap.add_argument("--review-ambiguity", nargs=2, metavar=("REQUEST_ID", "DECISION"),
                    help="Record an ambiguity review decision for a request")
    ap.add_argument("--mark-reviewed", nargs=2, metavar=("REQUEST_ID", "REASON"),
                    help="Mark a request as reviewed (clears needs_review)")
    ap.add_argument("--reject-link", nargs=3, metavar=("REQUEST_ID", "THREAD_ID", "MESSAGE_ID"),
                    help="Reject a candidate reply link so it is not re-proposed")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    threads = load_json(THREADS_PATH, {}).get("threads", {})
    actions_data = load_json(ACTIONS_PATH, {})
    gate = load_json(GATE_PATH, {})
    analyses = {}
    if os.path.isdir(ANALYSIS_DIR):
        for p in os.listdir(ANALYSIS_DIR):
            m = re.match(r"message_(\d+)\.json", p)
            if m:
                analyses[int(m.group(1))] = load_json(os.path.join(ANALYSIS_DIR, p), {})

    old_sidecar = load_json(OUT, {"version": 1, "requests": {}})
    old_requests = old_sidecar.get("requests", {})

    # Handle manual confirmation commands
    if args.confirm_fulfilled:
        rid = args.confirm_fulfilled
        if rid in old_requests:
            r = old_requests[rid]
            # only allow if all items fulfilled or documents received
            r["fulfilment"] = "fulfilled"
            r["fulfilment_confirmed_by"] = "user"
            r["fulfilment_confirmed_at"] = now_iso()
            r["status"] = "fulfilled"
            # mark all items fulfilled
            for it in r.get("requested_items", []):
                if it.get("status") != "fulfilled":
                    it["status"] = "fulfilled"
                    it["fulfilled_by"] = "user"
                    it["fulfilled_at"] = now_iso()
            # add fulfilment_confirmed event if source msg known
            old_sidecar["requests"] = old_requests
            old_sidecar["updated_at"] = now_iso()
            with open(OUT, "w", encoding="utf-8") as f:
                json.dump(old_sidecar, f, indent=2, ensure_ascii=False)
            print("Confirmed fulfilled: %s" % rid)
        else:
            print("Request not found: %s" % rid, file=sys.stderr)
            return 2
        return 0

    if args.confirm_link:
        rid, tthread, tmsg = args.confirm_link
        if rid in old_requests:
            r = old_requests[rid]
            mid = int(tmsg)
            if mid == 0:
                # resolve to first inbound message of the thread
                t = threads.get(tthread, {}) if 'threads' in globals() else {}
                # threads may not be loaded (confirm_link path skips build); load now
                try:
                    _threads = load_json(THREADS_PATH, {}).get("threads", {})
                    t = _threads.get(tthread, {})
                except Exception:
                    t = {}
                mid = None
                for c in (t.get("chronology") or []):
                    if c.get("direction") == "in":
                        mid = c.get("message_id")
                        break
                if mid is None and t.get("message_ids"):
                    mid = t["message_ids"][0] if t["message_ids"] else None
                if not mid:
                    print("Cannot confirm link: thread %s has no inbound message." % tthread, file=sys.stderr)
                    return 2
            entry = {
                "thread_id": tthread, "message_id": mid, "kind": "reply",
                "confidence": "confirmed", "derived": False, "human_confirmed": True,
                "confirmed_by": "user", "confirmed_at": now_iso(),
                "matched_signals": ["manual_approval"],
                "contradictory_signals": [], "missing_signals": [],
                "evidence": "Manually approved by user", "attached_at": now_iso(),
            }
            keys = {(lr.get("thread_id"), lr.get("message_id")) for lr in r.get("linked_replies", [])}
            if (tthread, mid) not in keys:
                r["linked_replies"].append(entry)
            old_sidecar["requests"] = old_requests
            old_sidecar["updated_at"] = now_iso()
            with open(OUT, "w", encoding="utf-8") as f:
                json.dump(old_sidecar, f, indent=2, ensure_ascii=False)
            print("Confirmed link: %s -> %s/%s" % (rid, tthread, tmsg))
        else:
            print("Request not found: %s" % rid, file=sys.stderr)
            return 2
        return 0

    if args.review_ambiguity:
        rid, decision = args.review_ambiguity
        if rid in old_requests:
            r = old_requests[rid]
            r["ambiguity_reviewed"] = True
            r["ambiguity_decision"] = decision
            old_sidecar["requests"] = old_requests
            old_sidecar["updated_at"] = now_iso()
            with open(OUT, "w", encoding="utf-8") as f:
                json.dump(old_sidecar, f, indent=2, ensure_ascii=False)
            print("Recorded ambiguity review: %s -> %s" % (rid, decision))
        else:
            print("Request not found: %s" % rid, file=sys.stderr)
            return 2
        return 0

    if args.mark_reviewed:
        rid, reason = args.mark_reviewed
        if rid in old_requests:
            r = old_requests[rid]
            r["needs_review"] = False
            r["reviewed_at"] = now_iso()
            r["reviewed_by"] = "user"
            r["review_reason"] = reason
            old_sidecar["requests"] = old_requests
            old_sidecar["updated_at"] = now_iso()
            with open(OUT, "w", encoding="utf-8") as f:
                json.dump(old_sidecar, f, indent=2, ensure_ascii=False)
            print("Marked reviewed: %s" % rid)
        else:
            print("Request not found: %s" % rid, file=sys.stderr)
            return 2
        return 0

    if args.reject_link:
        rid, tthread, tmsg = args.reject_link
        if rid in old_requests:
            r = old_requests[rid]
            rej = [tthread, int(tmsg)]
            if rej not in (r.get("rejected_links") or []):
                r.setdefault("rejected_links", []).append(rej)
            # also remove from linked_replies if present
            r["linked_replies"] = [lr for lr in (r.get("linked_replies") or [])
                                   if not (lr.get("thread_id") == tthread and lr.get("message_id") == int(tmsg))]
            old_sidecar["requests"] = old_requests
            old_sidecar["updated_at"] = now_iso()
            with open(OUT, "w", encoding="utf-8") as f:
                json.dump(old_sidecar, f, indent=2, ensure_ascii=False)
            print("Rejected link: %s -> %s/%s" % (rid, tthread, tmsg))
        else:
            print("Request not found: %s" % rid, file=sys.stderr)
            return 2
        return 0

    # --- Build requests ---
    requests = build_requests(threads, analyses, actions_data)

    # index by id
    req_by_id = {r["request_id"]: r for r in requests}

    # For each request, find candidate replies and events
    for r in requests:
        src_tid = r["source_thread"]
        src_thread = threads.get(src_tid, {})
        old_r = old_requests.get(r["request_id"], {})
        rejected_threads = {(rl[0] if isinstance(rl, (list, tuple)) else rl.get("thread_id"))
                           for rl in (old_r.get("rejected_links") or [])}
        candidates = []
        for tid, t in threads.items():
            if tid == src_tid:
                continue
            if tid in rejected_threads:
                continue
            title_l = (t.get("title") or t.get("subject") or "").lower()
            if any(k in title_l for k in ["ricevuta", "protocollazione", "delivery status", "conferma di ricezione"]):
                continue
            cand_inst = norm_inst(t.get("institution"))
            person_overlap = [p for p in (t.get("person_names") or [])
                             if norm_person(p) in r["person_norm"]]
            proto_overlap = [p for p in (t.get("protocol_refs") or [])
                            for v in ([p.get("value") if isinstance(p, dict) else p])
                            if v in r["protocol_refs"]]
            if (cand_inst and cand_inst == r["institution_norm"]) or person_overlap or proto_overlap:
                candidates.append((tid, t))

        # Evaluate each candidate
        reply_candidates = []  # (tid, t, matched, contradictory, missing, confidence)
        for tid, t in candidates:
            matched, contradictory, missing, confidence = signal_eval(r, t, None, gate)
            # fix signal name standardisation: ensure protocol match recorded
            # (signal_eval records "protocol_exact"? let's check: it appended {"signal":"protocol_exact"?})
            # We'll recompute matched signal names consistently:
            reply_candidates.append({
                "thread": t, "tid": tid,
                "matched": matched, "contradictory": contradictory,
                "missing": missing, "confidence": confidence,
            })

        # Link replies with high/medium confidence, unless ambiguous
        # Conservative auto-link: only link if there is a unique best candidate
        # with NO contradictory signals. Otherwise flag as ambiguous for review.
        high_med = [c for c in reply_candidates if c["confidence"] in ("high", "medium")]
        high_med.sort(key=lambda c: (0 if c["confidence"] == "high" else 1, -len(c["matched"])))
        clean = [c for c in high_med if not c["contradictory"]]
        ambiguous = False
        amb_candidates = []
        if len(high_med) >= 2 and (not clean or high_med[0]["confidence"] == high_med[1]["confidence"] and high_med[0]["contradictory"] == high_med[1]["contradictory"]):
            # ambiguous if top candidates tie in confidence and both are clean or both contradictory
            if len(clean) < len(high_med) or len([c for c in high_med if c["confidence"]==high_med[0]["confidence"]]) > 1:
                ambiguous = True
        amb_candidates = [{"thread_id": c["tid"],
                          "confidence": c["confidence"],
                          "matched": [m["signal"] for m in c["matched"]],
                          "contradictory": [c2["signal"] for c2 in c["contradictory"]]}
                         for c in high_med]
        linked_replies = []
        if not ambiguous and clean:
            best = sorted(clean, key=lambda c: (
                0 if c["confidence"] == "high" else 1,
                -len(c["matched"]),
            ))[0]
            # if there's a second clean candidate with same confidence -> ambiguous
            second_clean = [c for c in clean if c is not best and c["confidence"] == best["confidence"]]
            if second_clean:
                ambiguous = True
            else:
                t = best["thread"]
                msg_id = None
                for c in (t.get("chronology") or []):
                    if c.get("direction") == "in":
                        msg_id = c.get("message_id")
                        break
                if msg_id is None and t.get("message_ids"):
                    msg_id = t["message_ids"][0]
                ge = gate.get("messages", {}).get(str(msg_id)) if msg_id else None
                has_docs = bool(ge and ge.get("has_documents"))
                entry = {
                    "thread_id": best["tid"],
                    "message_id": msg_id,
                    "kind": "reply",
                    "confidence": best["confidence"],
                    "derived": True,
                    "human_confirmed": False,
                    "matched_signals": best["matched"],
                    "contradictory_signals": best["contradictory"],
                    "missing_signals": best["missing"],
                    "evidence": " | ".join(m.get("signal", "") for m in best["matched"]) or "no matched signals",
                    "has_documents": has_docs,
                    "attached_at": now_iso(),
                }
                linked_replies.append(entry)
        if ambiguous:
            linked_replies = []
        linked_events = []
        event_threads = [src_tid] + [lr["thread_id"] for lr in linked_replies]
        # add threads sharing a protocol number with this request (PEC receipt/protocol threads)
        for tid, t in threads.items():
            tprotos = [(x.get("value") if isinstance(x, dict) else x) for x in (t.get("protocol_refs") or [])]
            if any(p in r["protocol_refs"] for p in tprotos):
                event_threads.append(tid)
        # add PEC receipt/protocol threads for the same request: subject+person+institution
        # overlap and dated within 30 days after the request (these carry the new protocol)
        if r["sent_at"]:
            try:
                rd = __import__("datetime").datetime.fromisoformat(r["sent_at"].replace("Z","+00:00"))
            except Exception:
                rd = None
        else:
            rd = None
        for tid, t in threads.items():
            title_l = (t.get("title") or t.get("subject") or "").lower()
            if not any(k in title_l for k in ["ricevuta", "protocollazione", "delivery status"]):
                continue
            if norm_inst(t.get("institution")) != r["institution_norm"]:
                continue
            person_overlap = [p for p in (t.get("person_names") or []) if norm_person(p) in r["person_norm"]]
            if not person_overlap:
                continue
            if rd and t.get("last_activity"):
                try:
                    cd = __import__("datetime").datetime.fromisoformat(t["last_activity"].replace("Z","+00:00"))
                    if not (0 <= (cd-rd).days <= 30):
                        continue
                except Exception:
                    pass
            event_threads.append(tid)
        seen_threads = set()
        for tid in event_threads:
            if tid in seen_threads:
                continue
            seen_threads.add(tid)
            t = threads.get(tid)
            if not t:
                continue
            is_src = (tid == src_tid)
            evs = classify_events_for_thread(t, gate, is_src, r["source_message_id"])
            for e in evs:
                # attach signal info? keep minimal
                linked_events.append(e)
        # dedup events by (message_id, kind)
        seen_e = set()
        deduped_events = []
        for e in linked_events:
            key = (e.get("message_id"), e.get("kind"))
            if key in seen_e:
                continue
            seen_e.add(key)
            deduped_events.append(e)
        linked_events = deduped_events

        # linked attachments: from gate on linked reply msgs + source
        linked_atts = []
        for lr in linked_replies:
            ge = gate.get("messages", {}).get(str(lr.get("message_id")))
            if ge and ge.get("has_documents"):
                for a in ge.get("attachments", []):
                    if a.get("kind") in ("document", "image") and a.get("status") != "duplicate":
                        if a.get("attachment_id") not in linked_atts:
                            linked_atts.append(a.get("attachment_id"))
        # also source thread messages
        for mid in (src_thread.get("message_ids") or []):
            ge = gate.get("messages", {}).get(str(mid))
            if ge and ge.get("has_documents"):
                for a in ge.get("attachments", []):
                    if a.get("kind") in ("document", "image") and a.get("status") != "duplicate":
                        if a.get("attachment_id") not in linked_atts:
                            linked_atts.append(a.get("attachment_id"))

        # status
        has_docs_reply = any(lr.get("has_documents") for lr in linked_replies)
        if ambiguous:
            status = "needs_review"
        elif has_docs_reply:
            status = "documents_received"
        elif linked_replies:
            status = "response_received"
        else:
            status = "open"

        # item fulfilment status from human (preserved later)
        for it in r["requested_items"]:
            it.setdefault("status", "open")

        r["linked_replies"] = linked_replies
        r["linked_events"] = linked_events
        r["linked_attachments"] = linked_atts
        r["status"] = status
        r["ambiguous"] = ambiguous
        r["ambiguity_candidates"] = amb_candidates if ambiguous else []
        # needs_review: ambiguous OR documents requiring inspection
        docs_need_review = False
        doc_reason = None
        for att_id in (linked_atts or []):
            # find the gate entry containing this attachment
            for mid in (r.get("linked_replies", []) and [lr.get("message_id") for lr in r["linked_replies"]] or []) + [r.get("source_message_id")]:
                ge = gate.get("messages", {}).get(str(mid)) if mid else None
                if ge and ge.get("blocks_no_action"):
                    docs_need_review = True
                    doc_reason = "documents require visual inspection (attachment gate)"
                    break
                if ge and ge.get("requires_human_review") and ge.get("has_documents"):
                    docs_need_review = True
                    doc_reason = "documents require human review"
                    break
            if docs_need_review:
                break
        if ambiguous:
            r["needs_review"] = True
            r["review_reason"] = ("ambiguous reply linkage: %d candidate(s) with equal confidence"
                                 % len(amb_candidates))
        elif linked_atts:
            r["needs_review"] = True
            if docs_need_review:
                r["review_reason"] = doc_reason or "documents require human review"
            else:
                r["review_reason"] = ("documents supplied but unverified — assess relevance, "
                                     "completeness and fulfilment of the request")
        else:
            r["needs_review"] = False
            r["review_reason"] = None
        r["updated_at"] = now_iso()

    # Merge with old sidecar (preserve human fields)
    for r in requests:
        old = old_requests.get(r["request_id"])
        r = merge_preserve(old, r)
        req_by_id[r["request_id"]] = r

    # Build final sidecar
    sidecar = {
        "version": 1,
        "generated_at": now_iso(),
        "request_count": len(requests),
        "requests": {r["request_id"]: r for r in requests},
        # research needs are NOT sent requests; list them for reference only
        "research_needs_note": ("lifeEvent entries with status 'known_no_record' identify research "
                                "needs, not sent correspondence requests. They are tracked in "
                                "familyData.ts and are not converted into requests here."),
    }

    os.makedirs(EXTRACTED, exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(sidecar, f, indent=2, ensure_ascii=False)

    # Summary
    print("Requests: %d" % len(requests))
    from collections import Counter
    print("Statuses:", dict(Counter(r["status"] for r in requests)))
    amb = [r["request_id"] for r in requests if r.get("ambiguous")]
    print("Ambiguous: %d %s" % (len(amb), amb))
    for r in requests:
        print("  %s | %s | %s | replies=%d events=%d docs=%d" % (
            r["request_id"], r["status"], (r["institution"] or "")[:30],
            len(r["linked_replies"]), len(r["linked_events"]), len(r["linked_attachments"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
