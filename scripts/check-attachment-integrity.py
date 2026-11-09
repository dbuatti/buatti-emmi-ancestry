#!/usr/bin/env python3
"""Check integrity of downloaded attachments: file exists, size matches, readable."""
import argparse
import json
import os
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
ATTACHMENTS_DIR = os.path.join(ROOT, "correspondence", "attachments")

def main():
    ap = argparse.ArgumentParser(description="Check attachment integrity")
    ap.add_argument("--json", action="store_true", help="Output as JSON")
    ap.add_argument("--fix", action="store_true", help="Attempt to fix (re-download missing)")
    args = ap.parse_args()

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("""
        SELECT id, message_id, filename, safe_filename, mime_type, size_bytes,
               local_path, gmail_attachment_id, unavailable, unavailable_reason
        FROM attachments
        ORDER BY id
    """)
    rows = cur.fetchall()

    results = {
        "total": len(rows),
        "downloaded": 0,
        "unavailable": 0,
        "not_downloaded": 0,
        "passed": 0,
        "failed": 0,
        "issues": [],
        "attachments": [],
    }

    for r in rows:
        att = dict(r)
        att_id = att["id"]
        local_path = att["local_path"]
        size_bytes = att["size_bytes"]
        unavailable = att["unavailable"]

        entry = {
            "id": att_id,
            "filename": att["filename"],
            "message_id": att["message_id"],
            "status": "unknown",
            "issues": [],
        }

        if unavailable:
            entry["status"] = "unavailable"
            entry["issues"].append(att["unavailable_reason"] or "Gmail reports unavailable")
            results["unavailable"] += 1
            results["attachments"].append(entry)
            continue

        if not local_path:
            entry["status"] = "not_downloaded"
            entry["issues"].append("No local_path set")
            results["not_downloaded"] += 1
            results["attachments"].append(entry)
            continue

        # Resolve path (could be relative or absolute)
        if not os.path.isabs(local_path):
            local_path = os.path.join(ROOT, local_path)

        results["downloaded"] += 1

        # Check 1: file exists
        if not os.path.exists(local_path):
            entry["status"] = "failed"
            entry["issues"].append(f"File not found: {local_path}")
            results["failed"] += 1
            results["issues"].append({"id": att_id, "issue": "file_not_found", "detail": local_path})
            results["attachments"].append(entry)
            continue

        # Check 2: file is readable
        try:
            with open(local_path, "rb") as f:
                header = f.read(16)
                f.seek(0, 2)
                actual_size = f.tell()
        except Exception as e:
            entry["status"] = "failed"
            entry["issues"].append(f"Cannot read file: {e}")
            results["failed"] += 1
            results["issues"].append({"id": att_id, "issue": "unreadable", "detail": str(e)})
            results["attachments"].append(entry)
            continue

        # Check 3: size matches
        if size_bytes is not None and actual_size != size_bytes:
            entry["status"] = "failed"
            entry["issues"].append(f"Size mismatch: DB={size_bytes}, disk={actual_size}")
            results["failed"] += 1
            results["issues"].append({"id": att_id, "issue": "size_mismatch", "detail": f"DB={size_bytes}, disk={actual_size}"})
            results["attachments"].append(entry)
            continue

        # Check 4: file is not empty
        if actual_size == 0:
            entry["status"] = "failed"
            entry["issues"].append("File is empty (0 bytes)")
            results["failed"] += 1
            results["issues"].append({"id": att_id, "issue": "empty_file", "detail": "0 bytes"})
            results["attachments"].append(entry)
            continue

        # Check 5: magic bytes match mime type (basic check)
        mime = att["mime_type"] or ""
        magic_ok = True
        magic_note = ""
        if mime.startswith("application/pdf") and not header.startswith(b"%PDF"):
            magic_ok = False
            magic_note = f"Expected PDF header, got {header[:8]}"
        elif mime.startswith("image/jpeg") and not header.startswith(b"\xff\xd8\xff"):
            magic_ok = False
            magic_note = f"Expected JPEG header, got {header[:8]}"
        elif mime.startswith("image/png") and not header.startswith(b"\x89PNG"):
            magic_ok = False
            magic_note = f"Expected PNG header, got {header[:8]}"

        if not magic_ok:
            entry["status"] = "warning"
            entry["issues"].append(f"MIME mismatch: {magic_note}")
            results["issues"].append({"id": att_id, "issue": "mime_mismatch", "detail": magic_note})
        else:
            entry["status"] = "passed"

        if entry["status"] == "passed":
            results["passed"] += 1
        elif entry["status"] == "warning":
            results["passed"] += 1  # warnings still count as passed (readable)

        results["attachments"].append(entry)

    conn.close()

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(f"Attachment Integrity Check")
        print(f"=========================")
        print(f"Total attachments: {results['total']}")
        print(f"  Downloaded:     {results['downloaded']}")
        print(f"  Unavailable:    {results['unavailable']}")
        print(f"  Not downloaded: {results['not_downloaded']}")
        print(f"  Passed:         {results['passed']}")
        print(f"  Failed:         {results['failed']}")
        if results["issues"]:
            print(f"\nIssues found ({len(results['issues'])}):")
            for issue in results["issues"]:
                print(f"  #{issue['id']}: {issue['issue']} — {issue['detail']}")
        else:
            print("\nNo issues found.")

    sys.exit(0 if results["failed"] == 0 else 1)

if __name__ == "__main__":
    main()