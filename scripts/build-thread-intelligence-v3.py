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


def normalize_proto(s):
    """Normalise a protocol string for comparison."""
    s = str(s).lower()
    changed = True
    while changed:
        new = re.sub(r"^(prot(?:ocollo)?\.?|n\.?|no\.?|numero)\s*", "", s).strip()
        changed = new != s
        s = new
    s = re.sub(r"\s*del\s+\d{1,2}[-/]\d{1,2}[-/]\d{2,4}", "", s)
    s = s.strip(" .,;:-")
    return s

def classify_protocols(msg_id, body, subject):
    """Classify each protocol as current or quoted."""
    protos = []
    seen_values = set()
    a = analyses.get(msg_id, {})
    # Source 1: analysis JSON protocol_refs
    for pr in (a.get("protocol_refs") or []):
        v = pr.get("value") if isinstance(pr, dict) else pr
        ev = pr.get("evidence", "") if isinstance(pr, dict) else ""
        if not v:
            continue
        v_str = str(v).strip()
        # Skip PEC message IDs (jpec format, contains @, or very long with dashes)
        if "@" in v_str or len(v_str) > 25 or (v_str.count("-") >= 2 and not v_str.replace("-","").isdigit()):
            continue
        # Skip pure years
        if v_str.isdigit() and 1900 <= int(v_str) <= 2099:
            continue
        if v_str in seen_values:
            continue
        low_subj = (subject or "").lower()
        low_ev = (ev or "").lower()
        is_referenced = False
        # Not in subject at all -> quoted
        if v_str.lower() not in low_subj and normalize_proto(v_str) not in normalize_proto(low_subj):
            is_referenced = True
        else:
            rif_pos = low_subj.find("rif")
            proto_pos = low_subj.find(v_str.lower())
            if rif_pos >= 0 and proto_pos > rif_pos:
                is_referenced = True
            rif_pos_ev = low_ev.find("rif")
            proto_pos_ev = low_ev.find(v_str.lower())
            if rif_pos_ev >= 0 and proto_pos_ev > rif_pos_ev:
                is_referenced = True
        # quoted section of body
        quoted_section = ""
        for line in (body or "").split("\n"):
            if line.strip().startswith(">"):
                quoted_section += " " + line
        if v_str in quoted_section and v_str.lower() not in low_subj:
            is_referenced = True
        # URL evidence without explicit protocol -> quoted
        if "http" in low_ev and v_str.lower() not in low_ev:
            is_referenced = True
        # "Re:" prefix before protocol -> quoted
        re_pos = low_subj.find("re:")
        if re_pos >= 0:
            proto_pos = low_subj.find(v_str.lower())
            if proto_pos > re_pos:
                is_referenced = True
        src = "quoted" if is_referenced else "current"
        protos.append({"value": v_str, "source": src, "evidence": ev if ev else (subject or "")})
        seen_values.add(v_str)

    # Source 2: subject line scan for "rif. prot. X, Y, Z" lists
    subj = subject or ""
    rif_match = re.search(r"rif\.?\s*prot\.?\s*(.+)$", subj, re.I)
    if rif_match:
        rif_list = rif_match.group(1)
        for m in re.finditer(r"(\d[\w/\-]*)", rif_list):
            num = m.group(1)
            if len(num) < 4 or (num.isdigit() and 1800 <= int(num) <= 2099):
                continue
            # skip date-like strings (dd/mm/yyyy) but keep protocol/year (e.g. 0066127/2026)
            if "/" in num:
                parts = num.split("/")
                if len(parts) == 3 and len(parts[0]) <= 2 and len(parts[1]) <= 2:
                    continue
                if len(parts) == 2 and len(parts[0]) <= 2 and len(parts[1]) == 4 and int(parts[0]) <= 31:
                    continue
            # skip large numbers (likely date concatenations or IDs, not protocols)
            if num.isdigit() and int(num) > 100000:
                continue
            if len(num) > 7 and num.isdigit():
                continue
            if any(normalize_proto(num) == normalize_proto(p["value"]) for p in protos):
                for p in protos:
                    if normalize_proto(p["value"]) == normalize_proto(num):
                        p["source"] = "quoted"
                        p["evidence"] = "rif. prot. " + num
                continue
            protos.append({"value": num, "source": "quoted", "evidence": "rif. prot. " + num})
            seen_values.add(num)

    # Source 3: subject scan for "prot. N. 12345 del DATE" / "n. 12345 del DATE"
    for m in re.finditer(r"(?:prot(?:ocollo)?\.?\s*)?(?:n\.?\s*)?(\d{4,}(?:/\d{4})?)\s*(?:del\s+\d{1,2}[-/]\d{1,2}[-/]\d{2,4})?", subj, re.I):
        num = m.group(1)
        if len(num) < 4 or (num.isdigit() and 1800 <= int(num) <= 2099):
            continue
        if num.isdigit() and int(num) > 100000:
            continue
        if len(num) > 6 and num.isdigit():
            continue
        start_pos = m.start()
        prefix = subj[max(0, start_pos - 30):start_pos].lower()
        if start_pos > 0 and (subj[start_pos-1].isalnum() or subj[start_pos-1] in "_|/"):
            continue
        if m.end() < len(subj) and (subj[m.end()].isalnum() or subj[m.end()] in "_|/"):
            continue
        # skip HTML entities (&#8211; etc.)
        if start_pos > 0 and subj[start_pos-1] in "&#":
            continue
        if start_pos > 1 and subj[start_pos-2:start_pos] == "&#":
            continue
        if any(normalize_proto(num) == normalize_proto(p["value"]) for p in protos):
            continue
        start_pos = m.start()
        prefix = subj[max(0, start_pos - 30):start_pos].lower()
        is_ref = "rif" in prefix or "re:" in prefix or "re :" in prefix
        src = "quoted" if is_ref else "current"
        ev_start = max(0, start_pos - 5)
        ev_end = min(len(subj), m.end() + 5)
        evidence = subj[ev_start:ev_end].strip()
        protos.append({"value": num, "source": src, "evidence": evidence})
        seen_values.add(num)

    # Fix evidence: replace URL-derived evidence with subject evidence
    for p in protos:
        if "http" in (p.get("evidence") or "").lower():
            v = p["value"]
            pos = subj.lower().find(v.lower())
            if pos >= 0:
                p["evidence"] = subj[max(0, pos - 10):pos + len(v) + 10].strip()
            else:
                # find in subject by normalised match
                for m in re.finditer(r"(\d[\w/\-]*)", subj):
                    if normalize_proto(m.group(1)) == normalize_proto(v):
                        p["evidence"] = subj[max(0, m.start() - 10):m.end() + 10].strip()
                        break

    # Deduplicate by normalised value
    deduped = []
    seen_norm = set()
    for p in protos:
        n = normalize_proto(p["value"])
        if n in seen_norm:
            for d in deduped:
                if normalize_proto(d["value"]) == n and d["source"] == "quoted" and p["source"] == "current":
                    d["source"] = "current"
                    d["evidence"] = p["evidence"]
            continue
        seen_norm.add(n)
        deduped.append(p)
    protos = deduped

    return protos

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
    e["linked_threads"] = []  # clear v1 links; rebuilt below
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

    # Protocol classification: current vs quoted
    msgs = conn.execute("SELECT id, subject, body_text FROM messages WHERE thread_id=?", (e["thread_db_id"],)).fetchall()
    # A protocol is 'current' for the thread if ANY message has it as current
    proto_sources = {}
    for m in msgs:
        for pr in classify_protocols(m["id"], m["body_text"], m["subject"]):
            v = pr["value"]
            if v not in proto_sources:
                proto_sources[v] = pr["source"]
            elif pr["source"] == "current":
                proto_sources[v] = "current"  # upgrade to current if any message has it
    current_protos = []
    quoted_protos = []
    for v, s in proto_sources.items():
        # find evidence: prefer subject evidence over URL evidence
        ev = ""
        for m in conn.execute("SELECT id, subject, body_text FROM messages WHERE thread_id=?", (e["thread_db_id"],)).fetchall():
            subj = m["subject"] or ""
            pos = subj.lower().find(v.lower())
            if pos >= 0:
                ev = subj[max(0, pos - 10):pos + len(v) + 10].strip()
                break
        if not ev:
            # fall back to analysis evidence (replace URL with subject reference)
            for m in conn.execute("SELECT id FROM messages WHERE thread_id=?", (e["thread_db_id"],)).fetchall():
                a = analyses.get(m["id"], {})
                for pr in (a.get("protocol_refs") or []):
                    if str(pr.get("value", "")) == v:
                        ev = pr.get("evidence", "")
                        if "http" in (ev or "").lower():
                            ev = "referenced in message body (not in subject)"
                        break
                if ev:
                    break
        if s == "current":
            current_protos.append({"value": v, "evidence": ev})
        else:
            quoted_protos.append({"value": v, "evidence": ev})
    e["protocol_refs_current"] = current_protos
    e["protocol_refs_quoted"] = quoted_protos
    e["protocol_refs"] = [p["value"] for p in current_protos] if current_protos else e.get("protocol_refs", [])

