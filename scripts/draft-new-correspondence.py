#!/usr/bin/env python3
"""Generate a draft for NEW correspondence (not a reply to an existing thread).

Usage: python3 scripts/draft-new-correspondence.py <thread_id> [--force]

Generates a new email draft addressed to the institution recommended by the
action classification's suggested_new_correspondence field.

Guards (all deterministic, from the stored correspondence):
  * a suggestion marked `suppressed` never produces a draft;
  * the recipient institution/office/email must be verified from existing
    correspondence, never taken on trust from the suggestion;
  * the draft must not reuse the salutation or address of the institution that
    referred Daniele elsewhere;
  * every draft is passed through the drafting verification gate (Step 5) and
    its readiness is stored with it.

No auto-send. Drafts are review-only.
"""
import argparse, json, os, re, sqlite3, urllib.request, datetime, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    from rules_loader import get_prompt_rules, format_rules_for_prompt
except ImportError:
    def get_prompt_rules(stage=None): return {}
    def format_rules_for_prompt(rules, stage=None): return ""
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from safe_write import safe_write_json, read_with_version

try:
    from gate_context import context_for_thread as load_attachment_context
except ImportError:
    def load_attachment_context(message_ids, **kw):
        return "", [], []

try:
    from request_links import request_context as load_request_context
except ImportError:
    def load_request_context(thread_id, **kw):
        return "", []

try:
    from draft_verifier import verify_draft as legacy_verify_draft
except ImportError:
    def legacy_verify_draft(**kw):
        return {"checks": {}, "readiness": "ready", "issues": [], "issue_count": 0}

try:
    import draft_gate as gate
except ImportError:  # pragma: no cover
    gate = None
try:
    import draft_lifecycle as lifecycle
except ImportError:  # pragma: no cover
    lifecycle = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
THREADS_PATH = os.path.join(ROOT, "correspondence", "extracted", "threads.json")
ANALYSIS_DIR = os.path.join(ROOT, "correspondence", "extracted", "analysis")
ACTIONS_PATH = os.path.join(ROOT, "correspondence", "extracted", "actions.json")
FAMILY_DATA = os.path.join(ROOT, "src", "data", "familyData.ts")
DRAFTS_DIR = os.path.join(ROOT, "correspondence", "extracted", "drafts")
MODEL = "llama3.2:latest"


def _out(msg):
    print(json.dumps(msg, ensure_ascii=False))
    return


def _request_actions(snc):
    """What the new email must ask for, derived from the suggestion's evidence."""
    quotes = [e.get("quote") or "" for e in (snc.get("evidence") or [])]
    text = " ".join([snc.get("reason") or "", snc.get("context_summary") or ""] + quotes)
    surnames = sorted({t for t in re.findall(r"\b[A-Z]{4,}\b", text)})[:2]
    years = sorted(set(re.findall(r"\b(?:1[6-9]|20)\d{2}\b", text)))
    groups = [[s] for s in surnames]
    if years:
        groups.append(years)
    groups.append(["morte", "decesso", "death", "nascita", "birth", "matrimonio", "marriage"])
    return [{
        "id": "request_new_information",
        "description": snc.get("reason") or "request the information described in the suggestion",
        "evidence": quotes[0] if quotes else "",
        "required_terms": groups,
    }]


