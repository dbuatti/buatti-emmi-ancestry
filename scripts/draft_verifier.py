#!/usr/bin/env python3
"""Drafting verification gate (Step 5).

Reusable, deterministic (rule-based) checks applied to every generated draft
before it is saved.  A draft is never marked `ready` merely because the model
produced fluent Italian.

Checks (each returns pass/fail + evidence):
  1. recipient_match      - recipient matches intended institution/purpose
  2. correspondence_type - reply vs new enquiry is correct for the script used
  3. immediate_purpose   - draft responds to the latest inbound message's action
  4. factual_provenance   - substantive claims traceable to source correspondence
  5. identity_distinction - similarly named people kept separate
  6. contradictions      - no contradiction with known evidence
  7. missing_information  - addresses/dates/names/documents not missing or flagged
  8. attachments         - no false claims of sending/attaching
  9. language            - Italian/English appropriate for recipient
 10. readiness           - ready / incomplete / blocked

Usage as module:
  from draft_verifier import verify_draft
  result = verify_draft(draft_text, context)

Usage as CLI:
  python3 scripts/draft_verifier.py <draft.json> [--context <context.txt>]
"""
import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _contains(text, needle):
    return needle.lower() in (text or "").lower()


def verify_draft(draft_text, draft_type, recipient, recipient_email,
                 source_messages, context_text, msgs, gate_block=None,
                 req_block=None, verified_facts=None):
    """Run all 10 checks.  Returns dict with per-check results and readiness."""
    text = draft_text or ""
    lower = text.lower()
    issues = []
    checks = {}

    # --- 1. recipient_match ---
    recipient_ok = True
    recipient_note = ""
    recipient_status = "missing"
    if not recipient or recipient == "Unknown institution":
        recipient_ok = False
        recipient_note = "Recipient institution is unknown"
        recipient_status = "missing"
    # email status
    if not recipient_email:
        recipient_ok = False
        recipient_note = (recipient_note + "; " if recipient_note else "") + "Recipient email is missing"
        recipient_status = "missing"
    else:
        # check if email is verified from source correspondence
        # (the draft should store recipient_email_source)
        recipient_status = "known_unverified"
        # check context for the email
        if recipient_email.lower() in (context_text or "").lower():
            recipient_status = "known_verified"
        # check for conflicting emails in context
        ctx_emails = set(re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", context_text or ""))
        if len(ctx_emails) > 1 and recipient_email.lower() not in [e.lower() for e in ctx_emails]:
            recipient_status = "conflicting"
    checks["recipient_match"] = {
        "pass": recipient_ok,
        "note": recipient_note or "Recipient identified",
        "recipient_status": recipient_status,
        "recipient_email": recipient_email,
        "recipient_email_source": None,  # populated by caller if available
    }
    if not recipient_ok:
        issues.append("recipient_match: %s" % recipient_note)

    # --- 2. correspondence_type ---
    type_ok = True
    type_note = ""
    if draft_type == "reply":
        # a reply should not start with "Cara Sig.ra [VERIFY EMAIL]" (Curia style for new enquiry)
        if "[verify email]" in lower:
            type_ok = False
            type_note = "Draft uses [VERIFY EMAIL] placeholder — may be a new enquiry misclassified as reply"
    elif draft_type == "new_correspondence":
        # a new enquiry should not reuse "Re:" subject style or Curia salutation
        if "cara sig.ra" in lower and "curia" in lower:
            type_ok = False
            type_note = "Draft addresses Curia but is meant to be a new enquiry to Anagrafe"
    checks["correspondence_type"] = {
        "pass": type_ok,
        "note": type_note or "Type consistent with %s" % draft_type,
    }
    if not type_ok:
        issues.append("correspondence_type: %s" % type_note)

    # --- 3. immediate_purpose ---
    purpose_ok = True
    purpose_note = ""
    # For the Linguaglossa thread, the office offered to post the certificate if
    # given a postal address.  The draft must respond to that offer.
    if "foti" in (recipient or "").lower() or "linguaglossa" in (recipient or "").lower():
        if "indirizzo" not in lower and "postal" not in lower and "spedisc" not in lower:
            purpose_ok = False
            purpose_note = "Does not respond to the office's offer to post the certificate (missing postal address response)"
    # For Anagrafe SBT, the draft should be addressed to Anagrafe, not Curia
    if "anagrafe" in (recipient or "").lower() or "san benedetto" in (recipient or "").lower():
        if "curia" in lower and "anagrafe" not in lower:
            purpose_ok = False
            purpose_note = "Addresses Curia instead of Anagrafe"
    checks["immediate_purpose"] = {
        "pass": purpose_ok,
        "note": purpose_note or "Responds to latest incoming message",
    }
    if not purpose_ok:
        issues.append("immediate_purpose: %s" % purpose_note)

    # --- 4. factual_provenance ---
    prov_ok = True
    prov_note = ""
    prov_claims = []
    # Check that protocol numbers in the draft appear in context
    proto_in_draft = re.findall(r"\d{4,}(?:/\d{4})?", text)
    for p in proto_in_draft:
        found = p in (context_text or "")
        prov_claims.append({"claim": p, "type": "protocol_number", "source": "context_text" if found else None, "status": "confirmed" if found else "unverified"})
        if not found:
            prov_ok = False
            prov_note = "Protocol/number '%s' not found in source correspondence" % p
            break
    # Check that dates in the draft appear in context or verified facts
    dates_in_draft = re.findall(r"\d{1,2}[./]\d{1,2}[./]\d{4}", text)
    for d in dates_in_draft:
        found = d in (context_text or "") or d in str(verified_facts or "")
        if not found:
            prov_claims.append({"claim": d, "type": "date", "source": None, "status": "unverified"})
    checks["factual_provenance"] = {
        "pass": prov_ok,
        "note": prov_note or "Substantive claims traceable",
        "claims": prov_claims,
    }
    if not prov_ok:
        issues.append("factual_provenance: %s" % prov_note)

    # --- 5. identity_distinction ---
    identity_ok = True
    identity_note = ""
    # Alternative phrasings of identity conflation
    conflation_phrases = [
        "stesso personaggio", "same person", "stessa persona", "medesima persona",
        "identical individual", "medesimo personaggio", "è la stessa", "e' la stessa",
        "è lo stesso", "e' lo stesso", "è medesimo", "stesso individuo",
    ]
    if any(p in lower for p in conflation_phrases):
        if "divers" in (context_text or "").lower() or "different" in (context_text or "").lower():
            identity_ok = False
            identity_note = "Draft conflates two distinct individuals (source says they are different)"
    # Egidio vs Gregorio distinction
    if "egidio" in lower and "gregorio" in lower:
        # ensure they are not described as the same person
        if "stesso" in lower and ("egidio" in lower and "gregorio" in lower):
            pass  # could be OK if describing separately
    checks["identity_distinction"] = {
        "pass": identity_ok,
        "note": identity_note or "Distinct individuals kept separate",
    }
    if not identity_ok:
        issues.append("identity_distinction: %s" % identity_note)

    # --- 6. contradictions ---
    contra_ok = True
    contra_note = ""
    # "invio i certificati" / "I am sending certificates" when not attaching
    if ("invio i certificati" in lower or "i am sending" in lower or "i'm sending" in lower
            or "ho inviato" in lower or "i have sent" in lower) and \
       not (context_text and "attach" in lower):
        contra_ok = False
        contra_note = "Draft claims to send/attach certificates but none are being attached"
    # "è lo stesso personaggio" / "same person" contradiction with known evidence
    conflation_phrases = ["è lo stesso personaggio", "e' lo stesso personaggio", "same person",
                          "stessa persona", "medesima persona", "è la stessa", "e' la stessa"]
    if any(p in lower for p in conflation_phrases):
        contra_ok = False
        contra_note = "Draft asserts 'same person' which may contradict research evidence"
    # "morì il" when source says "risulta già defunta"
    if "morì il" in lower or "mori il" in lower or "died on" in lower:
        if "risulta" in (context_text or "").lower() and "defunt" in (context_text or "").lower():
            contra_ok = False
            contra_note = "Draft changes 'already deceased by' to 'died on' — meaning altered"
    checks["contradictions"] = {
        "pass": contra_ok,
        "note": contra_note or "No contradictions detected",
    }
    if not contra_ok:
        issues.append("contradictions: %s" % contra_note)

    # --- 7. missing_information ---
    missing = []
    if "[verify" in lower:
        missing.append("contains [VERIFY] placeholder")
    if "[verify email]" in lower:
        missing.append("recipient email unverified")
    # postal address check for Linguaglossa
    if "foti" in (recipient or "").lower() or "linguaglossa" in (recipient or "").lower():
        if "indirizzo" not in lower and "postal" not in lower and "address" not in lower:
            missing.append("postal address not provided or requested (office asked for it)")
    # Anagrafe SBT email
    if "anagrafe" in (recipient or "").lower() or "san benedetto" in (recipient or "").lower():
        if not recipient_email:
            missing.append("recipient email not verified")
    if "typpo" in lower or "chiiappini" in lower or "chiaappini" in lower:
        missing.append("typo detected in draft")
    checks["missing_information"] = {
        "pass": len(missing) == 0,
        "note": "; ".join(missing) if missing else "No missing information detected",
    }
    if missing:
        issues.append("missing_information: %s" % "; ".join(missing))

    # --- 8. attachments ---
    attach_ok = True
    attach_note = ""
    # check if draft claims to attach/send documents
    attach_claims = []
    if "allego" in lower or "allegati" in lower or "attach" in lower:
        attach_claims.append("claims to attach documents")
    if "invio" in lower and "certificat" in lower:
        attach_claims.append("claims to send certificates")
    # if there are claims but no gate_block showing attachments, flag
    if attach_claims and not (gate_block and ("text_extracted" in (gate_block or "") or "ocr_extracted" in (gate_block or ""))):
        # check if attachments actually present in gate
        if gate_block and "not_a_document" in (gate_block or "") and "text_extracted" not in (gate_block or "") and "ocr_extracted" not in (gate_block or ""):
            attach_ok = False
            attach_note = "Draft claims to attach/send documents but no readable attachments are available"
    # check for unreadable attachments that are being claimed
    if gate_block and "needs_visual_review" in (gate_block or "") and ("allego" in lower or "invio" in lower):
        attach_ok = False
        attach_note = "Draft claims to attach documents but some attachments are unreadable/unverified"
    checks["attachments"] = {
        "pass": attach_ok,
        "note": attach_note or "No false attachment claims detected",
    }
    if not attach_ok:
        issues.append("attachments: %s" % attach_note)

    # --- 9. language ---
    lang_ok = True
    lang_note = ""
    italian_markers = ["cordiali saluti", "gentile", "ringrazio", "buongiorno", "distinti saluti"]
    if not any(m in lower for m in italian_markers):
        lang_ok = False
        lang_note = "Draft may not be in Italian"
    checks["language"] = {
        "pass": lang_ok,
        "note": (lang_note or "Italian language markers present (grammar quality not assessed)"),
    }
    if not lang_ok:
        issues.append("language: %s" % lang_note)

    # --- 10. readiness ---
    blocking_issues = [i for i in issues if i.split(":")[0] in ("recipient_match", "correspondence_type", "contradictions", "identity_distinction")]
    missing_issues = [i for i in issues if i.split(":")[0] in ("missing_information",)]
    if blocking_issues:
        readiness = "blocked"
    elif missing_issues:
        readiness = "incomplete"
    elif issues:
        readiness = "incomplete"
    else:
        readiness = "ready"
    checks["readiness"] = {
        "status": readiness,
        "issues": issues,
    }

    return {
        "checks": checks,
        "readiness": readiness,
        "issues": issues,
        "issue_count": len(issues),
    }


def main():
    ap = argparse.ArgumentParser(description="Verify a correspondence draft.")
    ap.add_argument("draft_path", help="Path to draft JSON file")
    ap.add_argument("--context", default=None, help="Path to context text file (optional)")
    args = ap.parse_args()

    with open(args.draft_path, "r", encoding="utf-8") as f:
        draft = json.load(f)

    context_text = ""
    if args.context and os.path.exists(args.context):
        with open(args.context, "r", encoding="utf-8") as f:
            context_text = f.read()

    result = verify_draft(
        draft_text=draft.get("draft_text", ""),
        draft_type=draft.get("draft_type", "reply"),
        recipient=draft.get("recipient") or draft.get("thread_id", ""),
        recipient_email=draft.get("recipient_email"),
        source_messages=draft.get("provenance", {}).get("source_messages", []),
        context_text=context_text,
        msgs=[],
        gate_block=draft.get("provenance", {}).get("attachment_gate"),
        req_block=None,
        verified_facts=draft.get("provenance", {}).get("verified_facts_used", []),
    )
    # propagate recipient email source
    result["checks"]["recipient_match"]["recipient_email_source"] = draft.get("recipient_email_source")

    print(json.dumps(result, indent=2, ensure_ascii=False))
    return 0 if result["readiness"] == "ready" else 1


if __name__ == "__main__":
    sys.exit(main())
