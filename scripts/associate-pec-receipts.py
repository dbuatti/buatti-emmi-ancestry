#!/usr/bin/env python3
"""Associate PEC receipts with their original outgoing enquiries.

Uses existing records only. No Gmail sync, no ingestion changes.

For each PEC receipt (message containing 'Ricevuta avvenuta protocollazione'),
attempts to match it to an original outgoing message by:
1. Protocol number in the receipt subject
2. Subject similarity (fuzzy match)
3. Sender email matching

Creates a pec-associations.json file recording the associations.

Usage:
  python scripts/associate-pec-receipts.py              # run association
  python scripts/associate-pec-receipts.py --dry-run    # show matches without writing
  python scripts/associate-pec-receipts.py --thread TID  # associate receipts for one thread

No database schema changes. No historical reprocessing. No familyData.ts changes.
"""
import argparse, json, os, re, sqlite3, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
ASSOC_PATH = os.path.join(ROOT, "correspondence", "extracted", "pec-associations.json")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from safe_write import safe_write_json, read_with_version

def extract_protocol_from_subject(subject):
    """Extract protocol number from a PEC receipt subject."""
    if not subject:
        return None
    # Pattern: RIF.PROT.:c_a462|REG_UFFICIALE|100913/2026
    m = re.search(r'RIF\.PROT\.\s*:\s*(.+?)(?:\]|$)', subject)
    if m:
        return m.group(1).strip()
    # Pattern: prot. 12345/2026
    m = re.search(r'prot\.?\s*(\d+/\d+)', subject, re.IGNORECASE)
    if m:
        return m.group(1)
    return None

def extract_original_subject_from_receipt(body):
    """Extract the original message subject from a PEC receipt body."""
    if not body:
        return None
    # PEC receipts contain: il messaggio con oggetto "..." è stato inviato
    m = re.search(r'il messaggio con oggetto\s*["\u201c](.+?)["\u201d]', body, re.IGNORECASE | re.DOTALL)
    if m:
        return m.group(1).strip()
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--thread", type=str, help="Associate receipts for one thread only")
    args = ap.parse_args()

    conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    conn.row_factory = sqlite3.Row

    # Find all PEC receipt messages
    query = """SELECT m.id, m.gmail_thread_id, m.direction, m.from_email, m.subject, m.body_text,
                      m.received_at, m.sent_at
               FROM messages m
               WHERE m.body_text LIKE '%Ricevuta avvenuta protocollazione%'
               OR m.subject LIKE '%Ricevuta avvenuta protocollazione%'"""
    if args.thread:
        query += " AND m.gmail_thread_id = ?"
        receipts = [dict(r) for r in conn.execute(query, (args.thread,)).fetchall()]
    else:
        receipts = [dict(r) for r in conn.execute(query).fetchall()]

    print(f"Found {len(receipts)} PEC receipt messages")

    # Load existing associations
    if os.path.exists(ASSOC_PATH):
        assoc_data = json.load(open(ASSOC_PATH))
    else:
        assoc_data = {"version": 1, "associations": {}, "generated_at": None}
    associations = assoc_data.get("associations", {})

    matched = 0
    unmatched = 0

    for receipt in receipts:
        rid = str(receipt["id"])
        if rid in associations:
            continue  # already associated

        # Extract original subject from receipt body
        orig_subject = extract_original_subject_from_receipt(receipt["body_text"])
        protocol = extract_protocol_from_subject(receipt["subject"]) or extract_protocol_from_subject(receipt["body_text"])

        # Find matching outgoing message
        match = None
        match_method = None

        # Strategy 1: Same thread (receipt in same thread as outgoing message)
        same_thread_outgoing = conn.execute(
            "SELECT id, gmail_thread_id, subject, sent_at FROM messages WHERE gmail_thread_id=? AND direction='out' AND id != ?",
            (receipt["gmail_thread_id"], receipt["id"])
        ).fetchall()
        # Filter out PEC receipts from candidates
        non_receipt_outgoing = [m for m in same_thread_outgoing
                                if "Ricevuta avvenuta protocollazione" not in (m["subject"] or "")]
        if non_receipt_outgoing:
            match = dict(non_receipt_outgoing[0])
            match_method = "same_thread"

        # Strategy 2: Subject match (exclude receipt itself)
        if not match and orig_subject:
            candidates = conn.execute(
                "SELECT id, gmail_thread_id, subject, sent_at FROM messages WHERE direction='out' AND id != ? AND subject LIKE ?",
                (receipt["id"], f"%{orig_subject[:40]}%")
            ).fetchall()
            non_receipt = [c for c in candidates if "Ricevuta avvenuta protocollazione" not in (c["subject"] or "")]
            if non_receipt:
                match = dict(non_receipt[0])
                match_method = "subject_match"

        # Strategy 3: Protocol match (exclude receipt itself)
        if not match and protocol:
            candidates = conn.execute(
                "SELECT id, gmail_thread_id, subject, sent_at FROM messages WHERE direction='out' AND id != ? AND (subject LIKE ? OR body_text LIKE ?)",
                (receipt["id"], f"%{protocol}%", f"%{protocol}%")
            ).fetchall()
            non_receipt = [c for c in candidates if "Ricevuta avvenuta protocollazione" not in (c["subject"] or "")]
            if non_receipt:
                match = dict(non_receipt[0])
                match_method = "protocol_match"

        if match:
            assoc = {
                "receipt_msg_id": receipt["id"],
                "receipt_thread_id": receipt["gmail_thread_id"],
                "receipt_subject": receipt["subject"],
                "original_msg_id": match["id"],
                "original_thread_id": match["gmail_thread_id"],
                "original_subject": match["subject"],
                "match_method": match_method,
                "protocol": protocol,
                "original_subject_from_receipt": orig_subject,
                "status": "associated",
                "associated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }
            associations[rid] = assoc
            matched += 1
            if args.dry_run:
                print(f"  MATCH: receipt MSG {receipt['id']} → original MSG {match['id']} (method: {match_method})")
        else:
            associations[rid] = {
                "receipt_msg_id": receipt["id"],
                "receipt_thread_id": receipt["gmail_thread_id"],
                "receipt_subject": receipt["subject"],
                "original_msg_id": None,
                "original_thread_id": None,
                "match_method": None,
                "protocol": protocol,
                "original_subject_from_receipt": orig_subject,
                "status": "unmatched",
                "associated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            }
            unmatched += 1
            if args.dry_run:
                print(f"  UNMATCHED: receipt MSG {receipt['id']} (protocol: {protocol})")

    conn.close()

    if args.dry_run:
        print(f"\nDry run: {matched} matched, {unmatched} unmatched")
        return

    # Write associations
    assoc_data["associations"] = associations
    assoc_data["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    _, v = read_with_version(ASSOC_PATH) if os.path.exists(ASSOC_PATH) else (None, None)
    safe_write_json(ASSOC_PATH, assoc_data, "script", v, ["associations"], "PEC receipt association")

    print(f"Associated: {matched} matched, {unmatched} unmatched")
    print(f"Total associations: {len(associations)}")

if __name__ == "__main__":
    main()
