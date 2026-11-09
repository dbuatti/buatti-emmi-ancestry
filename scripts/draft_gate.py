#!/usr/bin/env python3
"""Deterministic drafting verification gate (Step 5).

Runs ten local, rule-based checks over a generated draft before it can be
presented as ready for human review:

  1. recipient          intended institution / office / email
  2. correspondence type reply vs new enquiry
  3. immediate purpose   does it answer the latest inbound message
  4. factual provenance  numbers, dates and claims traceable to sources
  5. identity distinction separate people with similar names
  6. contradictions      known evidence / previous correspondence
  7. missing information addresses, emails, placeholders
  8. attachments         never claim to attach what is not attached
  9. language            greeting, closing, garbled text, name spellings
 10. readiness           ready_for_review | incomplete | blocked

There is no language model here and nothing is sent.  Every finding names the
message id or record it came from, so a failed draft keeps its evidence.

Public API
----------
verify_draft(draft_text, ...)                -> verification report (dict)
readiness_for(report)                        -> one of READY / INCOMPLETE / BLOCKED
annotate_draft(draft, report)                -> draft dict with review_status set
discover_postal_address(db_path)             -> verified postal address or None
discover_contact_details(db_path)            -> postal address + own emails/phones
resolve_recipient_email(db_path, institution, threads_path) -> {email, source...}
detect_actions_requested(body_text)          -> required response actions
derive_excluded_identities(source_texts)     -> "not the same person" constraints
check_suggestion_allowed(suggested)          -> (bool, reason)

Used by scripts/draft-reply.py and scripts/draft-new-correspondence.py.
Regression tests: scripts/test-draft-gate.py.
"""
import datetime
import json
import os
import re
import sqlite3
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
THREADS_PATH = os.path.join(ROOT, "correspondence", "extracted", "threads.json")

GATE_VERSION = 1

READY = "ready_for_review"
INCOMPLETE = "incomplete"
BLOCKED = "blocked"

OWN_EMAILS = {"daniele.buatti@gmail.com", "info@danielebuatti.com"}

# ---------------------------------------------------------------------------
# small helpers
# ---------------------------------------------------------------------------

_APOSTROPHES = "\u2019\u2018`\u00b4"


