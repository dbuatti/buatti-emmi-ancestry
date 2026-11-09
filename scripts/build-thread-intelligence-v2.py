#!/usr/bin/env python3
"""v2 thread intelligence: enquiries (multi-thread clusters) + institution normalisation + action classification."""
import json, os, re, sqlite3, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
ANALYSIS_DIR = os.path.join(ROOT, "correspondence", "extracted", "analysis")
V1_PATH = os.path.join(ROOT, "correspondence", "extracted", "threads.v1.json")
OUT = os.path.join(ROOT, "correspondence", "extracted", "threads.json")

conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
conn.row_factory = sqlite3.Row
analyses = {}
for p in os.listdir(ANALYSIS_DIR):
    m = re.match(r"message_(\d+)\.json", p)
    if m: analyses[int(m.group(1))] = json.load(open(os.path.join(ANALYSIS_DIR, p)))

v1 = json.load(open(V1_PATH))

CANONICAL_MAP = {
    "Comune di Ascoli Piceno": "Comune di Ascoli Piceno",
    "Municipality of Ascoli Piceno": "Comune di Ascoli Piceno",
    "Municipality of Ascoli Piceno": "Comune di Ascoli Piceno",
    "Comune di Maltignano": "Comune di Maltignano",
    "Maltignano Municipality": "Comune di Maltignano",
    "City of Maltignano": "Comune di Maltignano",
    "Comune of Maltignano": "Comune di Maltignano",
    "Municipality of San Benedetto del Tronto": "Comune di San Benedetto del Tronto",
    "Comune San Benedetto del Tronto": "Comune di San Benedetto del Tronto",
    "Comune di San Benedetto del Tronto": "Comune di San Benedetto del Tronto",
    "City of San Benedetto del Tronto": "Comune di San Benedetto del Tronto",
    "Commune of San Benedetto del Tronto": "Comune di San Benedetto del Tronto",
    "Municipality of Linguaglossa": "Comune di Linguaglossa",
    "Comune di Linguaglossa": "Comune di Linguaglossa",
    "Comune di Fiumefreddo di Sicilia": "Comune di Fiumefreddo di Sicilia",
    "Municipality of Fiumefreddo di Sicilia": "Comune di Fiumefreddo di Sicilia",
    "Department of Demographic Services of the City of Catania": "Comune di Catania",
    "Comune di Catania": "Comune di Catania",
    "State Archives of Ascoli Piceno": "Archivio di Stato di Ascoli Piceno",
    "Ascoli Piceno State Archive": "Archivio di Stato di Ascoli Piceno",
    "State Archives of Ascoli Picene": "Archivio di Stato di Ascoli Piceno",
    "Archivio di Stato di Ascoli Piceno": "Archivio di Stato di Ascoli Piceno",
    "State Archive of Catania": "Archivio di Stato di Catania",
    "State Archives of Catania": "Archivio di Stato di Catania",
    "Archivio di Stato di Catania": "Archivio di Stato di Catania",
    "Diocesan Historical Archive": "Archivio Storico Diocesano",
    "Court of Catania": "Tribunale di Catania",
    "Catania Tribunal": "Tribunale di Catania",
    "Tribunale di Catania": "Tribunale di Catania",
    "Court of Ascoli Piceno": "Tribunale di Ascoli Piceno",
    "IIS \"ULPIANI\" - ASCOLI PICENO": 'IIS "Celso Ulpiani" (Ascoli Piceno)',
    "IIS \"ULPIANI\"": 'IIS "Celso Ulpiani" (Ascoli Piceno)',
    "Celso Ulpiani Institute": 'IIS "Celso Ulpiani" (Ascoli Piceno)',
    "Istituto Istruzione Superiore \"Celso Ulpiani\"": 'IIS "Celso Ulpiani" (Ascoli Piceno)',
    "Istituto d'Istruzione Superiore Celso Ulpiani": 'IIS "Celso Ulpiani" (Ascoli Piceno)',
    "Higher Education Institute 'Celso Ulpiani'": 'IIS "Celso Ulpiani" (Ascoli Piceno)',
    "Celso Ulpiani": 'IIS "Celso Ulpiani" (Ascoli Piceno)',
    "USP of Ascoli Piceno": "Ufficio Scolastico Provinciale di Ascoli Piceno",
    "Provincial School Office of Ascoli Piceno": "Ufficio Scolastico Provinciale di Ascoli Piceno",
    "Provincial School Office (USP)": "Ufficio Scolastico Provinciale di Ascoli Piceno",
    "Provveditorato degli Studi of Ascoli Piceno": "Provveditorato agli Studi di Ascoli Piceno",
    "Diocesan Curia of Ascoli Piceno": "Curia di Ascoli Piceno",
    "Diocesi di Acireale": "Diocesi di Acireale",
    "Diocesi di Cirella": "Diocesi di Cirella (Calatabiano)",
    "Diocesis of San Benedetto del Tronto": "Curia di San Benedetto del Tronto",
    "Curia San Benedetto del Tronto": "Curia di San Benedetto del Tronto",
    "parishes of San Benedetto del Tronto": "Parrocchie di San Benedetto del Tronto",
    "Parrocchia di Fiumefreddo": "Parrocchia di Fiumefreddo di Sicilia",
    "General Consulate of Italy in Melbourne": "Consolato Generale d'Italia (Melbourne)",
    "University of Perugia": "Università di Perugia",
    "Unipg": "Università di Perugia",
    "AIRE": "A.I.R.E.",
    "A.I.R.E.": "A.I.R.E.",
    "Office IV - Territorial Area of Ascoli Piceno and Fermo": "Ufficio IV - Ambito Territoriale di Ascoli Piceno e Fermo",
    "Provveditorato degli Studi of Ascoli Piceno": "Provveditorato agli Studi di Ascoli Piceno",
    "Office of Civil Status and Demographic Services of the Municipality of Ascoli Piceno": "Comune di Ascoli Piceno",
    "Ufficio dello Stato Civile, Settore 4": "Comune di Ascoli Piceno",
    # generic / not institutions
    "Antenati": None,
    "Antenati Portal": None,
    "Portal Antenati": None,
    "FamilySearch": None,
    "Pec Aruba": None,
    "Certified Mail": None,
    "Certified Mail Service": None,
    "Post Office": None,
    "pagOnline": None,
    "pagOnline portal": None,
    "pagPA": None,
    "Pagopa.it": None,
    "Cert-SBT": None,
    "comune.ap@pec.it": None,
    "postacert.istruzione.it": None,
    "Stato civile": None,
    "Office of Civil Registry and State": None,
    "Office of the Civil Registry": None,
    "Civil Registry Office": None,
    "Marriage Register 1948, part 2, series A": None,
    "AS-CT": None,
    "Office of Anagrafe and Demographic Services": None,
    "Anagrafe office": None,
    "Anagrafe/State Civil": None,
    "State Civil Registry": None,
    "Prefecture": None,
    "Italian Institute": None,
    "Institute": None,
    "Office of Civil Registry and State": None,
    "Anagrafe del Comune di Linguaglossa": "Comune di Linguaglossa",
}

