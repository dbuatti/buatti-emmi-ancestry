#!/usr/bin/env python3
"""R3.2 — Rule Safety and Controlled Output Tests.

Tests scope enforcement, versioning, and actual rule application.
Uses isolated test rules (not production rules). Does not activate production rules.

Usage:
  python scripts/test-rule-safety.py              # run all tests
  python scripts/test-rule-safety.py --verbose    # show details

No database schema changes. No familyData.ts changes. No commits or pushes.
"""
import argparse, json, os, sys, copy

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
from rules_loader import (load_rules, load_active_rules, format_rules_for_prompt,
                          get_prompt_rules, apply_rules_to_text, bump_rule_version,
                          get_deterministic_checks)

RULES_PATH = os.path.join(ROOT, "correspondence", "extracted", "rules.json")

def run_test(name, fn):
    try:
        result = fn()
        if result is True:
            print(f"  PASS: {name}")
            return True
        elif result is False:
            print(f"  FAIL: {name}")
            return False
        else:
            print(f"  SKIP: {name} — {result}")
            return None
    except Exception as e:
        print(f"  ERROR: {name} — {e}")
        return False

# --- Scope enforcement tests ---

def test_scope_enforcement_in_apply():
    """apply_rules_to_text must skip case_specific rules."""
    rules = {
        "r_gen": {"pattern": "bisnonna", "correction": "great-grandmother", "scope": "generalizable"},
        "r_case": {"pattern": "bisnonna", "correction": "great-aunt", "scope": "case_specific"},
    }
    text = "La mia bisnonna."
    modified, applied = apply_rules_to_text(text, rules)
    assert "great-grandmother" in modified, "generalizable rule should apply"
    assert "great-aunt" not in modified, "case_specific rule should NOT apply"
    assert "r_gen" in applied
    assert "r_case" not in applied
    return True

def test_scope_enforcement_unknown():
    """apply_rules_to_text must skip unknown scope (fail closed)."""
    rules = {
        "r_unknown": {"pattern": "test", "correction": "TEST", "scope": "unknown_scope"},
    }
    text = "This is a test."
    modified, applied = apply_rules_to_text(text, rules)
    assert modified == text, "Unknown scope should not modify text"
    assert len(applied) == 0
    return True

def test_scope_enforcement_missing():
    """apply_rules_to_text must skip rules without scope (fail closed)."""
    rules = {
        "r_noscope": {"pattern": "test", "correction": "TEST"},  # no scope field
    }
    text = "This is a test."
    modified, applied = apply_rules_to_text(text, rules)
    assert modified == text, "Missing scope should not modify text"
    assert len(applied) == 0
    return True

def test_scope_enforcement_loader():
    """load_active_rules must not return case_specific rules."""
    # Create temp rule with case_specific scope
    backup = json.load(open(RULES_PATH))
    backup_copy = json.loads(json.dumps(backup))
    backup["rules"]["test_cs"] = {
        "id": "test_cs", "status": "active", "scope": "case_specific",
        "stage": "translation", "mechanism": "prompt_injection",
        "pattern": "test", "correction": "TEST", "version": 1,
    }
    with open(RULES_PATH, "w") as f:
        json.dump(backup, f, indent=2)
    active = load_active_rules()
    assert "test_cs" not in active, "case_specific rule should not be loaded"
    # Restore
    with open(RULES_PATH, "w") as f:
        json.dump(backup_copy, f, indent=2)
    return True

# --- Versioning tests ---

def test_bump_rule_version():
    """bump_rule_version should preserve history and increment version."""
    rule = {
        "id": "test_v", "version": 1, "pattern": "old", "correction": "new",
        "rationale": "test", "scope": "generalizable",
    }
    bumped = bump_rule_version(rule, new_pattern="newer", new_correction="newer2")
    assert bumped["version"] == 2, f"Expected version 2, got {bumped['version']}"
    assert bumped["pattern"] == "newer"
    assert bumped["correction"] == "newer2"
    assert len(bumped["version_history"]) == 1
    assert bumped["version_history"][0]["version"] == 1
    assert bumped["version_history"][0]["pattern"] == "old"
    # Bump again
    bumped2 = bump_rule_version(bumped, new_rationale="updated")
    assert bumped2["version"] == 3
    assert len(bumped2["version_history"]) == 2
    return True

