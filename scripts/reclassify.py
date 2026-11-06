#!/usr/bin/env python3
"""Reclassify existing messages using the revised deterministic rules.

Uses only locally stored data. No Gmail access.
Preserves manual overrides (skips messages with overrides).
"""

import json
import os
import sqlite3
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DB_PATH = os.environ.get("CORRESPONDENCE_DB_PATH",
                         str(PROJECT_ROOT / ".local" / "correspondence.db"))
RAW_DIR = PROJECT_ROOT / "correspondence" / "raw" / "info@danielebuatti.com"  # default; override via --account

sys.path.insert(0, str(SCRIPT_DIR))
import importlib.util
spec = importlib.util.spec_from_file_location("sg", SCRIPT_DIR / "sync-gmail.py")
sg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sg)


def load_headers(msg_id):
    """Load headers from raw JSON."""
    path = RAW_DIR / f"{msg_id}.json"
    if not path.exists():
        return {}, []
    with open(path) as f:
        raw = json.load(f)
    headers = {h["name"]: h["value"] for h in raw["payload"]["headers"]}
    labels = raw.get("labelIds", [])
    return headers, labels


def main():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    # Get all messages
    msgs = conn.execute("""
        SELECT m.id, m.gmail_message_id, m.direction, m.from_name, m.from_email,
               m.subject, m.received_at, m.snippet, m.body_text,
               m.thread_id
        FROM messages m
        ORDER BY m.received_at DESC
    """).fetchall()

    print(f"Reclassifying {len(msgs)} messages...")

    for m in msgs:
        msg_id = m["id"]
        thread_id = m["thread_id"]

        # Check for manual override — skip if exists
        override = sg.get_override(conn, scope="thread", thread_id=thread_id)
        if not override:
            override = sg.get_override(conn, scope="sender", sender_email=m["from_email"])
        if override:
            print(f"  SKIP msg {msg_id} (has override)")
            continue

        # Load headers
        headers, labels = load_headers(m["gmail_message_id"])

        # Build msg_data
        att_count = conn.execute(
            "SELECT COUNT(*) FROM attachments WHERE message_id = ?", (msg_id,)
        ).fetchone()[0]

        msg_data = {
            "from_email": m["from_email"],
            "subject": m["subject"],
            "snippet": m["snippet"],
            "body_text": m["body_text"],
            "headers": headers,
            "labels": labels,
            "has_attachments": att_count > 0,
        }

        # Classify
        type_result = sg.classify_message_type(msg_data)
        action_result = sg.infer_action_status(msg_data, type_result[0])

        msg_type = type_result[0]
        type_conf = type_result[1]
        action_status = action_result[0]
        action_conf = action_result[1]
        action_req = 1 if action_status in ('needs_review', 'needs_reply') else 0

        # Preserve original legacy category
        orig = conn.execute(
            "SELECT category FROM message_classification WHERE message_id = ?", (msg_id,)
        ).fetchone()
        orig_category = orig[0] if orig else "uncertain"

        # Update message_classification (delete old, insert new)
        conn.execute("DELETE FROM message_classification WHERE message_id = ?", (msg_id,))
        conn.execute(
            """INSERT INTO message_classification
               (message_id, category, message_type, action_status,
                relevance_score, action_required, confidence,
                type_confidence, action_confidence, classified_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (msg_id, orig_category, msg_type, action_status,
             type_conf, action_req, type_conf,
             type_conf, action_conf, sg.now_iso()),
        )
        conn.commit()
        print(f"  msg {msg_id}: {msg_type} ({type_conf}) / {action_status} ({action_conf})")

    conn.close()
    print("Reclassification complete.")


if __name__ == "__main__":
    main()