#!/usr/bin/env python3
"""Regression tests for the drafting verification gate (Step 5).

The two drafts that failed the first controlled sweep are preserved verbatim as
fixtures in correspondence/extracted/draft-gate-fixtures/.  The tests show that
the gate:

  * recognises the postal-address request in the Linguaglossa thread and the
    Egidio / 1868 namesake distinction;
  * recognises that the San Benedetto enquiry belongs to the Ufficio Anagrafe,
    not the Curia;
  * never accepts an invented postal address or recipient;
  * flags unsupported claims and unverified recipient details;
  * refuses to mark a fluent draft ready when verification fails.

Usage:
    python3 scripts/test-draft-gate.py [--verbose]

No network, no model calls, no writes, nothing sent.
"""
import argparse
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)

import draft_gate as gate  # noqa: E402

FIXTURES = os.path.join(ROOT, "correspondence", "extracted", "draft-gate-fixtures")
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")


def load_fixture(name):
    with open(os.path.join(FIXTURES, name), "r", encoding="utf-8") as f:
        return json.load(f)


def run_gate(fixture, draft_text=None, **overrides):
    kwargs = dict(
        draft_type=fixture["draft_type"],
        intended_recipient=fixture["intended_recipient"],
        latest_inbound=fixture["latest_inbound"],
        required_actions=fixture["required_actions"],
        source_texts=fixture["source_texts"],
        contact_details=fixture["contact_details"],
        excluded_identities=fixture["excluded_identities"],
        prohibited_recipient_markers=fixture["prohibited_recipient_markers"],
        known_surnames=fixture["known_surnames"],
        language="Italian",
    )
    kwargs.update(overrides)
    return gate.verify_draft(draft_text if draft_text is not None else fixture["draft_text"], **kwargs)


def check(report, check_id):
    return (report.get("checks") or {}).get(check_id) or {}


def findings(report, check_id):
    return " ".join(check(report, check_id).get("findings") or [])


def all_findings(report):
    return " ".join(report.get("findings") or [])


# ---------------------------------------------------------------------------
# tests
# ---------------------------------------------------------------------------

def test_linguaglossa_failing_draft():
    fx = load_fixture("linguaglossa.json")
    rep = run_gate(fx)
    assert rep["readiness"] != gate.READY, "fluent but failing draft must not be marked ready"
    assert rep["readiness"] == gate.BLOCKED, "expected blocked, got %s" % rep["readiness"]
    assert check(rep, "language")["status"] in ("pass", "warn"), "fixture should still read as fluent Italian"
    assert check(rep, "immediate_purpose")["status"] == "fail"
    assert "postal address" in findings(rep, "immediate_purpose").lower()
    assert check(rep, "attachments")["status"] == "fail"
    assert "claims to send/attach" in findings(rep, "attachments")
    assert check(rep, "identity_distinction")["status"] == "fail"
    idf = findings(rep, "identity_distinction")
    assert "05/09/1868" in idf and "atto n. 141" in idf, "identity finding must name both markers"
    assert check(rep, "contradictions")["status"] == "fail"
    assert "not the namesake" in findings(rep, "contradictions")
    # The address was verified but omitted; the draft must not contain one.
    assert "verified" in findings(rep, "missing_information").lower()
    assert gate.POSTAL_ADDRESS_RE.search(fx["draft_text"]) is None
    # Evidence required by the brief is preserved on the report.
    assert 197 in rep["source_messages"]
    assert rep["action_being_answered"]["message_id"] == 197
    assert rep["recipient"]["intended"]["email"] == "anagrafe@comune.linguaglossa.ct.it"


def test_linguaglossa_corrected_draft_is_ready():
    fx = load_fixture("linguaglossa.json")
    rep = run_gate(fx, fx["corrected_draft_text"])
    failed = [c["id"] for c in rep["verification_results"] if c["status"] == "fail"]
    assert not failed, "corrected draft should pass every check, failed: %s (%s)" % (failed, all_findings(rep))
    assert rep["readiness"] == gate.READY
    verified = fx["contact_details"]["postal_address"]["value"]
    assert verified in fx["corrected_draft_text"]
    assert check(rep, "attachments")["status"] == "pass"
    assert check(rep, "identity_distinction")["status"] == "pass"


def test_linguaglossa_placeholder_is_not_ready():
    fx = load_fixture("linguaglossa.json")
    verified = fx["contact_details"]["postal_address"]["value"]
    text = fx["corrected_draft_text"].replace(verified, "[INDIRIZZO POSTALE DA COMPLETARE]")
    rep = run_gate(fx, text)
    assert rep["readiness"] == gate.INCOMPLETE, rep["readiness"]
    assert check(rep, "immediate_purpose")["status"] == "fail"
    assert "INDIRIZZO POSTALE" in findings(rep, "missing_information")


