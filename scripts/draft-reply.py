#!/usr/bin/env python3
"""On-demand reply drafting for a correspondence thread.

Usage: python3 scripts/draft-reply.py <thread_id> [--force]

Generates a draft reply using local Ollama, saves to correspondence/extracted/drafts/<thread_id>.json,
and prints the draft JSON to stdout.

No auto-send. Drafts are review-only.
"""
import argparse, json, os, re, sqlite3, subprocess, urllib.request, datetime, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from rules_loader import get_prompt_rules, format_rules_for_prompt
except ImportError:
    def get_prompt_rules(stage=None): return {}
    def format_rules_for_prompt(rules, stage=None): return ""
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from safe_write import safe_write_json, read_with_version

try:
    from gate_context import context_for_thread as load_attachment_context, ensure_gate
except ImportError:
    def load_attachment_context(message_ids, **kw):
        return "", [], []
    def ensure_gate(message_ids, **kw):
        return []

try:
    from request_links import request_context as load_request_context
except ImportError:
    def load_request_context(thread_id, **kw):
        return "", []

try:
    from draft_verifier import verify_draft
except ImportError:
    def verify_draft(**kw):
        return {"checks": {}, "readiness": "ready", "issues": [], "issue_count": 0}
try:
    import draft_lifecycle as lifecycle
except ImportError:  # pragma: no cover
    lifecycle = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
THREADS_PATH = os.path.join(ROOT, "correspondence", "extracted", "threads.json")
ANALYSIS_DIR = os.path.join(ROOT, "correspondence", "extracted", "analysis")
REVIEWS_PATH = os.path.join(ROOT, "correspondence", "extracted", "reviews.json")
FAMILY_DATA = os.path.join(ROOT, "src", "data", "familyData.ts")
DRAFTS_DIR = os.path.join(ROOT, "correspondence", "extracted", "drafts")
MODEL = "llama3.2:latest"

try:
    import draft_gate as gate
except ImportError:  # pragma: no cover - the gate is always shipped with the script
    gate = None


def _gate_kwargs(**kwargs):
    return gate.build_gate_inputs(**kwargs) if gate else kwargs


