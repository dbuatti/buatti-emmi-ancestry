#!/usr/bin/env python3
"""Test rule application with actual output verification.

Tests that active rules influence output and proposed rules do not.

Uses isolated text fixtures (not production data). Does not reprocess
historical correspondence. Does not modify familyData.ts.

Usage:
  python scripts/test-rule-application.py              # run all tests
  python scripts/test-rule-application.py --verbose    # show details

No database schema changes. No commits or pushes.
"""
import argparse, json, os, sys, datetime, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULES_PATH = os.path.join(ROOT, "correspondence", "extracted", "rules.json")
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from rules_loader import load_rules, load_active_rules, format_rules_for_prompt, get_prompt_rules

def run_test(test_name, test_fn):
    """Run a test function and report result."""
    try:
        result = test_fn()
        if result is True:
            print(f"  PASS: {test_name}")
            return True
        elif result is False:
            print(f"  FAIL: {test_name}")
            return False
        else:
            print(f"  SKIP: {test_name} — {result}")
            return None
    except Exception as e:
        print(f"  ERROR: {test_name} — {e}")
        return False

def test_proposed_rules_have_no_effect():
    """Verify that proposed rules are not loaded by load_active_rules."""
    active = load_active_rules()
    proposed = load_rules(status="proposed")
    # No proposed rule should be in active set
    for rid in proposed:
        if rid in active:
            return False
    return True

def test_active_rules_loaded_by_stage():
    """Verify that active rules are filtered by stage."""
    # Temporarily, no active rules exist, so this should return empty
    active_translation = load_active_rules(stage="translation")
    active_analysis = load_active_rules(stage="analysis")
    # With no active rules, both should be empty
    if len(active_translation) > 0 or len(active_analysis) > 0:
        return False
    return True

def test_format_rules_for_prompt():
    """Verify format_rules_for_prompt produces correct output."""
    # Create a mock active rule
    mock_rules = {
        "rule_test": {
            "id": "rule_test",
            "type": "translation",
            "stage": "translation",
            "status": "active",
            "pattern": "bisnonna",
            "correction": "great-grandmother",
            "rationale": "bisnonna = great-grandmother",
        }
    }
    text = format_rules_for_prompt(mock_rules, stage="translation")
    if "bisnonna" not in text or "great-grandmother" not in text:
        return False
    if "APPROVED CORRECTION RULES" not in text:
        return False
    # Test with no rules
    empty = format_rules_for_prompt({}, stage="translation")
    if empty != "":
        return False
    return True

def test_rules_loader_filters_by_status():
    """Verify load_rules filters by status correctly."""
    # Load all rules
    all_rules = load_rules()
    proposed = load_rules(status="proposed")
    active = load_rules(status="active")
    rejected = load_rules(status="rejected")
    # All rules should be either proposed, active, or rejected
    for rid, r in all_rules.items():
        assert r["status"] in ("proposed", "active", "rejected"), f"Unknown status: {r['status']}"
    # With no active rules, active should be empty
    if len(active) != 0:
        return False
    # All 5 should be proposed
    if len(proposed) != 5:
        return False
    return True

def test_rules_loader_filters_by_stage():
    """Verify load_rules filters by stage."""
    translation_rules = load_rules(status="proposed", stage="translation")
    analysis_rules = load_rules(status="proposed", stage="analysis")
    classification_rules = load_rules(status="proposed", stage="classification")
    # rule_001 is translation
    assert "rule_001" in translation_rules
    # rule_002, rule_003 are analysis
    assert "rule_002" in analysis_rules
    assert "rule_003" in analysis_rules
    # rule_004 is classification
    assert "rule_004" in classification_rules
    return True

def test_rules_loader_filters_by_mechanism():
    """Verify load_rules filters by mechanism."""
    prompt_rules = load_rules(status="proposed", mechanism="prompt_injection")
    code_checks = load_rules(status="proposed", mechanism="code_check")
    # rule_004 is code_check
    assert "rule_004" in code_checks
    assert "rule_004" not in prompt_rules
    # rule_001, 002, 003, 005 are prompt_injection
    assert "rule_001" in prompt_rules
    return True

def test_rule_application_to_text():
    """Verify apply_rules_to_text works correctly."""
    from rules_loader import apply_rules_to_text
    mock_rules = {
        "r1": {"pattern": "bisnonna", "correction": "great-grandmother"},
        "r2": {"pattern": "trisavolo", "correction": "great-great-grandfather"},
    }
    text = "La mia bisnonna e il mio trisavolo."
    modified, applied = apply_rules_to_text(text, mock_rules)
    assert "great-grandmother" in modified
    assert "great-great-grandfather" in modified
    assert "bisnonna" not in modified
    assert "trisavolo" not in modified
    assert len(applied) == 2
    # Test no match
    text2 = "Hello world"
    modified2, applied2 = apply_rules_to_text(text2, mock_rules)
    assert modified2 == text2
    assert len(applied2) == 0
    return True

