#!/usr/bin/env python3
"""Evaluate assistant threads against autonomy rules and produce suggestions."""

import json, re, datetime, sys, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RULES_PATH = ROOT / "src" / "data" / "assistant-rules.json"


def load_rules():
    with open(RULES_PATH) as f:
        data = json.load(f)
    return data.get("rules", []), data.get("auto_approval", "high_confidence")


def load_summary():
    """Run the summary script and parse its output."""
    script = ROOT / "scripts" / "assistant-summary.py"
    result = subprocess.run(
        [sys.executable, str(script)],
        cwd=str(ROOT),
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        print(f"Error running summary script: {result.stderr}", file=sys.stderr)
        return {}
    return json.loads(result.stdout)


def check_thread_against_rule(thread, rule):
    trig = rule.get("trigger", {})
    inst = thread.get("institution") or ""
    inst_norm = re.sub(r"[^\w\s]", "", inst.lower().strip()).lower()
    inst_match = any(re.sub(r"[^\w]", "", str(x)).lower() in inst_norm for x in trig.get("institutions", []))
    if trig.get("institutions") and not inst_match:
        return False

    days_waiting = thread.get("days_waiting") or 0
    if trig.get("min_days_waiting") and days_waiting < trig["min_days_waiting"]:
        return False

    cls = (thread.get("classification") or "").lower()
    if trig.get("classification") and cls not in trig["classification"]:
        return False

    # Keyword check on snippet + people
    haystack = " ".join([
        inst,
        thread.get("latest_inbound_snippet") or "",
        ", ".join(thread.get("people") or []),
    ]).lower()
    for kw in trig.get("keywords", []):
        if kw.lower() in haystack.lower():
            return True
    if trig.get("keywords") and not any(kw.lower() in haystack.lower() for kw in trig["keywords"]):
        # If keywords specified but none match, fail
        return False

    return True


def evaluate_threads(rules, summary):
    suggestions = []
    for thread in summary.get("pending_actions", []):
        for rule in rules:
            if not rule.get("enabled", False):
                continue
            if check_thread_against_rule(thread, rule):
                suggestions.append({
                    "thread_id": thread.get("thread_id"),
                    "gmail_thread_id": thread.get("gmail_thread_id"),
                    "account_email": thread.get("account_email"),
                    "institution": thread.get("institution"),
                    "people": thread.get("people") or [],
                    "classification": thread.get("classification"),
                    "days_waiting": thread.get("days_waiting"),
                    "protocol_refs": thread.get("protocol_refs") or [],
                    "latest_inbound_snippet": thread.get("latest_inbound_snippet") or "",
                    "rule_id": rule.get("id"),
                    "confidence": rule.get("confidence", 50),
                    "auto_action": rule.get("auto_action", "suggest"),
                    "draft_template": rule.get("draft_template"),
                    "human_review": rule.get("human_review", True),
                })
    return suggestions


def main():
    rules, auto_approval = load_rules()
    summary = load_summary()
    suggestions = evaluate_threads(rules, summary)
    output = {
        "auto_approval": auto_approval,
        "suggestions": suggestions,
        "summary": summary,
    }
    print(json.dumps(output, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
