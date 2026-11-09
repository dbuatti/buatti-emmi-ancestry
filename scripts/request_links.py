#!/usr/bin/env python3
"""Shared access to request-links (Step 2) for downstream stages."""
import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RL_PATH = os.path.join(ROOT, "correspondence", "extracted", "request-links.json")


def load_request_links():
    try:
        with open(RL_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, dict) else {"version": 1, "requests": {}}
    except (OSError, ValueError):
        return {"version": 1, "requests": {}}


def requests_for_thread(thread_id):
    rl = load_request_links()
    out = []
    for rid, r in (rl.get("requests") or {}).items():
        if r.get("source_thread") == thread_id:
            out.append(r)
        for lr in (r.get("linked_replies") or []):
            if lr.get("thread_id") == thread_id:
                out.append(r)
                break
    # dedup
    seen = set()
    uniq = []
    for r in out:
        if r["request_id"] in seen:
            continue
        seen.add(r["request_id"])
        uniq.append(r)
    return uniq


def request_context(thread_id, max_chars=4000):
    """Text block for drafting: linked request + fulfilment state + ambiguity."""
    reqs = requests_for_thread(thread_id)
    if not reqs:
        return "", []
    blocks = []
    for r in reqs:
        items = "; ".join("%s [%s]" % (i.get("description"), i.get("status", "open"))
                          for i in (r.get("requested_items") or []))
        events = ", ".join("%s(%s)" % (e.get("kind"), (e.get("date") or "")[:10])
                           for e in (r.get("linked_events") or []))
        block = (
            "--- REQUEST LINK: %s ---\n"
            "Institution: %s\n"
            "Status: %s | Fulfilment: %s (unverified until human confirms)\n"
            "Requested items: %s\n"
            "Linked replies: %s\n"
            "Events: %s\n"
            "Ambiguous: %s%s\n"
            "Human notes: %s"
        ) % (
            r["request_id"],
            r.get("institution"),
            r.get("status"),
            r.get("fulfilment"),
            items or "(none recorded)",
            ", ".join("%s msg %s (%s)" % (lr.get("thread_id"), lr.get("message_id"), lr.get("confidence"))
                      for lr in (r.get("linked_replies") or [])) or "(none)",
            events or "(none)",
            r.get("ambiguous"),
            (" — candidates: " + ", ".join(c.get("thread_id") for c in r.get("ambiguity_candidates", []))) if r.get("ambiguous") else "",
            r.get("human_notes") or "(none)",
        )
        blocks.append(block)
    body = "\n\n".join(blocks)
    header = ("=== REQUEST LINKAGE (Step 2, derived, unverified fulfilment) ===\n"
              "The following connects this correspondence to the original research request. "
              "Fulfilment is never confirmed by the system; only a human can confirm it.\n")
    return (header + body)[:max_chars], reqs


def confirm_fulfilled(request_id):
    import subprocess
    cmd = [sys.executable, os.path.join(HERE, "build-request-links.py"),
           "--confirm-fulfilled", request_id]
    return subprocess.run(cmd, capture_output=True, text=True)


if __name__ == "__main__":
    print(json.dumps(load_request_links().get("requests", {}), indent=2, ensure_ascii=False)[:3000])
