#!/usr/bin/env python3
"""
Proactive correspondence detection.

Detects messages imported since the last review, classifies affected threads,
and surfaces new items requiring attention.

Usage:
  python scripts/detect-new-correspondence.py --init     # set watermark to current max (nothing "new")
  python scripts/detect-new-correspondence.py            # detect new items since last review
  python scripts/detect-new-correspondence.py --mark-reviewed  # advance watermark to current max

No Gmail enumeration. No attachment downloads. No family-data changes.
"""
import argparse, json, os, re, sqlite3, datetime, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from safe_write import safe_write_json, read_with_version
import importlib.util as _ilu
_spec = _ilu.spec_from_file_location('ca_merge', os.path.join(ROOT, 'scripts', 'classify-actions.py'))
_ca_merge = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(_ca_merge)
merge_preserved_fields = _ca_merge.merge_preserved_fields
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
THREADS_PATH = os.path.join(ROOT, "correspondence", "extracted", "threads.json")
ACTIONS_PATH = os.path.join(ROOT, "correspondence", "extracted", "actions.json")
REVIEW_STATE_PATH = os.path.join(ROOT, "correspondence", "extracted", "review-state.json")
NEW_ITEMS_PATH = os.path.join(ROOT, "correspondence", "extracted", "new-items.json")

# Import classify_thread from classify-actions.py
import importlib.util
_spec = importlib.util.spec_from_file_location("classify_actions", os.path.join(ROOT, "scripts", "classify-actions.py"))
_ca = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_ca)
classify_thread = _ca.classify_thread

def load_review_state():
    if os.path.exists(REVIEW_STATE_PATH):
        return json.load(open(REVIEW_STATE_PATH))
    return {"last_reviewed_at": None, "last_reviewed_message_id": 0, "reviewed_item_keys": []}

def save_review_state(state):
    os.makedirs(os.path.dirname(REVIEW_STATE_PATH), exist_ok=True)
    with open(REVIEW_STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)

