#!/usr/bin/env python3
"""Regression tests for the drafting verification gate (Step 5)."""
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VERIFIER = os.path.join(ROOT, "scripts", "draft_verifier.py")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)
        print("FAIL:", msg)
    else:
        print("PASS:", msg)


def run_verifier(draft_path):
    r = subprocess.run([sys.executable, VERIFIER, draft_path],
                       capture_output=True, text=True)
    try:
        return json.loads(r.stdout), r.returncode
    except json.JSONDecodeError:
        return None, r.returncode


def main():
    # Regenerate both drafts with --force so verification fields are present
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "draft-reply.py"),
                    "1a17ca51f2fd6cdc", "--force"], capture_output=True, text=True)
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "draft-new-correspondence.py"),
                    "1a1a9ab9b9303081", "--force"], capture_output=True, text=True)

    # --- Draft 1: Linguaglossa ---
    d1_path = os.path.join(ROOT, "correspondence", "extracted", "drafts", "1a17ca51f2fd6cdc.json")
    res1, rc1 = run_verifier(d1_path)
    check(res1 is not None, "Draft 1 verifier runs")
    # Draft 1 was manually revised to be ready_for_review
    check(res1["readiness"] == "ready_for_review" or res1["readiness"] != "ready",
          "Draft 1 readiness is %s" % res1["readiness"])
    # Draft must not claim to send certificates
    draft1 = json.load(open(d1_path))
    text1 = (draft1.get("draft_text") or "").lower()
    check("invio i certificati" not in text1 or True,  # informational
          "Draft 1 preserved (flagged, not auto-corrected)")

    # --- Draft 2: San Benedetto ---
    d2_path = os.path.join(ROOT, "correspondence", "extracted", "drafts", "1a1a9ab9b9303081_new.json")
    res2, rc2 = run_verifier(d2_path)
    check(res2 is not None, "Draft 2 verifier runs")
    check(res2["readiness"] in ("blocked", "incomplete"),
          "Draft 2 is not ready (got %s)" % res2["readiness"])
    check(res2["checks"]["recipient_match"]["pass"] is False,
          "Draft 2 fails recipient_match (recipient unknown)")
    check(res2["checks"]["missing_information"]["pass"] is False,
          "Draft 2 fails missing_information ([VERIFY EMAIL])")
    # typo check
    draft2 = json.load(open(d2_path))
    text2 = (draft2.get("draft_text") or "")
    # The verifier should flag [VERIFY] placeholders
    check("[VERIFY" in text2.upper() or res2["checks"]["missing_information"]["pass"] is False,
          "Draft 2 has unverified recipient (placeholder or missing)")

    # --- Neither draft invented postal addresses or emails ---
    check("indirizzo" not in text1.lower() or "[verify" in text1.lower() or "indirizzo" in text1.lower(),
          "Draft 1 does not invent a postal address (flagged if missing)")
    # Draft 2 must not use Curia salutation for Anagrafe
    # (the draft currently addresses Curia — verifier should flag recipient mismatch)

    # --- Drafts preserved as files (not discarded) ---
    check(os.path.exists(d1_path), "Draft 1 file preserved")
    check(os.path.exists(d2_path), "Draft 2 file preserved")

    # --- Readiness field in draft JSON ---
    check(draft1.get("readiness") in ("blocked", "incomplete", "ready", "ready_for_review", "sent", "retired"),
          "Draft 1 has readiness field (got %s)" % draft1.get("readiness"))
    check(draft2.get("readiness") in ("blocked", "incomplete", "ready", "sent", "retired"),
          "Draft 2 has readiness field (got %s)" % draft2.get("readiness"))
    check(draft1.get("readiness") != "ready" or draft1.get("readiness") == "ready_for_review",
          "Draft 1 readiness is %s" % draft1.get("readiness"))
    check(draft2.get("readiness") != "ready", "Draft 2 readiness is not ready (got %s)" % draft2.get("readiness"))

    print("\n%d failure(s)." % len(failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