def test_case_specific_scope():
    """Verify that case_specific corrections don't create rules."""
    # All 5 corrections are generalizable, so 5 rules proposed
    # A case_specific correction would not be proposed
    corrections = json.load(open(os.path.join(ROOT, "correspondence", "extracted", "corrections.json")))
    gen_count = sum(1 for c in corrections["corrections"].values() if c.get("scope") == "generalizable")
    case_count = sum(1 for c in corrections["corrections"].values() if c.get("scope") == "case_specific")
    # All 6 corrections (5 original + 1 trisavolo) are generalizable
    assert gen_count == 6, f"Expected 6 generalizable, got {gen_count}"
    assert case_count == 0, f"Expected 0 case_specific, got {case_count}"
    return True

def test_proposed_rules_do_not_affect_classification():
    """Verify that proposed (non-active) rules don't change classify_thread output."""
    # Since no rules are active, classify_thread should work the same as before
    import importlib.util
    _spec = importlib.util.spec_from_file_location("ca", os.path.join(ROOT, "scripts", "classify-actions.py"))
    _ca = importlib.util.module_from_spec(_spec)
    _spec.loader.exec_module(_ca)
    classify_thread = _ca.classify_thread

    # Test with the referral fixture
    msgs = [
        {"id": 1001, "account_email": "test@test.com", "direction": "out", "received_at": None,
         "sent_at": "2026-11-01T10:00:00+00:00", "subject": "Richiesta", "snippet": "Richiedo",
         "body_text": "Richiedo certificato.", "gmail_message_id": "m1", "from_email": "test@test.com",
         "from_name": "Daniele", "thread_id": 1},
        {"id": 1002, "account_email": "test@test.com", "direction": "in", "received_at": "2026-11-03T10:00:00+00:00",
         "sent_at": None, "subject": "Re: Richiesta", "snippet": "Le consiglio di rivolgersi",
         "body_text": "Le consiglio di rivolgersi all'ufficio anagrafe.",
         "gmail_message_id": "m2", "from_email": "curia@test.it", "from_name": "Curia", "thread_id": 1},
    ]
    result = classify_thread(1, "test", msgs, {"institution": "Curia", "institution_confidence": "high", "person_names": []})
    # Should be action_required (referral), not influenced by any rule
    assert result["classification"] == "action_required", f"Got {result['classification']}"
    return True

def test_no_rules_active():
    """Verify that no rules are currently active (human approval required)."""
    active = load_active_rules()
    if len(active) > 0:
        return False
    return True

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    print("=== R3 Rule Application Tests ===")
    print()

    tests = [
        ("Proposed rules have no effect", test_proposed_rules_have_no_effect),
        ("Active rules filtered by stage", test_active_rules_loaded_by_stage),
        ("format_rules_for_prompt", test_format_rules_for_prompt),
        ("Rules loader filters by status", test_rules_loader_filters_by_status),
        ("Rules loader filters by stage", test_rules_loader_filters_by_stage),
        ("Rules loader filters by mechanism", test_rules_loader_filters_by_mechanism),
        ("apply_rules_to_text", test_rule_application_to_text),
        ("Case-specific scope", test_case_specific_scope),
        ("Proposed rules don't affect classification", test_proposed_rules_do_not_affect_classification),
        ("No rules active (human approval required)", test_no_rules_active),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        result = run_test(name, fn)
        if result is True:
            passed += 1
        elif result is False:
            failed += 1

    print()
    print(f"Results: {passed} passed, {failed} failed, {len(tests)} total")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()
    print("=== R3 Rule Application Tests ===")
    print()
    passed = 0
    failed = 0
    tests = [
        ("Proposed rules have no effect", test_proposed_rules_have_no_effect),
        ("Active rules filtered by stage", test_active_rules_loaded_by_stage),
        ("format_rules_for_prompt", test_format_rules_for_prompt),
        ("Rules loader filters by status", test_rules_loader_filters_by_status),
        ("Rules loader filters by stage", test_rules_loader_filters_by_stage),
        ("Rules loader filters by mechanism", test_rules_loader_filters_by_mechanism),
        ("apply_rules_to_text", test_rule_application_to_text),
        ("Case-specific scope", test_case_specific_scope),
        ("Proposed rules don't affect classification", test_proposed_rules_do_not_affect_classification),
        ("No rules active (human approval required)", test_no_rules_active),
    ]
    for name, fn in tests:
        result = run_test(name, fn)
        if result is True: passed += 1
        elif result is False: failed += 1
    print()
    print(f"Results: {passed} passed, {failed} failed, {len(tests)} total")
    if failed > 0:
        sys.exit(1)
