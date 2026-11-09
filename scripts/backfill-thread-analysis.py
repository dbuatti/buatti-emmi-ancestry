#!/usr/bin/env python3
"""Backfill the `thread_analysis` table from existing `message_analysis` rows.

For each thread that has at least one analysed message, insert a
thread_analysis row (analysis_version=1) using the most recent message's
summary/intent/model. Idempotent (INSERT OR IGNORE on (thread_id, version)).

No LLM calls, no Gmail writes.
"""
import os, sqlite3, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

cur.execute("""
    SELECT m.thread_id,
           ma.summary_en,
           ma.sender_intent,
           ma.model_summary,
           ma.model_translation,
           ma.analysed_at
    FROM message_analysis ma
    JOIN messages m ON m.id = ma.message_id
    WHERE ma.analysis_version = (
        SELECT MAX(ma2.analysis_version) FROM message_analysis ma2 WHERE ma2.message_id = ma.message_id
    )
    ORDER BY ma.analysed_at DESC
""")
rows = cur.fetchall()

# Keep the most recent analysis per thread.
latest = {}
for r in rows:
    tid = r["thread_id"]
    if tid not in latest:
        latest[tid] = r

inserted = 0
for tid, r in latest.items():
    summary = r["summary_en"] or None
    intent = r["sender_intent"] or None
    model = r["model_summary"] or r["model_translation"] or None
    analysed = r["analysed_at"] or datetime.datetime.now(datetime.timezone.utc).isoformat()
    try:
        cur.execute(
            """INSERT OR IGNORE INTO thread_analysis
               (thread_id, analysis_version, summary_en, sender_intent, model, analysed_at)
               VALUES (?,?,?,?,?,?)""",
            (tid, 1, summary, intent, model, analysed),
        )
        inserted += cur.rowcount
    except sqlite3.Error as e:
        print("err", tid, e)

conn.commit()
conn.close()
print(f"Threads with analysed messages: {len(latest)}")
print(f"thread_analysis rows inserted: {inserted}")