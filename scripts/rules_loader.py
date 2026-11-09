#!/usr/bin/env python3
"""Shared rules loader for the Research Intelligence system.

Loads active rules from rules.json, filtered by stage and mechanism.
Only rules with status='active' and human approval are returned.

Usage:
    from rules_loader import load_active_rules, format_rules_for_prompt

    # For translation stage
    rules = load_active_rules(stage="translation")
    prompt_addition = format_rules_for_prompt(rules, stage="translation")

    # For classification stage (deterministic)
    rules = load_active_rules(stage="classification", mechanism="code_check")
"""

import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULES_PATH = os.path.join(ROOT, "correspondence", "extracted", "rules.json")
CORRECTIONS_PATH = os.path.join(ROOT, "correspondence", "extracted", "corrections.json")


def bump_rule_version(rule, new_pattern=None, new_correction=None, new_rationale=None):
    """Create a new version of a rule, preserving the old version in history.

    Returns the updated rule dict with incremented version and history entry.
    """
    if "version_history" not in rule:
        rule["version_history"] = []
    # Record current version in history
    history_entry = {
        "version": rule.get("version", 1),
        "pattern": rule.get("pattern"),
        "correction": rule.get("correction"),
        "rationale": rule.get("rationale"),
        "changed_at": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
    }
    rule["version_history"].append(history_entry)
    # Apply changes
    if new_pattern is not None:
        rule["pattern"] = new_pattern
    if new_correction is not None:
        rule["correction"] = new_correction
    if new_rationale is not None:
        rule["rationale"] = new_rationale
    rule["version"] = rule.get("version", 1) + 1
    return rule


def load_rules(status=None, stage=None, mechanism=None):
    """Load rules from rules.json, optionally filtered."""
    if not os.path.exists(RULES_PATH):
        return {}
    try:
        data = json.load(open(RULES_PATH))
    except (json.JSONDecodeError, IOError):
        return {}
    rules = data.get("rules", {})
    result = {}
    for rid, rule in rules.items():
        if status and rule.get("status") != status:
            continue
        # Exclude implemented_as_code from active loading (already in code)
        if status == "active" and rule.get("status") == "implemented_as_code":
            continue
        if stage and rule.get("stage") != stage:
            continue
        if mechanism and rule.get("mechanism") != mechanism:
            continue
        # Scope enforcement: only generalizable rules can be applied globally
        # Case-specific rules are never returned (fail closed)
        scope = rule.get("scope")
        if scope is None or scope not in ("generalizable",):
            continue  # fail closed: unknown/missing/invalid scope
        if scope == "case_specific":
            continue  # case-specific rules never applied globally
        result[rid] = rule
    return result


def load_active_rules(stage=None, mechanism=None, case_context=None):
    """Load only active (human-approved) rules, optionally filtered by stage/mechanism.

    Scope enforcement:
    - Only generalizable rules are returned.
    - case_specific rules are never returned (fail closed).
    - If case_context is provided, case_specific rules matching that context
      could be included, but this is not yet implemented (fail closed).
    """
    rules = load_rules(status="active", stage=stage, mechanism=mechanism)
    # Double-check scope (defense in depth)
    return {rid: r for rid, r in rules.items() if r.get("scope") == "generalizable"}


def format_rules_for_prompt(rules, stage=None):
    """Format active rules as prompt instructions for a given stage.

    Returns a string to append to the system prompt, or empty string if no rules.
    """
    if not rules:
        return ""
    lines = ["\n=== APPROVED CORRECTION RULES (apply consistently) ==="]
    for rid, rule in rules.items():
        if stage and rule.get("stage") != stage:
            continue
        version = rule.get("version", 1)
        lines.append(f"- [{rid} v{version}] {rule.get('pattern', '')} → {rule.get('correction', '')}")
        if rule.get("rationale"):
            lines.append(f"  Rationale: {rule['rationale']}")
    lines.append("=== END RULES ===\n")
    return "\n".join(lines) if len(lines) > 2 else ""


def get_deterministic_checks(stage=None):
    """Get active rules with mechanism='code_check' for a given stage.

    Returns list of (rule_id, pattern, correction) tuples.
    """
    rules = load_active_rules(stage=stage, mechanism="code_check")
    return [(rid, r.get("pattern", ""), r.get("correction", "")) for rid, r in rules.items()]


def get_prompt_rules(stage=None):
    """Get active rules with mechanism='prompt_injection' for a given stage.

    Returns dict of rule_id -> rule.
    """
    return load_active_rules(stage=stage, mechanism="prompt_injection")


def apply_rules_to_text(text, rules):
    """Apply deterministic text replacement rules to a string.

    Scope enforcement: only generalizable rules are applied.
    Case-specific, unknown, or missing scope → fail closed (rule skipped).
    Returns (modified_text, list_of_applied_rule_ids).
    """
    applied = []
    for rid, rule in rules.items():
        # Scope enforcement: fail closed
        scope = rule.get("scope")
        if scope is None or scope not in ("generalizable",):
            continue  # fail closed
        if scope != "generalizable":
            continue
        pattern = rule.get("pattern", "")
        correction = rule.get("correction", "")
        if pattern and correction and pattern in text:
            text = text.replace(pattern, correction)
            applied.append(rid)
    return text, applied


if __name__ == "__main__":
    # Self-test
    print("rules_loader module OK")