def test_version_in_format_rules():
    """format_rules_for_prompt should include version number."""
    mock_rules = {
        "r1": {"id": "r1", "status": "active", "scope": "generalizable", "stage": "translation",
               "mechanism": "prompt_injection", "pattern": "bisnonna", "correction": "great-grandmother",
               "rationale": "kinship", "version": 2},
    }
    text = format_rules_for_prompt(mock_rules, stage="translation")
    assert "v2" in text, f"Version not in prompt: {text}"
    return True

# --- Controlled output tests (deterministic) ---

def test_translation_rule_positive():
    """Translation rule: bisnonna → great-grandmother (positive case)."""
    rules = {
        "r1": {"pattern": "bisnonna", "correction": "great-grandmother", "scope": "generalizable"},
    }
    text = "La mia bisnonna è deceduta."
    modified, applied = apply_rules_to_text(text, rules)
    assert "great-grandmother" in modified
    assert "bisnonna" not in modified
    assert "r1" in applied
    return True

def test_translation_rule_negative():
    """Translation rule should not apply when pattern is absent."""
    rules = {
        "r1": {"pattern": "bisnonna", "correction": "great-grandmother", "scope": "generalizable"},
    }
    text = "La mia nonna è deceduta."
    modified, applied = apply_rules_to_text(text, rules)
    assert modified == text
    assert len(applied) == 0
    return True

def test_translation_rule_unrelated():
    """Translation rule should not affect unrelated kinship terms."""
    rules = {
        "r1": {"pattern": "bisnonna", "correction": "great-grandmother", "scope": "generalizable"},
    }
    text = "La mia zia è deceduta."
    modified, applied = apply_rules_to_text(text, rules)
    assert modified == text
    assert len(applied) == 0
    # Also test that "zia" is not replaced
    assert "great-grandmother" not in modified
    return True

def test_chronology_rule_positive():
    """Chronology rule: 'turned out to have died on' → 'was already deceased on'."""
    rules = {
        "r2": {"pattern": "turned out to have died on", "correction": "was already deceased on", "scope": "generalizable"},
    }
    text = "She turned out to have died on 4 October 1952."
    modified, applied = apply_rules_to_text(text, rules)
    assert "was already deceased on" in modified
    assert "turned out to have died on" not in modified
    assert "r2" in applied
    return True

def test_chronology_rule_negative():
    """Chronology rule should not apply when pattern is absent."""
    rules = {
        "r2": {"pattern": "turned out to have died on", "correction": "was already deceased on", "scope": "generalizable"},
    }
    text = "She died on 4 October 1952."
    modified, applied = apply_rules_to_text(text, rules)
    assert modified == text
    assert len(applied) == 0
    return True

def test_chronology_rule_unrelated():
    """Chronology rule should not affect unrelated temporal statements."""
    rules = {
        "r2": {"pattern": "turned out to have died on", "correction": "was already deceased on", "scope": "generalizable"},
    }
    text = "The meeting is scheduled for 4 October 2026."
    modified, applied = apply_rules_to_text(text, rules)
    assert modified == text
    assert len(applied) == 0
    return True

def test_evidence_rule_positive():
    """Evidence rule: family recollection should be flagged as unverified."""
    # This is a prompt rule, not a text replacement. Test the format.
    mock_rules = {
        "r5": {"id": "r5", "status": "active", "scope": "generalizable", "stage": "extraction",
               "mechanism": "prompt_injection", "pattern": "Family recollection",
               "correction": "moved to unverified", "rationale": "family recollections are not facts",
               "version": 1},
    }
    text = format_rules_for_prompt(mock_rules, stage="extraction")
    assert "Family recollection" in text
    assert "moved to unverified" in text
    assert "APPROVED CORRECTION RULES" in text
    return True