# Action classification (4 statuses)
for tid, e in enquiries.items():
    msgs = conn.execute("SELECT id, direction, received_at, sent_at, body_text FROM messages WHERE thread_id=? ORDER BY COALESCE(received_at,sent_at)", (e["thread_db_id"],)).fetchall()
    has_response = any(m["direction"] == "in" for m in msgs[1:]) if len(msgs) > 1 else False
    # check for document delivery evidence in any message body
    delivery_evidence = False
    for m in msgs:
        body = (m["body_text"] or "").lower()
        if any(k in body for k in ["trasmetto", "allego", "in allegato", "trasmesso", "documenti trasmessi", "received in a regular manner", "ho ricevuto", "si trasmettono", "in allegato le copie"]):
            delivery_evidence = True
    for act in (e.get("actions") or []):
        desc = (act.get("description") or "").lower()
        is_request = any(k in desc for k in ["request", "copy of", "search for", "obtain", "release", "digital reproduction", "full copy", "search"])
        is_question = any(k in desc for k in ["?", "which", "whether", "if ", "date of", "address"])
        if is_request and delivery_evidence:
            act["action_status"] = "completed"
        elif is_request and has_response:
            act["action_status"] = "uncertain"
        elif is_request:
            act["action_status"] = "outstanding"
        else:
            act["action_status"] = "historical"

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
    current_vals = [p["value"] if isinstance(p, dict) else p for p in (e.get("protocol_refs_current") or [])]
    thread_protos[tid] = [p for p in current_vals if p not in generic_protos]

