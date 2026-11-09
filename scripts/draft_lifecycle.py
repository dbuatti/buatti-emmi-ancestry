#!/usr/bin/env python3
"""Draft lifecycle helpers (pure functions, no I/O of correspondence data).

Distinguishes a STALE regeneration of a terminal historical draft from a NEW
correspondence event (a genuinely newer inbound message in the same thread).
A terminal draft whose thread has no newer inbound is historical evidence and
must never be regenerated or reactivated — even with --force. A terminal draft
whose thread DOES have a newer inbound is a legitimate new event: the new draft
is written to a fresh versioned file, leaving the historical file untouched.

Public API
----------
readiness(d); status(d)
is_suppressed(d)                -> suppression decision of the stored draft
is_terminal(d)                  -> sent | retired | superseded | blocked | suppressed
has_new_inbound(existing, msgs) -> timestamp str of a newer inbound, or None
next_version_path(existing_path)-> next free `stem_N.json` path
resolve_stale(existing, msgs)   -> "reverify" | "new_version"

Only used by scripts/draft-reply.py and scripts/draft-new-correspondence.py.
Regression tests: scripts/test-draft-lifecycle.py.
"""
import os

TERMINAL_STATUSES = {"sent", "retired", "superseded", "blocked"}


def readiness(d):
    return str((d or {}).get("readiness") or "").lower()


def status(d):
    return str((d or {}).get("status") or "").lower()


def is_suppressed(d):
    """True when the stored draft carries a suppression decision itself."""
    d = d or {}
    if d.get("suppressed"):
        return True
    pv = d.get("provenance") or {}
    if pv.get("suppressed"):
        return True
    snc = pv.get("suggested_new_correspondence") or {}
    return bool(snc.get("suppressed"))


def is_terminal(d):
    """Terminal lifecycle states blocked from stale regeneration."""
    return readiness(d) in TERMINAL_STATUSES or status(d) in TERMINAL_STATUSES or is_suppressed(d)


def has_new_inbound(existing, msgs):
    """Timestamp of an inbound message genuinely newer than `existing`.

    The thread's latest inbound alone is not a decision: the message must be
    strictly newer than the existing draft's generation time, so historical
    drafts never reactivate themselves.
    """
    generated = (existing or {}).get("generated_at")
    if not generated:
        return None
    latest_inbound_ts = None
    for m in (msgs or []):
        if (m or {}).get("direction") != "in":
            continue
        ts = (m or {}).get("received_at") or (m or {}).get("sent_at")
        if ts and (latest_inbound_ts is None or ts > latest_inbound_ts):
            latest_inbound_ts = ts
    if latest_inbound_ts and latest_inbound_ts > generated:
        return latest_inbound_ts
    return None


def next_version_path(existing_path):
    """Next free versioned path beside `existing_path` (stem_2.json ...)."""
    d, base = os.path.split(existing_path)
    stem, ext = os.path.splitext(base)
    if ext != ".json":
        return existing_path
    n = 2
    while os.path.exists(os.path.join(d, stem + ("_%d" % n) + ext)):
        n += 1
    return os.path.join(d, stem + ("_%d" % n) + ext)


def _version_files(directory, stem):
    """Versioned sibling drafts stem_2.json, stem_3.json ... (sorted)."""
    out = []
    n = 2
    while True:
        p = os.path.join(directory, stem + ("_%d" % n) + ".json")
        if not os.path.exists(p):
            return out
        out.append(p)
        n += 1


def resolve_stale(existing, existing_path, msgs, load_json=None):
    """Resolve whether the terminal `existing` draft is stale or historical.

    Returns ("reverify", path_to_current) when the draft stays historical, or
    ("new_version", fresh_path) when a genuinely newer inbound exists and the
    draft is not itself suppressed (a suppressed duplicate stays blocked).

    If a versioned draft ALREADY covers the newer inbound (its generated_at is
    newer than that inbound), the versioned file is returned as the current
    draft instead of generating yet another copy — invocation is idempotent.
    """
    if is_suppressed(existing):
        return "reverify", existing_path
    new_ts = has_new_inbound(existing, msgs)
    if new_ts is None:
        return "reverify", existing_path
    directory, base = os.path.split(existing_path)
    stem = base[:-len(".json")] if base.endswith(".json") else base
    for vpath in _version_files(directory, stem):
        draft = None
        if load_json is not None:
            try:
                draft = load_json(vpath)
            except Exception:
                draft = None
        if isinstance(draft, dict):
            generated = draft.get("generated_at") or ""
            if generated and generated >= new_ts:
                return "reverify", vpath
        else:
            # Without a loader, a version file is assumed to cover the new
            # inbound only when it lives beside a stale base draft and the
            # caller can avoid duplicates by not regenerating repeatedly.
            import datetime as _dt
            mtime = datetime.datetime.utcfromtimestamp(os.path.getmtime(vpath))
            mtime_iso = mtime.replace(tzinfo=datetime.timezone.utc).isoformat()
            if mtime_iso >= new_ts:
                return "reverify", vpath
    return "new_version", next_version_path(existing_path)
