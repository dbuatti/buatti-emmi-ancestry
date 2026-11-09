#!/usr/bin/env python3
"""Backfill the `actions` table from correspondence/extracted/actions.json.

One action per thread, derived from its classified thread state. Idempotent
via a (thread_id, description) guard. No LLM calls, no Gmail writes.
"""
import json, os, sqlite3, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
ACTIONS_JSON = os.path.join(ROOT, "correspondence", "extracted", "actions.json")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()
data = json.load(open(ACTIONS_JSON, encoding="utf-8"))
actions = data.get("actions", {})

inserted = 0
for gtid, info in actions.items():
    tid = info.get("db_thread_id")
    if not tid:
        continue
    classification = info.get("classification") or "unknown"
    state = info.get("thread_state") or ""
    msg_ids = info.get("message_ids") or []
    mid = msg_ids[0] if msg_ids else None
    status = "done" if classification == "resolved" else "open"
    if state in ("resolved",):
        status = "done"
    owner = "them" if state in ("awaiting_response", "waiting_external", "acknowledged") else "me"
    desc = f"{classification}: {info.get('subject','')[:120]}"
    completed = datetime.datetime.now(datetime.timezone.utc).isoformat() if status == "done" else None
    # guard against duplicates
    cur.execute("SELECT 1 FROM actions WHERE thread_id=? AND description=?", (tid, desc))
    if cur.fetchone():
        continue
    try:
        cur.execute(
            """INSERT INTO actions (thread_id, message_id, description, owner, due_date, status, created_at, completed_at)
               VALUES (?,?,?,?,?,?,datetime('now'),?)""",
            (tid, mid, desc, owner, None, status, completed),
        )
        inserted += cur.rowcount
    except sqlite3.Error as e:
        print("err", tid, e)

conn.commit()
conn.close()
print(f"Actions inserted: {inserted}")