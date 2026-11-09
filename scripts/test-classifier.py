#!/usr/bin/env python3
"""Independent classifier output tests using isolated fixtures.

Tests the actual classify_thread() function against controlled message/thread
fixtures. Does not activate rules, modify production data, or reprocess
historical correspondence.

Usage:
  python scripts/test-classifier.py              # run all tests
  python scripts/test-classifier.py --verbose    # show details

No database schema changes. No familyData.ts changes. No commits or pushes.
"""
import argparse, json, os, sys, sqlite3

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
import importlib.util
_spec = importlib.util.spec_from_file_location("ca", os.path.join(ROOT, "scripts", "classify-actions.py"))
_ca = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_ca)
classify_thread = _ca.classify_thread

# Isolated test fixtures (no DB, no production data)
FIXTURES = [
    {
        "name": "Incoming institutional referral",
        "msgs": [
            {"id": 1001, "account_email": "test@test.com", "direction": "out", "received_at": None,
             "sent_at": "2026-11-01T10:00:00+00:00", "subject": "Richiesta certificato",
             "snippet": "Richiedo certificato di morte", "body_text": "Richiedo certificato di morte di Mario Rossi.",
             "gmail_message_id": "m1", "from_email": "test@test.com", "from_name": "Daniele", "thread_id": 1},
            {"id": 1002, "account_email": "test@test.com", "direction": "in", "received_at": "2026-11-03T10:00:00+00:00",
             "sent_at": None, "subject": "Re: Richiesta certificato",
             "snippet": "Le consiglio di rivolgersi all'ufficio anagrafe",
             "body_text": "Buongiorno, la sua richiesta non può essere evasa da questa parrocchia. Le consiglio di rivolgersi all'ufficio anagrafe del Comune dove il nominativo è più facile da trovare.",
             "gmail_message_id": "m2", "from_email": "curia@test.it", "from_name": "Curia", "thread_id": 1},
        ],
        "thread_info": {"institution": "Curia di Test", "institution_confidence": "high", "person_names": ["Mario Rossi"]},
        "expected": {
            "classification": "action_required",
            "evidence_direction": "in",
            "evidence_contains": "rivolgersi",
            "source_msg_id": 1002,
        },
    },
    {
        "name": "Outgoing enquiry (no response yet)",
        "msgs": [
            {"id": 2001, "account_email": "test@test.com", "direction": "out", "received_at": None,
             "sent_at": "2026-11-01T10:00:00+00:00", "subject": "Richiesta certificato di nascita",
             "snippet": "Richiedo certificato di nascita", "body_text": "Richiedo certificato di nascita di Mario Rossi, nato nel 1920.",
             "gmail_message_id": "m3", "from_email": "test@test.com", "from_name": "Daniele", "thread_id": 2},
        ],
        "thread_info": {"institution": "Comune di Test", "institution_confidence": "high", "person_names": ["Mario Rossi"]},
        "expected": {
            "classification": "awaiting_response",
            "evidence_direction": "out",
        },
    },
    {
        "name": "Incoming request for information",
        "msgs": [
            {"id": 3001, "account_email": "test@test.com", "direction": "out", "received_at": None,
             "sent_at": "2026-10-01T10:00:00+00:00", "subject": "Richiesta documenti",
             "snippet": "Richiedo documenti", "body_text": "Richiedo copia atto di nascita.",
             "gmail_message_id": "m4", "from_email": "test@test.com", "from_name": "Daniele", "thread_id": 3},
            {"id": 3002, "account_email": "test@test.com", "direction": "in", "received_at": "2026-10-05T10:00:00+00:00",
             "sent_at": None, "subject": "Re: Richiesta documenti",
             "snippet": "Le chiediamo di inviare la copia del documento d'identità",
             "body_text": "Buongiorno, per procedere con la sua richiesta le chiediamo di inviare la copia del documento d'identità e il codice fiscale.",
             "gmail_message_id": "m5", "from_email": "comune@test.it", "from_name": "Comune", "thread_id": 3},
        ],
        "thread_info": {"institution": "Comune di Test", "institution_confidence": "high", "person_names": ["Mario Rossi"]},
        "analyses": {3002: {"outstanding_questions": [{"value": "provide ID document", "evidence": "le chiediamo di inviare la copia del documento d'identità"}], "actions_requested": [{"value": "send ID copy", "evidence": "le chiediamo di inviare la copia del documento d'identità"}]}},
        "expected": {
            "classification": "reply_required",
            "evidence_direction": "in",
        },
    },
    {
        "name": "PEC acknowledgement",
        "msgs": [
            {"id": 4001, "account_email": "test@test.com", "direction": "out", "received_at": None,
             "sent_at": "2026-10-01T10:00:00+00:00", "subject": "Richiesta certificato",
             "snippet": "Richiedo certificato", "body_text": "Richiedo certificato di nascita.",
             "gmail_message_id": "m6", "from_email": "test@test.com", "from_name": "Daniele", "thread_id": 4},
            {"id": 4002, "account_email": "test@test.com", "direction": "in", "received_at": "2026-10-02T10:00:00+00:00",
             "sent_at": None, "subject": "POSTA CERTIFICATA: Ricevuta avvenuta protocollazione",
             "snippet": "Ricevuta avvenuta protocollazione",
             "body_text": "Messaggio di posta certificata. Il giorno 02/10/2026 il messaggio con oggetto 'Richiesta certificato' è stato inviato. Ricevuta avvenuta protocollazione.",
             "gmail_message_id": "m7", "from_email": "posta-certificata@pec.aruba.it", "from_name": "PEC", "thread_id": 4},
        ],
        "thread_info": {"institution": "Comune di Test", "institution_confidence": "high", "person_names": ["Mario Rossi"]},
        "expected": {
            "classification": "awaiting_response",
        },
    },
    {
        "name": "Substantive institutional response (document delivery)",
        "msgs": [
            {"id": 5001, "account_email": "test@test.com", "direction": "out", "received_at": None,
             "sent_at": "2026-10-01T10:00:00+00:00", "subject": "Richiesta certificato",
             "snippet": "Richiedo certificato", "body_text": "Richiedo certificato di nascita.",
             "gmail_message_id": "m8", "from_email": "test@test.com", "from_name": "Daniele", "thread_id": 5},
            {"id": 5002, "account_email": "test@test.com", "direction": "in", "received_at": "2026-10-05T10:00:00+00:00",
             "sent_at": None, "subject": "Re: Richiesta certificato",
             "snippet": "Si trasmette il certificato richiesto",
             "body_text": "Buongiorno, si trasmette come file allegato il certificato di nascita richiesto.",
             "gmail_message_id": "m9", "from_email": "comune@test.it", "from_name": "Comune", "thread_id": 5},
        ],
        "thread_info": {"institution": "Comune di Test", "institution_confidence": "high", "person_names": ["Mario Rossi"]},
        "expected": {
            "classification": "resolved",
        },
    },
    {
        "name": "Existing equivalent enquiry awaiting response",
        "msgs": [
            {"id": 6001, "account_email": "test@test.com", "direction": "out", "received_at": None,
             "sent_at": "2026-11-01T10:00:00+00:00", "subject": "Richiesta certificato di morte",
             "snippet": "Richiedo certificato di morte", "body_text": "Richiedo certificato di morte di Mario Rossi, deceduto 1930-1952.",
             "gmail_message_id": "m10", "from_email": "test@test.com", "from_name": "Daniele", "thread_id": 6},
        ],
        "thread_info": {"institution": "Comune di Test", "institution_confidence": "high", "person_names": ["Mario Rossi"]},
        "expected": {
            "classification": "awaiting_response",
        },
    },
    {
        "name": "Genuine follow-up due",
        "msgs": [
            {"id": 7001, "account_email": "test@test.com", "direction": "out", "received_at": None,
             "sent_at": "2026-09-01T10:00:00+00:00", "subject": "Richiesta certificato",
             "snippet": "Richiedo certificato", "body_text": "Richiedo certificato di nascita.",
             "gmail_message_id": "m11", "from_email": "test@test.com", "from_name": "Daniele", "thread_id": 7},
        ],
        "thread_info": {"institution": "Comune di Test", "institution_confidence": "high", "person_names": ["Mario Rossi"]},
        "expected": {
            "classification": "follow_up_due",
        },
    },
    {
        "name": "Ambiguous correspondence",
        "msgs": [
            {"id": 8001, "account_email": "test@test.com", "direction": "in", "received_at": "2026-11-01T10:00:00+00:00",
             "sent_at": None, "subject": "Re: your request",
             "snippet": "We have received your message",
             "body_text": "Thank you for your message. We will get back to you.",
             "gmail_message_id": "m12", "from_email": "unknown@test.it", "from_name": "Unknown", "thread_id": 8},
        ],
        "thread_info": {"institution": "Unknown Institution", "institution_confidence": "low", "person_names": []},
        "expected": {
            "classification": "uncertain",
        },
    },
    {
        "name": "Different research objective (same person, different record)",
        "msgs": [
            {"id": 9001, "account_email": "test@test.com", "direction": "out", "received_at": None,
             "sent_at": "2026-11-01T10:00:00+00:00", "subject": "Richiesta ruolo matricolare",
             "snippet": "Richiedo ruolo matricolare", "body_text": "Richiedo il ruolo matricolare di Mario Rossi.",
             "gmail_message_id": "m13", "from_email": "test@test.com", "from_name": "Daniele", "thread_id": 9},
        ],
        "thread_info": {"institution": "Archivio di Stato", "institution_confidence": "high", "person_names": ["Mario Rossi"]},
        "expected": {
            "classification": "awaiting_response",
        },
    },
]

