#!/usr/bin/env python3
"""Shared safe-write module for atomic file writes with version checking and audit logging.

Usage:
    from safe_write import atomic_write, StaleVersionError, read_with_version

    # Read with version
    content, version = read_with_version(path)

    # Write atomically
    atomic_write(path, data, source="opencode", expected_version=version,
                 changed_fields=["classification"], reason="Referral detected")

All writers (Python scripts, app API, OpenCode) should use this module
to prevent silent overwrites and maintain an audit trail.
"""
import os
import json
import hashlib
import fcntl
import time
import tempfile
import datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT_LOG = os.path.join(ROOT, "correspondence", "extracted", "audit-log.jsonl")


class StaleVersionError(Exception):
    """Raised when the file has been modified since it was last read."""
    def __init__(self, path, expected, actual):
        self.path = path
        self.expected = expected
        self.actual = actual
        super().__init__(
            f"Stale version: {path} has been modified since last read. "
            f"Expected hash {expected[:12] if expected else 'None'}, "
            f"got {actual[:12] if actual else 'None'}. "
            f"Re-read the file and retry."
        )


class LockTimeoutError(Exception):
    """Raised when a file lock cannot be acquired within the timeout."""
    pass


def compute_hash(content):
    """Compute SHA-256 hash of file content."""
    if content is None:
        return None
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def read_with_version(path):
    """Read a file and return (content, version_hash). Returns (None, None) if file doesn't exist."""
    if not os.path.exists(path):
        return None, None
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()
    return content, compute_hash(content)


def _is_pid_running(pid):
    """Check if a process with the given PID is still running."""
    try:
        os.kill(pid, 0)
        return True
    except (OSError, ProcessLookupError):
        return False

def _acquire_lock(lock_path, timeout=10):
    """Acquire an exclusive file lock using O_CREAT|O_EXCL (atomic, cross-process).

    Both Python and TypeScript use this same protocol:
    1. Try to create lock file with O_CREAT|O_EXCL (atomic)
    2. If it exists, read PID + timestamp
    3. If PID is dead or lock is older than 60s, remove and retry
    4. Otherwise, wait and retry
    5. If timeout exceeded, raise LockTimeoutError
    """
    os.makedirs(os.path.dirname(lock_path) or ".", exist_ok=True)
    start = time.time()
    while True:
        try:
            # Atomic creation — fails if file already exists
            fd = os.open(lock_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL)
            os.write(fd, f"{os.getpid()}\n{time.time()}".encode())
            os.close(fd)
            # Now open for reading/writing
            fd = os.open(lock_path, os.O_RDWR)
            return fd, lock_path
        except FileExistsError:
            # Lock file exists — check if stale
            try:
                with open(lock_path, "r") as f:
                    lines = f.read().strip().split("\n")
                pid = int(lines[0]) if lines and lines[0].isdigit() else None
                ts = float(lines[1]) if len(lines) > 1 else 0
                age = time.time() - ts

                if pid is not None and not _is_pid_running(pid):
                    # Process is dead — remove stale lock
                    try:
                        os.unlink(lock_path)
                    except OSError:
                        pass
                    continue
                if pid is None and age > 60:
                    # No valid PID and lock is old — remove
                    try:
                        os.unlink(lock_path)
                    except OSError:
                        pass
                    continue
                # If PID is alive, never remove (even if old)
            except (OSError, ValueError, IndexError):
                # Can't read lock file — try to remove
                try:
                    os.unlink(lock_path)
                except OSError:
                    pass
                continue

            # Lock is held by active process — wait
            if time.time() - start > timeout:
                raise LockTimeoutError(f"Could not acquire lock on {lock_path} within {timeout}s")
            time.sleep(0.1)

def _release_lock(fd):
    """Release a file lock by closing fd and removing lock file."""
    try:
        # Get lock path from fd (we stored it... actually we need to pass it)
        pass
    except Exception:
        pass
    try:
        os.close(fd)
    except OSError:
        pass


def _release_lock(fd, lock_path=None):
    """Release a file lock by closing fd and removing lock file."""
    try:
        os.close(fd)
    except OSError:
        pass
    if lock_path:
        try:
            os.unlink(lock_path)
        except OSError:
            pass