# ---------- Manual enquiry clusters (based on investigation) ----------
# Automated protocol-based clustering is unreliable (quoted protocols create false links).
# Clusters are defined manually based on subject + institution + record type evidence.
MANUAL_CLUSTERS = {
    "enq_chiappini_pirri_sbt": ["19feb1dc9af1b45d"],
    "enq_maltignano_death_aire": ["19fef80835c78c0b"],
    "enq_ezio_birth_ascoli": ["19f72c5626245b64", "19feae59afee3ef8"],
    "enq_buatti_galanti_marriage": ["1a1821d652c394fe", "19f4a97846d0f653", "1a1821d3dbf9a9fc", "1a17c5bd501d373a", "1a17c5be52c762fd"],
    "enq_chiappini_matriculation": ["1a1a05f25bc1cfa7", "19f491279359c045", "19f6a4e17f6cfaa7"],
    "enq_alfredo_personal_file": ["1a1a05897f4ff17d", "1a1a97177a2e468e"],
    "enq_egidio_emmi_linguaglossa": ["1a17ca51f2fd6cdc", "19f8b54fa43baa1a", "19f5b78701d7668a", "19f5de9529cda63f"],
    "enq_ezio_student_file": ["19f86e68372c7c71", "19f649e908869daa", "19f8927474c7ca89"],
    "enq_buatti_galanti_sbtt": ["19f86dfdd500d14b", "19f84016b8ce376c"],
    "enq_chiappini_pirri_sbtt": ["19fee6d1cd4d717d"],
    "enq_duplicate_receipt_1": ["1a17c5bd501d373a", "1a17c5be52c762fd"],
    "enq_duplicate_receipt_2": ["1a17c580ea53c55a", "1a17c58062a11aff"],
}