def canonicalize(raw, context=""):
    if not raw:
        return None, "low", "no institution extracted"
    raw = raw.strip()
    if raw in CANONICAL_MAP:
        c = CANONICAL_MAP[raw]
        if c is None:
            return None, "low", "generic/uncertain reference ('%s') — not a specific institution" % raw
        return c, "high", "direct match from '%s'" % raw
    low = raw.lower()
    ctx_low = (context or "").lower()
    # context-based inference for PEC gateway / generic references
    if "aruba" in low or "pec" in low or "codesto" in low or "comune di aruba" in low:
        if "ascoli" in ctx_low or "comune.ap" in ctx_low or "ap@" in ctx_low or "settore 4" in ctx_low or "settore 4" in low or "ascoli" in low:
            return "Comune di Ascoli Piceno", "medium", "inferred from PEC context (Ascoli Piceno)"
        if "maltignano" in ctx_low:
            return "Comune di Maltignano", "medium", "inferred from PEC context (Maltignano)"
        if "san benedetto" in ctx_low or "sbt" in ctx_low or "cert-sbt" in ctx_low:
            return "Comune di San Benedetto del Tronto", "medium", "inferred from PEC context (SBT)"
        if "linguaglossa" in ctx_low:
            return "Comune di Linguaglossa", "medium", "inferred from PEC context (Linguaglossa)"
        if "catania" in ctx_low:
            return "Comune di Catania", "medium", "inferred from PEC context (Catania)"
        return None, "low", "PEC gateway/generic reference ('%s') — institution not established" % raw
    # fuzzy comune name
    for comune, canon in [("ascoli piceno", "Comune di Ascoli Piceno"),
                          ("maltignano", "Comune di Maltignano"),
                          ("san benedetto", "Comune di San Benedetto del Tronto"),
                          ("linguaglossa", "Comune di Linguaglossa"),
                          ("fiumefreddo", "Comune di Fiumefreddo di Sicilia"),
                          ("catania", "Comune di Catania")]:
        if comune in low:
            return canon, "medium", "inferred from '%s'" % raw
    # fuzzy archive/court
    if "ascoli" in low and ("archivio" in low or "stato" in low):
        return "Archivio di Stato di Ascoli Piceno", "medium", "inferred from '%s'" % raw
    if "catania" in low and ("archivio" in low or "stato" in low or "tribunale" in low):
        if "tribunale" in low or "court" in low:
            return "Tribunale di Catania", "medium", "inferred from '%s'" % raw
        return "Archivio di Stato di Catania", "medium", "inferred from '%s'" % raw
    if "perugia" in low:
        return "Università di Perugia", "medium", "inferred from '%s'" % raw
    if "melbourne" in low:
        return "Consolato Generale d'Italia (Melbourne)", "medium", "inferred from '%s'" % raw
    return None, "low", "unmapped institution string: '%s'" % raw