def run_tests():
    passed = 0
    failed = 0
    for fixture in FIXTURES:
        # Monkey-patch analyses if provided
        if "analyses" in fixture:
            _ca.analyses.update(fixture["analyses"])
        result = classify_thread(1, f"test_{fixture['name']}", fixture["msgs"], fixture["thread_info"])
        expected = fixture["expected"]
        status = "PASS"
        details = []
        if result is None:
            status = "FAIL"
            details.append("classify_thread returned None")
        else:
            if "classification" in expected and result["classification"] != expected["classification"]:
                status = "FAIL"
                details.append(f"classification: got {result['classification']}, expected {expected['classification']}")
            if "evidence_direction" in expected:
                ev = result.get("evidence", [])
                if ev:
                    actual_dir = ev[0].get("direction")
                    if actual_dir != expected["evidence_direction"]:
                        status = "FAIL"
                        details.append(f"evidence direction: got {actual_dir}, expected {expected['evidence_direction']}")
            if "evidence_contains" in expected:
                ev = result.get("evidence", [])
                if ev:
                    quote = ev[0].get("quote", "")
                    if expected["evidence_contains"].lower() not in quote.lower():
                        status = "FAIL"
                        details.append(f"evidence quote missing: {expected['evidence_contains']}")
            if "source_msg_id" in expected:
                ev = result.get("evidence", [])
                if ev:
                    actual_id = ev[0].get("msg_id")
                    if actual_id != expected["source_msg_id"]:
                        status = "FAIL"
                        details.append(f"source msg_id: got {actual_id}, expected {expected['source_msg_id']}")

        if status == "PASS":
            passed += 1
        else:
            failed += 1
        print(f"  {status}: {fixture['name']}" + (f" — {'; '.join(details)}" if details else ""))

    print(f"\nResults: {passed} passed, {failed} failed, {len(FIXTURES)} total")
    return passed, failed

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()
    print("=== Classifier Output Tests (isolated fixtures) ===")
    print()
    passed, failed = run_tests()
    if failed > 0:
        sys.exit(1)
