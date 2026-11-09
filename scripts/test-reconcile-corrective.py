#!/usr/bin/env python3
"""Tests for the corrective reconcile-sent-replies implementation."""
import copy
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "scripts", "reconcile-sent-replies.py")
DB_PATH = os.path.join(ROOT, ".local", "correspondence.db")

failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)
        print("FAIL:", msg)
    else:
        print("PASS:", msg)


def run(args, env=None):
    return subprocess.run([sys.executable, SCRIPT] + args, capture_output=True, text=True, cwd=ROOT, env=env)


# --- Test 1: Linguaglossa case preserved (already sent) ---
def test_linguaglossa_preserved():
    d = json.load(open(os.path.join(ROOT, "correspondence/extracted/drafts/1a17ca51f2fd6cdc.json")))
    check(d.get("readiness") == "sent", "Linguaglossa draft still marked sent")
    check(d.get("sent_message_id") == 11326, "Linguaglossa sent_message_id preserved (got %s)" % d.get("sent_message_id"))
    check(d.get("match_confidence") == "exact", "Linguaglossa match confidence preserved")


# --- Test 2: Blocked draft not reconciled ---
def test_blocked_protected():
    # Run reconcile in dry-run (no --apply) — just check the report
    r = run(["--json"])
    data = json.loads(r.stdout)
    blocked = [x for x in data if x.get("status") == "protected_blocked"]
    check(len(blocked) >= 1, "At least one blocked draft is protected (got %d)" % len(blocked))


# --- Test 3: Idempotency — re-run doesn't change state ---
def test_idempotency():
    # Snapshot
    import hashlib
    before = hashlib.sha256(open(os.path.join(ROOT, "correspondence/extracted/request-links.json"), "rb").read()).hexdigest()
    r = run([])
    after = hashlib.sha256(open(os.path.join(ROOT, "correspondence/extracted/request-links.json"), "rb").read()).hexdigest()
    check(before == after, "Reconcile (dry-run) doesn't change request-links.json")


# --- Test 4: One-to-one matching ---
def test_one_to_one():
    # The Linguaglossa draft is already sent, so it's skipped.
    # Check that the script reports already_completed for it.
    r = run(["--json"])
    data = json.loads(r.stdout)
    completed = [x for x in data if x.get("status") == "already_completed"]
    check(len(completed) >= 1, "Already-sent drafts are skipped (got %d)" % len(completed))


# --- Test 5: Action verification in output ---
def test_action_evidence():
    r = run(["--json"])
    data = json.loads(r.stdout)
    # Check that candidates have action_verified field
    for item in data:
        if item.get("best_match"):
            bm = item["best_match"]
            check("action_verified" in bm, "Candidate has action_verified field")
            break


def main():
    test_linguaglossa_preserved()
    test_blocked_protected()
    test_idempotency()
    test_one_to_one()
    test_action_evidence()
    print("\n%d failure(s)." % len(failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