def test_linguaglossa_invented_address_is_not_ready():
    fx = load_fixture("linguaglossa.json")
    verified = fx["contact_details"]["postal_address"]["value"]
    text = fx["corrected_draft_text"].replace(verified, "12 Example Street, Melbourne VIC 3000, Australia")
    rep = run_gate(fx, text)
    assert rep["readiness"] != gate.READY
    assert "not the verified address" in findings(rep, "missing_information")


def test_linguaglossa_unverified_contact_details():
    fx = load_fixture("linguaglossa.json")
    rep = run_gate(fx, fx["corrected_draft_text"],
                   contact_details={"postal_address": None, "emails": [], "phones": []})
    assert rep["readiness"] != gate.READY
    assert "could not be verified" in findings(rep, "missing_information")


def test_sbt_failing_draft_recognises_anagrafe_not_curia():
    fx = load_fixture("sbt.json")
    rep = run_gate(fx)
    assert rep["draft_type"] == "new_correspondence"
    assert rep["recipient"]["intended"]["office"] == "Ufficio Anagrafe"
    assert rep["recipient"]["intended"]["institution"] == "Comune di San Benedetto del Tronto"
    assert rep["readiness"] != gate.READY
    recipient_findings = findings(rep, "recipient").lower()
    assert "anagrafe" in recipient_findings, "must say the Anagrafe, not the Curia, is the recipient"
    assert "parrocch" in recipient_findings, "must flag the parish-register request"
    assert check(rep, "correspondence_type")["status"] == "fail", "must flag reply wording in a new email"
    assert "VERIFY EMAIL" in findings(rep, "missing_information")
    assert rep["recipient"]["intended"]["email"] == "comunesbt@comunesbt.it"


def test_sbt_curia_salutation_is_rejected():
    fx = load_fixture("sbt.json")
    text = fx["corrected_draft_text"].replace(
        "Spett.le Ufficio Anagrafe del Comune di San Benedetto del Tronto,",
        "Gentile Sig.ra Veccia,")
    rep = run_gate(fx, text)
    assert rep["readiness"] == gate.BLOCKED
    assert "Veccia" in findings(rep, "recipient")


def test_sbt_corrected_draft_is_ready():
    fx = load_fixture("sbt.json")
    rep = run_gate(fx, fx["corrected_draft_text"])
    failed = [c["id"] for c in rep["verification_results"] if c["status"] == "fail"]
    assert not failed, "corrected draft should pass every check, failed: %s (%s)" % (failed, all_findings(rep))
    assert rep["readiness"] == gate.READY
    assert check(rep, "recipient")["status"] == "pass"
    assert check(rep, "correspondence_type")["status"] == "pass"
    assert "San Giorgio" in fx["corrected_draft_text"], "uncertainty must be preserved in the corrected fixture"
    assert "CHIAPPINI" in fx["corrected_draft_text"]


def test_sbt_typo_is_flagged():
    fx = load_fixture("sbt.json")
    text = fx["corrected_draft_text"].replace("CHIAPPINI", "CHIAAPPINI")
    rep = run_gate(fx, text)
    assert rep["readiness"] != gate.READY
    assert check(rep, "language")["status"] == "fail"
    lang = findings(rep, "language")
    assert "CHIAAPPINI" in lang and "CHIAPPINI" in lang


def test_sbt_unverified_recipient_email_is_incomplete():
    fx = load_fixture("sbt.json")
    intended = dict(fx["intended_recipient"])
    intended["email"] = None
    intended["established_by"] = None
    rep = run_gate(fx, fx["corrected_draft_text"], intended_recipient=intended)
    assert rep["readiness"] != gate.READY
    assert "not verified" in findings(rep, "recipient")
    assert any("Recipient email" in f for f in rep["missing_information"])


def test_suppressed_suggestion_never_drafts():
    fx = load_fixture("sbt.json")
    ok, reason = gate.check_suggestion_allowed({"suppressed": True, "suppression_reason": "Duplicate of MSG 58"})
    assert not ok and "Duplicate" in reason
    ok, reason = gate.check_suggestion_allowed({"recommended_institution": "Comune di San Benedetto del Tronto"})
    assert ok, reason
    ok, reason = gate.check_suggestion_allowed({})
    assert not ok and "no verified recommended institution" in reason
    # Fixture records the original suppression so the regression is traceable.
    assert "suppressed" in " ".join(fx["provenance"]["why_failed"])


def test_action_detection_on_latest_inbound():
    fx = load_fixture("linguaglossa.json")
    ids = [a["id"] for a in fx["required_actions"]]
    assert "provide_postal_address" in ids
    assert "accept_post_original_offer" in ids
    offer = next(a for a in fx["required_actions"] if a["id"] == "accept_post_original_offer")
    assert "originale" in " ".join(sum(offer["required_terms"], []))


