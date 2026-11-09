#!/usr/bin/env python3
"""Acceptance tests for Step 2 request-linkage, using the real Ascoli correspondence."""
import importlib.util
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("b", os.path.join(ROOT, "scripts", "build-request-links.py"))
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)

RL_PATH = os.path.join(ROOT, "correspondence", "extracted", "request-links.json")
failures = []


def check(cond, msg):
    if not cond:
        failures.append(msg)
        print("FAIL:", msg)
    else:
        print("PASS:", msg)


def main():
    # Rebuild (idempotent)
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py")],
                   capture_output=True, text=True, check=True)
    threads = json.load(open(os.path.join(ROOT, "correspondence", "extracted", "threads.json"))).get("threads", {})
    rl = json.load(open(RL_PATH))
    reqs = rl.get("requests", {})

    # Find the D13 death-act request (outbound msg 59)
    d13 = [r for r in reqs.values() if r.get("source_message_id") == 59]
    check(len(d13) == 1, "D13 request exists (outbound msg 59)")
    r = d13[0] if d13 else {}
    rid = r.get("request_id")
    check(r.get("status") == "documents_received",
          "D13 status is documents_received (got %s)" % r.get("status"))
    check(r.get("fulfilment") == "unverified",
          "D13 fulfilment is unverified (got %s)" % r.get("fulfilment"))

    # Reply linkage across separate threads
    replies = r.get("linked_replies", [])
    check(len(replies) == 1, "D13 has exactly one linked reply (got %d)" % len(replies))
    if replies:
        lr = replies[0]
        check(lr.get("thread_id") == "1a1abc46de4b71d3",
              "D13 reply is thread 1a1abc46de4b71d3 (got %s)" % lr.get("thread_id"))
        check(lr.get("message_id") == 14,
              "D13 reply is msg 14 (got %s)" % lr.get("message_id"))
        check(lr.get("has_documents") is True,
              "D13 reply carries documents")
        check(lr.get("confidence") in ("high", "medium"),
              "D13 reply confidence %s" % lr.get("confidence"))

    # Document linkage
    check(3 in (r.get("linked_attachments") or []),
          "D13 linked attachment 3 (got %s)" % r.get("linked_attachments"))

    # Event chain: distinct event kinds
    kinds = [e.get("kind") for e in r.get("linked_events", [])]
    check("request_sent" in kinds, "event: request_sent present")
    check("pec_accepted" in kinds, "event: pec_accepted present (msg 43)")
    check("protocol_registered" in kinds, "event: protocol_registered present")
    check("document_supplied" in kinds, "event: document_supplied present (msg 14)")
    check("substantive_response_received" in kinds, "event: substantive_response_received present")
    # pec_accepted and document_supplied must be distinct events
    pec_msg = [e["message_id"] for e in r["linked_events"] if e["kind"] == "pec_accepted"]
    doc_msg = [e["message_id"] for e in r["linked_events"] if e["kind"] == "document_supplied"]
    check(pec_msg and doc_msg and pec_msg != doc_msg,
          "PEC acceptance (msg %s) distinct from document supply (msg %s)" % (pec_msg, doc_msg))
    # fulfilment_confirmed must NOT be derived
    check("fulfilment_confirmed" not in kinds,
          "fulfilment_confirmed is never derived")

    # Ambiguity: the ambiguous Ascoli follow-up must not be silently assigned
    # Find a request that is ambiguous
    ambig = [rr for rr in reqs.values() if rr.get("ambiguous")]
    check(len(ambig) > 0, "at least one ambiguous request flagged (got %d)" % len(ambig))
    # D13 itself must not be ambiguous
    check(not r.get("ambiguous"), "D13 is not ambiguous")

    # Human preservation: fulfilment cannot be set to fulfilled by the builder
    check(r.get("fulfilment") != "fulfilled",
          "builder never sets fulfilled (got %s)" % r.get("fulfilment"))

    # Idempotency: re-run and compare request_ids + human fields
    before = json.load(open(RL_PATH))
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py")],
                   capture_output=True, text=True, check=True)
    after = json.load(open(RL_PATH))
    check(set(before["requests"].keys()) == set(after["requests"].keys()),
          "idempotent: same request_ids after rebuild")
    check(before["requests"][rid].get("fulfilment") == after["requests"][rid].get("fulfilment"),
          "idempotent: fulfilment preserved")

    # Human confirmation round-trip
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py"),
                    "--confirm-fulfilled", rid], capture_output=True, text=True, check=True)
    rl2 = json.load(open(RL_PATH))
    r2 = rl2["requests"][rid]
    check(r2.get("fulfilment") == "fulfilled", "confirm-fulfilled sets fulfilled")
    check(r2.get("fulfilment_confirmed_by") == "user", "confirm-fulfilled records confirmer")
    # rebuild must preserve the human-confirmed fulfilment
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py")],
                   capture_output=True, text=True, check=True)
    rl3 = json.load(open(RL_PATH))
    check(rl3["requests"][rid].get("fulfilment") == "fulfilled",
          "rebuild preserves human-confirmed fulfilment")

    # Restore unverified state before readable/unverified tests
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py"),
                    "--confirm-fulfilled", rid], capture_output=True, text=True)  # noop if already
    # Actually reset fulfilment to unverified via sidecar edit
    _d = json.load(open(RL_PATH))
    _d["requests"][rid]["fulfilment"] = "unverified"
    _d["requests"][rid]["fulfilment_confirmed_by"] = None
    _d["requests"][rid]["fulfilment_confirmed_at"] = None
    _d["requests"][rid]["status"] = "documents_received"
    json.dump(_d, open(RL_PATH, "w"), indent=2, ensure_ascii=False)
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py")],
                   capture_output=True, text=True, check=True)

    # Readable-but-unverified documents must still set needs_review
    rl4 = json.load(open(RL_PATH))
    r4 = rl4["requests"][rid]
    check(r4.get("needs_review") is True,
          "D13 needs_review is True (readable/unverified docs) (got %s)" % r4.get("needs_review"))
    check(r4.get("review_reason") is not None,
          "D13 has a review_reason (got %s)" % r4.get("review_reason"))
    # Marking reviewed clears needs_review but does NOT mark fulfilled
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py"),
                    "--mark-reviewed", rid, "inspected docs"], capture_output=True, text=True, check=True)
    rl5 = json.load(open(RL_PATH))
    r5 = rl5["requests"][rid]
    check(r5.get("needs_review") is False, "mark-reviewed clears needs_review")
    check(r5.get("fulfilment") == "unverified",
          "mark-reviewed does NOT set fulfilment (got %s)" % r5.get("fulfilment"))
    # restore needs_review=True for clean state
    rl5["requests"][rid]["needs_review"] = True
    rl5["requests"][rid]["reviewed_at"] = None
    rl5["requests"][rid]["reviewed_by"] = None
    rl5["requests"][rid]["review_reason"] = r4.get("review_reason")
    json.dump(rl5, open(RL_PATH, "w"), indent=2, ensure_ascii=False)
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py")],
                   capture_output=True, text=True, check=True)

    # Missing message ID handling: confirm-link on a non-existent thread must
    # be rejected (no fabricated message_id 0 recorded).
    r0 = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py"),
                         "--confirm-link", rid, "nonexistent_thread_xyz", "0"],
                        capture_output=True, text=True)
    check(r0.returncode != 0, "confirm-link on thread with no messages is rejected (rc=%d)" % r0.returncode)
    rl_after = json.load(open(RL_PATH))
    r_after = rl_after["requests"][rid]
    bad = [lr for lr in (r_after.get("linked_replies") or []) if lr.get("message_id") == 0]
    check(len(bad) == 0, "no link recorded with message_id 0 (got %d)" % len(bad))
    rl3["requests"][rid]["fulfilment"] = "unverified"
    rl3["requests"][rid]["fulfilment_confirmed_by"] = None
    rl3["requests"][rid]["fulfilment_confirmed_at"] = None
    rl3["requests"][rid]["status"] = "documents_received"
    for it in rl3["requests"][rid].get("requested_items", []):
        if it.get("status") == "fulfilled":
            it["status"] = "open"
            it.pop("fulfilled_by", None)
            it.pop("fulfilled_at", None)
    with open(RL_PATH, "w", encoding="utf-8") as f:
        json.dump(rl3, f, indent=2, ensure_ascii=False)
    # rebuild to restore derived consistency
    subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py")],
                   capture_output=True, text=True, check=True)

    print("\n%d failure(s)." % len(failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