def test_evidence_rule_unrelated():
    """Evidence rule should not appear in non-extraction stages."""
    mock_rules = {
        "r5": {"id": "r5", "status": "active", "scope": "generalizable", "stage": "extraction",
               "mechanism": "prompt_injection", "pattern": "Family recollection",
               "correction": "moved to unverified", "rationale": "test", "version": 1},
    }
    text = format_rules_for_prompt(mock_rules, stage="translation")
    assert text == "", f"Extraction rule should not appear in translation stage: {text}"
    return True

def test_no_rule_baseline():
    """Verify that without rules, text is unchanged."""
    text = "La mia bisnonna è deceduta."
    modified, applied = apply_rules_to_text(text, {})
    assert modified == text
    assert len(applied) == 0
    return True

def test_multiple_rules_combined():
    """Verify multiple rules can be applied in sequence."""
    rules = {
        "r1": {"pattern": "bisnonna", "correction": "great-grandmother", "scope": "generalizable"},
        "r2": {"pattern": "trisavolo", "correction": "great-great-grandfather", "scope": "generalizable"},
    }
    text = "La mia bisnonna e il mio trisavolo."
    modified, applied = apply_rules_to_text(text, rules)
    assert "great-grandmother" in modified
    assert "great-great-grandfather" in modified
    assert "bisnonna" not in modified
    assert "trisavolo" not in modified
    assert len(applied) == 2
    return True

def test_rule_004_documentation_vs_code():
    """Verify rule_004 is documented as already implemented in code."""
    # Check that is_referral exists in classify-actions.py
    import os
    src = open(os.path.join(ROOT, "scripts", "classify-actions.py")).read()
    assert "is_referral" in src, "is_referral check should exist in classify-actions.py"
    assert "rivolgersi" in src, "rivolgersi should be in the referral check"
    # Check that rule_004 has implementation_note
    rules = json.load(open(os.path.join(ROOT, "correspondence", "extracted", "rules.json")))
    r4 = rules["rules"].get("rule_004", {})
    assert "implementation_note" in r4, "rule_004 should have implementation_note"
    assert "already implemented" in r4.get("implementation_note", "").lower() or "code" in r4.get("implementation_note", "").lower()
    return True

def test_rule_003_general_formulation():
    """Verify rule_003 has a revision note proposing general formulation."""
    rules = json.load(open(os.path.join(ROOT, "correspondence", "extracted", "rules.json")))
    r3 = rules["rules"].get("rule_003", {})
    assert "revision_note" in r3, "rule_003 should have revision_note"
    note = r3.get("revision_note", "")
    assert "general" in note.lower() or "Do not transfer" in note, "Should propose general formulation"
    return True


def test_chronology_rule_positive():
    """Chronology rule: 'turned out to have died on' -> 'was already deceased on' (positive)."""
    from rules_loader import apply_rules_to_text
    rules = {
        "r2": {"pattern": "turned out to have died on", "correction": "was already deceased on", "scope": "generalizable"},
    }
    text = "She turned out to have died on 4 October 1952."
    modified, applied = apply_rules_to_text(text, rules)
    assert "was already deceased on" in modified
    assert "turned out to have died on" not in modified
    assert "r2" in applied
    return True

def test_chronology_rule_negative():
    """Chronology rule should not apply when pattern is absent."""
    from rules_loader import apply_rules_to_text
    rules = {
        "r2": {"pattern": "turned out to have died on", "correction": "was already deceased on", "scope": "generalizable"},
    }
    text = "She died on 4 October 1952."
    modified, applied = apply_rules_to_text(text, rules)
    assert modified == text
    assert len(applied) == 0
    return True