# ---------- Main ----------
enquiries = v1["enquiries"]
for tid, e in enquiries.items():
    msgs_ctx = conn.execute("SELECT from_email, subject, snippet, body_text FROM messages WHERE thread_id=?",
                            (e["thread_db_id"],)).fetchall()
    ctx = (e.get("title", "") or "") + " " + " ".join(
        (m["from_email"] or "") + " " + (m["subject"] or "") + " " + (m["snippet"] or "") + " " + ((m["body_text"] or "")[:300]) for m in msgs_ctx)
    raw_insts = e.get("institutions", [])
    raw_primary = e.get("institution")
    canon, conf, note = canonicalize(raw_primary, context=ctx)
    e["institution_raw"] = raw_primary
    e["institution"] = canon  # None if uncertain
    e["institution_confidence"] = conf
    e["institution_note"] = note
    e["institutions_canonical"] = []
    for inst in raw_insts:
        c, cf, n = canonicalize(inst, context=ctx)
        e["institutions_canonical"].append({"raw": inst, "canonical": c, "confidence": cf, "note": n})

# Action classification
for tid, e in enquiries.items():
    has_response = any(c["event_type"] in ("receipt", "response") for c in e.get("chronology", []))
    for act in (e.get("actions") or []):
        desc = (act.get("description") or "").lower()
        is_request = any(k in desc for k in ["request", "copy of", "search for", "obtain", "release", "digital reproduction"])
        if is_request and has_response:
            act["action_status"] = "historical"
        else:
            act["action_status"] = "outstanding"

# Person normalization proposals
normalization_proposals = [
    {"variant_a": "Giovanni", "variant_b": "Giovanni Buatti",
     "evidence": "msg 906: 'son of Giovanni Buatti and Emidia Bruni'; msg 226: 'son of Giovanni and Bruni Emidia'. Same person (Alfredo's father), surname omitted in some messages.",
     "confidence": "medium", "status": "proposed"},
    {"variant_a": "Bruni Emidia", "variant_b": "Emidia Bruni",
     "evidence": "msg 906: 'son of Giovanni Buatti and Emidia Bruni'; msg 226: 'son of Giovanni and Bruni Emidia'. Same person, surname/first-name order swapped.",
     "confidence": "high", "status": "proposed"},
    {"variant_a": "Ida Galanti", "variant_b": "GALANTI Ida",
     "evidence": "Two candidates: born 19/03/1893 (d/o Antonio+Virginia) and 07/08/1904 (d/o Ignazio+Clementina). Death act (att 3, page 1) shows 19/03/1893. Identity unresolved until visually verified.",
     "confidence": "low", "status": "proposed (identity unresolved)"},
    {"variant_a": "Egidio Emmi", "variant_b": "EMMI Egidio",
     "evidence": "Same person, case variant. A second distinct Egidio Emmi exists (son of Antonino of Francesco + Rosa Vecchio, msg 2988).",
     "confidence": "medium", "status": "proposed (two distinct Egidios exist)"},
    {"variant_a": "Concetta Sgroi", "variant_b": "SGROI Concetta",
     "evidence": "Same person, surname/first-name order swapped.",
     "confidence": "high", "status": "proposed"},
    {"variant_a": "Rosaria Nasti", "variant_b": "Nasti Rosaria",
     "evidence": "Same person, surname/first-name order swapped. Spelling uncertainty: 'NASTI or RAITI'.",
     "confidence": "medium", "status": "proposed"},
]

# Proposed multi-thread enquiries (shared protocol numbers)
generic_protos = {"c_a462", "protocollo@cert-sbt.it", "RIF.PROT.:c_a462", "protocollo@comune.ap.it",
                  "comune.ap@pec.it", "posta-certificata@pec.aruba.it", "postacert.istruzione.it"}
