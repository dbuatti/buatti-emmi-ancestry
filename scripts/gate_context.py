#!/usr/bin/env python3
"""Shared access to the attachment gate (Step 1) for downstream stages.

`scripts/attachment-gate.py` has a hyphen in its name, so it cannot be imported
by module name.  Everything else (classify-actions.py, draft-reply.py,
draft-new-correspondence.py, and later the single-instruction Sweep) goes
through this helper instead of re-implementing the import dance.

Public API
----------
load_gate()                     -> parsed sidecar (or empty skeleton)
thread_gate(message_ids)        -> per-message gate entries for those messages
context_for_thread(message_ids)-> (text_block, provenance, warnings)
ensure_gate(message_ids)        -> runs the gate CLI for messages with no record
                                   (bounded: only the messages asked for)

Nothing here writes to Gmail, sends anything, or touches family data.
"""
import importlib.util
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
GATE_SCRIPT = os.path.join(HERE, "attachment-gate.py")

_GATE_MOD = None


def _gate_module():
    global _GATE_MOD
    if _GATE_MOD is None:
        spec = importlib.util.spec_from_file_location("attachment_gate", GATE_SCRIPT)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        _GATE_MOD = mod
    return _GATE_MOD


def load_gate():
    return _gate_module().load_gate()


def thread_gate(message_ids, gate=None):
    """Gate entries for the given DB message ids (missing ones are simply absent)."""
    gate = gate or load_gate()
    entries = {}
    for mid in message_ids or []:
        e = gate.get("messages", {}).get(str(mid))
        if e:
            entries[int(mid)] = e
    return entries


def context_for_thread(message_ids, gate=None, max_chars=8000):
    """(text_block, provenance, warnings) for drafting.

    Only `text_extracted` / `ocr_extracted` attachments are offered to the
    model.  Everything else becomes an explicit warning, because a draft must
    never claim to have read a document nobody could read.
    """
    mod = _gate_module()
    gate = gate or load_gate()
    block, prov = mod.attachment_context(gate, list(message_ids or []), max_chars=max_chars)

    warnings = []
    for mid in message_ids or []:
        e = gate.get("messages", {}).get(str(mid))
        if not e:
            continue
        for a in e.get("attachments") or []:
            if a.get("kind") not in ("document", "image"):
                continue
            status = a.get("status")
            if status in ("text_extracted", "ocr_extracted", "duplicate"):
                continue
            warnings.append(
                "Attachment %s on message %s could not be read (%s) — its contents "
                "are unknown; do not describe them in the draft."
                % (a.get("filename"), mid, status)
            )
    return block, prov, warnings


def ensure_gate(message_ids, allow_download=True):
    """Run the gate CLI for messages that have no gate record yet.

    Bounded by design: only the messages explicitly passed in are processed,
    never the archive.  Returns the list of message ids it actually gated.
    """
    gate = load_gate()
    missing = [str(m) for m in (message_ids or []) if str(m) not in gate.get("messages", {})]
    gated = []
    for mid in missing:
        cmd = [sys.executable, GATE_SCRIPT, "--message", mid]
        if not allow_download:
            cmd.append("--no-download")
        try:
            subprocess.run(cmd, capture_output=True, text=True, timeout=1800, check=False)
            gated.append(mid)
        except Exception:
            continue
    return gated


if __name__ == "__main__":
    ids = [int(x) for x in sys.argv[1:]]
    blk, prov, warns = context_for_thread(ids)
    print(blk)
    print("\n--- provenance ---")
    print(json.dumps(prov, indent=2, ensure_ascii=False))
    print("\n--- warnings ---")
    for w in warns:
        print("-", w)
