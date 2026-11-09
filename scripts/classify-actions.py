#!/usr/bin/env python3
"""
Phase 1: Action intelligence for correspondence.

Reads analysis JSONs + DB + threads.json, classifies each definite/possible
message/thread into one of:
  - reply_required: inbound message asking a question/request directed at me
  - action_required: I need to do something (pay, send, contact)
  - awaiting_response: outbound request with no inbound reply yet
  - follow_up_due: outbound request older than stated timeframe with no response
  - documents_received: documents arrived on an unanswered inbound message
                        (receipt only — fulfilment stays unverified)
  - resolved: evidence of document delivery or explicit resolution

Stores results in correspondence/extracted/actions.json (sidecar, no schema change).
Every classification includes supporting evidence, confidence (confirmed/inferred),
and the relevant date, institution, subject.

No family-tree changes. No Gmail imports. No commits.
"""
import json, os, re, sqlite3, datetime, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")
ANALYSIS_DIR = os.path.join(ROOT, "correspondence", "extracted", "analysis")
THREADS_PATH = os.path.join(ROOT, "correspondence", "extracted", "threads.json")
OUT = os.path.join(ROOT, "correspondence", "extracted", "actions.json")
GATE_PATH = os.path.join(ROOT, "correspondence", "extracted", "attachment-gate.json")

conn = sqlite3.connect("file:%s?mode=ro" % DB_PATH, uri=True)
conn.row_factory = sqlite3.Row
analyses = {}
for p in os.listdir(ANALYSIS_DIR):
    m = re.match(r"message_(\d+)\.json", p)
    if m: analyses[int(m.group(1))] = json.load(open(os.path.join(ANALYSIS_DIR, p)))
threads_data = json.load(open(THREADS_PATH))


