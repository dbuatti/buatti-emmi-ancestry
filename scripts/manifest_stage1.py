#!/usr/bin/env python3
"""Generate a manifest of attachments to be processed in Stage 1 of attachment-gate.

Includes:
- Message id, account_email, thread_id, direction, subject, date, attachment details.
- Paths: source (in DB) and destination (text file, ocr_pages) in extraction.
- File size, whether it's already processed.

Writes JSON to stdout.
"""

import json, os, sqlite3

ROOT = os.getcwd()
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
GATE_PATH = os.path.join(ROOT, "correspondence", "extracted", "attachment-gate.json")

TARGET_MESSAGE_IDS = [14, 128, 192, 197, 130]  # as per clarification

def main():
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row

    gate = json.load(open(GATE_PATH)) if os.path.exists(GATE_PATH) else {"messages": {}}

    manifest = []

    for mid in TARGET_MESSAGE_IDS:
        msg = conn.execute(
            "SELECT id, gmail_message_id, gmail_thread_id, direction, subject, from_email, received_at, account_email FROM messages WHERE id = ?",
            (mid,)
        ).fetchone()
        if not msg:
            continue
        atts = conn.execute(
            """SELECT a.id, a.filename, a.safe_filename, a.mime_type, a.size_bytes, a.local_path, a.unavailable, a.gmail_attachment_id
               FROM attachments a WHERE a.message_id = ? ORDER BY a.id""",
            (mid,)
        ).fetchall()

        entry = {
            "message_id": msg["id"],
            "gmail_message_id": msg["gmail_message_id"],
            "gmail_thread_id": msg["gmail_thread_id"],
            "account_email": msg["account_email"],
            "direction": msg["direction"],
            "from_email": msg["from_email"],
            "received_at": msg["received_at"],
            "subject": msg["subject"],
            "gate_status_existing": gate["messages"].get(str(msg["id"]), {}).get("gate_status", "NOT_GATED"),
            "attachments": []
        }
        for a in atts:
            # determine if file exists, size, and stage1 output paths
            src_path = a["local_path"] or ""
            exists = os.path.isfile(src_path)
            size = os.path.getsize(src_path) if exists else None
            # text output path (if any)
            txt_path = None
            if exists:
                # guess text path: correspondence/extracted/<att_id>.txt
                txt_path = os.path.join(ROOT, "correspondence", "extracted", f"{a['id']}.txt")
                txt_exists = os.path.isfile(txt_path)
            else:
                txt_exists = False

            ocr_pages_dir = os.path.join(ROOT, "correspondence", "extracted", "ocr_pages", str(a["id"]))
            ocr_dir_exists = os.path.isdir(ocr_pages_dir) and os.listdir(ocr_pages_dir)

            entry["attachments"].append({
                "attachment_id": a["id"],
                "filename": a["filename"],
                "safe_filename": a["safe_filename"],
                "mime_type": a["mime_type"],
                "size_bytes": a["size_bytes"],
                "local_path": src_path,
                "unavailable": bool(a["unavailable"]),
                "exists": exists,
                "fs_size": size,
                "text_path": txt_path,
                "text_exists": txt_exists if txt_path else False,
                "ocr_pages_dir": ocr_pages_dir,
                "ocr_dir_exists": ocr_dir_exists,
                "kind": None,  # we could compute, but not needed for manifest
            })

        manifest.append(entry)

    json.dump(manifest, open(os.path.join(ROOT, "stage1_manifest.json"), "w"), indent=2, default=str)
    print(json.dumps(manifest, indent=2, default=str))

if __name__ == "__main__":
    main()