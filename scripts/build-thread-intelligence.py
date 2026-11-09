#!/usr/bin/env python3
"""Build thread-level intelligence data layer from existing analyses.

Reads the local DB (read-only) and the 118 analysis JSONs, and writes:
  correspondence/extracted/threads.json

No schema changes. No original files modified. Reversible (JSON sidecar).
"""
import json, os, re, sqlite3, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
ANALYSIS_DIR = os.path.join(ROOT, "correspondence", "extracted", "analysis")
OUT = os.path.join(ROOT, "correspondence", "extracted", "threads.json")

conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
conn.row_factory = sqlite3.Row

# Load analyses
analyses = {}
for p in os.listdir(ANALYSIS_DIR):
    m = re.match(r"message_(\d+)\.json", p)
    if m:
        analyses[int(m.group(1))] = json.load(open(os.path.join(ANALYSIS_DIR, p)))

# Definite/possible threads
threads = conn.execute("""SELECT DISTINCT t.id, t.account_email, t.gmail_thread_id, t.subject,
    t.last_message_at, t.last_inbound_at, t.last_outbound_at, t.status, t.waiting_on
  FROM threads t JOIN messages m ON m.thread_id=t.id
  JOIN message_classification mc ON mc.message_id=m.id
  WHERE mc.genealogy_relevance IN ('definite','possible')""").fetchall()

def event_type(msg, subj):
    s = (subj or "").lower()
    if msg["direction"] == "out":
        if "sollecito" in s: return "follow_up"
        if "richiesta" in s or "invio" in s: return "request"
        return "correspondence"
    else:
        if "ricevuta" in s or "conferma" in s: return "receipt"
        if "re:" in s or "r:" in s: return "response"
        return "correspondence"