def load_attachment_gate():
    """Attachment gate records (scripts/attachment-gate.py). Empty if never run."""
    try:
        with open(GATE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {"messages": {}}
    except (OSError, ValueError):
        return {"messages": {}}


# --- attachment gate integration (scripts/attachment-gate.py) --------------
GATE_DOCUMENT_KINDS = ("document", "image")
GATE_READABLE = {"text_extracted", "ocr_extracted"}

AUXILIARY_EXTS = {".p7s", ".xml", ".eml", ".ics", ".vcf", ".sig", ".p7m"}
AUXILIARY_PREFIXES = ("daticert", "segnatura", "postacert", "smime",
                      "ricevuta", "riepilogo_mail")


def looks_like_document(filename, mime_type):
    """Mirror of attachment-gate.classify_kind, for gate records that do not exist yet.

    Without this, every PEC envelope (daticert.xml, smime.p7s, postacert.eml)
    would look like an unread document and drown the real findings.
    """
    base = os.path.basename((filename or "").lower())
    if base.startswith(AUXILIARY_PREFIXES):
        return False
    if os.path.splitext(base)[1] in AUXILIARY_EXTS:
        return False
    m = (mime_type or "").lower()
    if "pkcs7" in m or m in ("application/xml", "text/xml") or m.endswith("/xml"):
        return False
    return True


def trailing_inbound_window(msgs_sorted):
    """Inbound messages that arrived after the last outbound message.

    These are the messages nobody has answered yet. A document sitting in this
    window is exactly what makes "awaiting response" wrong — it was the D13
    regression that treated delivered death acts as still outstanding.
    """
    last_out = -1
    for i, m in enumerate(msgs_sorted):
        if m["direction"] == "out":
            last_out = i
    return msgs_sorted[last_out + 1:]


def thread_attachment_gate(gate, msgs_sorted):
    """Gate summary for one thread's unanswered inbound window.

    Returns a dict even when there is nothing to report, so downstream stages
    can always distinguish "no attachments" from "attachments nobody read".
    Never says whether the documents fulfil the request: `fulfilment` stays
    `unverified` until a human decides.
    """
    window = trailing_inbound_window(msgs_sorted)
    window_ids = [m["id"] for m in window]
    gated = gate.get("messages") or {}
    entries = [gated[str(i)] for i in window_ids if str(i) in gated]

    docs = []
    for e in entries:
        for a in e.get("attachments") or []:
            if a.get("kind") in GATE_DOCUMENT_KINDS and a.get("status") != "duplicate":
                docs.append(a)

    # Safety net: a document-looking attachment on an unanswered inbound message
    # that the gate has never looked at must never be invisible to classification.
    ungated = []
    if window_ids:
        placeholders = ",".join("?" * len(window_ids))
        rows = conn.execute(
            "SELECT DISTINCT message_id, filename, mime_type FROM attachments "
            "WHERE message_id IN (%s)" % placeholders,
            window_ids,
        ).fetchall()
        ungated = sorted({
            r["message_id"] for r in rows
            if looks_like_document(r["filename"], r["mime_type"])
        } - {e.get("message_id") for e in entries})

    readable = [a for a in docs if a.get("status") in GATE_READABLE]
    return {
        "window_message_ids": window_ids,
        "gated_message_ids": [e.get("message_id") for e in entries],
        "gate_statuses": {str(e.get("message_id")): e.get("gate_status") for e in entries},
        "documents_received": bool(docs),
        "document_count": len(docs),
        "readable_documents": [
            {"attachment_id": a.get("attachment_id"), "filename": a.get("filename"),
             "status": a.get("status"), "text_path": a.get("text_path")}
            for a in readable
        ],
        "unreadable_documents": [
            {"attachment_id": a.get("attachment_id"), "filename": a.get("filename"),
             "status": a.get("status"), "confidence": a.get("confidence")}
            for a in docs if a.get("status") not in GATE_READABLE
        ],
        "blocks_no_action": any(e.get("blocks_no_action") for e in entries),
        "requires_human_review": any(e.get("requires_human_review") for e in entries) or bool(ungated),
        "ungated_message_ids": ungated,
        "fulfilment": "unverified",
        "extraction_unverified": True,
    }


def apply_attachment_gate(classification, gate_info):
    """Let received documents correct the classification. Never infers fulfilment.

    * documents in the unanswered inbound window beat "awaiting_response"
      / "follow_up_due" / "uncertain" -> `documents_received`
    * "resolved" backed only by keyword evidence is downgraded to
      `documents_received` when the documents could not be read
    * reply_required / action_required are kept (the institution still wants
      something) but annotated with what was received
    """
    classification["attachment_gate"] = gate_info
    if not (gate_info["documents_received"] or gate_info["ungated_message_ids"]):
        return classification

    cls = classification["classification"]
    blocking = bool(gate_info.get("blocks_no_action"))

    if gate_info["ungated_message_ids"] and not gate_info["documents_received"]:
        what = ("attachment(s) on message %s have not been read yet "
                "(attachment gate not run for them)"
                % ", ".join(str(i) for i in gate_info["ungated_message_ids"]))
        confidence = "inferred"
    else:
        what = ("%d document(s) received on message %s"
                % (gate_info["document_count"],
                   ", ".join(str(i) for i in gate_info["gated_message_ids"])))
        confidence = "confirmed"
    if blocking:
        what += ("; the attached document could not be read reliably, "
                 "so its contents are unverified")

    downgrade_resolved = cls == "resolved" and blocking
    if cls in ("awaiting_response", "follow_up_due", "uncertain") or downgrade_resolved:
        classification["previous_classification"] = cls
        classification["classification"] = "documents_received"
        classification["confidence"] = confidence
        classification["document_receipt"] = "documents_present"
        classification["fulfilment"] = "unverified"
        classification["reasoning"] = (
            "%s. Delivery receipt is not the same as fulfilling the research "
            "request: fulfilment stays unverified until reviewed."
            % what
        )
        first = (gate_info["gated_message_ids"] or gate_info["ungated_message_ids"] or [None])[0]
        if first is not None:
            classification["evidence"] = [{
                "msg_id": first,
                "quote": what,
                "direction": "in",
            }]
        return classification

    # reply_required / action_required / readable "resolved": keep the action,
    # record what arrived.
    classification["document_receipt"] = "documents_present"
    classification["fulfilment"] = "unverified"
    classification["reasoning"] = (classification.get("reasoning") or "") + (
        " Also: %s." % what)
    return classification


def classify_thread(thread_id, gmail_thread_id, msgs, thread_info):
    """Classify a thread's current action state. Returns dict with status, evidence, confidence."""
    if not msgs:
        return None
    msgs_sorted = sorted(msgs, key=lambda m: m["received_at"] or m["sent_at"] or "")
    last = msgs_sorted[-1]
    last_date = last["received_at"] or last["sent_at"] or ""
    direction_last = last["direction"]

    # Collect all analysis data from messages in this thread, separated by direction
    all_actions_requested = []  # what I asked the institution (outgoing)
    all_outstanding = []  # what remains unresolved (both directions)
    all_actions_promised = []  # what the institution promised
    all_uncertainties = []
    outgoing_requests = []  # what I asked
    incoming_responses = []  # what the institution answered
    incoming_requests = []  # what the institution asks me to do
    for m in msgs_sorted:
        a = analyses.get(m["id"], {})
        acts_req = a.get("actions_requested") or []
        outs = a.get("outstanding_questions") or []
        acts_prom = a.get("actions_promised") or []
        uncs = a.get("uncertainties") or []
        all_actions_requested.extend(acts_req)
        all_outstanding.extend(outs)
        all_actions_promised.extend(acts_prom)
        all_uncertainties.extend(uncs)
        if m["direction"] == "out":
            for ar in acts_req:
                outgoing_requests.append({"msg_id": m["id"], "text": ar.get("value") if isinstance(ar, dict) else str(ar)})
            for oq in outs:
                outgoing_requests.append({"msg_id": m["id"], "text": (oq.get("value") if isinstance(oq, dict) else str(oq)) + " (outstanding)"})
        else:
            for ar in acts_req:
                incoming_requests.append({"msg_id": m["id"], "text": ar.get("value") if isinstance(ar, dict) else str(ar)})
            for oq in outs:
                incoming_responses.append({"msg_id": m["id"], "text": (oq.get("value") if isinstance(oq, dict) else str(oq))})

    # Check for document delivery evidence in any message body
    delivery_evidence = None
    for m in msgs_sorted:
        # Only inbound messages can contain document delivery (from the institution)
        if m["direction"] != "in":
            continue
        body = (m["body_text"] or "").lower()
        for kw in ["si trasmettono", "si trasmette", "trasmetto", "trasmesso", "trasmessa",
                   "ho ricevuto", "ricevuto in maniera regolare",
                   "copia integrale trasmessa", "allegato il certificato",
                   "allegato l'atto", "allegati gli atti",
                   "le invio il certificato", "invio il certificato", "certificato richiesto",
                   "le invio", "invio i certificati", "invio il documento"]:
            if kw in body:
                delivery_evidence = {"msg_id": m["id"], "keyword": kw,
                                    "snippet": body[max(0, body.find(kw)-80):body.find(kw)+120].strip()}
                break
        if delivery_evidence:
            break

    # Check for sollecito (follow-up) messages
    solleciti = [m for m in msgs_sorted if "sollecito" in (m["subject"] or "").lower()]
    has_sollecito = len(solleciti) > 0
    last_sollecito_date = solleciti[-1]["received_at"] or solleciti[-1]["sent_at"] if solleciti else None

    # Determine stated processing timeframe from analysis
    stated_timeframe = None
    for m in msgs_sorted:
        a = analyses.get(m["id"], {})
        for u in (a.get("uncertainties") or []):
            txt = (u.get("issue", "") if isinstance(u, dict) else str(u)).lower()
            if "giorni" in txt or "days" in txt or "settimane" in txt or "weeks" in txt:
                stated_timeframe = u.get("issue") if isinstance(u, dict) else str(u)
                break

    # Classification logic
    result = {
        "thread_id": gmail_thread_id,
        "db_thread_id": thread_id,
        "account_email": msgs_sorted[0]["account_email"],
        "subject": msgs_sorted[-1]["subject"] or msgs_sorted[0]["subject"],
        "institution": thread_info.get("institution"),
        "institution_confidence": thread_info.get("institution_confidence"),
        "last_activity": last_date,
        "message_count": len(msgs_sorted),
        "message_ids": [m["id"] for m in msgs_sorted],
        "classification": None,  # to be set
        "thread_state": None,  # supplemented state (not a new classification)
        "unresolved_research_questions": [],  # preserved even when declined/redirected
        "confidence": "inferred",  # confirmed or inferred
        "evidence": [],
        "reasoning": "",
        "actions_requested": [a.get("value") if isinstance(a, dict) else a for a in all_actions_requested],
        "outstanding_questions": [q.get("value") if isinstance(q, dict) else q for q in all_outstanding],
        "promised": [p.get("value") if isinstance(p, dict) else p for p in all_actions_promised],
        "outgoing_requests": outgoing_requests,
        "incoming_responses": incoming_responses,
        "incoming_requests": incoming_requests,
        "person_names": thread_info.get("person_names", []) if thread_info else [],
        "record_refs": thread_info.get("record_refs", []) if thread_info else [],
    }

    # Rule 1: If last message is inbound and delivers a document -> resolved
    if direction_last == "in" and delivery_evidence:
        result["classification"] = "resolved"
        result["confidence"] = "confirmed"
        result["thread_state"] = "supplied"
        result["unresolved_research_questions"] = [q.get("value") if isinstance(q, dict) else str(q) for q in all_outstanding]
        result["reasoning"] = "Inbound message contains document delivery evidence ('%s')." % delivery_evidence["keyword"]
        result["evidence"].append({"msg_id": delivery_evidence["msg_id"], "quote": delivery_evidence["snippet"], "direction": "in"})
        return result

    # Rule 2: If last message is inbound and is a PEC receipt/acknowledgement (not document delivery)
    if direction_last == "in":
        last_subj = (last["subject"] or "").lower()
        last_from = (last["from_email"] or "").lower()
        is_automated = any(k in last_from for k in ["posta-certificata", "mailer-daemon", "mail delivery", "no-reply", "noreply", "notifications@", "messaging@"])
        is_receipt = any(k in last_subj for k in ["ricevuta", "conferma di ricezione", "notifica avvenuta", "avvenuta protocollazione", "avvenuta registrazione", "delivery status notification"])
        if is_automated or is_receipt:
            # PEC receipt / automated notification is NOT proof of document delivery
            if delivery_evidence:
                result["classification"] = "resolved"
                result["confidence"] = "confirmed"
                result["thread_state"] = "supplied"
                result["unresolved_research_questions"] = [q.get("value") if isinstance(q, dict) else str(q) for q in all_outstanding]
                result["reasoning"] = "Document delivery evidenced (not just a receipt)."
                result["evidence"].append({"msg_id": delivery_evidence["msg_id"], "quote": delivery_evidence["snippet"], "direction": "in"})
                return result
            else:
                result["classification"] = "awaiting_response"
                result["confidence"] = "inferred"
                result["thread_state"] = "acknowledged"
                result["reasoning"] = "PEC acknowledgement/receipt or automated notification received, but no evidence of document delivery. Awaiting actual document."
                result["evidence"].append({"msg_id": last["id"], "quote": (last["snippet"] or "")[:200], "direction": "in"})
                return result

    # Rule 3: If last message is inbound and contains a question/request directed at me
    # (only if it's NOT an automated notification/receipt)
    last_from = (last["from_email"] or "").lower()
    is_automated = any(k in last_from for k in ["posta-certificata", "mailer-daemon", "mail delivery", "no-reply", "noreply", "notifications@", "messaging@", "pec.aruba", "legalmail", "postecert"])
    # Check if the inbound message refers Daniele to another institution
    last_body = (last["body_text"] or "").lower()
    is_referral = any(k in last_body for k in ["rivolgersi a", "rivolgersi all", "contattare l'ufficio", "contattare l\'ufficio",
                                                "ufficio anagrafe", "registro civile", "ufficio dello stato civile",
                                                "consiglio di rivolgersi", "le consiglio"])
    # Decline: institution says it cannot fulfil the request
    is_decline = any(k in last_body for k in ["non è possibile", "non siamo abilitati", "non siamo autorizzati",
                                               "impossibilità", "interdizione", "non possiamo", "non è in grado",
                                               "non possiamo evadere", "impossibile evadere", "non siamo in grado",
                                               "perfettamente a conoscenza dell'interdizione"])
    # Supply: institution says it is sending/providing the document
    is_supply = any(k in last_body for k in ["le invio il certificato", "invio il certificato", "certificato richiesto",
                                              "le invio", "trasmetto", "si trasmette", "si trasmettono",
                                              "allegato il certificato", "allegato l'atto", "allegati gli atti",
                                              "le invio i certificati", "invio i certificati"])
    if direction_last == "in" and not is_automated and (all_outstanding or all_actions_requested) and not is_referral and not is_decline and not is_supply:
        # Check if it's a question (needs reply) vs action (needs action)
        has_question = len(all_outstanding) > 0
        has_action = len(all_actions_requested) > 0
        if has_question and not has_action:
            result["classification"] = "reply_required"
        elif has_action and not has_question:
            result["classification"] = "action_required"
        else:
            result["classification"] = "reply_required"  # default to reply if both
        result["confidence"] = "inferred"
        result["reasoning"] = "Inbound message contains %d outstanding question(s) and %d action request(s)." % (len(all_outstanding), len(all_actions_requested))
        result["thread_state"] = "needs_reply" if has_question else "needs_action"
        result["unresolved_research_questions"] = [q.get("value") if isinstance(q, dict) else str(q) for q in all_outstanding]
        def _val(x):
            v = x.get("value", "") if isinstance(x, dict) else str(x)
            ev = x.get("evidence", "") if isinstance(x, dict) else ""
            return v, ev
        if incoming_requests:
            # Evidence from the inbound message that contains the request
            src = incoming_requests[0]
            quote = (msgs_sorted[-1].get("snippet") or "")[:200]
            for m in msgs_sorted:
                if m["id"] == src["msg_id"]:
                    quote = (m.get("snippet") or "")[:200]
                    break
            result["evidence"].append({"msg_id": src["msg_id"], "quote": quote, "direction": "in"})
        elif all_outstanding:
            # Find the message that contains the outstanding question
            src_msg_id = msgs_sorted[-1]["id"]
            for oq in all_outstanding:
                if isinstance(oq, dict) and oq.get("evidence"):
                    for m in msgs_sorted:
                        if m["id"] == msgs_sorted[-1]["id"]:
                            src_msg_id = m["id"]
                            break
            quote = (msgs_sorted[-1].get("snippet") or "")[:200]
            result["evidence"].append({"msg_id": src_msg_id, "quote": quote, "direction": "in"})
        return result

    # Rule 3c: If last message is inbound and the institution declined the request
    if direction_last == "in" and not is_automated and is_decline:
        result["classification"] = "resolved"
        result["confidence"] = "confirmed"
        result["reasoning"] = "Institution declined the request: '%s'." % [k for k in ["non è possibile", "non siamo abilitati", "non siamo autorizzati", "impossibilità", "interdizione", "non possiamo", "non è in grado", "non possiamo evadere", "impossibile evadere", "non siamo in grado", "perfettamente a conoscenza dell'interdizione"] if k in last_body][0]
        result["evidence"].append({"msg_id": last["id"], "quote": (last.get("snippet") or "")[:200], "direction": "in"})
        # Preserve outstanding questions as unresolved research questions (not reply requirements)
        result["unresolved_research_questions"] = [q.get("value") if isinstance(q, dict) else str(q) for q in all_outstanding]
        # Preserve thread_state
        result["thread_state"] = "declined"
        return result

    # Rule 3d: If last message is inbound and the institution supplied the document
    if direction_last == "in" and not is_automated and is_supply:
        result["classification"] = "resolved"
        result["confidence"] = "confirmed"
        result["reasoning"] = "Institution supplied the requested document."
        result["evidence"].append({"msg_id": last["id"], "quote": (last.get("snippet") or "")[:200], "direction": "in"})
        result["unresolved_research_questions"] = [q.get("value") if isinstance(q, dict) else str(q) for q in all_outstanding]
        result["thread_state"] = "supplied"
        return result

    # Rule 3b: If last message is inbound and refers to another institution
    if direction_last == "in" and not is_automated and is_referral:
        # Extract the referral quote from the inbound message body
        referral_quote = ""
        for kw in ["rivolgersi", "consiglio di rivolgersi", "contattare l'ufficio", "ufficio anagrafe"]:
            idx = last_body.find(kw)
            if idx >= 0:
                start = max(0, idx - 60)
                end = min(len(last_body), idx + 120)
                referral_quote = last_body[start:end].strip()
                break
        if not referral_quote:
            referral_quote = (last.get("snippet") or "")[:200]
        result["classification"] = "action_required"
        result["confidence"] = "inferred"
        result["thread_state"] = "redirected"
        result["reasoning"] = "Institution refers to another office. Action required: contact the recommended institution."
        result["evidence"].append({"msg_id": last["id"], "quote": referral_quote, "direction": "in"})
        # Apply deterministic rules
        try:
            checks = get_deterministic_checks(stage="classification")
            for rid, pattern, correction in checks:
                if pattern.lower() in (result["classification"] or "").lower():
                    result["reasoning"] += f" [Rule {rid}: {correction}]"
        except Exception:
            pass
        return result

    # Rule 4: If last message is outbound (I sent something)
    if direction_last == "out":
        # Check if any earlier inbound message contains substantive document delivery
        # (even though the last message is outbound, e.g. a thank-you)
        earlier_delivery = None
        for m in msgs_sorted:
            if m["direction"] != "in":
                continue
            if m["id"] == last["id"]:
                continue  # skip if somehow last is inbound (shouldn't happen here)
            body = (m["body_text"] or "").lower()
            for kw in ["si trasmettono", "si trasmette", "trasmetto", "trasmesso", "trasmessa",
                       "copia integrale trasmessa", "allegato il certificato",
                       "allegato l'atto", "allegati gli atti",
                       "invio la copia", "invio copia", "trasmetto in allegato"]:
                if kw in body:
                    # Verify it's NOT a PEC receipt/automated notification
                    from_email = (m.get("from_email") or "").lower()
                    is_automated = any(k in from_email for k in ["posta-certificata", "mailer-daemon", "mail delivery", "no-reply", "noreply", "notifications@", "messaging@", "pec.aruba", "legalmail", "postecert"])
                    is_receipt = any(k in (m.get("subject") or "").lower() for k in ["ricevuta", "conferma di ricezione", "notifica avvenuta", "avvenuta protocollazione"])
                    if not is_automated and not is_receipt:
                        earlier_delivery = {"msg_id": m["id"], "keyword": kw,
                                           "snippet": body[max(0, body.find(kw)-80):body.find(kw)+120].strip()}
                        break
            if earlier_delivery:
                break

        if earlier_delivery:
            # Determine if delivery is full or partial
            # Check if all outstanding requests are mentioned in the delivery
            delivery_text = earlier_delivery["snippet"].lower()
            outstanding_items = [q.get("value") if isinstance(q, dict) else str(q) for q in all_outstanding]
            requested_items = [a.get("value") if isinstance(a, dict) else str(a) for a in all_actions_requested]
            all_items = outstanding_items + requested_items

            # Simple heuristic: if there are no outstanding items, it's full delivery
            # If there are outstanding items, check if delivery mentions them
            if not all_items:
                # No specific items tracked — treat as full delivery
                result["classification"] = "resolved"
                result["confidence"] = "confirmed"
                result["reasoning"] = "Substantive document delivery found in earlier inbound message (msg %d), followed by outbound acknowledgement. Delivery fulfils the request." % earlier_delivery["msg_id"]
                result["evidence"].append({"msg_id": earlier_delivery["msg_id"], "quote": earlier_delivery["snippet"], "direction": "in"})
                return result

            # Check for explicit partial-delivery indicators
            partial_indicators = ["non è disponibile", "non disponibile", "non trovato", "non trovata",
                                 "not available", "not found", "non è stato possibile",
                                 "non siamo in grado", "mancante", "mancanti"]
            is_partial = any(ind in delivery_text for ind in partial_indicators)

            if is_partial:
                result["classification"] = "awaiting_response"
                result["confidence"] = "inferred"
                result["thread_state"] = "partially_supplied"
                result["reasoning"] = "Partial document delivery found in earlier inbound message (msg %d). Some requested items remain outstanding." % earlier_delivery["msg_id"]
                result["evidence"].append({"msg_id": earlier_delivery["msg_id"], "quote": earlier_delivery["snippet"], "direction": "in"})
                if all_items:
                    result["evidence"].append({"msg_id": last["id"], "quote": "Remaining outstanding: " + "; ".join(all_items[:5]), "direction": "out"})
                return result
            else:
                # Full delivery — no partial indicators found
                result["classification"] = "resolved"
                result["confidence"] = "confirmed"
                result["reasoning"] = "Substantive document delivery found in earlier inbound message (msg %d), followed by outbound acknowledgement. Delivery fulfils the request." % earlier_delivery["msg_id"]
                result["evidence"].append({"msg_id": earlier_delivery["msg_id"], "quote": earlier_delivery["snippet"], "direction": "in"})
                return result
        # Check if a follow-up is potentially due
        # Use tiered approach: no blanket 30-day rule
        try:
            last_dt = datetime.datetime.fromisoformat(last_date.replace("Z", "+00:00"))
            now = datetime.datetime.now(datetime.timezone.utc)
            days_since = (now - last_dt).days
        except (ValueError, TypeError):
            days_since = 0

        if has_sollecito:
            # Already sent a follow-up; check if it's been a while
            if days_since > 14:
                result["classification"] = "follow_up_due"
                result["confidence"] = "inferred"
                result["reasoning"] = "Previous follow-up sent %d days ago, no response received." % days_since
            else:
                result["classification"] = "awaiting_response"
                result["confidence"] = "inferred"
                result["reasoning"] = "Follow-up sent %d days ago, awaiting response." % days_since
        else:
            # No follow-up sent yet
            if days_since > 21:
                result["classification"] = "follow_up_due"
                result["confidence"] = "inferred"
                result["reasoning"] = "Request sent %d days ago with no response. Consider sending a follow-up." % days_since
            else:
                result["classification"] = "awaiting_response"
                result["confidence"] = "inferred"
                result["reasoning"] = "Request sent %d days ago, awaiting response." % days_since
        result["evidence"].append({"msg_id": last["id"], "quote": (last["snippet"] or "")[:200], "direction": "out"})
        if result["thread_state"] is None:
            result["thread_state"] = result["classification"]
        return result

    # Fallback
    result["classification"] = "uncertain"
    result["confidence"] = "inferred"
    result["thread_state"] = "uncertain"
    result["reasoning"] = "Could not determine action state from available evidence."
    return result


# Load threads.json for person_names lookup
_THREADS_FOR_RELATED = None
def _load_threads_for_related():
    global _THREADS_FOR_RELATED
    if _THREADS_FOR_RELATED is None:
        try:
            import json as _j
            _THREADS_FOR_RELATED = _j.load(open(os.path.join(ROOT, "correspondence", "extracted", "threads.json"))).get("threads", {})
        except Exception:
            _THREADS_FOR_RELATED = {}
    return _THREADS_FOR_RELATED

def find_related_threads(gmail_thread_id, person_names, record_refs, institution, all_actions):
    """Find threads related to the given thread by person, record, or institution.

    Returns list of related thread dicts with relationship type and evidence.
    Conservative: only matches on exact person names or record refs, not surnames.
    """
    threads_data = {}
    try:
        import json as _j
        threads_data = _j.load(open(os.path.join(ROOT, "correspondence", "extracted", "threads.json"))).get("threads", {})
    except Exception:
        pass

    related = []
    norm_persons = set()
    for pn in (person_names or []):
        if isinstance(pn, str):
            norm_persons.add(pn.lower().strip())
        elif isinstance(pn, dict):
            norm_persons.add((pn.get("name") or "").lower().strip())

    for other_tid, other_act in all_actions.items():
        if other_tid == gmail_thread_id:
            continue

        other_persons = set()
        for pn in (other_act.get("person_names") or []):
            if isinstance(pn, str):
                other_persons.add(pn.lower().strip())
        if not other_persons:
            other_thread = threads_data.get(other_tid, {})
            for pn in (other_thread.get("person_names") or []):
                if isinstance(pn, str):
                    other_persons.add(pn.lower().strip())

        person_overlap = norm_persons & other_persons if norm_persons and other_persons else set()

        other_records = set(other_act.get("record_refs") or [])
        if not other_records:
            other_thread = threads_data.get(other_tid, {})
            other_records = set(other_thread.get("record_refs") or [])
        this_records = set(record_refs or [])
        record_overlap = this_records & other_records if this_records and other_records else set()

        if person_overlap or record_overlap:
            other_status = other_act.get("classification", "")
            is_awaiting = other_status in ("awaiting_response", "action_required")
            other_subj = other_act.get("subject", "") or ""
            related.append({
                "thread_id": other_tid,
                "subject": other_subj,
                "relationship": "same_person" if person_overlap else "same_record",
                "matched_persons": list(person_overlap),
                "matched_records": list(record_overlap),
                "other_classification": other_status,
                "other_institution": other_act.get("institution"),
                "is_awaiting_response": is_awaiting,
                "evidence": "Shared person(s): " + ", ".join(person_overlap) if person_overlap else "Shared record(s): " + ", ".join(record_overlap),
            })

    # Conservative: prefer threads sharing the most specific (least common) person name
    # Filter out threads that only match on very common family names (Lilia, Remo)
    # unless they also match on the primary subject
    common_names = {"lilia chiappini", "chiappini lilia", "remo chiappini", "chiappini remo"}
    filtered = []
    for r in related:
        matched = set(p.lower() for p in r["matched_persons"])
        # If the match is ONLY on common names, skip it
        if matched and matched.issubset(common_names):
            continue
        filtered.append(r)
    # If filtering removed everything, fall back to all
    if not filtered:
        filtered = related
    filtered.sort(key=lambda r: (not r["is_awaiting_response"], 0 if (r.get("other_institution") or "").lower().find("comune") >= 0 else 1, 0 if "morte" in (r.get("subject") or "").lower() or "death" in (r.get("subject") or "").lower() else 1, -len(r["matched_persons"]), r["thread_id"]))
    return filtered


def merge_preserved_fields(new_classification, existing_action):
    """Merge a new classification with preserved human-confirmed fields.

    Human-confirmed fields are never overwritten by automated classification.
    Preserved fields: recommended_action (if manually set), suppressed flag,
    related_threads (confirmed ones), outgoing_requests, incoming_responses,
    incoming_requests, research_objectives, outstanding, completed_actions,
    research_findings, suggested_new_correspondence (except classification-derived fields).
    """
    if not existing_action:
        return new_classification

    # Preserve recommended_action if it was manually set (not a template)
    old_rec = existing_action.get("recommended_action")
    new_rec = new_classification.get("recommended_action")
    # Template recommendations from _recommend start with generic phrases
    is_template = new_rec and any(new_rec.startswith(p) for p in [
        "Prepare a reply", "You need to take action", "Waiting for", "Follow up with",
        "This matter appears", "Needs manual review", "Informational update",
        "Action required: contact", "Action required: Curia"
    ])
    if old_rec and not is_template and old_rec != new_rec:
        new_classification["recommended_action"] = old_rec

    # Preserve confirmed related_threads (merge human-confirmed fields into new entries)
    old_related = existing_action.get("related_threads") or []
    confirmed_related = {r.get("thread_id"): r for r in old_related if r.get("status") == "confirmed"}
    if confirmed_related:
        new_related = new_classification.get("related_threads") or []
        for nr in new_related:
            tid = nr.get("thread_id")
            if tid in confirmed_related:
                # Merge human-confirmed fields
                cr = confirmed_related[tid]
                nr["status"] = "confirmed"
                nr["confirmed_by"] = cr.get("confirmed_by")
                nr["confirmed_at"] = cr.get("confirmed_at")
                if cr.get("reason"):
                    nr["reason"] = cr["reason"]
                if cr.get("evidence"):
                    nr["evidence"] = cr["evidence"]
        # Add any confirmed threads not in new list
        existing_targets = {r.get("thread_id") for r in new_related}
        for tid, cr in confirmed_related.items():
            if tid not in existing_targets:
                new_related.append(cr)
        new_classification["related_threads"] = new_related

    # Preserve suppressed flag
    old_snc = existing_action.get("suggested_new_correspondence") or {}
    if old_snc.get("suppressed"):
        new_snc = new_classification.get("suggested_new_correspondence") or {}
        new_snc["suppressed"] = True
        if old_snc.get("suppression_reason"):
            new_snc["suppression_reason"] = old_snc["suppression_reason"]
        new_classification["suggested_new_correspondence"] = new_snc

    # Preserve research_findings
    if existing_action.get("research_findings"):
        new_classification["research_findings"] = existing_action["research_findings"]

    # Preserve completed_actions
    if existing_action.get("completed_actions"):
        new_classification["completed_actions"] = existing_action["completed_actions"]

    # Preserve direction-separated fields if they exist
    for field in ["outgoing_requests", "incoming_responses", "incoming_requests", "research_objectives", "outstanding", "thread_state", "unresolved_research_questions"]:
        if existing_action.get(field):
            new_classification[field] = existing_action[field]

    # Preserve outgoing_requests/incoming_responses from existing if new ones are empty
    if not new_classification.get("outgoing_requests") and existing_action.get("outgoing_requests"):
        new_classification["outgoing_requests"] = existing_action["outgoing_requests"]
    if not new_classification.get("incoming_responses") and existing_action.get("incoming_responses"):
        new_classification["incoming_responses"] = existing_action["incoming_responses"]

    return new_classification



def main():
    threads_data = json.load(open(THREADS_PATH))
    enquiries = threads_data.get("threads", {})
    # Also load proposed enquiries for context
    proposed = threads_data.get("proposed_enquiries", {})

    # Load existing actions for merge preservation
    existing_actions = {}
    if os.path.exists(OUT):
        try:
            existing_actions = json.load(open(OUT)).get("actions", {})
        except Exception:
            pass

    # Build a map of gmail_thread_id -> thread info
    thread_info_map = {}
    for tid, e in enquiries.items():
        thread_info_map[tid] = e

    results = {}
    attachment_gate = load_attachment_gate()
    # Process each thread that has definite/possible messages
    conn2 = sqlite3.connect(DB_PATH)
    conn2.row_factory = sqlite3.Row
    definite_threads = conn2.execute("""SELECT DISTINCT t.id, t.account_email, t.gmail_thread_id
        FROM threads t JOIN messages m ON m.thread_id=t.id
        JOIN message_classification mc ON mc.message_id=m.id
        WHERE mc.genealogy_relevance IN ('definite','possible')""").fetchall()

    for t in definite_threads:
        tid = t["gmail_thread_id"]
        msgs = conn2.execute("""SELECT id, account_email, direction, received_at, sent_at, subject, snippet, body_text, gmail_message_id, from_email, from_name
            FROM messages WHERE thread_id=? ORDER BY COALESCE(received_at,sent_at)""", (t["id"],)).fetchall()
        msgs = [dict(m) for m in msgs]
        info = thread_info_map.get(tid, {})
        classification = classify_thread(t["id"], tid, msgs, info)
        if classification:
            # Attachment gate: received documents outrank "nothing happened yet"
            gate_info = thread_attachment_gate(attachment_gate, msgs)
            classification = apply_attachment_gate(classification, gate_info)
            # Request linkage (Step 2): attach linked requests for this thread
            try:
                _scripts = os.path.join(ROOT, "scripts")
                if _scripts not in sys.path:
                    sys.path.insert(0, _scripts)
                from request_links import requests_for_thread as _rft
                rls = _rft(tid)
                classification["request_links"] = [
                    {"request_id": r["request_id"], "status": r["status"],
                     "fulfilment": r["fulfilment"], "ambiguous": r.get("ambiguous"),
                     "linked_events": [e["kind"] for e in (r.get("linked_events") or [])],
                     "linked_attachments": r.get("linked_attachments") or []}
                    for r in rls
                ]
            except Exception:
                classification["request_links"] = []
            # Cross-thread reconciliation: find related threads
            person_names = info.get("person_names", [])
            record_refs = info.get("record_refs", [])
            related = find_related_threads(tid, person_names, record_refs, classification.get("institution"), results)
            if related:
                classification["related_threads"] = related
                awaiting_related = [r for r in related if r["is_awaiting_response"]]
                if awaiting_related and classification["classification"] in ("action_required", "reply_required"):
                    classification["reasoning"] += (" Note: related thread %s already has an enquiry awaiting response. "
                                                   "Consider waiting before sending a new request." % awaiting_related[0]["thread_id"])
            # Preserve human-confirmed fields from existing action
            existing_action = existing_actions.get(tid)
            classification = merge_preserved_fields(classification, existing_action)
            results[tid] = classification

    # Summary counts
    from collections import Counter
    counts = Counter(r["classification"] for r in results.values())
    conf_counts = Counter(r["confidence"] for r in results.values())

    out = {
        "version": 1,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "total_threads": len(results),
        "counts": dict(counts),
        "confidence_counts": dict(conf_counts),
        "actions": results,
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"Written {OUT}")
    print(f"Total threads classified: {len(results)}")
    print("Counts:", dict(counts))
    print("Confidence:", dict(conf_counts))

    # Print a sample of each classification
    print("\n=== Sample classifications ===")
    shown = set()
    for tid, r in results.items():
        if r["classification"] not in shown:
            shown.add(r["classification"])
            print(f"\n[{r['classification'].upper()}] {r['subject'][:70]}")
            print(f"  institution: {r['institution']}")
            print(f"  confidence: {r['confidence']}")
            print(f"  reasoning: {r['reasoning']}")
            print(f"  evidence: {r['evidence']}")
            print(f"  last_activity: {r['last_activity']}")
            print(f"  messages: {r['message_count']}")


if __name__ == "__main__":
    main()