#!/usr/bin/env python3
"""Propose reusable rules from generalizable corrections.

Reads corrections.json, identifies generalizable corrections that don't yet
have an associated rule, and proposes new rules for human approval.

Usage:
  python scripts/propose-rules.py              # propose rules from all generalizable corrections
  python scripts/propose-rules.py --dry-run     # show what would be proposed

Rules are stored in rules.json with status='proposed'. They must be explicitly
approved before becoming active. No rules are auto-approved.

No database schema changes. No historical reprocessing. No familyData.ts changes.
"""
import argparse, json, os, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORRECTIONS_PATH = os.path.join(ROOT, "correspondence", "extracted", "corrections.json")
RULES_PATH = os.path.join(ROOT, "correspondence", "extracted", "rules.json")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from safe_write import safe_write_json, read_with_version

# Map correction types to rule application stages
TYPE_TO_STAGE = {
    "translation": "translation",
    "entity_extraction": "analysis",
    "relationship": "analysis",
    "chronology": "analysis",
    "evidence": "extraction",
    "action_detection": "classification",
    "drafting": "drafting",
    "classification": "classification",
    "other": "analysis",
}

# Map correction types to how the rule is applied
TYPE_TO_MECHANISM = {
    "translation": "prompt_injection",
    "entity_extraction": "prompt_injection",
    "relationship": "prompt_injection",
    "chronology": "prompt_injection",
    "evidence": "prompt_injection",
    "action_detection": "code_check",
    "drafting": "prompt_injection",
    "classification": "code_check",
    "other": "prompt_injection",
}

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if not os.path.exists(CORRECTIONS_PATH):
        print("No corrections file found.")
        return
    corrections_data = json.load(open(CORRECTIONS_PATH))
    corrections = corrections_data.get("corrections", {})

    if os.path.exists(RULES_PATH):
        rules_data = json.load(open(RULES_PATH))
    else:
        rules_data = {"version": 1, "rules": {}, "generated_at": None}
    rules = rules_data.get("rules", {})

    # Find generalizable corrections without an associated rule
    proposed = []
    for corr_id, corr in corrections.items():
        if corr.get("scope") != "generalizable":
            continue
        if corr.get("human_confirmed") is not True:
            continue
        if corr.get("rule_proposed"):
            # Already has a rule proposed
            continue
        proposed.append((corr_id, corr))

    if not proposed:
        print("No new generalizable corrections to propose rules from.")
        return

    new_rules = {}
    for corr_id, corr in proposed:
        rule_id = f"rule_{len(rules) + len(new_rules) + 1:03d}"
        rule = {
            "id": rule_id,
            "version": 1,
            "scope": corr.get("scope", "case_specific"),
            "type": corr["correction_type"],
            "stage": TYPE_TO_STAGE.get(corr["correction_type"], "analysis"),
            "mechanism": TYPE_TO_MECHANISM.get(corr["correction_type"], "prompt_injection"),
            "pattern": corr["original"],
            "correction": corr["corrected"],
            "rationale": corr.get("notes", ""),
            "evidence": corr.get("evidence", ""),
            "source_corrections": [corr_id],
            "source_messages": [corr.get("message_id")] if corr.get("message_id") else [],
            "source_threads": [corr.get("thread_id")] if corr.get("thread_id") else [],
            "status": "proposed",
            "proposed_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "approved_at": None,
            "approved_by": None,
            "applied_count": 0,
            "last_applied": None,
            "model_version": corr.get("model_version"),
            "prompt_version": corr.get("prompt_version"),
        }
        new_rules[rule_id] = rule

        # Link correction to proposed rule
        corr["rule_proposed"] = rule_id

    if args.dry_run:
        print(f"Would propose {len(new_rules)} rules:")
        for rid, r in new_rules.items():
            print(f"  {rid}: [{r['type']}] {r['pattern'][:50]} → {r['correction'][:50]}")
        return

    # Write proposed rules to rules.json
    rules.update(new_rules)
    rules_data["rules"] = rules
    rules_data["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    _, rv = read_with_version(RULES_PATH) if os.path.exists(RULES_PATH) else (None, None)
    safe_write_json(RULES_PATH, rules_data, "script", rv, ["rules"], "Proposed rules from corrections")

    # Update corrections.json with rule_proposed links
    corrections_data["corrections"] = corrections
    corrections_data["generated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    _, cv = read_with_version(CORRECTIONS_PATH)
    safe_write_json(CORRECTIONS_PATH, corrections_data, "script", cv, ["corrections"], "Linked corrections to proposed rules")

    print(f"Proposed {len(new_rules)} rules. Review and approve in the Research Centre.")

if __name__ == "__main__":
    main()
    main()