def test_excluded_identity_derivation():
    fx = load_fixture("linguaglossa.json")
    assert fx["excluded_identities"], "the 1868 namesake constraint must be derived from the sources"
    markers = " ".join(sum((e["excluded_markers"] for e in fx["excluded_identities"]), []))
    assert "05/09/1868" in markers and "atto n. 141" in markers
    assert any(e["source_message_id"] in (224, 197) for e in fx["excluded_identities"])


def test_discover_postal_address_from_sent_correspondence():
    if not os.path.exists(DB_PATH):
        return "skipped (correspondence DB not present)"
    found = gate.discover_postal_address()
    assert found, "expected a postal address in the sent correspondence"
    assert "Toorak" in found["value"], found["value"]
    assert found["source_message_id"], "the address must name its source message"
    # A venue address inside a quoted invitation must never be picked up.
    assert "Bridge Rd" not in found["value"]
    assert "Fitzroy" not in found["value"]


def test_resolve_recipient_email_from_correspondence():
    if not os.path.exists(DB_PATH):
        return "skipped (correspondence DB not present)"
    sbt = gate.resolve_recipient_email(institution="Comune di San Benedetto del Tronto",
                                       topic_terms=["pirri", "irma"])
    assert sbt["email"] == "comunesbt@comunesbt.it", sbt
    assert sbt["source_message_id"] == 58
    ling = gate.resolve_recipient_email(institution="Comune di Linguaglossa",
                                        topic_terms=["emmi", "egidio"])
    assert ling["email"] == "anagrafe@comune.linguaglossa.ct.it", ling
    assert ling["source_message_id"] == 224


def test_postal_address_completeness():
    # A suburb alone is not a complete address
    complete, components, missing = gate.is_complete_postal_address("Toorak")
    assert not complete, "Toorak alone must not be a complete address"
    assert "street" in missing and "postcode" in missing
    # A complete address passes
    complete2, components2, missing2 = gate.is_complete_postal_address(
        "685 Toorak Road, Toorak VIC 3142, Victoria, Australia")
    assert complete2, "complete address must pass: missing=%s" % missing2
    assert components2.get("postcode") == "3142"
    assert components2.get("state") == "VIC"
    assert components2.get("country") == "Australia"
    assert components2.get("street") is not None
    assert components2.get("suburb") is not None
    # Empty / None
    complete3, _, missing3 = gate.is_complete_postal_address("")
    assert not complete3
    complete4, _, missing4 = gate.is_complete_postal_address(None)
    assert not complete4
    # Partial address (no postcode)
    complete5, _, missing5 = gate.is_complete_postal_address("12 Smith St, Toorak VIC, Australia")
    assert not complete5
    assert "postcode" in missing5
    # PO Box
    complete6, components6, missing6 = gate.is_complete_postal_address(
        "PO Box 123, Toorak VIC 3142, Australia")
    assert complete6, "PO Box address must be complete: missing=%s" % missing6
    assert "PO Box" in components6.get("street", "")

TESTS = [
    test_linguaglossa_failing_draft,
    test_linguaglossa_corrected_draft_is_ready,
    test_linguaglossa_placeholder_is_not_ready,
    test_linguaglossa_invented_address_is_not_ready,
    test_linguaglossa_unverified_contact_details,
    test_sbt_failing_draft_recognises_anagrafe_not_curia,
    test_sbt_curia_salutation_is_rejected,
    test_sbt_corrected_draft_is_ready,
    test_sbt_typo_is_flagged,
    test_sbt_unverified_recipient_email_is_incomplete,
    test_suppressed_suggestion_never_drafts,
    test_action_detection_on_latest_inbound,
    test_excluded_identity_derivation,
    test_discover_postal_address_from_sent_correspondence,
    test_resolve_recipient_email_from_correspondence,
    test_postal_address_completeness,
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()
    passed = failed = skipped = 0
    for test in TESTS:
        try:
            result = test()
        except AssertionError as exc:
            failed += 1
            print("  FAIL: %s — %s" % (test.__name__, exc))
            continue
        except Exception as exc:  # noqa: BLE001 - report every unexpected failure
            failed += 1
            print("  ERROR: %s — %s: %s" % (test.__name__, type(exc).__name__, exc))
            continue
        if isinstance(result, str) and result.startswith("skipped"):
            skipped += 1
            print("  SKIP: %s — %s" % (test.__name__, result))
        else:
            passed += 1
            if args.verbose:
                print("  PASS: %s" % test.__name__)
    print()
    print("Draft gate tests: %d passed, %d failed, %d skipped" % (passed, failed, skipped))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
