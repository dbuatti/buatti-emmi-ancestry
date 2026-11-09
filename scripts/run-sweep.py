#!/usr/bin/env python3
"""Step 4: controlled dry-run Sweep for the Research Centre.

Orchestrates the existing read-only pipeline (Gmail sync, analysis, thread
intelligence, attachment gate, request linkage, classification, drafting) and
produces a SweepSummary.  Never sends, modifies, labels, archives or deletes
Gmail messages.  Never touches familyData.ts or the database schema.

Usage:
  python3 scripts/run-sweep.py                      # execute (dry-run w.r.t. sending)
  python3 scripts/run-sweep.py --dry-run             # preview only, no writes
  python3 scripts/run-sweep.py --limit 10            # cap messages per stage
  python3 scripts/run-sweep.py --since 2026-11-01T00:00:00Z
  python3 scripts/run-sweep.py --skip-sync --skip-analysis
  python3 scripts/run-sweep.py --max-drafts 5

State: correspondence/extracted/sweep-state.json (last successful sweep, scope).
Summary: correspondence/extracted/sweep-summary.json.
"""
import argparse
import datetime
import json
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXTRACTED = os.path.join(ROOT, "correspondence", "extracted")
STATE_PATH = os.path.join(EXTRACTED, "sweep-state.json")
SUMMARY_PATH = os.path.join(EXTRACTED, "sweep-summary.json")
LOCK_FILE = os.path.join(ROOT, ".local", "sweep.lock")
LOG_PATH = os.path.join(ROOT, ".local", "sweep.log")

DEFAULT_LIMIT = 10
DEFAULT_MAX_DRAFTS = 5