def _audit_entry(path, source, status, changed_fields=None, reason=None,
                 version_before=None, version_after=None, error=None):
    """Create an audit log entry."""
    entry = {
        "ts": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "file": os.path.relpath(path, ROOT),
        "source": source,
        "status": status,
        "changed_fields": changed_fields or [],
        "reason": reason,
        "version_before": version_before[:12] if version_before else None,
        "version_after": version_after[:12] if version_after else None,
    }
    if error:
        entry["error"] = error
    return entry


def _write_audit(entry):
    """Append an entry to the audit log (append-only)."""
    os.makedirs(os.path.dirname(AUDIT_LOG), exist_ok=True)
    with open(AUDIT_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def atomic_write(path, data, source, expected_version=None, changed_fields=None, reason=None):
    """Atomically write data to a file with version checking and audit logging.

    Args:
        path: Absolute path to the file.
        data: Data to write (dict → JSON, str → raw text).
        source: Who is writing ("app_ui", "opencode", "script", "manual").
        expected_version: SHA-256 hash from read_with_version(). If provided and doesn't match, raises StaleVersionError.
        changed_fields: List of field names that were changed.
        reason: Human-readable reason for the change.

    Returns:
        The new version hash of the written file.

    Raises:
        StaleVersionError: If the file was modified since last read.
        LockTimeoutError: If the lock cannot be acquired.
    """
    os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    # Read current content
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            current_content = f.read()
        current_hash = compute_hash(current_content)
    else:
        current_content = None
        current_hash = None

    # Version check (pre-lock)
    if expected_version is not None and expected_version != current_hash:
        entry = _audit_entry(path, source, "rejected", changed_fields, reason,
                            version_before=current_hash, error="Stale version (pre-lock)")
        _write_audit(entry)
        raise StaleVersionError(path, expected_version, current_hash)

    # Acquire lock
    lock_path = path + ".lock"
    lock_fd, lock_path = _acquire_lock(lock_path)
    try:
        # Re-check version after acquiring lock (double-checked locking)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                current_content2 = f.read()
            current_hash2 = compute_hash(current_content2)
            if expected_version is not None and expected_version != current_hash2:
                entry = _audit_entry(path, source, "rejected", changed_fields, reason,
                                    version_before=current_hash2, error="Stale version (post-lock)")
                _write_audit(entry)
                raise StaleVersionError(path, expected_version, current_hash2)
            current_hash = current_hash2

        # Write to temp file
        dir_name = os.path.dirname(path) or "."
        fd, temp_path = tempfile.mkstemp(dir=dir_name, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                if isinstance(data, str):
                    f.write(data)
                else:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                    f.write("\n")
                f.flush()
                os.fsync(f.fileno())

            # Atomic replace
            os.replace(temp_path, path)

            # Compute new hash
            with open(path, "r", encoding="utf-8") as f:
                new_content = f.read()
            new_hash = compute_hash(new_content)

            # Log accepted write
            entry = _audit_entry(path, source, "accepted", changed_fields, reason,
                                version_before=current_hash, version_after=new_hash)
            _write_audit(entry)

            return new_hash

        except Exception as e:
            # Clean up temp file
            try:
                os.unlink(temp_path)
            except OSError:
                pass
            entry = _audit_entry(path, source, "rejected", changed_fields, reason,
                                version_before=current_hash, error=str(e))
            _write_audit(entry)
            raise
    finally:
        _release_lock(lock_fd, lock_path)


def safe_read_json(path):
    """Read a JSON file and return (data, version_hash). Returns (None, None) if file doesn't exist."""
    content, version = read_with_version(path)
    if content is None:
        return None, None
    try:
        data = json.loads(content)
        return data, version
    except json.JSONDecodeError:
        return None, version


def safe_write_json(path, data, source, expected_version=None, changed_fields=None, reason=None):
    """Convenience wrapper for atomic_write with JSON data."""
    return atomic_write(path, data, source, expected_version, changed_fields, reason)


if __name__ == "__main__":
    print("safe_write module loaded OK")
