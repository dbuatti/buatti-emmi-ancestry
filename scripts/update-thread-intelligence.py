#!/usr/bin/env python3
"""Incremental thread intelligence updater.

Updates threads.json for threads affected by new messages, without full rebuild.
Preserves existing institution canonicalization, protocol refs, person names,
notes, and human-reviewed enquiry groupings.

Usage:
  python scripts/update-thread-intelligence.py [--thread-ids TID1,TID2,...]
  python scripts/update-thread-intelligence.py --from-new-items

If --from-new-items, reads new-items.json and updates affected threads.
If --thread-ids, updates those specific threads.
If neither, updates threads with messages newer than the last processing checkpoint.

No full reprocessing. No schema changes. No family-data changes.
"""
import argparse, json, os, re, sqlite3, datetime, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from safe_write import safe_write_json, read_with_version

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
THREADS_PATH = os.path.join(ROOT, "correspondence", "extracted", "threads.json")
NEW_ITEMS_PATH = os.path.join(ROOT, "correspondence", "extracted", "new-items.json")
ANALYSIS_DIR = os.path.join(ROOT, "correspondence", "extracted", "analysis")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--thread-ids", type=str, help="Comma-separated gmail thread IDs to update")
    ap.add_argument("--from-new-items", action="store_true", help="Update threads from new-items.json")
    args = ap.parse_args()

    conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    conn.row_factory = sqlite3.Row

    # Load existing threads.json
    if not os.path.exists(THREADS_PATH):
        print("ERROR: threads.json not found")
        sys.exit(1)
    threads_data = json.load(open(THREADS_PATH))
    enquiries = threads_data.get("threads", {})

    # Determine which threads to update
    affected_tids = set()
    if args.thread_ids:
        affected_tids = set(args.thread_ids.split(","))
    elif args.from_new_items:
        if os.path.exists(NEW_ITEMS_PATH):
            ni = json.load(open(NEW_ITEMS_PATH))
            for item in ni.get("items", []):
                affected_tids.add(item["thread_id"])
    else:
        # Default: threads with messages newer than last processing checkpoint
        # Use the review state watermark as a proxy
        review_state_path = os.path.join(ROOT, "correspondence", "extracted", "review-state.json")
        watermark = 0
        if os.path.exists(review_state_path):
            rs = json.load(open(review_state_path))
            watermark = rs.get("last_detection_watermark", 0) or rs.get("last_reviewed_message_id", 0)
        # Find threads with new messages
        new_threads = conn.execute(
            "SELECT DISTINCT gmail_thread_id FROM messages WHERE id > ?", (watermark,)
        ).fetchall()
        affected_tids = set(r["gmail_thread_id"] for r in new_threads)

    if not affected_tids:
        print("No threads to update.")
        conn.close()
        return

    updated = 0
    added = 0

    for gmail_tid in affected_tids:
        db_thread = conn.execute(
            "SELECT id, account_email, subject, last_message_at, last_inbound_at, last_outbound_at, "
            "has_unanswered_inbound, summary_en, sender_intent, follow_up_due_at, created_at, updated_at "
            "FROM threads WHERE gmail_thread_id=?", (gmail_tid,)
        ).fetchone()
        if not db_thread:
            continue

        db_tid = db_thread["id"]
        account_email = db_thread["account_email"]

        # Get all messages in thread
        msgs = [dict(r) for r in conn.execute(
            "SELECT id, direction, received_at, sent_at, subject, body_text FROM messages WHERE thread_id=? "
            "ORDER BY COALESCE(received_at,sent_at)", (db_tid,)
        ).fetchall()]

        msg_ids = [m["id"] for m in msgs]
        last_activity = db_thread["last_message_at"] or (msgs[-1]["received_at"] or msgs[-1]["sent_at"] if msgs else None)

        # Load analyses for new messages
        new_analyses = {}
        for m in msgs:
            p = os.path.join(ANALYSIS_DIR, f"message_{m['id']}.json")
            if os.path.exists(p):
                try:
                    new_analyses[m["id"]] = json.load(open(p))
                except:
                    pass

        if gmail_tid in enquiries:
            # Update existing thread entry
            entry = enquiries[gmail_tid]
            # Update message count and last activity (preserve everything else)
            entry["message_count"] = len(msgs)
            entry["message_ids"] = msg_ids
            if last_activity:
                entry["last_activity"] = last_activity
            # Update last_inbound/last_outbound from DB
            if db_thread["last_inbound_at"]:
                entry["last_inbound"] = db_thread["last_inbound_at"]
            if db_thread["last_outbound_at"]:
                entry["last_outbound"] = db_thread["last_outbound_at"]
            # Append new outstanding actions from new analyses (don't replace existing)
            existing_outstanding = entry.get("outstanding_actions") or []
            if not isinstance(existing_outstanding, list):
                existing_outstanding = []
            existing_outstanding_set = set(str(x) for x in existing_outstanding)
            new_outstanding = []
            for mid, a in new_analyses.items():
                for q in (a.get("outstanding_questions") or []):
                    val = q.get("value") if isinstance(q, dict) else str(q)
                    if val and val not in existing_outstanding_set:
                        new_outstanding.append(val)
                        existing_outstanding_set.add(val)
            if new_outstanding and "outstanding_actions" in entry:
                entry["outstanding_actions"].extend(new_outstanding)
            # Update actions_requested similarly
            existing_actions = entry.get("actions") or []
            if not isinstance(existing_actions, list):
                existing_actions = []
            existing_action_vals = set()
            for a in existing_actions:
                if isinstance(a, dict):
                    existing_action_vals.add(a.get("description", "") or a.get("value", ""))
                else:
                    existing_action_vals.add(str(a))
            new_actions = []
            for mid, a in new_analyses.items():
                for q in (a.get("actions_requested") or []):
                    val = q.get("value") if isinstance(q, dict) else str(q)
                    if val and val not in existing_action_vals:
                        new_actions.append({"description": val, "owner": "them", "status": "open",
                                           "evidence_msg": mid, "evidence": (q.get("evidence") if isinstance(q, dict) else ""),
                                           "action_status": "uncertain"})
                        existing_action_vals.add(val)
            if new_actions and "actions" in entry:
                entry["actions"].extend(new_actions)
            updated += 1
        else:
            # New thread — create a minimal entry
            # Extract institution from thread_info or DB
            institution = None
            # Try to get from analysis
            for mid, a in new_analyses.items():
                for inst in (a.get("institutions") or []):
                    val = inst.get("value") if isinstance(inst, dict) else str(inst)
                    if val:
                        institution = val
                        break
                if institution:
                    break
            # Try to canonicalize using v3's CANONICAL_MAP (import from v3 module)
            try:
                import importlib.util
                _spec = importlib.util.spec_from_file_location("v3", os.path.join(ROOT, "scripts", "build-thread-intelligence-v3.py"))
                _v3 = importlib.util.module_from_spec(_spec)
                _spec.loader.exec_module(_v3)
                if institution and hasattr(_v3, "CANONICAL_MAP"):
                    canonical = _v3.CANONICAL_MAP.get(institution)
                    if canonical is not None:
                        institution = canonical
            except Exception:
                pass

            # Extract protocol refs from analyses
            protocol_refs = []
            for mid, a in new_analyses.items():
                for p in (a.get("protocol_refs") or []):
                    val = p.get("value") if isinstance(p, dict) else str(p)
                    if val and val not in protocol_refs:
                        protocol_refs.append(val)

            # Extract person names
            person_names = []
            for mid, a in new_analyses.items():
                for p in (a.get("people") or []):
                    name = p.get("name") if isinstance(p, dict) else str(p)
                    if name and name not in person_names:
                        person_names.append(name)

            # Extract outstanding actions
            outstanding = []
            for mid, a in new_analyses.items():
                for q in (a.get("outstanding_questions") or []):
                    val = q.get("value") if isinstance(q, dict) else str(q)
                    if val and val not in outstanding:
                        outstanding.append(val)

            actions = []
            for mid, a in new_analyses.items():
                for q in (a.get("actions_requested") or []):
                    val = q.get("value") if isinstance(q, dict) else str(q)
                    if val and val not in actions:
                        actions.append(val)

            # Get subject from first message
            subject = msgs[0]["subject"] if msgs else db_thread["subject"]

            entry = {
                "thread_db_id": db_tid,
                "gmail_thread_id": gmail_tid,
                "account_email": account_email,
                "title": subject,
                "status": "needs_attention",
                "review_status": "unreviewed",
                "person_names": person_names,
                "people": [],
                "institution": institution,
                "institution_raw": institution,
                "institution_confidence": "medium" if institution else "low",
                "location": None,
                "places": [],
                "protocol_refs": protocol_refs,
                "record_refs": [],
                "chronology": [],
                "actions": actions,
                "message_count": len(msgs),
                "message_ids": msg_ids,
                "last_activity": last_activity,
                "last_inbound": db_thread["last_inbound_at"],
                "last_outbound": db_thread["last_outbound_at"],
                "waiting_on": "me",
                "linked_threads": [],
                "notes": [],
                "created_at": db_thread["created_at"] or datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "outstanding_actions": outstanding,
                "institutions": [institution] if institution else [],
                "institutions_canonical": [institution] if institution else [],
                "protocol_refs_current": protocol_refs,
                "protocol_refs_quoted": [],
            }
            enquiries[gmail_tid] = entry
            added += 1

    # Write updated threads.json
    threads_data["threads"] = enquiries
    threads_data["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    _, tv = read_with_version(THREADS_PATH)
    safe_write_json(THREADS_PATH, threads_data, "script", tv, ["threads"], "Thread intelligence updated")

    conn.close()
    print(f"Updated {updated} existing threads, added {added} new threads.")
    print(f"Total threads: {len(enquiries)}")

if __name__ == "__main__":
    main()