def log(msg):
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    line = "[%s] %s" % (ts, msg)
    print(line)
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def load_state():
    try:
        with open(STATE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return {"version": 1, "last_successful_sweep": None, "last_scope": None}


def draft_readiness(path):
    """Readiness recorded by the drafting verification gate.

    A draft is never reported as ready because a sweep produced it: the only
    values are those the gate wrote (`ready_for_review`, `incomplete`,
    `blocked`).  A draft with no report is `unverified`.
    """
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        return "unverified"
    return data.get("readiness") or "unverified"


def save_state(state):
    os.makedirs(EXTRACTED, exist_ok=True)
    state["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with open(STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, ensure_ascii=False)


def run_step(name, cmd, timeout=600, dry_run=False):
    log("STEP: %s" % name)
    if dry_run:
        log("  (dry-run) would run: %s" % " ".join(cmd))
        return True, ""
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, cwd=ROOT)
        if r.returncode != 0:
            log("  FAILED (rc=%d): %s" % (r.returncode, (r.stderr or r.stdout or "")[:500]))
            return False, r.stderr or r.stdout or ""
        log("  OK")
        return True, r.stdout or ""
    except subprocess.TimeoutExpired:
        log("  TIMEOUT")
        return False, "timeout"
    except Exception as e:
        log("  ERROR: %s" % e)
        return False, str(e)


def acquire_lock():
    if os.path.exists(LOCK_FILE):
        try:
            age = time.time() - os.path.getmtime(LOCK_FILE)
            if age > 3600:
                os.remove(LOCK_FILE)
            else:
                log("Lock held (age %ds). Aborting." % age)
                return False
        except OSError:
            pass
    os.makedirs(os.path.dirname(LOCK_FILE), exist_ok=True)
    with open(LOCK_FILE, "w") as f:
        f.write(str(os.getpid()))
    return True


def release_lock():
    try:
        if os.path.exists(LOCK_FILE):
            os.remove(LOCK_FILE)
    except OSError:
        pass


def main():
    ap = argparse.ArgumentParser(description="Controlled dry-run Sweep for the Research Centre.")
    ap.add_argument("--dry-run", action="store_true", default=False,
                    help="Preview only; no writes, no sidecar changes")
    ap.add_argument("--limit", type=int, default=DEFAULT_LIMIT,
                    help="Cap messages per stage (default %d)" % DEFAULT_LIMIT)
    ap.add_argument("--since", default=None, help="ISO timestamp; sweep messages since this")
    ap.add_argument("--skip-sync", action="store_true", default=False)
    ap.add_argument("--skip-analysis", action="store_true", default=False)
    ap.add_argument("--skip-drafts", action="store_true", default=False)
    ap.add_argument("--max-drafts", type=int, default=DEFAULT_MAX_DRAFTS)
    ap.add_argument("--no-db-write", action="store_true", default=False,
                    help="Pass --no-db-write to the attachment gate (no SQLite writes)")
    ap.add_argument("--message-ids", default=None,
                    help="Comma-separated DB message ids to scope the attachment gate and summary")
    ap.add_argument("--json", action="store_true", default=False)
    args = ap.parse_args()

    dry = args.dry_run
    limit = args.limit
    state = load_state()
    since = args.since or state.get("last_successful_sweep")
    if since is None:
        # default: last 7 days
        since = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)).isoformat()
    message_ids = [x.strip() for x in (args.message_ids or "").split(",") if x.strip()]
    log("SWEEP START (dry_run=%s, limit=%d, since=%s)" % (dry, limit, since))

    if not acquire_lock():
        return 2

    summary = {
        "version": 1,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "dry_run": dry,
        "scope": {"since": since, "limit": limit},
        "stages": {},
        "new_messages": 0,
        "attachments_gated": 0,
        "classifications": {},
        "requests": {},
        "proposed_actions": [],
        "review_items": [],
        "drafts_prepared": [],
        "no_action_threads": [],
    }

    try:
        # Stage 1: incremental Gmail sync
        if not args.skip_sync:
            sync_cmd = [sys.executable, os.path.join(ROOT, "scripts", "sync-gmail.py"), "--incremental"]
            if dry:
                sync_cmd.append("--dry-run")
            ok, out = run_step("gmail_sync", sync_cmd, dry_run=dry)
            summary["stages"]["gmail_sync"] = "ok" if ok else "failed"
        else:
            summary["stages"]["gmail_sync"] = "skipped"

        # Stage 2: analyse unanalysed genealogy-relevant messages (bounded)
        if not args.skip_analysis:
            ok, out = run_step("analysis", [
                sys.executable, os.path.join(ROOT, "scripts", "analyze-messages.py"),
                "--unanalysed", "--limit", str(limit),
            ], dry_run=dry)
            summary["stages"]["analysis"] = "ok" if ok else "failed"
        else:
            summary["stages"]["analysis"] = "skipped"

        # Stage 3: incremental thread intelligence update
        ok, out = run_step("thread_intelligence", [
            sys.executable, os.path.join(ROOT, "scripts", "update-thread-intelligence.py"),
        ], dry_run=dry)
        summary["stages"]["thread_intelligence"] = "ok" if ok else "failed"

        # Stage 4: attachment gate (scoped to message-ids if provided)
        if message_ids:
            gate_ok = True
            for mid in message_ids:
                gate_cmd = [sys.executable, os.path.join(ROOT, "scripts", "attachment-gate.py"),
                            "--message", mid]
                if args.no_db_write:
                    gate_cmd.append("--no-db-write")
                ok, _ = run_step("attachment_gate_%s" % mid, gate_cmd, dry_run=dry, timeout=1800)
                if not ok:
                    gate_ok = False
            summary["stages"]["attachment_gate"] = "ok" if gate_ok else "failed"
        else:
            gate_cmd = [sys.executable, os.path.join(ROOT, "scripts", "attachment-gate.py"),
                        "--since", since, "--inbound-only"]
            if args.no_db_write:
                gate_cmd.append("--no-db-write")
            ok, out = run_step("attachment_gate", gate_cmd, dry_run=dry, timeout=1800)
            summary["stages"]["attachment_gate"] = "ok" if ok else "failed"

        # Stage 5: request linkage (idempotent)
        ok, out = run_step("request_links", [
            sys.executable, os.path.join(ROOT, "scripts", "build-request-links.py"),
        ], dry_run=dry)
        summary["stages"]["request_links"] = "ok" if ok else "failed"

        # Stage 6: classification
        ok, out = run_step("classify", [
            sys.executable, os.path.join(ROOT, "scripts", "classify-actions.py"),
        ], dry_run=dry)
        summary["stages"]["classify"] = "ok" if ok else "failed"

        # Stage 7: build summary from sidecars
        if not dry:
            # load sidecars
            actions = load_json(os.path.join(EXTRACTED, "actions.json"), {})
            rl = load_json(os.path.join(EXTRACTED, "request-links.json"), {})
            gate = load_json(os.path.join(EXTRACTED, "attachment-gate.json"), {})
            threads = load_json(os.path.join(EXTRACTED, "threads.json"), {}).get("threads", {})

            acts = actions.get("actions", {})
            summary["classifications"] = actions.get("counts", {})
            # request status counts
            from collections import Counter
            reqs = rl.get("requests", {})
            summary["requests"] = dict(Counter(r.get("status") for r in reqs.values()))
            summary["requests"]["needs_review"] = sum(1 for r in reqs.values() if r.get("needs_review"))
            summary["requests"]["ambiguous"] = sum(1 for r in reqs.values() if r.get("ambiguous"))
            summary["requests"]["fulfilled"] = sum(1 for r in reqs.values() if r.get("fulfilment") == "fulfilled")

            # proposed actions: threads needing a reply or action, with request link
            # scope to message-ids if provided
            scoped_threads = set()
            if message_ids:
                for mid in message_ids:
                    for tid2, t in threads.items():
                        if mid in [str(m) for m in (t.get("message_ids") or [])]:
                            scoped_threads.add(tid2)
            for tid, a in acts.items():
                if scoped_threads and tid not in scoped_threads:
                    continue
                cls = a.get("classification")
                if cls in ("reply_required", "action_required", "documents_received", "follow_up_due"):
                    rls = a.get("request_links") or []
                    draft_path = None
                    summary["proposed_actions"].append({
                        "thread_id": tid,
                        "subject": a.get("subject"),
                        "classification": cls,
                        "institution": a.get("institution"),
                        "request_ids": [r.get("request_id") for r in rls],
                        "ambiguous": any(r.get("ambiguous") for r in rls),
                        "needs_review": any(r.get("needs_review") for r in rls) or cls == "documents_received",
                        "attachment_gate": a.get("attachment_gate", {}).get("gate_status"),
                        "draft_path": draft_path,
                        "reasoning": a.get("reasoning"),
                    })
                elif cls in ("awaiting_response", "resolved", "uncertain"):
                    summary["no_action_threads"].append({"thread_id": tid, "classification": cls})

            # review items: ambiguous + needs_review requests (scoped if message-ids given)
            for rid, r in reqs.items():
                if scoped_threads:
                    if r.get("source_thread") not in scoped_threads and not any(
                        lr.get("thread_id") in scoped_threads for lr in (r.get("linked_replies") or [])
                    ):
                        continue
                if r.get("ambiguous") or r.get("needs_review"):
                    summary["review_items"].append({
                        "request_id": rid,
                        "status": r.get("status"),
                        "needs_review": r.get("needs_review"),
                        "ambiguous": r.get("ambiguous"),
                        "review_reason": r.get("review_reason"),
                        "institution": r.get("institution"),
                        "person_names": r.get("person_names"),
                        "linked_attachments": r.get("linked_attachments"),
                    })

            # Stage 8: prepare drafts (bounded)
            if not args.skip_drafts:
                draft_count = 0
                for pa in summary["proposed_actions"]:
                    if draft_count >= args.max_drafts:
                        break
                    if pa["classification"] not in ("reply_required", "action_required"):
                        continue
                    tid = pa["thread_id"]
                    # check existing draft
                    dp = os.path.join(EXTRACTED, "drafts", tid + ".json")
                    if os.path.exists(dp):
                        # preserve Gmail metadata from existing draft
                        try:
                            existing = json.load(open(dp))
                            gmail_meta = {k: existing.get(k) for k in ("gmail_draft_id", "gmail_draft_created_at", "gmail_draft_account", "gmail_draft_status", "gmail_draft_body_hash") if existing.get(k)}
                        except Exception:
                            gmail_meta = {}
                        pa["draft_path"] = "correspondence/extracted/drafts/%s.json" % tid
                        pa["draft_readiness"] = draft_readiness(dp)
                        # flag if Gmail draft body differs from current local draft
                        gmail_body_changed = False
                        if gmail_meta.get("gmail_draft_id") and gmail_meta.get("gmail_draft_body_hash"):
                            import hashlib
                            current_hash = hashlib.sha256(existing.get("draft_text", "").encode()).hexdigest()
                            if current_hash != gmail_meta["gmail_draft_body_hash"]:
                                gmail_body_changed = True
                        summary["drafts_prepared"].append({
                            "thread_id": tid, "path": pa["draft_path"], "status": "existing",
                            "readiness": pa["draft_readiness"],
                            "gmail_draft_id": gmail_meta.get("gmail_draft_id"),
                            "gmail_body_changed": gmail_body_changed})
                        draft_count += 1
                        continue
                    ok, out = run_step("draft_%s" % tid[:8], [
                        sys.executable, os.path.join(ROOT, "scripts", "draft-reply.py"), tid,
                    ], dry_run=False)
                    if ok:
                        pa["draft_path"] = "correspondence/extracted/drafts/%s.json" % tid
                        pa["draft_readiness"] = draft_readiness(dp)
                        summary["drafts_prepared"].append({
                            "thread_id": tid, "path": pa["draft_path"], "status": "prepared",
                            "readiness": pa["draft_readiness"]})
                        draft_count += 1
                    else:
                        summary["drafts_prepared"].append({
                            "thread_id": tid, "path": None, "status": "failed",
                            "readiness": "blocked"})

            # save summary
            os.makedirs(EXTRACTED, exist_ok=True)
            with open(SUMMARY_PATH, "w", encoding="utf-8") as f:
                json.dump(summary, f, indent=2, ensure_ascii=False)
            log("Summary written: %s" % os.path.relpath(SUMMARY_PATH, ROOT))
            log("Proposed actions: %d | Review items: %d | Drafts: %d" % (
                len(summary["proposed_actions"]), len(summary["review_items"]), len(summary["drafts_prepared"])))

        # update state
        if not dry:
            state["last_successful_sweep"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
            state["last_scope"] = {"since": since, "limit": limit}
            save_state(state)

    finally:
        release_lock()

    if args.json:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    else:
        print("\n=== SWEEP SUMMARY ===")
        print("Proposed actions: %d" % len(summary["proposed_actions"]))
        print("Review items: %d" % len(summary["review_items"]))
        print("Drafts prepared: %d" % len(summary["drafts_prepared"]))
        if summary["drafts_prepared"]:
            tally = {}
            for d in summary["drafts_prepared"]:
                tally[d.get("readiness") or "unverified"] = tally.get(d.get("readiness") or "unverified", 0) + 1
            print("Draft readiness: %s" % ", ".join("%s=%d" % kv for kv in sorted(tally.items())))
        print("No-action threads: %d" % len(summary["no_action_threads"]))
        print("Classifications: %s" % summary["classifications"])
        print("Requests: %s" % summary["requests"])
    return 0


def load_json(path, default=None):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default if default is not None else {}


if __name__ == "__main__":
    sys.exit(main())