def _run_gate(draft_text, draft_type, kwargs, language="Italian"):
    if gate is None:
        return {"readiness": "blocked", "checks": {}, "findings": ["draft gate module unavailable"]}
    return gate.verify_draft(draft_text, draft_type=draft_type, language=language, **kwargs)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("thread_id")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    os.makedirs(DRAFTS_DIR, exist_ok=True)
    out_path = os.path.join(DRAFTS_DIR, args.thread_id + ".json")
    existing_draft = None
    _supersedes_file = None
    if os.path.exists(out_path):
        try:
            _candidate = json.load(open(out_path))
        except (OSError, ValueError):
            _candidate = None
        # Terminal historical drafts are never silently regenerated: --force
        # regenerates only NON-terminal drafts. A genuinely NEW inbound message
        # is resolved separately below (versioned file, never an overwrite).
        if _candidate is not None and ((not args.force) or (lifecycle and lifecycle.is_terminal(_candidate))):
            existing_draft = _candidate

    # Load thread intelligence
    if not os.path.exists(THREADS_PATH):
        print(json.dumps({"ok": False, "error": "Thread intelligence not available"}))
        return
    threads_data = json.load(open(THREADS_PATH))
    thread = (threads_data.get("threads") or {}).get(args.thread_id)
    if not thread:
        print(json.dumps({"ok": False, "error": "Thread not found in intelligence data"}))
        return

    conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    conn.row_factory = sqlite3.Row
    msgs = [dict(r) for r in conn.execute(
        "SELECT id, direction, received_at, sent_at, from_name, from_email, subject, body_text, snippet FROM messages WHERE thread_id=? ORDER BY COALESCE(received_at, sent_at)",
        (thread["thread_db_id"],)).fetchall()]
    conn.close()

    # Load analyses
    analyses = {}
    for m in msgs:
        p = os.path.join(ANALYSIS_DIR, f"message_{m['id']}.json")
        if os.path.exists(p):
            try: analyses[m["id"]] = json.load(open(p))
            except: pass

    # --- Deterministic drafting context ------------------------------------
    # Everything below is derived from the correspondence itself (no model):
    # who the reply goes to, what the latest inbound actually asks for, the
    # verified postal address, and people who must not be conflated.
    inbound_msgs = [m for m in msgs if m["direction"] == "in"]
    latest_inbound = inbound_msgs[-1] if inbound_msgs else None
    source_texts = gate.source_texts(msgs) if gate else []
    contact_details = gate.discover_contact_details(DB_PATH) if gate else {}
    required_actions = (gate.detect_actions_requested(latest_inbound.get("body_text"))
                        if (gate and latest_inbound) else [])
    excluded_identities = gate.derive_excluded_identities(source_texts) if gate else []
    topic_terms = gate.topic_terms(thread, latest_inbound) if gate else []
    resolved_recipient = (gate.resolve_recipient_email(DB_PATH, thread.get("institution") or "",
                                                       THREADS_PATH, topic_terms)
                          if gate else {})
    intended_recipient = {
        "institution": thread.get("institution"),
        "office": thread.get("office") or thread.get("office_name"),
        "email": (resolved_recipient or {}).get("email"),
        "established_by": (resolved_recipient or {}).get("established_by"),
    }
    known_surnames = sorted({t.upper()
                             for n in (thread.get("person_names") or [])
                             for t in re.findall(r"[A-Za-zÀ-ÿ]{5,}", n or "")})
    gate_kwargs = _gate_kwargs(
        intended_recipient=intended_recipient,
        latest_inbound=({"id": latest_inbound["id"],
                         "received_at": latest_inbound.get("received_at") or latest_inbound.get("sent_at"),
                         "from_name": latest_inbound.get("from_name"),
                         "from_email": latest_inbound.get("from_email")}
                        if latest_inbound else None),
        actions=required_actions,
        sources=source_texts,
        contact_details=contact_details,
        excluded_identities=excluded_identities,
        prohibited_markers=[],
        surnames=known_surnames,
    )

    # An existing draft is re-verified on read, never rewritten: the original
    # text and its provenance stay exactly as they were saved.
    if existing_draft is not None:
        _resolution = "reverify"
        _resolved_path = out_path
        if lifecycle is not None:
            try:
                _resolution, _resolved_path = lifecycle.resolve_stale(existing_draft, out_path, msgs)
            except Exception:
                _resolution = "reverify"
        if _resolution == "reverify" and os.path.abspath(_resolved_path) != os.path.abspath(out_path):
            # A versioned draft already covers the newer inbound: it IS the
            # current draft. Re-verify it in memory, never overwrite the file.
            try:
                existing_draft = json.load(open(_resolved_path))
            except (OSError, ValueError):
                pass
        elif _resolution == "new_version":
            # NEW correspondence event: a genuinely newer inbound message
            # arrived in this thread after the historical draft was generated.
            # Generate into a FRESH versioned file; the retired/sent historical
            # draft and its sent-message reconciliation stay untouched.
            _supersedes_file = os.path.basename(out_path)
            out_path = _resolved_path
            existing_draft = None
        else:
            draft = existing_draft
            text = draft.get("edited_text") or draft.get("draft_text") or ""
            draft_lang = draft.get("language") or "Italian"
            report = _run_gate(text, "reply", gate_kwargs, draft_lang)
            draft = dict(draft)
            draft["verification"] = report
            # Preserve terminal/suppressed lifecycle states: a rebuild must not
            # reactivate a retired, sent, blocked or suppressed draft.
            if lifecycle is None or lifecycle.is_terminal(draft):
                preserved = draft.get("readiness")
                draft["readiness"] = preserved
                draft["review_status"] = preserved
            else:
                draft["readiness"] = report.get("readiness")
                draft["review_status"] = report.get("readiness") or draft.get("review_status") or "draft"
            draft["verification_recomputed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            if draft.get("edited_text"):
                print(json.dumps({"ok": True, "draft": draft, "confirm_overwrite": True}))
                return
            print(json.dumps({"ok": True, "draft": draft}))
            return

    # Load reviews
    reviews = {}
    if os.path.exists(REVIEWS_PATH):
        try:
            rd = json.load(open(REVIEWS_PATH))
            reviews = rd.get("reviews", {})
        except: pass
    thread_reviews = reviews.get(args.thread_id, {})

    # Load family data
    family_text = ""
    if os.path.exists(FAMILY_DATA):
        family_text = open(FAMILY_DATA).read()

    def normalize_name_for_match(name):
        if not name: return ""
        cleaned = re.sub(r"[^A-Za-zÀ-ÿ\s]", " ", name)
        tokens = sorted(cleaned.lower().split())
        return " ".join(tokens)

    family_people = {}
    for m in re.finditer(r"name:\s*'([^']+)'", family_text):
        name = m.group(1)
        key = normalize_name_for_match(name)
        if key and key not in family_people:
            pos = m.start()
            start_b = family_text.rfind("{", 0, pos)
            end_b = family_text.find("}", pos) + 1
            block = family_text[start_b:end_b] if start_b >= 0 and end_b > start_b else ""
            family_people[key] = (name, block)

    person_names = set()
    for m in msgs:
        a = analyses.get(m["id"], {})
        for p in (a.get("people") or []):
            if isinstance(p, dict) and p.get("name"):
                person_names.add(p["name"])

    verified_facts = []
    matched_people = []
    ambiguous = []
    for aname in person_names:
        akey = normalize_name_for_match(aname)
        if not akey: continue
        candidates = [(fname, block) for key, (fname, block) in family_people.items() if key == akey]
        if len(candidates) == 1:
            matched_people.append((aname, candidates[0][0], candidates[0][1]))
        elif len(candidates) > 1:
            ambiguous.append((aname, [c[0] for c in candidates]))

    for aname, fname, block in matched_people:
        extracted = []
        for f in ["birthDate", "birthPlace", "deathDate", "deathPlace", "burialPlace"]:
            for match in re.finditer(rf"{f}:\s*'([^']*)'", block):
                if match.group(1):
                    extracted.append(f"{f}: {match.group(1)}")
        if extracted:
            verified_facts.append(f"{fname}: {'; '.join(extracted)}")

    ambiguous_warnings = []
    for aname, cands in ambiguous:
        ambiguous_warnings.append(f"Ambiguous person match for '{aname}': could be {cands}. Verified facts not used.")

    # Build context
    context_parts = []
    context_parts.append(f"=== THREAD: {thread.get('title') or thread.get('subject') or args.thread_id} ===")
    context_parts.append(f"AUTHOR (you are writing as): Daniele Buatti (daniele.buatti@gmail.com / info@danielebuatti.com)")
    context_parts.append(f"RECIPIENT (you are writing to): {thread.get('institution') or 'Unknown institution'}")
    context_parts.append(f"Institution: {thread.get('institution') or 'Unknown'} (confidence: {thread.get('institution_confidence') or 'unknown'})")
    context_parts.append(f"IMPORTANT: You are writing AS Daniele Buatti TO the recipient institution. Never adopt the voice or perspective of the institution's messages.")
    if thread.get("protocol_refs"):
        context_parts.append("Protocol refs: " + ", ".join(thread["protocol_refs"]))
    if thread.get("record_refs"):
        context_parts.append("Record refs: " + ", ".join(thread["record_refs"]))
    if thread.get("person_names"):
        context_parts.append("People mentioned: " + ", ".join(thread["person_names"]))
    if verified_facts:
        context_parts.append("\n=== VERIFIED GENEALOGY FACTS (from family data, do not contradict) ===")
        context_parts.append("\n".join(verified_facts))
    accepted_facts = []
    for key, rv in thread_reviews.items():
        if rv and (rv.get("decision") in ("accepted", "edited")):
            val = rv.get("edited_value") or rv.get("original")
            accepted_facts.append(f"{key}: {val} (evidence: {rv.get('evidence') or 'n/a'})")
    if accepted_facts:
        context_parts.append("\n=== HUMAN-VERIFIED FACTS (highest priority) ===")
        context_parts.append("\n".join(accepted_facts))
    outstanding = [a.get("description") or a.get("value") or str(a) for a in (thread.get("outstanding_actions") or [])]
    if outstanding:
        context_parts.append("\n=== OUTSTANDING QUESTIONS / ACTIONS ===")
        context_parts.append("\n".join(outstanding))

    # Extract key phrases that must be preserved verbatim
    source_text_all = " ".join(m.get("body_text") or "" for m in msgs)
    key_phrases = []
    for phrase in ["pronipote", "bisnonna", "bisnonno", "già defunt", "already deceased", "already dead"]:
        if phrase.lower() in source_text_all.lower():
            # find the sentence containing it
            for sentence in re.split(r'[.!?\n]', source_text_all):
                if phrase.lower() in sentence.lower():
                    key_phrases.append(sentence.strip())
                    break
    if key_phrases:
        context_parts.append("\n=== KEY PHRASES FROM SOURCE (preserve verbatim if relevant) ===")
        context_parts.append("\n".join(key_phrases))

    context_parts.append("\n=== CORRESPONDENCE (oldest first) ===")
    recent = msgs[-3:]
    older = msgs[:-3]
    if older:
        context_parts.append(f"[Earlier messages ({len(older)}) - key info preserved:]")
        for m in older:
            a = analyses.get(m["id"], {})
            summary = a.get("purpose_summary") or m.get("snippet") or "(no summary)"
            date = m["received_at"] or m["sent_at"] or ""
            protos = [p.get("value") if isinstance(p, dict) else p for p in (a.get("protocol_refs") or [])]
            people = [p.get("name") if isinstance(p, dict) else p for p in (a.get("people") or [])]
            outs = [q.get("value") if isinstance(q, dict) else q for q in (a.get("outstanding_questions") or [])]
            context_parts.append(f"- {date[:10]} [{m['direction']}] {m['subject'] or ''}: {summary}")
            if protos: context_parts.append(f"  Protocols: {', '.join(protos)}")
            if people: context_parts.append(f"  People: {', '.join(people)}")
            if outs: context_parts.append(f"  Outstanding: {'; '.join(outs)}")
        context_parts.append("")
    for m in recent:
        date = m["received_at"] or m["sent_at"] or ""
        a = analyses.get(m["id"], {})
        trans = a.get("translation_en", "") if a else ""
        context_parts.append(f"--- Message {m['id']} ({m['direction']}, {date}) ---")
        context_parts.append(f"From: {m['from_name'] or m['from_email']}")
        context_parts.append(f"Subject: {m['subject'] or ''}")
        if trans and trans != m["body_text"]:
            context_parts.append(f"English translation:\n{trans[:2000]}")
        else:
            context_parts.append(f"Body:\n{(m['body_text'] or '')[:2000]}")
        context_parts.append("")

    # Attachments that arrived on this thread (Step 1 gate). Only text the gate
    # actually extracted is offered; unreadable documents are named as gaps.
    # Placed after the messages so truncation never cuts the correspondence.
    gate_block, gate_provenance, gate_warnings = load_attachment_context([m["id"] for m in msgs])
    if gate_block:
        context_parts.append("")
        context_parts.append(gate_block)

    # Request linkage (Step 2): what was requested, what arrived, fulfilment state
    req_block, req_provs = load_request_context(args.thread_id)
    if req_block:
        context_parts.append("")
        context_parts.append(req_block)
    req_warnings = []
    for r in (req_provs or []):
        if r.get("ambiguous"):
            req_warnings.append("Request %s is AMBIGUOUS (candidate replies: %s) — do not assume a single linkage."
                               % (r["request_id"], ", ".join(c.get("thread_id") for c in r.get("ambiguity_candidates", []))))

    # What the latest inbound actually asks for, plus verified contact details.
    # Appended after truncation so it is never cut off.
    required_block = gate.required_response_block(required_actions, contact_details,
                                                  excluded_identities, intended_recipient, "reply")

    context_text = "\n".join(context_parts)[:20000] + "\n\n" + required_block

    last_inbound = [m for m in msgs if m["direction"] == "in"]
    last_in = last_inbound[-1] if last_inbound else None
    is_italian = bool(last_in and (last_in.get("body_text") or "").lower().__contains__("à") or (last_in and (last_in.get("body_text") or "") and any(c in (last_in.get("body_text") or "") for c in "àèéìòù")))
    # simpler: check for Italian characters
    body_check = (last_in.get("body_text") or "") if last_in else ""
    is_italian = any(c in body_check for c in "àèéìòùÀÈÉÌÒÙ")
    target_lang = "Italian" if is_italian else "English"

    # Load active rules for drafting stage
    try:
        _drules = get_prompt_rules(stage="drafting")
        _drule_text = format_rules_for_prompt(_drules, stage="drafting")
        _applied_draft_rules = list(_drules.keys())
    except Exception:
        _drule_text = ""
        _applied_draft_rules = []
    system_prompt = f"""You are drafting a reply on behalf of Daniele Buatti to a correspondent (often an Italian municipal office or archive).

IDENTITY (CRITICAL):
- You are writing AS Daniele Buatti. You are replying TO the identified recipient institution.
- The incoming messages in the correspondence are FROM the institution. Do NOT adopt their voice, identity or perspective.
- Never write as if you are the institution. Never use "we" to refer to the institution. Use "I" (Daniele) throughout.
- The recipient's message is the INBOUND message you are responding to. Your reply goes TO them.

RULES:
1. Write in formal {target_lang}. If the original correspondence is in Italian, reply in Italian. If in English, reply in English.
2. You must ONLY use information explicitly present in the provided correspondence, verified genealogy facts, and accepted review decisions.
3. NEVER invent facts, dates, protocol numbers, names, or promises. If unsure about a detail, omit it or mark with [VERIFY].
4. PRESERVE EXACT MEANING (CRITICAL): When describing family relationships or temporal status, use the EXACT wording from the source correspondence. Do NOT paraphrase or strengthen claims.
   EXAMPLE (BAD): Source says "Sono pronipote di Gregorio Emmi" -> Draft says "Sono cugino di seconda generazione" (WRONG - changed relationship)
   EXAMPLE (GOOD): Source says "Sono pronipote di Gregorio Emmi" -> Draft says "Sono pronipote di Gregorio Emmi" (CORRECT - preserved)
   EXAMPLE (BAD): Source says "risulta già defunta il 4 ottobre 1952" -> Draft says "è deceduta il 4 ottobre 1952" (WRONG - changed "already deceased by" to "died on")
   EXAMPLE (GOOD): Source says "risulta già defunta il 4 ottobre 1952" -> Draft says "risulta già defunta il 4 ottobre 1952" (CORRECT - preserved exact wording)
   - "pronipote" = great-grandson/great-granddaughter. NEVER write "cugino" (cousin) instead.
   - "bisnonna" = great-grandmother. NEVER write "cugina" (cousin) instead.
   - "risulta già defunta il 4 ottobre 1952" = "was already deceased on October 4, 1952". NEVER write "morì il 4 ottobre 1952" or "è deceduta il 4 ottobre 1952" (which means "died on").
   EXAMPLE (BAD): Source says "La mia bisnonna" -> Draft says "La mia cugina" (WRONG - changed relationship)
   EXAMPLE (GOOD): Source says "La mia bisnonna" -> Draft says "La mia bisnonna" (CORRECT - preserved)
   - If you are unsure how to describe a relationship or date, COPY the exact phrase from the source or OMIT the claim entirely. Do not invent an interpretation.
5. Reference protocol numbers exactly as they appear in the correspondence. Do not modify or invent them.
6. Do not promise actions Daniele hasn't committed to.
7. Include a greeting, the body of the reply, and a closing.
8. If the message requires answering a specific question, answer it directly.
9. If the message requires providing information, provide only verified facts.
10. If the message requires a follow-up or chase, be polite and reference the original request and protocol.
11. End with "Cordiali saluti" (Italian) or "Kind regards" (English), followed by Daniele Buatti's contact details.

OUTPUT: Return ONLY the draft reply text, no commentary, no markdown.""" + (_drule_text if _drule_text else "")

    user_prompt = f"Draft a reply to the following correspondence thread.\n\n{context_text}"

    payload = {"model": MODEL, "messages": [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ], "stream": False, "options": {"temperature": 0.2}}

    req = urllib.request.Request("http://127.0.0.1:11434/api/chat",
                                 data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=300) as r:
        resp = json.load(r)
    draft_text = (resp.get("message", {}).get("content", "") or "").strip()

    # Post-generation validation
    unverified = []
    # Only check protocol-like numbers (5+ digits or containing /), skip years
    proto_regex = re.compile(r"\b\d{5,}(?:/\d{4})?\b")
    draft_protos = proto_regex.findall(draft_text)
    context_protos = list(thread.get("protocol_refs") or [])
    for a in analyses.values():
        for p in (a.get("protocol_refs") or []):
            v = p.get("value") if isinstance(p, dict) else p
            if v: context_protos.append(str(v))
    # Also add any numbers from message subjects
    for m in msgs:
        subj = m.get("subject") or ""
        for num in re.findall(r"\d{5,}(?:/\d{4})?", subj):
            context_protos.append(num)
    for dp in draft_protos:
        if not any(str(cp).find(dp) >= 0 for cp in context_protos):
            unverified.append(f'Protocol/number "{dp}" not found in source correspondence')
    if "[VERIFY]" in draft_text:
        unverified.append("Draft contains [VERIFY] markers — review these passages")
    # perspective check
    draft_lower = draft_text.lower()
    perspective_issues = []
    if "gentile signor buatti" in draft_lower or "gentile sig. buatti" in draft_lower:
        perspective_issues.append("Draft may be written from the institution's perspective (addresses Daniele as recipient). Verify author/recipient.")
    if "noi abbiamo" in draft_lower or "we have" in draft_lower or "ci permettiamo" in draft_lower:
        perspective_issues.append("Draft contains first-person plural that may indicate institutional voice. Verify perspective.")
    if perspective_issues:
        unverified.extend(perspective_issues)
    # temporal/relationship meaning check
    meaning_issues = []
    # Check for conflation of "already deceased by" with "died on"
    died_on_patterns = ["è deceduta il", "è morto il", "died on", "morì il", "morì il giorno", "deceduta il", "morto il"]
    if any(p in draft_lower for p in died_on_patterns):
        source_text = " ".join(m.get("body_text") or "" for m in msgs).lower()
        if "già defunt" in source_text or "already deceased" in source_text or "already dead" in source_text:
            meaning_issues.append("Possible temporal conflation: source says 'already deceased by' but draft says 'died on'. Verify.")
    # Check for relationship paraphrasing
    source_text_all = " ".join(m.get("body_text") or "" for m in msgs).lower()
    if "pronipote" in source_text_all and "pronipote" not in draft_lower:
        meaning_issues.append("Relationship term 'pronipote' from source not preserved in draft. Verify relationship description.")
    if "cugino" in draft_lower and "pronipote" in source_text_all and "pronipote" not in draft_lower:
        meaning_issues.append("Possible relationship paraphrasing: source says 'pronipote' (great-grandson) but draft says 'cugino' (cousin). Verify.")
    if "bisnonna" in source_text_all and "bisnonna" not in draft_lower:
        meaning_issues.append("Relationship term 'bisnonna' (great-grandmother) from source not preserved in draft. Verify relationship description.")
    if ("cugina" in draft_lower or "cugino" in draft_lower) and "bisnonna" in source_text_all and "bisnonna" not in draft_lower:
        meaning_issues.append("Possible relationship paraphrasing: source says 'bisnonna' (great-grandmother) but draft says 'cugina/cugino' (cousin). Verify.")
    if meaning_issues:
        unverified.extend(meaning_issues)

    warnings = []
    if unverified:
        warnings.append("Unverified content detected: " + "; ".join(unverified))
    if not analyses:
        warnings.append("No AI analysis available. Draft is based on raw correspondence only.")
    if len(analyses) < len(msgs):
        warnings.append(f"{len(msgs)-len(analyses)} message(s) in this thread have no analysis. Context may be incomplete.")
    if ambiguous_warnings:
        warnings.extend(ambiguous_warnings)
    if not verified_facts and person_names:
        warnings.append("No verified genealogy facts were matched for the people mentioned. Draft relies on correspondence context only.")
    if gate_warnings:
        warnings.extend(gate_warnings)
    if req_warnings:
        warnings.extend(req_warnings)

    # Drafting verification gate (Step 5). The deterministic gate is
    # authoritative; the earlier heuristic verifier only contributes warnings.
    verification = _run_gate(draft_text, "reply", gate_kwargs, target_lang)
    _readiness = verification.get("readiness") or "blocked"
    _recipient = intended_recipient.get("institution") or "Unknown institution"
    try:
        legacy = verify_draft(
            draft_text=draft_text,
            draft_type="reply",
            recipient=_recipient,
            recipient_email=intended_recipient.get("email"),
            source_messages=[m["id"] for m in msgs],
            context_text=context_text,
            msgs=msgs,
            gate_block=gate_block,
            req_block=req_block,
            verified_facts=verified_facts,
        )
        for iss in legacy.get("issues", []):
            if iss not in warnings:
                warnings.append("Verification: " + iss)
    except Exception as exc:  # noqa: BLE001 - never block drafting on the old check
        warnings.append("Legacy verifier unavailable: %s" % exc)
    for f in verification.get("findings") or []:
        msg = "Draft gate: " + f
        if msg not in warnings:
            warnings.append(msg)

    # Determine "why a reply is needed": the action in the LATEST inbound, not a
    # stale analysis question.
    reply_reason = ""
    if latest_inbound:
        date = (latest_inbound.get("received_at") or latest_inbound.get("sent_at") or "")[:10]
        if required_actions:
            described = "; ".join(a.get("description") or a.get("id") for a in required_actions)
            evidence = next((a.get("evidence") for a in required_actions if a.get("evidence")), "")
            reply_reason = ('Reply needed because the last inbound message (msg %s, %s) asks to %s'
                            % (latest_inbound["id"], date, described))
            if evidence:
                reply_reason += ' — "%s"' % evidence
        else:
            a = analyses.get(latest_inbound["id"], {})
            asked = (a.get("actions_requested") or [])[:1]
            qval = (asked[0].get("value") if isinstance(asked[0], dict) else str(asked[0])) if asked else ""
            if qval:
                reply_reason = ('Reply needed because the last inbound message (msg %s, %s) asks: "%s"'
                                % (latest_inbound["id"], date, qval))


    draft = {
        "thread_id": args.thread_id,
        "draft_text": draft_text,
        "language": target_lang,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "model": MODEL,
        "context_summary": f"Thread: {len(msgs)} messages. Institution: {thread.get('institution') or 'Unknown'}.",
        "review_status": _readiness,
        "edited_text": None,
        "reviewed_at": None,
        "reply_reason": reply_reason,
        "readiness": _readiness,
        "verification": verification,
        "recipient": _recipient,
        "recipient_email": intended_recipient.get("email"),
        "recipient_email_source": (resolved_recipient or {}).get("established_by"),
        "provenance": {
            "source_messages": [m["id"] for m in msgs],
            "analysis_files": [f"message_{mid}.json" for mid in analyses],
            "verified_facts_used": verified_facts,
            "ai_suggestions_used": (thread.get("outstanding_actions") or []),
            "unverified_content_flagged": unverified,
            "attachment_gate": {
                "attachments_used": gate_provenance,
                "note": "Attachment text is machine-extracted (text layer or OCR) and unverified; "
                        "it does not establish that a research request was fulfilled.",
            },
            "request_links": [r["request_id"] for r in (req_provs or [])],
            "drafting_inputs": {
                "intended_recipient": intended_recipient,
                "latest_inbound_message_id": (latest_inbound or {}).get("id"),
                "required_actions": required_actions,
                "verified_contact_details": contact_details,
                "excluded_identities": excluded_identities,
                "postal_address_rule": "verified from sent correspondence only; never invented",
            },
        },
        "warnings": warnings,
        "rules_applied": _applied_draft_rules if '_applied_draft_rules' in dir() else [],
    }

    os.makedirs(DRAFTS_DIR, exist_ok=True)
    _, dv = read_with_version(out_path) if os.path.exists(out_path) else (None, None)
    # Preserve Gmail metadata from any existing draft (never overwrite on regeneration)
    _existing_gmail_meta = {}
    if os.path.exists(out_path):
        try:
            _existing = json.load(open(out_path))
            for _k in ("gmail_draft_id", "gmail_draft_created_at", "gmail_draft_account", "gmail_draft_status", "gmail_draft_body_hash"):
                if _existing.get(_k):
                    _existing_gmail_meta[_k] = _existing[_k]
        except (OSError, ValueError):
            pass
    if _existing_gmail_meta:
        draft.update(_existing_gmail_meta)
    if _supersedes_file:
        draft["supersedes_file"] = _supersedes_file
    safe_write_json(out_path, draft, "script", dv, ["draft_text"], "Draft generated")
    print(json.dumps({"ok": True, "draft": draft}))


if __name__ == "__main__":
    main()