#!/usr/bin/env python3
"""Pipeline orchestrator for automatic correspondence processing.

Runs the full pipeline:
  1. Gmail incremental sync
  2. AI analysis of unanalysed genealogy-relevant messages
  3. Incremental thread intelligence update
  4. New message detection + action classification
  5. Logging

Usage:
  python scripts/run-pipeline.py                    # full run
  python scripts/run-pipeline.py --dry-run           # show what would be done
  python scripts/run-pipeline.py --skip-sync        # skip Gmail sync (offline)
  python scripts/run-pipeline.py --skip-analysis    # skip AI analysis
  python scripts/run-pipeline.py --max-analyse N    # cap analysis per run (default 5)

No Gmail enumeration from scratch. No attachment downloads. No family-data changes.
No automatic email sending. No automatic resolution.
"""
import argparse, json, os, sys, subprocess, datetime, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOG_PATH = os.path.join(ROOT, ".local", "pipeline.log")
LOCK_FILE = os.path.join(ROOT, ".local", "pipeline.lock")
MAX_ANALYSE_DEFAULT = 5

def log(msg):
    ts = datetime.datetime.now(datetime.timezone.utc).isoformat()
    line = f"[{ts}] {msg}"
    print(line)
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def is_pid_running(pid):
    """Check if a process with the given PID is still running."""
    try:
        os.kill(pid, 0)  # signal 0 = check existence, doesn't kill
        return True
    except (OSError, ProcessLookupError):
        return False

def acquire_lock():
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE, "r") as f:
                pid_str = f.read().strip()
            pid = int(pid_str) if pid_str.isdigit() else None
            age = time.time() - os.path.getmtime(LOCK_FILE)
            if pid is not None and is_pid_running(pid):
                # Process is still running — never remove
                log("Lock held by active process (PID %d, age %ds). Aborting." % (pid, age))
                return False
            # PID not running (or no PID) — check age
            if age > 3600:  # 1 hour stale
                os.remove(LOCK_FILE)
                log("Removed stale lock (PID %s not running, age %ds)." % (pid_str, age))
            else:
                log("Lock file exists (PID %s, age %ds) but process not running. Removing." % (pid_str, age))
                os.remove(LOCK_FILE)
        except (OSError, ValueError):
            # Can't read lock file — remove it
            try:
                os.remove(LOCK_FILE)
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

def run_step(name, cmd, timeout=300):
    log(f"STEP: {name}")
    try:
        result = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            log(f"  OK: {result.stdout.strip()[:200]}")
            return True
        else:
            log(f"  FAILED (rc={result.returncode}): {result.stderr.strip()[:300]}")
            return False
    except subprocess.TimeoutExpired:
        log(f"  TIMEOUT after {timeout}s")
        return False
    except Exception as e:
        log(f"  ERROR: {e}")
        return False

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--skip-sync", action="store_true")
    ap.add_argument("--skip-analysis", action="store_true")
    ap.add_argument("--max-analyse", type=int, default=MAX_ANALYSE_DEFAULT)
    args = ap.parse_args()

    if not acquire_lock():
        sys.exit(1)

    try:
        log("=" * 60)
        log("Pipeline run started")
        results = {}

        # Step 1: Gmail incremental sync
        if args.skip_sync:
            log("STEP: Gmail sync SKIPPED (--skip-sync)")
            results["sync"] = "skipped"
        elif args.dry_run:
            log("STEP: Gmail sync (dry-run)")
            run_step("Gmail sync (dry-run)", ["python3", "scripts/sync-gmail.py", "--incremental", "--dry-run"], timeout=120)
            results["sync"] = "dry-run"
        else:
            ok = run_step("Gmail incremental sync", ["python3", "scripts/sync-gmail.py", "--incremental"], timeout=300)
            results["sync"] = "ok" if ok else "failed"

        # Step 2: AI analysis of unanalysed genealogy-relevant messages
        if args.skip_analysis:
            log("STEP: AI analysis SKIPPED (--skip-analysis)")
            results["analysis"] = "skipped"
        elif args.dry_run:
            log("STEP: AI analysis (dry-run)")
            run_step("AI analysis (dry-run)", ["python3", "scripts/analyze-messages.py", "--unanalysed", "--limit", str(args.max_analyse), "--dry-run"] if False else ["python3", "scripts/analyze-messages.py", "--unanalysed", "--limit", "0"], timeout=10)
            results["analysis"] = "dry-run"
        else:
            ok = run_step("AI analysis", ["python3", "scripts/analyze-messages.py", "--unanalysed", "--limit", str(args.max_analyse)], timeout=600)
            results["analysis"] = "ok" if ok else "failed"

        # Step 3: New message detection + action classification (must run before thread intel)
        if args.dry_run:
            log("STEP: New message detection (dry-run)")
            run_step("Detection (dry-run)", ["python3", "scripts/detect-new-correspondence.py"], timeout=120)
            results["detection"] = "dry-run"
        else:
            ok = run_step("New message detection", ["python3", "scripts/detect-new-correspondence.py"], timeout=300)
            results["detection"] = "ok" if ok else "failed"

        # Step 4: Incremental thread intelligence update (uses new-items.json from detection)
        if args.dry_run:
            log("STEP: Thread intelligence update (dry-run)")
            run_step("Thread intel (dry-run)", ["python3", "scripts/update-thread-intelligence.py", "--from-new-items"], timeout=60)
            results["thread_intel"] = "dry-run"
        else:
            ok = run_step("Thread intelligence update", ["python3", "scripts/update-thread-intelligence.py", "--from-new-items"], timeout=120)
            results["thread_intel"] = "ok" if ok else "failed"

        log(f"Pipeline run complete: {json.dumps(results)}")
        log("=" * 60)

    finally:
        release_lock()

if __name__ == "__main__":
    main()