clusters = {}
for cid, tids in MANUAL_CLUSTERS.items():
    valid = [t for t in tids if t in enquiries]
    if valid:
        clusters[cid] = valid

# Mark duplicate threads
duplicate_pairs = [("1a17c5bd501d373a", "1a17c5be52c762fd"), ("1a17c580ea53c55a", "1a17c58062a11aff")]
for a, b in duplicate_pairs:
    for tid in (a, b):
        if tid in enquiries:
            if "duplicate_of" not in enquiries[tid]:
                enquiries[tid]["duplicate_of"] = []
            other = b if tid == a else a
            if other not in enquiries[tid]["duplicate_of"]:
                enquiries[tid]["duplicate_of"].append(other)
            enquiries[tid]["duplicate_note"] = "Duplicate PEC receipt/notification for the same underlying message."

# ---------- Build proposed multi-thread enquiries ----------
RATIONALE = {
    "enq_chiappini_pirri_sbt": "Same research matter (Remo Chiappini x Irma Pirri marriage, San Benedetto del Tronto). Shared institution and record references across threads.",
    "enq_maltignano_death_aire": "Single thread with multiple messages (Maltignano death certificates and AIRE certification for Buatti Ezio + Chiappini Lilia).",
    "enq_ezio_birth_ascoli": "Same research matter (Ezio Buatti birth certificate, Ascoli Piceno). Shared protocol 0066127/2026.",
    "enq_buatti_galanti_marriage": "Same research matter (Alfredo Buatti x Ida Galanti marriage, Ascoli Piceno). Shared protocols 0062771/2026 and 0073964/2026 across PEC receipts, solleciti and original request.",
    "enq_chiappini_matriculation": "Same research matter (Remo Chiappini matriculation role, Ascoli/USP). Shared protocol 1719-A across request, payment and follow-up.",
    "enq_alfredo_personal_file": "Same research matter (Alfredo Buatti personal file as Comune employee, Ascoli Piceno). Shared protocol 0098310/2026.",
    "enq_egidio_emmi_linguaglossa": "Same research matter (Egidio Emmi birth and marriage, Linguaglossa/Catania). Shared record references (act n. 59/1900, birth cert).",
    "enq_ezio_student_file": "Same research matter (Ezio Buatti student file, IIS Ulpiani / University of Perugia). Shared subject and institution.",
    "enq_buatti_galanti_sbtt": "Same research matter (Buatti-Galanti marriage search in San Benedetto del Tronto). Shared subject and institution.",
    "enq_chiappini_pirri_sbtt": "Mixed follow-up (combined sollecito) referencing the Chiappini-Pirri marriage enquiry.",
    "enq_duplicate_receipt_1": "Duplicate PEC receipt/notification for the same underlying JPEC message.",
    "enq_duplicate_receipt_2": "Duplicate protocol receipt for the same protocol number 0029358/2026.",
}
CONFIDENCE = {
    "enq_chiappini_pirri_sbt": "high",
    "enq_maltignano_death_aire": "high",
    "enq_ezio_birth_ascoli": "high",
    "enq_buatti_galanti_marriage": "high",
    "enq_chiappini_matriculation": "high",
    "enq_alfredo_personal_file": "high",
    "enq_egidio_emmi_linguaglossa": "high",
    "enq_ezio_student_file": "high",
    "enq_buatti_galanti_sbtt": "medium",
    "enq_chiappini_pirri_sbtt": "medium",
    "enq_duplicate_receipt_1": "high",
    "enq_duplicate_receipt_2": "high",
}

