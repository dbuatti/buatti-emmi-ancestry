#!/usr/bin/env python3
"""Backfill the `thread_links` table (thread -> person/record/lead/question).

Derives person links from correspondence/extracted/request-links.json, which
already maps each outbound research request to its involved threads and the
person names mentioned. Names are resolved to familyData person ids via a
normalised name match.

Idempotent: uses INSERT OR IGNORE on the composite PK.
No Gmail writes, no familyData changes.
"""
import json
import os
import re
import sqlite3
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
FAMILY_DATA = os.path.join(ROOT, "src", "data", "familyData.ts")
REQUEST_LINKS = os.path.join(ROOT, "correspondence", "extracted", "request-links.json")


def load_person_map():
    text = open(FAMILY_DATA, encoding="utf-8").read()
    # Extract id + name pairs from initialPeople array.
    person_re = re.compile(r"id:\s*'([^']+)'\s*,\s*\n\s*name:\s*'([^']+)'", re.MULTILINE)
    m = {}
    for pid, name in person_re.findall(text):
        key = re.sub(r"\s+", " ", name.lower()).strip()
        # strip parenthetical qualifiers like "(Sr.)"
        key = re.sub(r"\s*\([^)]*\)", "", key).strip()
        m[key] = pid
        # also store last-name-only-ish: full name
        m[name.lower().strip()] = pid
    return m


def norm_name(s):
    s = (s or "").lower().strip()
    s = re.sub(r"\s*\([^)]*\)", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def resolve_person_id(name, person_map):
    n = norm_name(name)
    if n in person_map:
        return person_map[n]
    # try "surname firstname" / "firstname surname" swaps
    parts = n.split()
    if len(parts) == 2:
        swapped = parts[1] + " " + parts[0]
        if swapped in person_map:
            return person_map[swapped]
    # fuzzy: find a person whose normalised name contains all tokens
    for k, pid in person_map.items():
        if all(tok in k for tok in parts) and len(parts) >= 2:
            return pid
    return None


def main():
    if not os.path.exists(DB_PATH):
        print("DB not found:", DB_PATH, file=sys.stderr)
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    # map gmail_thread_id -> threads.id (and account_email)
    cur.execute("SELECT id, account_email, gmail_thread_id FROM threads")
    thread_id_map = {}
    for tid, acct, gtid in cur.fetchall():
        thread_id_map[(acct, gtid)] = tid
        thread_id_map[gtid] = tid  # gmail_thread_id alone (first wins)

    person_map = load_person_map()
    print("Loaded", len(person_map) // 2, "people from familyData.ts")

    data = json.load(open(REQUEST_LINKS, encoding="utf-8"))
    requests = data.get("requests", {})

    inserted = 0
    skipped_no_person = 0
    skipped_no_thread = 0
    seen = set()

    for rid, req in requests.items():
        person_ids = set()
        for name in req.get("person_names", []) or []:
            pid = resolve_person_id(name, person_map)
            if pid:
                person_ids.add(pid)
            else:
                skipped_no_person += 1

        # Collect all thread ids involved in this request.
        thread_gids = set()
        if req.get("source_thread"):
            thread_gids.add(req["source_thread"])
        for lr in req.get("linked_replies", []) or []:
            if lr.get("thread_id"):
                thread_gids.add(lr["thread_id"])
        for ev in req.get("linked_events", []) or []:
            if ev.get("thread_id"):
                thread_gids.add(ev["thread_id"])

        for gtid in thread_gids:
            tid = thread_id_map.get(gtid)
            if tid is None:
                skipped_no_thread += 1
                continue
            for pid in person_ids:
                key = (tid, "person", pid)
                if key in seen:
                    continue
                seen.add(key)
                try:
                    cur.execute(
                        "INSERT OR IGNORE INTO thread_links (thread_id, entity_type, entity_id, created_at) VALUES (?,?,?,datetime('now'))",
                        (tid, "person", pid),
                    )
                    inserted += cur.rowcount
                except sqlite3.Error as e:
                    print("insert error:", e, file=sys.stderr)

    # ---- Phase 2: person links from Gemini message analyses (4B) ----
    # The analyse pipeline (Gemini) extracts people per message; a thread can
    # mention people that request-links missed. Add those links idempotently.
    analysis_dir = os.path.join(ROOT, "correspondence", "extracted", "analysis")
    added_from_analysis = 0
    if os.path.isdir(analysis_dir):
        for fname in sorted(os.listdir(analysis_dir)):
            if not fname.startswith("message_") or not fname.endswith(".json"):
                continue
            try:
                a = json.load(open(os.path.join(analysis_dir, fname), encoding="utf-8"))
            except Exception:
                continue
            mid = a.get("message_id")
            if not mid:
                continue
            try:
                row = cur.execute(
                    "SELECT thread_id, account_email, gmail_thread_id FROM messages WHERE id=?",
                    (mid,),
                ).fetchone()
            except Exception:
                continue
            if not row:
                continue
            tid = row[0]
            for p in a.get("people") or []:
                if not isinstance(p, dict):
                    continue
                name = p.get("name")
                if not name or "daniele buatti" in name.lower():
                    continue  # Daniele himself is already linked via the requester side
                pid = resolve_person_id(name, person_map)
                if not pid:
                    continue
                key = (tid, "person", pid)
                if key in seen:
                    continue
                seen.add(key)
                cur.execute(
                    "INSERT OR IGNORE INTO thread_links (thread_id, entity_type, entity_id, created_at) VALUES (?,?,?,datetime('now'))",
                    (tid, "person", pid),
                )
                added_from_analysis += cur.rowcount

    conn.commit()
    conn.close()
    print(f"Inserted {inserted} thread->person links")
    print(f"Skipped (no person match): {skipped_no_person}")
    print(f"Skipped (no thread in DB): {skipped_no_thread}")
    print(f"Added via Gemini analyses: {added_from_analysis}")


if __name__ == "__main__":
    main()