def test_chronology_rule_unrelated():
    """Chronology rule should not affect unrelated temporal statements."""
    from rules_loader import apply_rules_to_text
    rules = {
        "r2": {"pattern": "turned out to have died on", "correction": "was already deceased on", "scope": "generalizable"},
    }
    text = "The meeting is scheduled for 4 October 2026."
    modified, applied = apply_rules_to_text(text, rules)
    assert modified == text
    assert len(applied) == 0
    return True

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    print("=== R3.2 Rule Safety and Controlled Output Tests ===")
    print()

    tests = [
        ("Chronology Rule (positive)", test_chronology_rule_positive),
        ("Chronology Rule (negative)", test_chronology_rule_negative),
        ("Chronology Rule (unrelated)", test_chronology_rule_unrelated),
        ("Scope Enforcement In Apply", test_scope_enforcement_in_apply),
        ("Scope Enforcement Unknown", test_scope_enforcement_unknown),
        ("Scope Enforcement Missing", test_scope_enforcement_missing),
        ("Scope Enforcement Loader", test_scope_enforcement_loader),
        ("Bump Rule Version", test_bump_rule_version),
        ("Version In Format Rules", test_version_in_format_rules),
        ("Translation Rule Positive", test_translation_rule_positive),
        ("Translation Rule Negative", test_translation_rule_negative),
        ("Translation Rule Unrelated", test_translation_rule_unrelated),
        ("Chronology Rule Positive", test_chronology_rule_positive),
        ("Chronology Rule Negative", test_chronology_rule_negative),
        ("Chronology Rule Unrelated", test_chronology_rule_unrelated),
        ("Evidence Rule Positive", test_evidence_rule_positive),
        ("Evidence Rule Unrelated", test_evidence_rule_unrelated),
        ("No Rule Baseline", test_no_rule_baseline),
        ("Multiple Rules Combined", test_multiple_rules_combined),
        ("Rule 004 Documentation Vs Code", test_rule_004_documentation_vs_code),
        ("Rule 003 General Formulation", test_rule_003_general_formulation),
    ]

    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            result = fn()
            if result is True:
                passed += 1
                print(f"  PASS: {name}")
            elif result is False:
                failed += 1
                print(f"  FAIL: {name}")
            else:
                print(f"  SKIP: {name} — {result}")
        except Exception as e:
            failed += 1
            print(f"  ERROR: {name} — {e}")

    print()
    print(f"Results: {passed} passed, {failed} failed, {len(tests)} total")
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    main()
    ap = argparse.ArgumentParser()
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()
    print("=== R3.2 Rule Safety and Controlled Output Tests ===")
    print()
    tests = [
        ("Chronology Rule (positive)", test_chronology_rule_positive),
        ("Chronology Rule (negative)", test_chronology_rule_negative),
        ("Chronology Rule (unrelated)", test_chronology_rule_unrelated),
        ("Scope Enforcement In Apply", test_scope_enforcement_in_apply),
        ("Scope Enforcement Unknown", test_scope_enforcement_unknown),
        ("Scope Enforcement Missing", test_scope_enforcement_missing),
        ("Scope Enforcement Loader", test_scope_enforcement_loader),
        ("Bump Rule Version", test_bump_rule_version),
        ("Version In Format Rules", test_version_in_format_rules),
        ("Translation Rule Positive", test_translation_rule_positive),
        ("Translation Rule Negative", test_translation_rule_negative),
        ("Translation Rule Unrelated", test_translation_rule_unrelated),
        ("Chronology Rule Positive", test_chronology_rule_positive),
        ("Chronology Rule Negative", test_chronology_rule_negative),
        ("Chronology Rule Unrelated", test_chronology_rule_unrelated),
        ("Evidence Rule Positive", test_evidence_rule_positive),
        ("Evidence Rule Unrelated", test_evidence_rule_unrelated),
        ("No Rule Baseline", test_no_rule_baseline),
        ("Multiple Rules Combined", test_multiple_rules_combined),
        ("Rule 004 Documentation Vs Code", test_rule_004_documentation_vs_code),
        ("Rule 003 General Formulation", test_rule_003_general_formulation),
    ]
    passed = 0
    failed = 0
    for name, fn in tests:
        try:
            result = fn()
            if result is True:
                passed += 1
                print(f"  PASS: {name}")
            elif result is False:
                failed += 1
                print(f"  FAIL: {name}")
            else:
                print(f"  SKIP: {name} — {result}")
        except Exception as e:
            failed += 1
            print(f"  ERROR: {name} — {e}")
    print()
    print(f"Results: {passed} passed, {failed} failed, {len(tests)} total")
    if failed > 0:
        sys.exit(1)