def detect():
    state = load_review_state()
    watermark = state.get("last_reviewed_message_id", 0)

    conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    conn.row_factory = sqlite3.Row

    # Find new messages since watermark
    new_msgs = [dict(r) for r in conn.execute(
        "SELECT id, account_email, gmail_message_id, gmail_thread_id, direction, "
        "from_name, from_email, subject, received_at, sent_at, snippet, body_text, imported_at "
        "FROM messages WHERE id > ? ORDER BY id", (watermark,)).fetchall()]

    if not new_msgs:
        # No new messages
        result = {
            "detected_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "watermark_before": watermark,
            "new_message_count": 0,
            "new_thread_count": 0,
            "items": [],
            "message": "No new messages since last review.",
        }
        os.makedirs(os.path.dirname(NEW_ITEMS_PATH), exist_ok=True)
        with open(NEW_ITEMS_PATH, "w", encoding="utf-8") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)
        print(json.dumps({"ok": True, "new_messages": 0, "new_threads": 0}))
        return

    # Group new messages by thread
    threads_affected = {}
    for m in new_msgs:
        tid = m["gmail_thread_id"]
        threads_affected.setdefault(tid, []).append(m)

    # Load existing data
    threads_data = json.load(open(THREADS_PATH)) if os.path.exists(THREADS_PATH) else {"threads": {}}
    thread_info_map = threads_data.get("threads", {})
    proposed = threads_data.get("proposed_enquiries", {})

    actions_data = json.load(open(ACTIONS_PATH)) if os.path.exists(ACTIONS_PATH) else {"version": 1, "actions": {}}
    actions = actions_data.get("actions", {})

    # Check genealogy relevance of new messages
    def is_genealogy_relevant(msg_id):
        row = conn.execute(
            "SELECT genealogy_relevance FROM message_classification WHERE message_id=?",
            (msg_id,)).fetchone()
        if row:
            return row["genealogy_relevance"] in ("definite", "possible")
        return False  # unclassified = treat as not yet relevant

    items = []
    threads_reclassified = 0

    for gmail_tid, new_thread_msgs in threads_affected.items():
        # Get DB thread info
        db_thread = conn.execute(
            "SELECT id, account_email FROM threads WHERE gmail_thread_id=?", (gmail_tid,)).fetchone()
        if not db_thread:
            continue

        db_thread_id = db_thread["id"]
        account_email = db_thread["account_email"]

        # Get all messages in this thread
        all_msgs = [dict(r) for r in conn.execute(
            "SELECT id, account_email, direction, received_at, sent_at, subject, snippet, body_text, gmail_message_id, from_email, from_name "
            "FROM messages WHERE thread_id=? ORDER BY COALESCE(received_at,sent_at)", (db_thread_id,)).fetchall()]

        # Check if any message in thread is genealogy-relevant
        genealogy_relevant = any(is_genealogy_relevant(m["id"]) for m in all_msgs)
        new_relevant = [m for m in new_thread_msgs if is_genealogy_relevant(m["id"])]
        new_irrelevant = [m for m in new_thread_msgs if not is_genealogy_relevant(m["id"])]

        info = thread_info_map.get(gmail_tid, {})
        is_new_thread = gmail_tid not in actions

        # Only process genealogy-relevant threads
        if not genealogy_relevant:
            # Skip non-genealogy threads — do not classify or add to actions
            continue

        # Re-classify the thread
        classification = classify_thread(db_thread_id, gmail_tid, all_msgs, info)
        if classification:
            existing_action = actions.get(gmail_tid)
            classification = merge_preserved_fields(classification, existing_action)
            actions[gmail_tid] = classification
            threads_reclassified += 1

        # Build item for new-items.json
        # Only include if genealogy-relevant OR new thread
        if genealogy_relevant or new_relevant:
            # Determine which new messages are in this thread
            new_msg_ids = [m["id"] for m in new_thread_msgs]
            new_relevant_ids = [m["id"] for m in new_relevant]

            item = {
                "thread_id": gmail_tid,
                "db_thread_id": db_thread_id,
                "account_email": account_email,
                "subject": classification.get("subject", "") if classification else (new_thread_msgs[0].get("subject") or ""),
                "institution": classification.get("institution") if classification else None,
                "classification": classification.get("classification") if classification else "uncertain",
                "confidence": classification.get("confidence") if classification else "inferred",
                "is_new_thread": is_new_thread,
                "new_message_count": len(new_thread_msgs),
                "new_relevant_count": len(new_relevant),
                "new_irrelevant_count": len(new_irrelevant),
                "new_message_ids": new_msg_ids,
                "new_relevant_ids": new_relevant_ids,
                "reviewed_message_ids": [],
                "last_activity": classification.get("last_activity") if classification else None,
                "evidence": classification.get("evidence") if classification else [],
                "reasoning": classification.get("reasoning") if classification else None,
                "recommended_action": _recommend(classification, new_relevant, new_thread_msgs, actions),
                "reviewed": False,
            }
            items.append(item)

    # Update actions.json
    actions_data["actions"] = actions
    actions_data["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    actions_data["total_threads"] = len(actions)
    from collections import Counter
    actions_data["counts"] = dict(Counter(r["classification"] for r in actions.values()))
    actions_data["confidence_counts"] = dict(Counter(r["confidence"] for r in actions.values()))
    os.makedirs(os.path.dirname(ACTIONS_PATH), exist_ok=True)
    _, av = read_with_version(ACTIONS_PATH)
    safe_write_json(ACTIONS_PATH, actions_data, "script", av, ["actions"], "Detection updated actions")

    # Write new-items.json
    result = {
        "detected_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "watermark_before": watermark,
        "watermark_after": max(m["id"] for m in new_msgs),
        "new_message_count": len(new_msgs),
        "new_thread_count": len(threads_affected),
        "genealogy_relevant_count": sum(1 for m in new_msgs if is_genealogy_relevant(m["id"])),
        "irrelevant_count": sum(1 for m in new_msgs if not is_genealogy_relevant(m["id"])),
        "threads_reclassified": threads_reclassified,
        "items": items,
    }
    # Preserve reviewed flags, but unreview if new messages arrived
    reviewed_map = {}  # thread_id -> set of reviewed message IDs
    if os.path.exists(NEW_ITEMS_PATH):
        try:
            prev = json.load(open(NEW_ITEMS_PATH))
            for item in prev.get("items", []):
                if item.get("reviewed"):
                    reviewed_map[item["thread_id"]] = set(item.get("reviewed_message_ids", []) or item.get("new_message_ids", []))
        except (json.JSONDecodeError, IOError):
            pass
    for item in items:
        if item["thread_id"] in reviewed_map:
            reviewed_ids = reviewed_map[item["thread_id"]]
            # If any new message ID was not in the reviewed set, mark as unreviewed
            new_ids = set(item["new_message_ids"])
            if new_ids.issubset(reviewed_ids):
                item["reviewed"] = True
                item["reviewed_message_ids"] = list(reviewed_ids)
            else:
                item["reviewed"] = False
                item["reviewed_message_ids"] = []
        else:
            item["reviewed"] = False
            item["reviewed_message_ids"] = []

    # Save detection watermark to review state (Fix A)
    state = load_review_state()
    state["last_detection_watermark"] = result["watermark_after"]
    state["last_detection_at"] = result["detected_at"]
    save_review_state(state)

    conn.close()
    os.makedirs(os.path.dirname(NEW_ITEMS_PATH), exist_ok=True)
    _, nv = read_with_version(NEW_ITEMS_PATH)
    safe_write_json(NEW_ITEMS_PATH, result, "script", nv, ["items"], "Detection updated new items")

    print(json.dumps({
        "ok": True,
        "new_messages": len(new_msgs),
        "new_threads": len(threads_affected),
        "genealogy_relevant": result["genealogy_relevant_count"],
        "irrelevant": result["irrelevant_count"],
        "items": len(items),
    }))

def _recommend(classification, new_relevant, new_msgs, all_actions=None):
    """Generate a human-readable recommended action."""
    if not classification:
        return "Review this message manually."
    cls = classification.get("classification", "uncertain")
    inst = classification.get("institution", "the correspondent")
    tid = classification.get("thread_id", "")

    # Look up person_names from threads.json if not in classification
    person_names = classification.get("person_names", [])
    record_refs = classification.get("record_refs", [])
    if not person_names:
        try:
            _td = json.load(open(os.path.join(ROOT, "correspondence", "extracted", "threads.json")))
            _t = _td.get("threads", {}).get(tid, {})
            person_names = _t.get("person_names", [])
            record_refs = _t.get("record_refs", [])
        except Exception:
            pass

    # Check for related threads that are already awaiting response
    related_awaiting = []
    if all_actions:
        try:
            import importlib.util
            _spec = importlib.util.spec_from_file_location("ca", os.path.join(ROOT, "scripts", "classify-actions.py"))
            _ca = importlib.util.module_from_spec(_spec)
            _spec.loader.exec_module(_ca)
            related = _ca.find_related_threads(tid, person_names, record_refs, inst, all_actions)
            related_awaiting = [r for r in related if r["is_awaiting_response"]]
        except Exception:
            pass

    if cls == "reply_required":
        return f"Prepare a reply to {inst}. Use the draft generator in Actions & Replies."
    if cls == "action_required":
        if related_awaiting:
            rt = related_awaiting[0]
            return (f"Action required: {inst} referred you to another office. "
                    f"However, an equivalent enquiry is already awaiting response in thread {rt['thread_id'][:12]} "
                    f"({rt['other_institution'] or 'unknown institution'}). Check whether to wait or follow up.")
        return f"Action required: contact {inst} as recommended. Check whether an equivalent enquiry already exists before sending."
    if cls == "awaiting_response":
        return f"Waiting for {inst} to respond. No action needed now."
    if cls == "follow_up_due":
        return f"Follow up with {inst} — the stated timeframe has passed."
    if cls == "resolved":
        return f"This matter appears resolved (document delivery evidenced). Verify and mark complete."
    if cls == "uncertain":
        return "Needs manual review — classification is uncertain. Inspect the correspondence."
    return "Informational update. No action required."

def init():
    conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    max_id = conn.execute("SELECT MAX(id) FROM messages").fetchone()[0] or 0
    conn.close()
    state = {
        "last_reviewed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "last_reviewed_message_id": max_id,
        "reviewed_item_keys": [],
    }
    save_review_state(state)
    print(json.dumps({"ok": True, "watermark": max_id, "message": "Review state initialized. No items marked as new."}))

def mark_reviewed():
    state = load_review_state()
    # Use detection watermark if available, otherwise fall back to MAX(id)
    detection_wm = state.get("last_detection_watermark")
    if detection_wm:
        max_id = detection_wm
    else:
        conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
        max_id = conn.execute("SELECT MAX(id) FROM messages").fetchone()[0] or 0
        conn.close()
    state["last_reviewed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    state["last_reviewed_message_id"] = max_id
    # Mark all current new-items as reviewed, storing reviewed message IDs
    if os.path.exists(NEW_ITEMS_PATH):
        ni = json.load(open(NEW_ITEMS_PATH))
        for item in ni.get("items", []):
            item["reviewed"] = True
            item["reviewed_message_ids"] = list(item.get("new_message_ids", []))
        with open(NEW_ITEMS_PATH, "w", encoding="utf-8") as f:
            json.dump(ni, f, indent=2, ensure_ascii=False)
    save_review_state(state)
    print(json.dumps({"ok": True, "watermark": max_id, "message": "Marked all items as reviewed."}))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--init", action="store_true")
    ap.add_argument("--mark-reviewed", action="store_true")
    args = ap.parse_args()
    if args.init:
        init()
    elif args.mark_reviewed:
        mark_reviewed()
    else:
        detect()

if __name__ == "__main__":
    main()