enquiries = {}
for t in threads:
    tid = t["gmail_thread_id"]
    msgs = conn.execute("""SELECT id, account_email, direction, received_at, sent_at, subject, gmail_message_id,
        from_name, from_email, snippet FROM messages WHERE thread_id=? ORDER BY COALESCE(received_at,sent_at)""",
        (t["id"],)).fetchall()
    msg_ids = [m["id"] for m in msgs]
    # aggregate from analyses
    people = []
    places = []
    institutions = []
    protocol_refs = []
    record_refs = []
    actions = []
    for mid in msg_ids:
        a = analyses.get(mid, {})
        for p in (a.get("people") or []):
            name = p.get("name") if isinstance(p, dict) else p
            if name and name not in [x.get("name") if isinstance(x, dict) else x for x in people]:
                people.append({"name": name, "role": p.get("role", "") if isinstance(p, dict) else "",
                               "evidence_msg": mid})
        for pl in (a.get("places") or []):
            v = pl.get("value") if isinstance(pl, dict) else pl
            if v and v not in places: places.append(v)
        for inst in (a.get("institutions") or []):
            v = inst.get("value") if isinstance(inst, dict) else inst
            if v and v not in institutions: institutions.append(v)
        for pr in (a.get("protocol_refs") or []):
            v = pr.get("value") if isinstance(pr, dict) else pr
            if v and v not in protocol_refs: protocol_refs.append(v)
        for rr in (a.get("record_refs") or []):
            v = rr.get("value") if isinstance(rr, dict) else rr
            if v and v not in record_refs: record_refs.append(v)
        for act in (a.get("actions_requested") or []):
            v = act.get("value") if isinstance(act, dict) else act
            ev = act.get("evidence") if isinstance(act, dict) else ""
            if v:
                actions.append({"description": v, "owner": "them", "status": "open",
                                "evidence_msg": mid, "evidence": ev})
        for q in (a.get("outstanding_questions") or []):
            v = q.get("value") if isinstance(q, dict) else q
            ev = q.get("evidence") if isinstance(q, dict) else ""
            if v:
                actions.append({"description": v, "owner": "me", "status": "open",
                                "evidence_msg": mid, "evidence": ev})

    # chronology
    chronology = []
    for m in msgs:
        mid = m["id"]
        a = analyses.get(mid, {})
        d = m["received_at"] or m["sent_at"] or ""
        et = event_type(m, m["subject"])
        # evidence: first sentence of translation or snippet
        trans = a.get("translation_en", "") or ""
        ev_text = trans[:200].replace("\n", " ") if trans else (m["snippet"] or "")[:200]
        chronology.append({
            "date": d,
            "event_type": et,
            "message_id": mid,
            "gmail_message_id": m["gmail_message_id"],
            "direction": m["direction"],
            "subject": m["subject"],
            "from": m["from_name"] or m["from_email"],
            "evidence": ev_text,
            "analysis_available": mid in analyses,
        })

    # title: clean subject
    title = (t["subject"] or "").strip()
    # remove protocol suffixes
    title = re.sub(r"\s*-\s*\[RIF\.PROT\..*\]", "", title).strip()
    title = re.sub(r"\s*–\s*rif\. prot\..*", "", title, flags=re.I).strip()

    enquiries[tid] = {
        "thread_db_id": t["id"],
        "gmail_thread_id": tid,
        "account_email": t["account_email"],
        "title": title,
        "status": "open",  # open | awaiting_response | partially_fulfilled | resolved | not_pursuing
        "review_status": "unreviewed",
        "person_names": [p["name"] for p in people],
        "people": people,
        "institution": (institutions[0] if institutions else None),
        "institutions": institutions,
        "location": (places[0] if places else None),
        "places": places,
        "protocol_refs": protocol_refs,
        "record_refs": record_refs,
        "chronology": chronology,
        "actions": actions,
        "message_count": len(msgs),
        "message_ids": msg_ids,
        "last_activity": t["last_message_at"],
        "last_inbound": t["last_inbound_at"],
        "last_outbound": t["last_outbound_at"],
        "waiting_on": t["waiting_on"],
        "linked_threads": [],  # proposed cross-thread links (to be populated)
        "notes": [],
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

# Proposed cross-thread links based on shared protocol numbers
# Exclude generic refs
generic_protos = {"c_a462", "protocollo@cert-sbt.it", "RIF.PROT.:c_a462", "protocollo@comune.ap.it"}
# build proto -> threads
proto_map = {}
for tid, d in enquiries.items():
    for p in d["protocol_refs"]:
        if p not in generic_protos:
            proto_map.setdefault(p, []).append(tid)

proposed_links = []
for proto, tids in proto_map.items():
    if len(tids) > 1:
        for i in range(len(tids)):
            for j in range(i + 1, len(tids)):
                proposed_links.append({
                    "source_thread": tids[i],
                    "target_thread": tids[j],
                    "reason": f"shared protocol reference: {proto}",
                    "evidence": proto,
                    "status": "proposed",  # proposed | confirmed | rejected
                })

# Attach proposed links to each enquiry
for link in proposed_links:
    src = link["source_thread"]
    if src in enquiries:
        enquiries[src].setdefault("linked_threads", []).append({
            "target": link["target_thread"],
            "reason": link["reason"],
            "evidence": link["evidence"],
            "status": link["status"],
        })

# Deduplicate proposed links (same pair may share multiple protos)
seen = set()
deduped = []
for link in proposed_links:
    key = tuple(sorted([link["source_thread"], link["target_thread"]]))
    if key in seen:
        continue
    seen.add(key)
    deduped.append(link)

out = {
    "version": 1,
    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "enquiry_count": len(enquiries),
    "proposed_link_count": len(deduped),
    "enquiries": enquiries,
    "proposed_links": deduped,
}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f"Written {OUT}")
print(f"Enquiries: {len(enquiries)}")
print(f"Proposed cross-thread links: {len(deduped)}")
# summary of proposed links
for link in deduped:
    print(f"  PROPOSED: {link['source_thread'][:20]} <-> {link['target_thread'][:20]}: {link['reason']}")