def _subject_suggestion(snc, institution):
    quotes = [e.get("quote") or "" for e in (snc.get("evidence") or [])]
    text = " ".join([snc.get("reason") or "", snc.get("context_summary") or ""] + quotes)
    surnames = sorted({t for t in re.findall(r"\b[A-Z]{4,}\b", text)})[:2]
    subject = "Richiesta di informazioni"
    if surnames:
        subject += " – " + " / ".join(surnames)
    if institution:
        subject += " – " + institution
    return subject


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("thread_id")
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()

    os.makedirs(DRAFTS_DIR, exist_ok=True)
    out_path = os.path.join(DRAFTS_DIR, args.thread_id + "_new.json")

    # Load action data
    if not os.path.exists(ACTIONS_PATH):
        return _out({"ok": False, "error": "Actions not available"})
    actions_data = json.load(open(ACTIONS_PATH))
    action = actions_data.get("actions", {}).get(args.thread_id)
    if not action:
        return _out({"ok": False, "error": "Thread not found in actions"})

    snc = action.get("suggested_new_correspondence")
    if not snc:
        return _out({"ok": False, "error": "No suggested new correspondence for this thread"})

    # A suppressed suggestion may never produce a draft.
    allowed, suppression_reason = (gate.check_suggestion_allowed(snc) if gate else (True, ""))

    # Thread context (also needed to re-verify a preserved draft on read)
    threads_data = json.load(open(THREADS_PATH)) if os.path.exists(THREADS_PATH) else {}
    thread = (threads_data.get("threads") or {}).get(args.thread_id) or {}

    conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
    conn.row_factory = sqlite3.Row
    db_thread = conn.execute("SELECT id FROM threads WHERE gmail_thread_id=?", (args.thread_id,)).fetchone()
    msgs = []
    if db_thread:
        msgs = [dict(r) for r in conn.execute(
            "SELECT id, direction, received_at, sent_at, from_name, from_email, subject, body_text FROM messages WHERE thread_id=? ORDER BY COALESCE(received_at,sent_at)",
            (db_thread["id"],)).fetchall()]
    conn.close()

    analyses = {}
    for m in msgs:
        p = os.path.join(ANALYSIS_DIR, f"message_{m['id']}.json")
        if os.path.exists(p):
            try: analyses[m["id"]] = json.load(open(p))
            except: pass

    # --- Verified recipient (never taken on trust from the suggestion) ------
    recipient_institution = (snc.get("recommended_institution") or "").strip()
    if not recipient_institution and gate:
        recipient_institution = gate.institution_from_referral(msgs) or ""
    topic_terms = gate.topic_terms(thread) if gate else []
    resolved = (gate.resolve_recipient_email(DB_PATH, recipient_institution, THREADS_PATH, topic_terms)
                if gate else {})
    recipient_email = (resolved or {}).get("email")
    recommended_email = snc.get("recommended_email")
    email_warnings = []
    if recommended_email and recipient_email and recommended_email.lower() != recipient_email.lower():
        email_warnings.append(
            "Suggestion named %s but existing correspondence verifies %s; the verified address is used."
            % (recommended_email, recipient_email))
    if recommended_email and not recipient_email:
        email_warnings.append(
            "Suggested address %s could not be verified from existing correspondence and was NOT used."
            % recommended_email)
    if not recipient_email:
        email_warnings.append("No recipient email could be verified from existing correspondence.")

    latest_inbound = next((m for m in reversed(msgs) if m["direction"] == "in"), None)
    recipient_office = (snc.get("recommended_office") or
                        (gate.office_from_referral(msgs) if gate else None))
    intended_recipient = {
        "institution": recipient_institution or None,
        "office": recipient_office,
        "email": recipient_email,
        "established_by": (resolved or {}).get("established_by"),
    }
    prohibited_markers = (gate.referral_markers(thread, recipient_institution, msgs, recipient_email)
                          if gate else [])
    contact_details = gate.discover_contact_details(DB_PATH) if gate else {}
    sources = gate.source_texts(msgs) if gate else []
    excluded = gate.derive_excluded_identities(sources) if gate else []
    required_actions = _request_actions(snc)
    surnames = sorted({t for n in (thread.get("person_names") or [])
                       for t in re.findall(r"[A-Za-zÀ-ÿ]{5,}", n or "")})
    surnames = [s.upper() for s in surnames if s.upper() == s] or []
    gate_inputs = (gate.build_gate_inputs(
        intended_recipient=intended_recipient,
        latest_inbound=({"id": latest_inbound["id"],
                         "received_at": latest_inbound.get("received_at") or latest_inbound.get("sent_at"),
                         "from_name": latest_inbound.get("from_name"),
                         "from_email": latest_inbound.get("from_email")}
                        if latest_inbound else None),
        actions=required_actions,
        sources=sources,
        contact_details=contact_details,
        excluded_identities=excluded,
        prohibited_markers=prohibited_markers,
        surnames=surnames,
    ) if gate else {})

    def annotate(draft, text, language="Italian"):
        """Attach a fresh verification report in memory; never rewrite the file."""
        out = dict(draft or {})
        report = (gate.verify_draft(text, draft_type="new_correspondence",
                                    language=draft.get("language") or language,
                                    **gate_inputs) if gate else
                  {"readiness": "blocked", "findings": ["draft gate unavailable"]})
        if not allowed:
            # The stored draft is evidence of the earlier failure; it stays on
            # disk untouched but can never be presented as ready.
            report = dict(report)
            report["findings"] = list(report.get("findings") or []) + [
                "Suggestion suppressed: %s" % suppression_reason]
            report["readiness"] = "blocked"
        if lifecycle is None or lifecycle.is_terminal(out):
            preserved = out.get("readiness")
            out["readiness"] = preserved
            out["review_status"] = preserved
        else:
            out["readiness"] = report.get("readiness")
            out["review_status"] = report.get("readiness") or out.get("review_status") or "draft"
        out["verification_recomputed_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        return out

    # Existing draft: re-verify in memory, never overwrite the preserved file.
    existing = None
    _load_existing = False
    _supersedes_file = None
    if os.path.exists(out_path):
        try:
            _cand = json.load(open(out_path))
        except (OSError, ValueError):
            _cand = None
        if _cand is not None and ((not args.force) or (lifecycle and lifecycle.is_terminal(_cand))):
            _load_existing = True
    if _load_existing:
        try:
            existing = json.load(open(out_path))
        except (OSError, ValueError):
            existing = None
        if existing is not None:
            _resolution = "reverify"
            if lifecycle is not None:
                try:
                    _resolution, _resolved_path = lifecycle.resolve_stale(existing, out_path, msgs)
                except Exception:
                    _resolution = "reverify"
            if _resolution == "reverify" and os.path.abspath(_resolved_path or "") != os.path.abspath(out_path):
                # A versioned `_new` draft already covers the newer inbound.
                # It IS the current draft: re-verify in memory, no rewrite.
                try:
                    existing = json.load(open(_resolved_path))
                except (OSError, ValueError):
                    pass
                annotated = annotate(existing, existing.get("edited_text") or existing.get("draft_text") or "")
                if not allowed:
                    return _out({"ok": False,
                                 "error": "Suggestion suppressed: %s" % suppression_reason,
                                 "suppressed": True,
                                 "suggestion": snc,
                                 "draft": annotated})
                return _out({"ok": True, "draft": annotated})
            elif _resolution == "new_version" and allowed:
                # NEW correspondence event: the thread has a genuinely newer
                # inbound message. Draft into a FRESH versioned file; the
                # historical `_new` draft stays untouched.
                _supersedes_file = os.path.basename(out_path)
                out_path = _resolved_path
                existing = None
            else:
                annotated = annotate(existing, existing.get("edited_text") or existing.get("draft_text") or "")
                if not allowed:
                    return _out({"ok": False,
                                 "error": "Suggestion suppressed: %s" % suppression_reason,
                                 "suppressed": True,
                                 "suggestion": snc,
                                 "draft": annotated})
                return _out({"ok": True, "draft": annotated})

    if not allowed:
        return _out({"ok": False,
                     "error": "Suggestion suppressed: %s" % suppression_reason,
                     "suppressed": True,
                     "suggestion": snc})

    recipient = recipient_institution or "Unknown institution"
    reason = snc.get("reason", "")
    context_summary = snc.get("context_summary", "")
    verified_facts = snc.get("verified_facts", [])
    unverified = snc.get("unverified", [])
    uncertainty_note = snc.get("uncertainty_note", "")
    evidence = snc.get("evidence", [])

    # Build context
    context_parts = []
    context_parts.append(f"=== NEW CORRESPONDENCE DRAFT ===")
    context_parts.append(f"AUTHOR (you are writing as): Daniele Buatti (daniele.buatti@gmail.com / info@danielebuatti.com)")
    context_parts.append(f"RECIPIENT (you are writing to): {recipient}")
    if recipient_office:
        context_parts.append(f"RECIPIENT OFFICE: {recipient_office}")
    if recipient_email:
        context_parts.append(f"RECIPIENT EMAIL (verified from existing correspondence): {recipient_email}")
        if intended_recipient.get("established_by"):
            context_parts.append(f"VERIFIED BY: {intended_recipient['established_by']}")
    else:
        context_parts.append("NOTE: The recipient email address is NOT verified by any existing message. "
                             "The draft will be marked incomplete and must not be sent.")
    context_parts.append("")
    context_parts.append("=== WHY THIS EMAIL IS BEING SUGGESTED ===")
    context_parts.append(f"Reason: {reason}")
    context_parts.append(f"Context: {context_summary}")
    if uncertainty_note:
        context_parts.append(f"Uncertainty note: {uncertainty_note}")
    context_parts.append("")
    context_parts.append("=== VERIFIED FACTS (from family data and correspondence) ===")
    for vf in verified_facts:
        context_parts.append(f"- {vf}")
    context_parts.append("")
    context_parts.append("=== UNVERIFIED / UNCERTAIN (never state these as established) ===")
    for u in unverified:
        context_parts.append(f"- {u}")
    context_parts.append("")
    context_parts.append("=== SUPPORTING EVIDENCE ===")
    for ev in evidence:
        context_parts.append(f"- MSG {ev.get('msg_id')}: \"{ev.get('quote', '')}\"")
    context_parts.append("")
    context_parts.append("=== ORIGINAL CORRESPONDENCE (background only — this is NOT a reply to it) ===")
    for m in msgs:
        date = m["received_at"] or m["sent_at"] or ""
        context_parts.append(f"--- Message {m['id']} ({m['direction']}, {date}) ---")
        context_parts.append(f"From: {m['from_name'] or m['from_email']}")
        context_parts.append(f"Subject: {m['subject'] or ''}")
        body = (m["body_text"] or "")[:1500]
        context_parts.append(f"Body:\n{body}")
        context_parts.append("")

    gate_block, gate_provenance, gate_warnings = load_attachment_context([m["id"] for m in msgs])
    if gate_block:
        context_parts.append("")
        context_parts.append(gate_block)

    req_block, req_provs = load_request_context(args.thread_id)
    if req_block:
        context_parts.append("")
        context_parts.append(req_block)

    required_block = (gate.required_response_block(required_actions, contact_details, excluded,
                                                   intended_recipient, "new_correspondence")
                      if gate else "")
    context_text = "\n".join(context_parts)[:20000]
    if required_block:
        context_text += "\n\n" + required_block

    target_lang = "Italian"

    try:
        _drules = get_prompt_rules(stage="drafting")
        _drule_text = format_rules_for_prompt(_drules, stage="drafting")
        _applied_draft_rules = list(_drules.keys())
    except Exception:
        _drule_text = ""
        _applied_draft_rules = []
    system_prompt = f"""You are drafting a NEW email (not a reply) on behalf of Daniele Buatti to a new correspondent.

IDENTITY (CRITICAL):
- You are writing AS Daniele Buatti. You are writing TO the identified recipient institution.
- This is a NEW email, not a reply to an existing thread.
- Never adopt the voice or perspective of any institution.
- Never address the person or office who referred Daniele elsewhere: this email goes to the new office only.

RULES:
1. Write in formal Italian.
2. You must ONLY use information explicitly present in the provided context, verified facts, and accepted research findings.
3. NEVER invent facts, dates, protocol numbers, names, addresses or promises. If unsure about a detail, omit it and mark it with [VERIFY].
4. PRESERVE EXACT MEANING: keep the source's exact wording for relationships and dates. "risulta già defunta il 4 ottobre 1952" means "was already deceased on 4 October 1952", NOT "died on 4 October 1952". Do not strengthen any claim.
5. Any detail listed under UNVERIFIED / UNCERTAIN must stay uncertain: say "secondo un ricordo di famiglia" (according to a family memory) or "probabilmente" and never assert a place or date that is not established.
6. Use only the verified contact details given in the REQUIRED RESPONSE block, exactly as written.
7. Include a formal greeting to the office, the body of the email, and a closing.
8. Be specific about what you are asking for, using the verified facts and the dates/places already established.
9. End with "Cordiali saluti" followed by Daniele Buatti's name and verified contact details.

OUTPUT: Return ONLY the draft email text, no commentary, no markdown.""" + (_drule_text if _drule_text else "")

    user_prompt = f"Draft a new email to {recipient}.\n\n{context_text}"

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

    # Post-generation validation (heuristic; the gate below is authoritative)
    unverified_flags = []
    draft_lower = draft_text.lower()
    if "è deceduta il" in draft_lower or "morì il" in draft_lower or "died on" in draft_lower:
        unverified_flags.append("Possible temporal conflation: source says 'already deceased by' but draft says 'died on'. Verify.")
    if "è morta a san benedetto" in draft_lower or "deceduta a san benedetto" in draft_lower or "morì a san benedetto" in draft_lower:
        unverified_flags.append("Draft may assert an unestablished place of death. Verify.")

    warnings = []
    if unverified_flags:
        warnings.append("Unverified content detected: " + "; ".join(unverified_flags))
    if gate_warnings:
        warnings.extend(gate_warnings)
    if email_warnings:
        warnings.extend(email_warnings)
    req_warnings = []
    for r_ in (req_provs or []):
        if r_.get("ambiguous"):
            req_warnings.append("Request %s is AMBIGUOUS — do not assume a single linkage." % r_["request_id"])
    if req_warnings:
        warnings.extend(req_warnings)

    verification = (gate.verify_draft(draft_text, draft_type="new_correspondence",
                                      language=target_lang, **gate_inputs)
                    if gate else {"readiness": "blocked", "findings": ["draft gate unavailable"]})
    _readiness = verification.get("readiness") or "blocked"
    try:
        legacy = legacy_verify_draft(
            draft_text=draft_text,
            draft_type="new_correspondence",
            recipient=recipient,
            recipient_email=recipient_email,
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
    except Exception as exc:  # noqa: BLE001
        warnings.append("Legacy verifier unavailable: %s" % exc)
    for f in verification.get("findings") or []:
        msg = "Draft gate: " + f
        if msg not in warnings:
            warnings.append(msg)

    reply_reason = ("New correspondence suggested: message %s recommends contacting %s to %s"
                    % (latest_inbound["id"] if latest_inbound else "n/a",
                       recipient, reason or "make the request described in the suggestion"))

    draft = {
        "thread_id": args.thread_id,
        "draft_type": "new_correspondence",
        "draft_text": draft_text,
        "language": target_lang,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "model": MODEL,
        "recipient": recipient,
        "recipient_office": recipient_office,
        "recipient_email": recipient_email,
        "recipient_email_source": (resolved or {}).get("established_by"),
        "subject_suggestion": _subject_suggestion(snc, recipient),
        "review_status": _readiness,
        "edited_text": None,
        "reviewed_at": None,
        "reply_reason": reply_reason,
        "readiness": _readiness,
        "verification": verification,
        "provenance": {
            "source_thread": args.thread_id,
            "source_messages": [m["id"] for m in msgs],
            "analysis_files": [f"message_{mid}.json" for mid in analyses],
            "verified_facts_used": verified_facts,
            "unverified_content_flagged": unverified_flags,
            "suggested_new_correspondence": snc,
            "request_links": [r_["request_id"] for r_ in (req_provs or [])],
            "attachment_gate": {
                "attachments_used": gate_provenance,
                "note": "Attachment text is machine-extracted (text layer or OCR) and unverified; "
                        "it does not establish that a research request was fulfilled.",
            },
            "drafting_inputs": {
                "intended_recipient": intended_recipient,
                "latest_inbound_message_id": (latest_inbound or {}).get("id"),
                "required_actions": required_actions,
                "verified_contact_details": contact_details,
                "prohibited_recipient_markers": prohibited_markers,
                "recipient_email_checks": email_warnings,
                "postal_address_rule": "verified from sent correspondence only; never invented",
            },
        },
        "warnings": warnings,
        "rules_applied": _applied_draft_rules if '_applied_draft_rules' in dir() else [],
    }

    os.makedirs(DRAFTS_DIR, exist_ok=True)
    _, dv = read_with_version(out_path) if os.path.exists(out_path) else (None, None)
    # Preserve Gmail metadata from any existing draft
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
    safe_write_json(out_path, draft, "script", dv, ["draft_text"], "New correspondence draft generated")
    return _out({"ok": True, "draft": draft})


if __name__ == "__main__":
    main()