multi_enquiries = {}
for cid, tids in MANUAL_CLUSTERS.items():
    valid = [t for t in tids if t in enquiries]
    if not valid:
        continue
    all_msgs = set()
    all_people = []
    all_protos = []
    all_records = []
    all_institutions = []
    all_places = []
    all_actions = []
    for tid in valid:
        e = enquiries[tid]
        all_msgs.update(e.get("message_ids", []))
        for pn in (e.get("person_names") or []):
            if pn not in all_people: all_people.append(pn)
        for p in (e.get("protocol_refs_current") or []):
            v = p["value"] if isinstance(p, dict) else p
            if v not in all_protos: all_protos.append(v)
        if not all_protos:
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
    title = enquiries[valid[0]].get("title", "")
    seen_acts = set()
    deduped_actions = []
    for a in all_actions:
        key = a.get("description", "")
        if key in seen_acts: continue
        seen_acts.add(key)
        deduped_actions.append(a)
    multi_enquiries[cid] = {
        "enquiry_id": cid,
        "title": title,
        "status": "proposed",
        "review_status": "unreviewed",
        "constituent_threads": valid,
        "constituent_messages": sorted(all_msgs),
        "thread_count": len(valid),
        "message_count": len(all_msgs),
        "person_names": all_people,
        "institutions": all_institutions,
        "places": all_places,
        "protocol_refs": all_protos,
        "record_refs": all_records,
        "actions": deduped_actions,
        "outstanding_actions": [a for a in deduped_actions if a.get("action_status") == "outstanding"],
        "historical_actions": [a for a in deduped_actions if a.get("action_status") == "historical"],
        "completed_actions": [a for a in deduped_actions if a.get("action_status") == "completed"],
        "uncertain_actions": [a for a in deduped_actions if a.get("action_status") == "uncertain"],
        "last_activity": max((enquiries[t].get("last_activity") or "") for t in valid),
        "rationale": RATIONALE.get(cid, "Shared subject, institution and protocol chain"),
        "confidence": CONFIDENCE.get(cid, "medium"),
        "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
    }

# Proposed cross-thread links: ONLY based on current (non-quoted) protocols
proto_map = {}
for tid, e in enquiries.items():
    for p in (e.get("protocol_refs_current") or []):
        v = p["value"] if isinstance(p, dict) else p
        if v not in generic_protos:
            proto_map.setdefault(v, []).append(tid)

proposed_links = []
for proto, tids in proto_map.items():
    if len(tids) > 1:
        for i in range(len(tids)):
            for j in range(i + 1, len(tids)):
                proposed_links.append({
                    "source_thread": tids[i],
                    "target_thread": tids[j],
                    "reason": "shared current protocol reference: %s" % proto,
                    "evidence": proto,
                    "status": "proposed",
                })

# Mixed-followup links
mixed_links = [
    ("19fee6d1cd4d717d", "19feb1dc9af1b45d", "mixed follow-up referencing Chiappini-Pirri marriage enquiry", "0066017"),
    ("19fee6d1cd4d717d", "19f86dfdd500d14b", "mixed follow-up referencing Buatti-Galanti SBT marriage enquiry", "Buatti-Galanti subject"),
    ("19fee6d1cd4d717d", "1a1821d652c394fe", "mixed follow-up referencing Buatti-Galanti Ascoli marriage enquiry", "Buatti-Galanti subject"),
]
for src, tgt, reason, evidence in mixed_links:
    if src in enquiries and tgt in enquiries:
        proposed_links.append({
            "source_thread": src,
            "target_thread": tgt,
            "reason": reason,
            "evidence": evidence,
            "status": "proposed",
        })

# Deduplicate
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

# Mark duplicate threads
duplicate_pairs = [("1a17c5bd501d373a", "1a17c5be52c762fd"), ("1a17c580ea53c55a", "1a17c58062a11aff")]
for a, b in duplicate_pairs:
    for tid in (a, b):
        if tid in enquiries:
            if "duplicate_of" not in enquiries[tid]:
                enquiries[tid]["duplicate_of"] = []
            other = b if tid == a else a
            if other not in enquiries[tid]["duplicate_of"]:
                enquiries[tid]["duplicate_of"].append(other)
            enquiries[tid]["duplicate_note"] = "Duplicate PEC receipt/notification for the same underlying message."

out = {
    "version": 3,
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