thread_protos = {}
for tid, e in enquiries.items():
    thread_protos[tid] = [p for p in (e.get("protocol_refs") or []) if p not in generic_protos]

clusters = {}
proto_to_cluster = {}
for tid, protos in thread_protos.items():
    matched = None
    for p in protos:
        if p in proto_to_cluster:
            matched = proto_to_cluster[p]
            break
    if matched:
        clusters[matched].append(tid)
        for p in protos:
            proto_to_cluster[p] = matched
    else:
        new_id = "enq_" + tid[:8]
        clusters[new_id] = [tid]
        for p in protos:
            proto_to_cluster[p] = new_id

multi_enquiries = {}
for cid, tids in clusters.items():
    if len(tids) <= 1:
        continue
    all_msgs = set()
    all_people = []
    all_protos = []
    all_records = []
    all_institutions = []
    all_places = []
    all_actions = []
    for tid in tids:
        e = enquiries[tid]
        all_msgs.update(e.get("message_ids", []))
        for pn in (e.get("person_names") or []):
            if pn not in all_people: all_people.append(pn)
        for p in (e.get("protocol_refs") or []):
            if p not in all_protos: all_protos.append(p)
        for r in (e.get("record_refs") or []):
            if r not in all_records: all_records.append(r)
        for inst in (e.get("institutions") or []):
            if inst not in all_institutions: all_institutions.append(inst)
        for pl in (e.get("places") or []):
            if pl not in all_places: all_places.append(pl)
        for a in (e.get("actions") or []):
            all_actions.append(a)
    title = enquiries[tids[0]].get("title", "")
    multi_enquiries[cid] = {
        "enquiry_id": cid,
        "title": title,
        "status": "proposed",
        "review_status": "unreviewed",
        "constituent_threads": tids,
        "constituent_messages": sorted(all_msgs),
        "thread_count": len(tids),
        "message_count": len(all_msgs),
        "person_names": all_people,
        "institutions": all_institutions,
        "places": all_places,
        "protocol_refs": all_protos,
        "record_refs": all_records,
        "actions": all_actions,
        "outstanding_actions": [a for a in all_actions if a.get("action_status") == "outstanding"],
        "historical_actions": [a for a in all_actions if a.get("action_status") == "historical"],
        "last_activity": max((enquiries[t].get("last_activity") or "") for t in tids),
        "rationale": "Shared specific protocol references",
        "confidence": "medium",
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

# Proposed cross-thread links (from v1, carried forward)
v1 = json.load(open(V1_PATH))
proposed_links = v1.get("proposed_links", [])
# deduplicate
seen = set()
deduped = []
for link in proposed_links:
    key = tuple(sorted([link["source_thread"], link["target_thread"]]))
    if key in seen: continue
    seen.add(key)
    deduped.append(link)

# Attach proposed links to threads
for link in deduped:
    src = link["source_thread"]
    if src in enquiries:
        enquiries[src].setdefault("linked_threads", []).append({
            "target": link["target_thread"],
            "reason": link["reason"],
            "evidence": link["evidence"],
            "status": link["status"],
        })

out = {
    "version": 2,
    "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    "thread_count": len(enquiries),
    "proposed_enquiry_count": len(multi_enquiries),
    "institution_normalization": {
        "canonical_map_applied": True,
        "note": "Raw institution strings preserved in institution_raw. Canonical names applied where evidence supports. Generic references (codesto, PEC gateways) marked low confidence.",
    },
    "person_normalization_proposals": normalization_proposals,
    "threads": enquiries,
    "proposed_enquiries": multi_enquiries,
    "proposed_links": deduped,
}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(out, f, indent=2, ensure_ascii=False)
print(f"Written {OUT}")
print(f"Threads: {len(enquiries)}")
print(f"Proposed multi-thread enquiries: {len(multi_enquiries)}")
for eid, e in multi_enquiries.items():
    print(f"  {eid}: {e['thread_count']} threads, {e['message_count']} msgs, outstanding={len(e['outstanding_actions'])}, historical={len(e['historical_actions'])}")
# institution summary
from collections import Counter
insts = Counter(e.get("institution") for e in enquiries.values())
print("\nCanonical institutions (top):")
for k, v in insts.most_common(15):
    print(f"  {v:3}  {k}")
low = [e.get("institution_raw") for e in enquiries.values() if e.get("institution_confidence") == "low"]
print("\nLow-confidence institutions:", len(low))
for r in set(low):
    print(f"  - {r}")