def _now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def _norm(text):
    """Lowercase, strip accents/punctuation, collapse whitespace."""
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = text.lower().replace("\u2013", "-").replace("\u2014", "-")
    text = re.sub(r"[^a-z0-9@.\- ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _tokens(text):
    return [t for t in _norm(text).split(" ") if t]


def _sentences(text):
    t = re.sub(r"\b(n|nn|sig|sigg|dott|dr|prof|avv|via|p|ca|cfr|ecc)\.", lambda m: m.group(1) + "§",
               text or "", flags=re.I)
    parts = re.split(r"(?<=[.!?])\s+|\n+", t)
    return [p.replace("§", ".").strip() for p in parts if p.strip()]


def _sentence_at(text, index, window=320):
    """The sentence around index, keeping abbreviations such as 'atto n. 141'."""
    text = text or ""
    start = max(0, index - window)
    end = min(len(text), index + window)
    seg = text[start:end]
    cut = 0
    for m in re.finditer(r"(?<=[.!?])\s+(?=[A-ZÀ-Ù])|\n", seg):
        if m.end() <= index - start:
            cut = m.end()
    seg = seg[cut:]
    m2 = re.search(r"(?<=[.!?])\s+(?=[A-ZÀ-Ù])|\n", seg)
    if m2:
        seg = seg[:m2.start()]
    return seg.strip()


def _first_salutation(text):
    """First two non-empty lines, which is where a letter addresses its reader."""
    lines = [l.strip() for l in (text or "").splitlines() if l.strip()]
    return " ".join(lines[:2])


def _quote(text, limit=220):
    text = re.sub(r"\s+", " ", (text or "")).strip()
    return text[:limit] + ("…" if len(text) > limit else "")


def _check(check_id, label, status, findings=None, evidence=None):
    findings = findings or []
    return {
        "id": check_id,
        "label": label,
        "status": status,  # pass | warn | fail | not_applicable
        "findings": findings,
        "evidence": evidence or [],
    }


def _levenshtein(a, b):
    if a == b:
        return 0
    if not a:
        return len(b)
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


# ---------------------------------------------------------------------------
# discovery from verified correspondence (read-only)
# ---------------------------------------------------------------------------

POSTAL_ADDRESS_RE = re.compile(
    r"\b\d{1,5}[A-Za-z]?\s+[A-Z][^\n,]{2,60},\s*"
    r"(?:[A-Z][A-Za-z'’ .-]{1,40}\s+)?"
    r"(?:VIC|NSW|QLD|WA|SA|TAS|NT|ACT)\s+\d{4},?\s*"
    r"(?:Victoria,\s*)?Australia\b"
)
EMAIL_RE = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")
PHONE_RE = re.compile(r"\+?61\s?\d{3}\s?\d{3}\s?\d{3}|\b04\d{2}\s?\d{3}\s?\d{3}\b")
PLACEHOLDER_RE = re.compile(r"\[([A-ZÀ-Ù][A-ZÀ-Ù0-9 /'’.,:-]{2,60})\]")


def _open_db(db_path=None):
    path = db_path or DB_PATH
    if not os.path.exists(path):
        return None
    conn = sqlite3.connect("file:%s?mode=ro" % path, uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def is_complete_postal_address(value):
    """Return (complete, components, missing) for an Australian postal address.

    A complete address needs: street/PO Box, suburb, state, postcode, country.
    Never invents missing components.
    """
    if not value:
        return False, {}, ["street", "suburb", "state", "postcode", "country"]
    v = value.strip()
    missing = []
    components = {}
    # postcode: 4 digits
    pm = re.search(r"\b(\d{4})\b", v)
    if pm:
        components["postcode"] = pm.group(1)
    else:
        missing.append("postcode")
    # state
    sm = re.search(r"\b(VIC|NSW|QLD|WA|SA|TAS|NT|ACT)\b", v, re.I)
    if sm:
        components["state"] = sm.group(1).upper()
    else:
        missing.append("state")
    # country
    if re.search(r"\bAustralia\b", v, re.I):
        components["country"] = "Australia"
    else:
        missing.append("country")
    # street: number + name (or PO Box)
    po_box = re.search(r"\bPO\s*Box\s+\d+", v, re.I)
    street_num = re.search(r"\b\d{1,5}[A-Za-z]?\s+[A-Z][A-Za-z]", v)
    if po_box:
        components["street"] = po_box.group(0)
    elif street_num:
        sm2 = re.search(r"(\d{1,5}[A-Za-z]?\s+[A-Z][^\n,]{2,40})", v)
        if sm2:
            components["street"] = sm2.group(1).strip()
        else:
            missing.append("street")
    else:
        missing.append("street")
    # suburb: a word between street and state
    # heuristic: if there's a comma-separated token before the state
    suburb_m = re.search(r",\s*([A-Z][A-Za-z'’ .-]{2,40}?)\s+(?:VIC|NSW|QLD|WA|SA|TAS|NT|ACT)\b", v, re.I)
    if suburb_m:
        components["suburb"] = suburb_m.group(1).strip()
    else:
        missing.append("suburb")
    complete = len(missing) == 0
    return complete, components, missing


SIGNATURE_ANCHOR_RE = re.compile(
    r"(?im)^\s*(?:--\s*$|daniele(?:\s+[A-Za-zÀ-ÿ]+){0,4}\s+buatti|best regards|"
    r"cordiali saluti|distinti saluti|kind regards|un caro saluto)")


def _in_signature_block(body, address_start):
    """True when the address sits just after Daniele's name/closing line.

    This is what keeps a venue address inside a quoted invitation from being
    mistaken for his postal address.
    """
    head = (body or "")[:address_start]
    anchors = list(SIGNATURE_ANCHOR_RE.finditer(head))
    if not anchors:
        return False
    gap = head[anchors[-1].end():]
    return len(gap) <= 400 and "\n\n\n" not in gap and "\r\n\r\n\r\n" not in gap


def discover_postal_address(db_path=None):
    """Newest postal address printed in the signature of Daniele's sent mail.

    Returns {"value", "source_message_id", "sent_at", "established_by",
             "alternates"} or None. It is never invented: if sent
    correspondence does not contain one, the gate reports it as missing.
    """
    conn = _open_db(db_path)
    if not conn:
        return None
    try:
        rows = conn.execute(
            "SELECT id, body_text, sent_at, received_at FROM messages WHERE direction='out' "
            "AND body_text IS NOT NULL ORDER BY id DESC"
        ).fetchall()
    finally:
        conn.close()
    found = None
    alternates = []
    for row in rows:
        body = row["body_text"] or ""
        for m in POSTAL_ADDRESS_RE.finditer(body):
            if not _in_signature_block(body, m.start()):
                continue
            value = re.sub(r"\s+", " ", m.group(0)).strip().rstrip(",")
            complete, components, missing = is_complete_postal_address(value)
            entry = {"value": value, "source_message_id": row["id"],
                     "complete": complete, "components": components,
                     "missing_components": missing}
            if found is None:
                found = {
                    "value": value,
                    "source_message_id": row["id"],
                    "sent_at": row["sent_at"] or row["received_at"],
                    "established_by": "postal address printed in the signature of sent message %s" % row["id"],
                    "complete": complete,
                    "components": components,
                    "missing_components": missing,
                }
            elif value not in {found["value"]} | {a["value"] for a in alternates}:
                alternates.append(entry)
            break
    if found:
        found["alternates"] = alternates
    return found


def discover_contact_details(db_path=None):
    """Verified contact details for Daniele, each with its source message id."""
    details = {"postal_address": discover_postal_address(db_path)}
    conn = _open_db(db_path)
    if not conn:
        details["emails"] = [{"value": e, "source_message_id": None} for e in sorted(OWN_EMAILS)]
        details["phones"] = []
        return details
    try:
        rows = conn.execute(
            "SELECT id, body_text FROM messages WHERE direction='out' "
            "AND body_text IS NOT NULL ORDER BY id ASC"
        ).fetchall()
    finally:
        conn.close()
    emails, phones = {}, {}
    for row in rows:
        for e in EMAIL_RE.findall(row["body_text"] or ""):
            e = e.lower().rstrip(".,;")
            if e in OWN_EMAILS:
                emails.setdefault(e, row["id"])
        for p in PHONE_RE.findall(row["body_text"] or ""):
            phones.setdefault(re.sub(r"\s+", " ", p), row["id"])
    details["emails"] = [{"value": e, "source_message_id": mid} for e, mid in emails.items()]
    details["phones"] = [{"value": p, "source_message_id": mid} for p, mid in phones.items()]
    return details


def _load_threads(threads_path=None):
    path = threads_path or THREADS_PATH
    try:
        with open(path, "r", encoding="utf-8") as f:
            return (json.load(f) or {}).get("threads") or {}
    except (OSError, ValueError):
        return {}


def _institution_key(name):
    """Drop the institutional prefix so 'Comune di X' matches 'X'."""
    n = _norm(name)
    for prefix in ("comune di ", "curia di ", "curia vescovile di ", "archivio di stato di ",
                   "parrocchia di ", "diocesi di ", "universita di ", "universita degli studi di "):
        if n.startswith(prefix):
            n = n[len(prefix):]
            break
    return n


INSTITUTION_TYPES = ("comune", "curia", "parrocchia", "diocesi", "archivio", "universita",
                     "tribunale", "prefettura", "provincia", "regione", "conservatoria",
                     "agenzia", "ministero")


def _institution_type(name):
    """'Comune', 'Curia', 'Parrocchia' … or None. Two different offices of the
    same town must never be treated as the same recipient."""
    tokens = _norm(name).split()
    for token in tokens[:3]:
        if token in INSTITUTION_TYPES:
            return token
    return None


def _institution_matches(a, b):
    ka, kb = _institution_key(a), _institution_key(b)
    if not ka or not kb:
        return False
    ta_type, tb_type = _institution_type(a), _institution_type(b)
    if ta_type and tb_type and ta_type != tb_type:
        return False
    if ka == kb:
        return True
    ta, tb = set(ka.split()), set(kb.split())
    if not ta or not tb:
        return False
    return len(ta & tb) / float(len(ta | tb)) >= 0.75


def resolve_recipient_email(db_path=None, institution="", threads_path=None, topic_terms=None):
    """Find an email address already used for this institution, with provenance.

    Candidates come from sent messages to that institution. They are scored so
    the address used for the *same topic* wins over an unrelated address that
    happens to belong to the same institution.

    Returns {"email", "source_message_id", "source_thread", "established_by",
             "candidates"} or a dict with email=None plus candidates.
    """
    result = {"email": None, "source_message_id": None, "source_thread": None,
              "established_by": None, "candidates": []}
    if not institution:
        return result
    conn = _open_db(db_path)
    if not conn:
        return result
    try:
        threads = _load_threads(threads_path)
        matching_threads = []
        for tid, t in threads.items():
            if _institution_matches(institution, t.get("institution") or ""):
                matching_threads.append((tid, t))
        candidates = []
        for tid, t in matching_threads:
            db_id = t.get("thread_db_id")
            if db_id is None:
                continue
            rows = conn.execute(
                "SELECT id, to_json, subject, body_text FROM messages WHERE thread_id=? AND direction='out' "
                "ORDER BY id ASC", (db_id,)).fetchall()
            for row in rows:
                try:
                    to = json.loads(row["to_json"] or "[]")
                except ValueError:
                    to = []
                for entry in to:
                    email = (entry or {}).get("email")
                    if email and email.lower() not in OWN_EMAILS:
                        candidates.append({
                            "email": email.lower(),
                            "source_message_id": row["id"],
                            "source_thread": tid,
                            "subject": row["subject"],
                            "_body": row["body_text"] or "",
                        })
        # de-duplicate by email, keeping the oldest occurrence
        seen = set()
        uniq = []
        for c in candidates:
            if c["email"] in seen:
                continue
            seen.add(c["email"])
            uniq.append(c)
        if uniq:
            topics = [_norm(t) for t in (topic_terms or []) if t]

            def score(c):
                s = 0
                domain = c["email"].split("@")[-1]
                if "comune" in domain or "comune" in c["email"]:
                    s += 3
                if "anagrafe" in c["email"]:
                    s += 4
                haystack = _norm((c.get("subject") or "") + " " + c["email"])
                s += 4 * sum(1 for t in topics if t and t in haystack)
                # the institution's own thread is stronger evidence than a
                # third-party archive that merely mentions the same town
                s += 2
                if domain.endswith("gov.it") and "cultura" in domain:
                    s -= 5
                return s

            uniq.sort(key=lambda c: (-score(c), c["source_message_id"]))
            best = uniq[0]
            for c in uniq:
                c.pop("_body", None)
            result["candidates"] = uniq
            result.update({
                "email": best["email"],
                "source_message_id": best["source_message_id"],
                "source_thread": best["source_thread"],
                "established_by": "sent message %s (thread %s) was addressed to %s" % (
                    best["source_message_id"], best["source_thread"], best["email"]),
            })
            return result

        # Fallback: match institution words against recipient domains.
        inst_tokens = [t for t in _institution_key(institution).split() if len(t) > 2]
        rows = conn.execute(
            "SELECT id, to_json FROM messages WHERE direction='out' ORDER BY id ASC").fetchall()
        for row in rows:
            try:
                to = json.loads(row["to_json"] or "[]")
            except ValueError:
                to = []
            for entry in to:
                email = ((entry or {}).get("email") or "").lower()
                if not email or email in OWN_EMAILS:
                    continue
                domain = email.split("@")[-1]
                if sum(1 for t in inst_tokens if t in domain) >= 2:
                    result.update({
                        "email": email,
                        "source_message_id": row["id"],
                        "established_by": "sent message %s was addressed to %s (domain match)" % (row["id"], email),
                    })
                    return result
    finally:
        conn.close()
    return result


def detect_actions_requested(body_text):
    """Derive the concrete response actions from an inbound message body."""
    text = body_text or ""
    low = text.lower()
    actions = []

    offer_re = re.search(
        r"(certificato in originale|in originale[^.\n]{0,120}spedisco|glielo spedisco|"
        r"original certificate[^.\n]{0,120}(?:send|post))", low)
    address_re = re.search(
        r"(indirizzo di posta[^.\n]{0,40}|indirizzo postale|indirizzo completo|"
        r"complete (?:postal )?address|your address)", low)
    if address_re:
        actions.append({
            "id": "provide_postal_address",
            "description": "provide Daniele's complete postal address so the office can post the original",
            "evidence": _quote(_sentence_at(text, address_re.start())),
            "required_terms": [],
        })
    if offer_re:
        actions.append({
            "id": "accept_post_original_offer",
            "description": "thank the correspondent and accept the offer to post the original certificate",
            "evidence": _quote(_sentence_at(text, offer_re.start())),
            "required_terms": [["grazie", "ringrazi"], ["originale"], ["sped", "invi", "posta", "postal"]],
        })
    if re.search(r"non ci sono diritti da pagare|senza costi|no fees", low):
        actions.append({
            "id": "acknowledge_no_fees",
            "description": "acknowledge that no fees are due",
            "evidence": _quote(_sentence_at(text, re.search(
                r"non ci sono diritti da pagare|senza costi|no fees", low).start())),
            "required_terms": [["diritti", "costi", "gratuit", "pagare", "fees"]],
        })
    # Explicit questions with no other detected action still need an answer.
    if not actions:
        for sentence in _sentences(text):
            if sentence.rstrip().endswith("?") and len(sentence) > 15:
                words = [w for w in re.findall(r"[A-Za-zÀ-ÿ]{5,}", sentence)][:4]
                actions.append({
                    "id": "answer_question",
                    "description": "answer the question asked in the latest inbound message",
                    "evidence": _quote(sentence),
                    "required_terms": [[w.lower() for w in words]] if words else [],
                })
                break
    return actions


def derive_excluded_identities(source_texts):
    """Find source statements that explicitly forbid conflating two people.

    Example: "Non si tratta dell'omonimo nato il 05/09/1868 (atto n. 141)…".
    Returns one entry per statement with the markers that must never be
    asserted as facts about the other person.
    """
    out = []
    pattern = re.compile(
        r"(non si tratta dell'omonimo|non si tratta della stessa persona|"
        r"non e la stessa persona|non è la stessa persona|not the same person|"
        r"diverso dall'omonimo|different from the namesake)", re.I)
    for src in source_texts or []:
        body = src.get("body") or ""
        for m in pattern.finditer(body):
            sentence = _sentence_at(body, m.start())
            markers = []
            markers += re.findall(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b", sentence)
            markers += [re.sub(r"\s+", " ", x) for x in
                        re.findall(r"atto\s+n?\.?\s*\d+(?:/\d{4})?", sentence, re.I)]
            markers += re.findall(r"\b[A-Z]{3,}(?:\s+[A-Z][a-zà-ÿ]+)?", sentence)
            markers = [x for x in dict.fromkeys(markers) if x.lower() not in ("non", "id")]
            out.append({
                "statement": _quote(sentence),
                "source_message_id": src.get("id"),
                "source_message_ids": [src.get("id")],
                "excluded_markers": markers,
                # the statement originates in Daniele's own outbound message;
                # inbound copies only quote it
                "_origin_ids": [src.get("id")] if src.get("direction") == "out" else [],
            })
    # Copies of the same sentence exist in quoted history; merge them.
    merged = []
    for entry in out:
        for kept in merged:
            if set(entry["excluded_markers"]) & set(kept["excluded_markers"]):
                kept["excluded_markers"] = list(dict.fromkeys(
                    kept["excluded_markers"] + entry["excluded_markers"]))
                kept["statement"] = max(kept["statement"], entry["statement"], key=len)
                kept["source_message_ids"] = sorted(set(
                    kept["source_message_ids"] + entry["source_message_ids"]))
                kept["_origin_ids"] = kept["_origin_ids"] + entry["_origin_ids"]
                break
        else:
            merged.append(dict(entry))
    for entry in merged:
        candidates = entry.pop("_origin_ids") or entry["source_message_ids"]
        entry["source_message_id"] = min(candidates)
    return merged


def check_suggestion_allowed(suggested):
    """A suppressed suggestion must never produce a draft."""
    if not isinstance(suggested, dict):
        return False, "no suggested new correspondence to draft"
    if suggested.get("suppressed"):
        return False, suggested.get("suppression_reason") or "suggestion is suppressed"
    if not suggested.get("recommended_institution"):
        return False, "no verified recommended institution"
    return True, ""


# ---------------------------------------------------------------------------
# shared drafting context (used by both drafters)
# ---------------------------------------------------------------------------

STOPWORDS = {"the", "and", "for", "with", "from", "san", "benedetto", "del", "della", "delle",
             "degli", "comune", "curia", "ufficio", "richiesta", "ricerca", "sono"}


def topic_terms(thread, latest_inbound=None):
    """Terms used to pick the right address for this institution/topic."""
    terms = set()
    for name in ((thread or {}).get("person_names") or []):
        for token in re.findall(r"[A-Za-zÀ-ÿ]{4,}", (name or "").lower()):
            terms.add(token)
    subject = ((thread or {}).get("title") or (thread or {}).get("subject") or "")
    for token in re.findall(r"[A-Za-zÀ-ÿ]{4,}", subject.lower()):
        if token not in STOPWORDS:
            terms.add(token)
    return sorted(terms)


def source_texts(msgs):
    """Message bodies in the shape the checks expect."""
    return [{"id": m.get("id"), "direction": m.get("direction"), "subject": m.get("subject"),
             "body": m.get("body_text") or ""} for m in (msgs or [])]


def signature_names(body):
    """Personal names printed in a signature block (heuristic, deterministic)."""
    text = body or ""
    cut = len(text)
    for marker in ("\n>", "\nIl ", "\nOn ", "\n-----Original"):
        idx = text.find(marker)
        if idx != -1:
            cut = min(cut, idx)
    names = []
    for line in text[:cut].splitlines()[-8:]:
        line = line.strip().strip(",")
        m = re.match(r"^([A-ZÀ-Ù][a-zà-ÿ]+(?:\s+[A-ZÀ-Ù][a-zà-ÿ]+){1,2})$", line)
        if m:
            names.append(m.group(1))
    return names


def office_from_referral(msgs):
    """The office a referring message tells Daniele to write to."""
    pattern = re.compile(r"ufficio\s+(anagrafe|stato\s+civile|di\s+stato\s+civile|"
                         r"servizi\s+demografici|protocollo)", re.I)
    for m in reversed(msgs or []):
        body = m.get("body_text") or ""
        mt = pattern.search(body)
        if mt:
            return "Ufficio " + re.sub(r"\s+", " ", mt.group(1)).title()
    return None


def institution_from_referral(msgs):
    """The municipality named in a referral such as 'ufficio anagrafe di <place>'."""
    pattern = re.compile(r"ufficio\s+(?:anagrafe|stato\s+civile|servizi\s+demografici)\s+"
                         r"(?:di|del|della)\s+([A-ZÀ-Ù][^.,;:]{2,60})", re.I)
    for m in reversed(msgs or []):
        body = re.sub(r"\s+", " ", m.get("body_text") or "")
        mt = pattern.search(body)
        if mt:
            place = re.sub(r"\s+", " ", mt.group(1)).strip()
            place = re.sub(r"\s+(dove|per|che)\b.*$", "", place).strip()
            return "Comune di " + place
    return None


def referral_markers(thread, target_institution, msgs, target_email=None):
    """Names/domains belonging to the institution that referred us elsewhere.

    The new email must not reuse that correspondent's salutation or address.
    """
    src_inst = ((thread or {}).get("institution") or "").strip()
    if not src_inst or _institution_matches(src_inst, target_institution or ""):
        return []
    markers = set()
    markers.add(src_inst.split()[0])
    target_email = (target_email or "").lower()
    for m in msgs or []:
        if m.get("direction") != "in":
            continue
        email = (m.get("from_email") or "").lower()
        if not email or email == target_email:
            continue
        domain = email.split("@")[-1]
        if domain:
            markers.add(domain)
        for name in signature_names(m.get("body_text")):
            markers.update(name.split())
    return sorted(x for x in markers if len(x) >= 4)


def required_response_block(actions, contact_details, excluded_identities, recipient,
                            draft_type="reply"):
    """Deterministic instruction block: what the latest inbound actually asks for."""
    lines = ["=== REQUIRED RESPONSE (derived from the latest inbound message; must be satisfied) ==="]
    if actions:
        for i, a in enumerate(actions, 1):
            lines.append("%d. %s" % (i, a.get("description") or a.get("id")))
            if a.get("evidence"):
                lines.append("   Inbound says: \"%s\"" % a["evidence"])
    else:
        lines.append("1. Answer the latest inbound message directly.")

    postal = (contact_details or {}).get("postal_address") or {}
    needs_address = any(a.get("id") == "provide_postal_address" for a in (actions or []))
    lines.append("")
    lines.append("VERIFIED CONTACT DETAILS (use exactly as written; never invent or change them):")
    if postal.get("value"):
        lines.append("  %s" % postal["value"])
        lines.append("  (established by sent message %s)" % postal.get("source_message_id"))
    elif needs_address:
        lines.append("  NO VERIFIED POSTAL ADDRESS EXISTS. Write the literal placeholder")
        lines.append("  [INDIRIZZO POSTALE DA COMPLETARE] instead of inventing one.")
    for e in (contact_details or {}).get("emails", []) or []:
        if e.get("value"):
            lines.append("  %s" % e["value"])
    lines.append("")

    if draft_type == "new_correspondence":
        lines.append("This is a FIRST contact with this office: introduce Daniele briefly and")
        lines.append("state the request plainly. Do not write as if continuing an exchange.")
    if recipient and recipient.get("email"):
        lines.append("Recipient address verified from existing correspondence: %s" % recipient["email"])
    office = (recipient or {}).get("office")
    if office:
        lines.append("Address the office as: %s" % office)

    lines.append("NOTHING is attached to this email. NEVER write that you are sending or attaching")
    lines.append("certificates, documents, copies or attachments, and do not thank for documents")
    lines.append("that were not received in this thread.")

    if excluded_identities:
        lines.append("")
        lines.append("IDENTITY CONSTRAINTS (people who must never be conflated):")
        for entry in excluded_identities:
            lines.append("- Source message %s states: \"%s\"" % (
                entry.get("source_message_id"), entry.get("statement")))
            lines.append("  Never assert these are the same person. Markers belonging to the other person: %s"
                         % ", ".join(entry.get("excluded_markers") or []))
    if recipient and recipient.get("prohibited_markers"):
        lines.append("")
        lines.append("DO NOT reuse the salutation or address of the institution that referred you:")
        lines.append("  %s" % ", ".join(recipient["prohibited_markers"]))
    return "\n".join(lines)


def build_gate_inputs(*, intended_recipient, latest_inbound, actions, sources,
                      contact_details, excluded_identities=None,
                      prohibited_markers=None, surnames=None):
    """Package every check input so it can be stored with the draft."""
    return {
        "intended_recipient": intended_recipient,
        "latest_inbound": latest_inbound,
        "required_actions": actions,
        "source_texts": sources,
        "contact_details": contact_details,
        "excluded_identities": excluded_identities or [],
        "prohibited_recipient_markers": prohibited_markers or [],
        "known_surnames": surnames or [],
    }


# ---------------------------------------------------------------------------
# checks
# ---------------------------------------------------------------------------

NON_ATTACHMENT_CONTEXT = ("non allego", "non invio", "non trasmetto", "nessun allegato",
                          "not attaching", "no attachments")

ATTACH_CLAIM_RE = re.compile(
    r"\b(allego|accludo|trasmetto|in allegato|le invio|le trasmetto|le allego|"
    r"la invio|inviero|invierò|vi invio)\b[^.\n]{0,90}"
    r"\b(certificat|document|atto|copia|allegat|passaporto|ricevut|identit)",
    re.I)

SAME_PERSON_RE = re.compile(
    r"(è|e|si tratta|coincide|corrisponde)[^.\n]{0,40}"
    r"(lo stesso|la stessa|il medesimo|la medesima|stessa persona|stesso personaggio)",
    re.I)

NEGATION_WORDS = ("non", "diverso", "diversa", "distinto", "distinta", "omonimo", "namesake", "different")

REPLY_MARKERS = (
    "le scrivo di nuovo", "ti scrivo di nuovo", "come le dicevo", "come le anticipavo",
    "in risposta alla sua", "in risposta alla vostra", "grazie per la sua email",
    "grazie per la sua e-mail", "grazie per avermi inviato", "grazie mille per avermi inviato",
    "la ringrazio ancora", "ringraziandola ancora", "in merito alla sua precedente",
)

NEW_MARKERS = (
    "mi presento", "le scrivo per la prima volta", "vi scrivo per la prima volta",
    "non ci conosciamo", "mi permetto di presentarmi",
)

DEFAULT_FORBIDDEN_CLAIMS = [
    (r"\b(è morta|e morta|deceduta|morì|mori)\s+(a|in)\s+san benedetto",
     "asserts Irma Pirri died in San Benedetto del Tronto, which is not established"),
    (r"\b(è deceduta|e deceduta|morì|mori)\s+il\s+4\s+ottobre\s+1952",
     "turns 'was already deceased by 4 October 1952' into 'died on that date'"),
]

OFFICE_SERVICE_TERMS = {
    # service words that belong to a different office than the intended one
    "anagrafe": ("parrocch", "parroco", "registri parrocchiali", "diocesi", "vescovile", "curia vescovile"),
    "stato civile": ("parrocch", "parroco", "registri parrocchiali", "diocesi", "vescovile", "curia vescovile"),
    "curia": ("ufficio anagrafe", "stato civile", "certificato di residenza", "stato di famiglia"),
}

ITALIAN_STOPWORDS = (" il ", " la ", " di ", " che ", " per ", " con ", " sono ", " gentile ", " spettabile ")


def _check_recipient(draft_text, intended, prohibited_markers, wrong_office_terms, draft_type):
    findings, evidence = [], []
    salutation = _first_salutation(draft_text)
    norm_sal = _norm(salutation)
    blocked = False
    for marker in prohibited_markers or []:
        if marker and _norm(marker) in norm_sal:
            findings.append("Salutation reuses '%s' from the referring thread's correspondent." % marker)
            blocked = True
    for marker in prohibited_markers or []:
        if marker and _norm(marker) in _norm(draft_text) and _norm(marker) not in norm_sal:
            findings.append("Draft mentions '%s' from the referring thread; verify it is only cited as a referral, not as the recipient." % marker)
    institution = (intended or {}).get("institution") or ""
    office = (intended or {}).get("office") or ""
    if institution and _institution_key(institution) not in _norm(draft_text):
        findings.append("Draft does not name the intended institution (%s)." % institution)
    matched_terms = [t for t in (wrong_office_terms or []) if t and _norm(t) in _norm(draft_text)]
    specific_terms = [t for t in matched_terms
                      if not any(t != o and _norm(t) in _norm(o) for o in matched_terms)]
    for term in specific_terms:
        findings.append("Draft asks for '%s', a service of the referring office, not of %s." % (
            term, office or institution or "the intended recipient"))
        blocked = True
    # email
    intended_email = (intended or {}).get("email")
    found_emails = {e.lower().rstrip(".,;") for e in EMAIL_RE.findall(draft_text)} - OWN_EMAILS
    if found_emails:
        if intended_email and intended_email.lower() not in found_emails:
            findings.append("Draft contains an email address (%s) that is not the verified recipient (%s)." % (
                ", ".join(sorted(found_emails)), intended_email))
            blocked = True
        elif not intended_email:
            findings.append("Draft contains an unverified email address (%s)." % ", ".join(sorted(found_emails)))
    if draft_type == "new_correspondence" and not intended_email:
        findings.append("Recipient email address is not verified from existing correspondence.")
    if intended_email:
        evidence.append("Recipient email verified: %s (%s)" % (
            intended_email, (intended or {}).get("established_by") or "existing correspondence"))
    if blocked:
        status = "fail"
    elif findings:
        status = "warn"
    else:
        status = "pass"
    return _check("recipient", "Recipient", status, findings, evidence)


def _check_correspondence_type(draft_text, draft_type, intended):
    findings = []
    low = _norm(draft_text)
    if draft_type == "new_correspondence":
        for marker in REPLY_MARKERS:
            if _norm(marker) in low:
                findings.append("Draft is meant to be a NEW email but reads as a reply: \"%s\"." % marker)
        if findings:
            return _check("correspondence_type", "Correspondence type", "fail", findings)
        return _check("correspondence_type", "Correspondence type", "pass",
                      [], ["Framed as a new enquiry to %s" % ((intended or {}).get("institution") or "the recipient")])
    for marker in NEW_MARKERS:
        if _norm(marker) in low:
            findings.append("Draft is a reply but introduces itself as a first contact: \"%s\"." % marker)
    return _check("correspondence_type", "Correspondence type",
                  "fail" if findings else "pass", findings)


def _action_satisfied(action, draft_text, contact_details):
    low = _norm(draft_text)
    aid = action.get("id")
    verified = ((contact_details or {}).get("postal_address") or {}).get("value")
    if aid == "provide_postal_address":
        if verified and _norm(verified) in low:
            return True, "verified postal address used"
        if any(p in (draft_text or "") for p in ("[INDIRIZZO", "[POSTAL", "[ADDRESS", "[INDIRIZZO POSTALE")):
            return False, "postal address marked as missing with a placeholder (not verified)"
        return False, "no postal address"
    if aid == "accept_post_original_offer":
        groups = action.get("required_terms") or []
        missing = [g for g in groups if not any(_norm(x) in low for x in g)]
        return (not missing), ("all required terms present" if not missing
                               else "missing: " + ", ".join("/".join(g) for g in missing))
    groups = action.get("required_terms") or []
    missing = [g for g in groups if not any(_norm(x) in low for x in g)]
    return (not missing), ("answered" if not missing else "missing: " + ", ".join("/".join(g) for g in missing))


def _check_immediate_purpose(draft_text, actions, latest_inbound, contact_details):
    findings, evidence = [], []
    if not actions:
        return _check("immediate_purpose", "Immediate purpose", "not_applicable",
                      ["No explicit request detected in the latest inbound message."])
    for a in actions:
        ok, why = _action_satisfied(a, draft_text, contact_details)
        label = a.get("description") or a.get("id")
        if ok:
            evidence.append("%s — %s" % (label, why))
        else:
            findings.append("Latest inbound message asks to %s — draft does not (%s)." % (label, why))
    low = _norm(draft_text)
    if findings and any(m in low for m in ("richieste precedenti", "precedenti richieste", "due richieste")):
        findings.append("Draft re-raises older requests instead of answering the latest message.")
    if latest_inbound and latest_inbound.get("id") is not None:
        evidence.append("Latest inbound: message %s (%s)" % (
            latest_inbound.get("id"), (latest_inbound.get("received_at") or "")[:10]))
    return _check("immediate_purpose", "Immediate purpose",
                  "fail" if findings else "pass", findings, evidence)


def _supported_terms(text, sources, verified_text="", verified_source=None):
    """Return (sources_for, sources_against) for a claim's distinctive tokens."""
    years = set(re.findall(r"\b(?:1[6-9]|20)\d{2}\b", text))
    dates = set(re.findall(r"\b\d{1,2}/\d{1,2}/\d{2,4}\b", text))
    caps = set(re.findall(r"\b[A-Z]{3,}\b", text))
    needles = years | dates | caps
    if not needles:
        return [], []
    hit, miss = [], []
    for needle in needles:
        found = [s.get("id") for s in sources if needle in (s.get("body") or "")]
        if found:
            hit.append((needle, found))
        elif verified_text and needle in verified_text:
            # Established by Daniele's own verified contact details.
            hit.append((needle, [verified_source] if verified_source is not None else []))
        else:
            miss.append(needle)
    return hit, miss


def _check_factual_provenance(draft_text, source_texts, contact_details=None):
    findings, evidence, claims = [], [], []
    sources = source_texts or []
    joined = " ".join((s.get("body") or "") for s in sources)
    # Verified contact details are established from sent correspondence too.
    verified_details = []
    postal = (contact_details or {}).get("postal_address") or {}
    verified_source = postal.get("source_message_id") if isinstance(postal, dict) else None
    for key in ("postal_address",):
        entry = (contact_details or {}).get(key)
        if isinstance(entry, dict) and entry.get("value"):
            verified_details.append(entry["value"])
            for alternate in entry.get("alternates") or []:
                if alternate.get("value"):
                    verified_details.append(alternate["value"])
    for entry in (contact_details or {}).get("emails", []):
        if entry.get("value"):
            verified_details.append(entry["value"])
    for entry in (contact_details or {}).get("phones", []):
        if entry.get("value"):
            verified_details.append(entry["value"])
    verified_text = " ".join(verified_details)
    if verified_text:
        joined += " " + verified_text
    # Placeholders such as [VERIFY EMAIL] are missing-information findings, not
    # factual claims, so they are removed before this check.
    analysed = PLACEHOLDER_RE.sub(" ", draft_text or "")

    # numbers that look like protocol/case references
    for token in sorted(set(re.findall(r"\b\d{5,}(?:/\d{4})?\b|\b\d{1,3}/\d{4}\b", analysed))):
        if token not in joined:
            findings.append("Number/protocol \"%s\" is not present in the source correspondence." % token)
    for sentence in _sentences(analysed):
        hit, miss = _supported_terms(sentence, sources, verified_text, verified_source)
        if not hit and not miss:
            continue
        claims.append({
            "claim": _quote(sentence, 240),
            "supported": not miss,
            "sources": sorted({i for _, ids in hit for i in ids}),
            "unsupported_terms": miss,
        })
    unsupported = [c for c in claims if not c["supported"]]
    if unsupported:
        findings.append("%d factual claim(s) contain terms absent from the source correspondence." % len(unsupported))
    if claims:
        evidence.append("%d factual claim(s) traced; %d fully supported." % (
            len(claims), len(claims) - len(unsupported)))
    return _check("factual_provenance", "Factual provenance",
                  "fail" if unsupported or findings else "pass",
                  findings, evidence), claims


def _check_identity(draft_text, excluded_identities):
    findings, evidence = [], []
    failed = False
    for entry in excluded_identities or []:
        markers = entry.get("excluded_markers") or []
        if not markers:
            continue
        for sentence in _sentences(draft_text):
            if not any(m.lower() in sentence.lower() for m in markers):
                continue
            if SAME_PERSON_RE.search(sentence):
                findings.append("Conflates two distinct people: \"%s\" (source message %s says \"%s\")." % (
                    _quote(sentence), entry.get("source_message_id"), entry.get("statement")))
                failed = True
            elif not any(w in _norm(sentence) for w in NEGATION_WORDS):
                findings.append("Uses data belonging to the other person (%s) without saying they are different." %
                                ", ".join(markers))
        evidence.append("Source message %s: \"%s\"" % (entry.get("source_message_id"), entry.get("statement")))
    if failed:
        status = "fail"
    elif findings:
        status = "warn"
    else:
        status = "pass"
    return _check("identity_distinction", "Identity distinction", status, findings, evidence)


def _check_contradictions(draft_text, forbidden_claims, source_texts):
    findings, evidence = [], []
    low = _norm(draft_text)
    claims = list(DEFAULT_FORBIDDEN_CLAIMS) + [
        (f.get("pattern"), f.get("description") or "contradicts known evidence")
        for f in (forbidden_claims or []) if f.get("pattern")
    ]
    for pattern, description in claims:
        m = re.search(pattern, low, re.I)
        if m:
            findings.append("Draft contradicts known evidence: %s (\"%s\")." % (
                description, _quote(draft_text[max(0, draft_text.lower().find(m.group(0).lower())):][:180])))
    for src in source_texts or []:
        body = src.get("body") or ""
        if "non si tratta" in body.lower() and "stesso" in low and "1868" in low:
            findings.append("Source message %s explicitly says this is not the namesake; draft asserts sameness." % src.get("id"))
            break
    # de-duplicate identical findings
    findings = list(dict.fromkeys(findings))
    return _check("contradictions", "Contradictions",
                  "fail" if findings else "pass", findings)


def _check_missing_information(draft_text, intended, actions, contact_details, draft_type):
    findings = []
    placeholders = PLACEHOLDER_RE.findall(draft_text or "")
    for p in dict.fromkeys(placeholders):
        findings.append("Unresolved placeholder [%s] must be completed before sending." % p)
    postal_needed = any(a.get("id") == "provide_postal_address" for a in (actions or []))
    verified = ((contact_details or {}).get("postal_address") or {}).get("value")
    postal_complete = ((contact_details or {}).get("postal_address") or {}).get("complete", True)
    if postal_needed and not (verified and _norm(verified) in _norm(draft_text)):
        if verified:
            if not postal_complete:
                findings.append("Postal address is incomplete (%s); missing: %s. Complete it manually before sending." % (
                    verified, ", ".join(((contact_details or {}).get("postal_address") or {}).get("missing_components") or [])))
            else:
                findings.append("Postal address was verified (%s, msg %s) but is not included." % (
                    verified, (contact_details.get("postal_address") or {}).get("source_message_id")))
        else:
            findings.append("No postal address could be verified from sent correspondence; none was invented.")
    # Any postal address in the draft must be one already verified in the
    # correspondence; a different one is either invented or outdated.
    allowed = set()
    postal = (contact_details or {}).get("postal_address") or {}
    for entry in [postal] + list(postal.get("alternates") or []):
        if isinstance(entry, dict) and entry.get("value"):
            allowed.add(_norm(entry["value"]))
    for m in POSTAL_ADDRESS_RE.finditer(draft_text or ""):
        value = re.sub(r"\s+", " ", m.group(0)).strip().rstrip(",")
        if _norm(value) not in allowed:
            if allowed:
                findings.append("Postal address \"%s\" is not the verified address (%s)." % (value, verified))
            else:
                findings.append("Postal address \"%s\" could not be verified from sent correspondence." % value)
            break
    for m in re.finditer(r"\b(TODO|TBD|XXX|FIXME)\b", draft_text or ""):
        findings.append("Unresolved marker %s in the draft." % m.group(1))
    if draft_type == "new_correspondence" and not (intended or {}).get("email"):
        findings.append("Recipient email address is missing (not verified from correspondence).")
    unsolved = [a for a in (actions or []) if not _action_satisfied(a, draft_text, contact_details)[0]]
    for a in unsolved:
        findings.append("Required action not completed: %s." % (a.get("description") or a.get("id")))
    findings = list(dict.fromkeys(findings))
    return _check("missing_information", "Missing information",
                  "fail" if findings else "pass", findings)


def _check_attachments(draft_text, attachments_actually_present, attachments):
    present = list(attachments or [])
    if attachments_actually_present:
        present = present or ["(confirmed by caller)"]
    findings = []
    if not present:
        low = _norm(draft_text)
        for m in ATTACH_CLAIM_RE.finditer(draft_text or ""):
            context = low[max(0, m.start() - 40):m.end() + 10]
            if any(n in context for n in NON_ATTACHMENT_CONTEXT):
                continue
            findings.append("Draft claims to send/attach a document (\"%s\") but nothing is attached." %
                            _quote(m.group(0), 120))
    return _check("attachments", "Attachments",
                  "fail" if findings else "pass", findings,
                  ["Attachments present: %s" % ", ".join(present)] if present else
                  ["No attachments are attached to this draft."])


def _check_language(draft_text, expected_language, known_surnames):
    findings, warnings = [], []
    low = (draft_text or "").lower()
    if not re.search(r"\b(gentile|spettabile|spett\.le|egregio|buongiorno|carissimo|caro|cara|gent\.mo|"
                     r"dear|to whom it may concern)\b", low):
        findings.append("No greeting/salutation found.")
    if not re.search(r"(cordiali saluti|distinti saluti|ossequi|un caro saluto|"
                     r"kind regards|best regards|sincerely)", low):
        findings.append("No closing found.")
    if expected_language == "Italian":
        if sum(1 for w in ITALIAN_STOPWORDS if w in (" " + low + " ")) < 3:
            findings.append("Draft does not read as Italian prose.")
        if re.search(r"\b(dear|kind regards|best regards|sincerely)\b", low):
            warnings.append("English salutation/closing in an Italian draft.")
    # repeated words and double spaces from model glitches
    for m in re.finditer(r"\b(\w{3,})\s+\1\b", low):
        warnings.append("Repeated word \"%s %s\"." % (m.group(1), m.group(1)))
    if re.search(r"\b(al|del|nel|sul)\s+[aeiou]\b", low):
        warnings.append("Possible elision error (e.g. \"al anno\" should be \"all'anno\").")
    if "  " in (draft_text or ""):
        warnings.append("Double spaces in the draft body.")
    # surname integrity: flag near-miss spellings of known family surnames
    known = [s for s in (known_surnames or []) if len(s) >= 5]
    for token in set(re.findall(r"\b[A-Z]{5,}\b", draft_text or "")):
        if token in known:
            continue
        for k in known:
            if _levenshtein(token, k) <= 1:
                findings.append("Possible misspelling \"%s\" (expected \"%s\")." % (token, k))
                break
    findings = list(dict.fromkeys(findings))
    warnings = list(dict.fromkeys(warnings))
    if findings:
        status = "fail"
    elif warnings:
        status = "warn"
    else:
        status = "pass"
    return _check("language", "Language", status, findings + warnings)


def readiness_for(report):
    return (report or {}).get("readiness") or BLOCKED


BLOCKING_CHECKS = ("recipient", "correspondence_type", "identity_distinction", "contradictions", "attachments")
INCOMPLETE_CHECKS = ("immediate_purpose", "factual_provenance", "missing_information", "language")


def verify_draft(draft_text, *, draft_type, intended_recipient=None, latest_inbound=None,
                 required_actions=None, source_texts=None, contact_details=None,
                 excluded_identities=None, forbidden_claims=None,
                 attachments_actually_present=False, attachments=None,
                 known_surnames=None, prohibited_recipient_markers=None,
                 language="Italian", notes=None):
    """Run the ten checks and return a report with evidence and readiness."""
    intended_recipient = intended_recipient or {}
    draft_text = draft_text or ""
    actions = required_actions or []

    office = _norm(intended_recipient.get("office") or "")
    wrong_office_terms = []
    for key, terms in OFFICE_SERVICE_TERMS.items():
        if key in office or key in _norm(intended_recipient.get("institution") or ""):
            if not any(t in office for t in terms):
                wrong_office_terms.extend(terms)

    checks = [
        _check_recipient(draft_text, intended_recipient, prohibited_recipient_markers,
                         wrong_office_terms, draft_type),
        _check_correspondence_type(draft_text, draft_type, intended_recipient),
        _check_immediate_purpose(draft_text, actions, latest_inbound, contact_details),
    ]
    provenance, claims = _check_factual_provenance(draft_text, source_texts, contact_details)
    checks.append(provenance)
    checks.append(_check_identity(draft_text, excluded_identities))
    checks.append(_check_contradictions(draft_text, forbidden_claims, source_texts))
    checks.append(_check_missing_information(draft_text, intended_recipient, actions,
                                             contact_details, draft_type))
    checks.append(_check_attachments(draft_text, attachments_actually_present, attachments))
    checks.append(_check_language(draft_text, language, known_surnames))

    statuses = {c["id"]: c["status"] for c in checks}
    if any(statuses.get(c) == "fail" for c in BLOCKING_CHECKS):
        readiness = BLOCKED
    elif any(statuses.get(c) == "fail" for c in INCOMPLETE_CHECKS):
        readiness = INCOMPLETE
    else:
        readiness = READY

    summary = {s: sum(1 for c in checks if c["status"] == s)
               for s in ("pass", "warn", "fail", "not_applicable")}
    findings = [f for c in checks for f in c["findings"]]
    report = {
        "gate_version": GATE_VERSION,
        "checked_at": _now(),
        "draft_type": draft_type,
        "readiness": readiness,
        "ready_for_review": readiness == READY,
        "recipient": {
            "intended": {
                "institution": intended_recipient.get("institution"),
                "office": intended_recipient.get("office"),
                "email": intended_recipient.get("email"),
                "established_by": intended_recipient.get("established_by"),
            },
            "salutation": _first_salutation(draft_text),
            # Salutation/address terms belonging to the office that referred
            # Daniele elsewhere; reusing them would address the wrong office.
            "prohibited_markers": list(prohibited_recipient_markers or []),
            "issues": statuses.get("recipient") != "pass",
        },
        "action_being_answered": {
            "message_id": (latest_inbound or {}).get("id"),
            "received_at": (latest_inbound or {}).get("received_at"),
            "from": (latest_inbound or {}).get("from_name") or (latest_inbound or {}).get("from_email"),
            "actions": actions,
        },
        "source_messages": sorted({s.get("id") for s in (source_texts or []) if s.get("id") is not None}),
        "factual_claims": claims,
        "missing_information": next(
            (c["findings"] for c in checks if c["id"] == "missing_information"), []),
        "contradictions": next(
            (c["findings"] for c in checks if c["id"] == "contradictions"), []),
        "checks": {c["id"]: c for c in checks},
        "verification_results": checks,
        "summary": summary,
        "findings": findings,
        "notes": notes or [],
    }
    return report


def annotate_draft(draft, report):
    """Return the draft with verification evidence and readiness-based status."""
    out = dict(draft or {})
    out["verification"] = report
    out["review_status"] = readiness_for(report) if readiness_for(report) != READY else READY
    return out


# ---------------------------------------------------------------------------
# CLI (inspection only; writes nothing)
# ---------------------------------------------------------------------------

def main():
    import argparse
    ap = argparse.ArgumentParser(description="Inspect the drafting verification gate (read-only).")
    ap.add_argument("--contact-details", action="store_true", help="show discovered contact details")
    ap.add_argument("--recipient", help="resolve the verified email for an institution")
    args = ap.parse_args()
    if args.contact_details:
        print(json.dumps(discover_contact_details(), indent=2, ensure_ascii=False))
    if args.recipient:
        print(json.dumps(resolve_recipient_email(institution=args.recipient), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
