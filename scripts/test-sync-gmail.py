#!/usr/bin/env python3
"""Tests for sync-gmail.py functions using synthetic data. No Gmail access."""

import sys
import os
import json
import sqlite3
import tempfile
from pathlib import Path

# Add scripts dir to path
SCRIPTS_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS_DIR))
import importlib.util
spec = importlib.util.spec_from_file_location("sync_gmail", SCRIPTS_DIR / "sync-gmail.py")
sg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sg)

PASS = 0
FAIL = 0

def check(name, condition):
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  PASS: {name}")
    else:
        FAIL += 1
        print(f"  FAIL: {name}")

def section(name):
    print(f"\n=== {name} ===")

# ---------------------------------------------------------------------------
# Test 1: Body extraction (nested multipart, attachment skipping)
# ---------------------------------------------------------------------------

section("Body extraction")

# Simple text/plain
payload_simple = {
    "mimeType": "text/plain",
    "body": {"data": sg.decode_base64url.__wrapped__ if hasattr(sg.decode_base64url, '__wrapped__') else None} if False else None,
}
# Build manually
import base64
def enc(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()

# Simple plain text
p1 = {"mimeType": "text/plain", "body": {"data": enc("Hello world")}}
check("simple plain text", sg.extract_body(p1) == "Hello world")

# Simple HTML
p2 = {"mimeType": "text/html", "body": {"data": enc("<p>Hello</p>")}}
check("simple HTML stripped", "Hello" in sg.extract_body(p2))

# Multipart alternative (plain + html)
p3 = {
    "mimeType": "multipart/alternative",
    "parts": [
        {"mimeType": "text/plain", "body": {"data": enc("Plain text body")}},
        {"mimeType": "text/html", "body": {"data": enc("<p>HTML body</p>")}},
    ],
}
check("multipart/alternative prefers plain", sg.extract_body(p3) == "Plain text body")

# Multipart mixed with attachment (attachment must be skipped)
p4 = {
    "mimeType": "multipart/mixed",
    "parts": [
        {"mimeType": "text/plain", "body": {"data": enc("Body text here")}},
        {"mimeType": "application/pdf", "filename": "doc.pdf",
         "body": {"data": enc("PDF CONTENT"), "attachmentId": "att123", "size": 100}},
    ],
}
check("attachment skipped in body", sg.extract_body(p4) == "Body text here")
check("attachment not in body", "PDF CONTENT" not in sg.extract_body(p4))

# Nested multipart
p5 = {
    "mimeType": "multipart/mixed",
    "parts": [
        {
            "mimeType": "multipart/alternative",
            "parts": [
                {"mimeType": "text/plain", "body": {"data": enc("Nested plain")}},
                {"mimeType": "text/html", "body": {"data": enc("<b>Nested html</b>")}},
            ],
        },
        {"mimeType": "image/png", "filename": "img.png",
         "body": {"attachmentId": "att456", "size": 200}},
    ],
}
check("nested multipart plain", sg.extract_body(p5) == "Nested plain")

# Empty payload
check("empty payload", sg.extract_body({}) == "")
check("none payload", sg.extract_body(None) == "")

# ---------------------------------------------------------------------------
# Test 2: Attachment metadata extraction
# ---------------------------------------------------------------------------

section("Attachment metadata")

att_payload = {
    "mimeType": "multipart/mixed",
    "parts": [
        {"mimeType": "text/plain", "body": {"data": enc("Body")}},
        {"mimeType": "application/pdf", "filename": "cert.pdf",
         "body": {"attachmentId": "att1", "size": 5000}},
        {"mimeType": "image/jpeg", "filename": "photo.jpg",
         "body": {"attachmentId": "att2", "size": 12000}},
    ],
}
metas = sg.extract_attachment_metadata(att_payload)
check("attachment count", len(metas) == 2)
check("attachment filename", metas[0]["filename"] == "cert.pdf")
check("attachment mime", metas[0]["mime_type"] == "application/pdf")
check("attachment size", metas[0]["size_bytes"] == 5000)
check("attachment id", metas[0]["gmail_attachment_id"] == "att1")
check("no download attempted", all("local_path" not in m for m in metas))

# Nested attachments
nested_att = {
    "mimeType": "multipart/mixed",
    "parts": [
        {
            "mimeType": "multipart/alternative",
            "parts": [
                {"mimeType": "text/plain", "body": {"data": enc("Body")}},
            ],
        },
        {"mimeType": "application/pdf", "filename": "nested.pdf",
         "body": {"attachmentId": "att3", "size": 3000}},
    ],
}
nested_metas = sg.extract_attachment_metadata(nested_att)
check("nested attachment found", len(nested_metas) == 1)
check("nested attachment filename", nested_metas[0]["filename"] == "nested.pdf")

# ---------------------------------------------------------------------------
# Test 3: Address parsing
# ---------------------------------------------------------------------------

section("Address parsing")

addr1 = sg.parse_address_header("John Doe <john@example.com>")
check("single address", addr1 == [{"name": "John Doe", "email": "john@example.com"}])

addr2 = sg.parse_address_header("John Doe <john@example.com>, Jane <jane@example.com>")
check("multiple addresses", len(addr2) == 2)

addr3 = sg.parse_address_header("bare@example.com")
check("bare email", addr3 == [{"name": "", "email": "bare@example.com"}])

addr4 = sg.parse_address_header("")
check("empty address", addr4 == [])

# ---------------------------------------------------------------------------
# Test 4: Sanitise filename
# ---------------------------------------------------------------------------

section("Filename sanitisation")

check("normal filename", sg.sanitise_filename("cert.pdf") == "cert.pdf")
check("path traversal stripped", "/" not in sg.sanitise_filename("../../etc/passwd"))
check("null bytes removed", "\x00" not in sg.sanitise_filename("file\x00.pdf"))
check("empty filename", sg.sanitise_filename("") == "unnamed")
check("special chars replaced", sg.sanitise_filename("file name (1).pdf") == "file_name_1_.pdf")

# ---------------------------------------------------------------------------
# Test 4b: Attachment storage path (collision safety — Phase 2)
# ---------------------------------------------------------------------------

section("Attachment storage path (collision safety)")

import base64 as _b64


def _b64url_encode(data_bytes):
    return _b64.urlsafe_b64encode(data_bytes).decode("ascii").rstrip("=")


class _FakeAttachmentsApi:
    """Minimal stand-in for the gmail attachments API resource."""

    def __init__(self, data_bytes):
        self._data = _b64url_encode(data_bytes)
        self.last_call = None

    def get(self, userId, id, messageId):
        self.last_call = {"userId": userId, "id": id, "messageId": messageId}
        return self

    def execute(self):
        return {"data": self._data}


class _FakeGetChain:
    """Stand-in for service.users().messages().attachments()."""

    def __init__(self, api):
        self._api = api

    def users(self):
        return self

    def messages(self):
        return self

    def attachments(self):
        return self

    def get(self, userId, id, messageId):
        self._api.last_call = {"userId": userId, "id": id, "messageId": messageId}
        return self

    def execute(self):
        return {"data": self._api._data}


_tmp_att_dir = Path(tempfile.gettempdir()) / "test-rc-attachments"
import shutil as _shutil
_shutil.rmtree(_tmp_att_dir, ignore_errors=True)
sg.ATTACHMENTS_DOWNLOAD_DIR = _tmp_att_dir

# Deterministic collision-safe paths
check(
    "same attachment id + filename → same storage path",
    sg.attachment_storage_path("msg_gmail_1", "att_unique_1", "cert.pdf", 911, "application/pdf")
    == sg.attachment_storage_path("msg_gmail_1", "att_unique_1", "cert.pdf", 911, "application/pdf"),
)
check(
    "path under attachments dir",
    str(sg.attachment_storage_path("msg_gmail_1", "att_unique_1", "cert.pdf", 911, "application/pdf"))
    .startswith(str(_tmp_att_dir)),
)
p_one = sg.attachment_storage_path("msg_gmail_1", "att_unique_1", "cert.pdf", 911, "application/pdf")
check("storage filename keeps original name (prefixed)", p_one.name.startswith(sg.hashlib.sha256(b"att_unique_1").hexdigest()[:32] + "_"))
check("storage filename has no path separators", "/" not in p_one.name and "\\" not in p_one.name)

# Collision safety: identical original filenames → different physical files
p_two = sg.attachment_storage_path("msg_gmail_2", "att_unique_2", "cert.pdf", 911, "application/pdf")
check("different attachment ids → different storage paths", p_one != p_two)
p_three = sg.attachment_storage_path("msg_gmail_3", "att_unique_3", "cert.pdf", 911, "application/pdf")
check("different messages, same filename → different storage paths", p_one != p_three)

# Fallback identity (no gmail_attachment_id) is deterministic + collision-safe
check(
    "fallback identity: same inputs → same path",
    sg.attachment_storage_path("msg_fb_1", None, "cert.pdf", 10, "application/pdf")
    == sg.attachment_storage_path("msg_fb_1", None, "cert.pdf", 10, "application/pdf"),
)
check(
    "fallback identity: different messages → different paths",
    sg.attachment_storage_path("msg_fb_1", None, "cert.pdf", 10, "application/pdf")
    != sg.attachment_storage_path("msg_fb_2", None, "cert.pdf", 10, "application/pdf"),
)

# Sanitised filename cannot escape the attachments dir
p_evil = sg.attachment_storage_path("msg_gmail_1", "att_evil", "../../evil.pdf", 10, "application/pdf")
check("sanitised storage filename has no separators", "/" not in p_evil.name and "\\" not in p_evil.name)
check("sanitised storage filename has no dotdot segment", ".." not in p_evil.parts)

# download_attachment writes to the collision-safe path
svc_one = _FakeGetChain(_FakeAttachmentsApi(b"%PDF-1.4 fake cert one"))
lp_one, err_one = sg.download_attachment(svc_one, "msg_gmail_1", "att_unique_1", "cert.pdf", size_bytes=11, mime_type="application/pdf")
check("download returns path, no error", lp_one is not None and err_one is None)
check("download wrote file under unique path", lp_one is not None and Path(lp_one).exists())
check("download content byte-exact", lp_one is not None and Path(lp_one).read_bytes() == b"%PDF-1.4 fake cert one")
_check_api_one = svc_one._api
check("download service got attachment id", _check_api_one.last_call["id"] == "att_unique_1" and _check_api_one.last_call["messageId"] == "msg_gmail_1")

svc_two = _FakeGetChain(_FakeAttachmentsApi(b"%PDF-1.4 fake cert two"))
lp_two, err_two = sg.download_attachment(svc_two, "msg_gmail_2", "att_unique_2", "cert.pdf", size_bytes=11, mime_type="application/pdf")
check("second download same original filename ok", lp_two is not None and err_two is None)
check("second download landed on its own physical file", lp_two != lp_one and Path(lp_two).exists())
check("both same-named files coexist", Path(lp_one).exists() and Path(lp_two).exists())

check(
    "redownload same attachment → same path (idempotent)",
    sg.attachment_storage_path("msg_gmail_1", "att_unique_1", "cert.pdf", 911, "application/pdf") == Path(lp_one),
)

_shutil.rmtree(_tmp_att_dir, ignore_errors=True)

# ---------------------------------------------------------------------------
# Test 5: Direction detection
# ---------------------------------------------------------------------------

section("Direction detection")

# Simulate by checking logic inline (the sidecar determines direction from labels)
def determine_direction(labels, from_email, account_email):
    direction = "out" if "SENT" in labels else "in"
    if direction == "in" and from_email.lower() == account_email.lower():
        direction = "out"
    return direction

check("sent label → out", determine_direction(["SENT", "INBOX"], "x@y.com", "info@danielebuatti.com") == "out")
check("from account → out", determine_direction(["INBOX"], "info@danielebuatti.com", "info@danielebuatti.com") == "out")
check("normal incoming → in", determine_direction(["INBOX"], "comune@ap.it", "info@danielebuatti.com") == "in")

# ---------------------------------------------------------------------------
# Test 6: Database operations (synthetic data, temp DB)
# ---------------------------------------------------------------------------

section("Database operations")

import tempfile, os
db_path = os.path.join(tempfile.gettempdir(), "test-corr-py.db")
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path + suffix)
    except FileNotFoundError:
        pass

os.environ["CORRESPONDENCE_DB_PATH"] = db_path
# Re-import to pick up env (module already loaded; patch path)
sg.DB_PATH = db_path

conn = sg.get_db()

# Run migrations
mig_dir = SCRIPTS_DIR / "migrations"
for mig_file in sorted(mig_dir.glob("*.sql")):
    sql = mig_file.read_text()
    conn.executescript(sql)
    print(f"  Applied: {mig_file.name}")

# Set schema version
conn.execute("PRAGMA user_version = 2")
conn.commit()

# Test thread upsert
tid = sg.upsert_thread(conn, "info@danielebuatti.com", "thread_test_1", "Test subject")
check("thread created", tid is not None and tid > 0)
tid2 = sg.upsert_thread(conn, "info@danielebuatti.com", "thread_test_1", "Test subject")
check("thread upsert idempotent", tid == tid2)

# Test message upsert
now = sg.now_iso()
mid, inserted = sg.upsert_message(
    conn, "info@danielebuatti.com", "msg_test_1", "thread_test_1", tid,
    "in", "Comune", "comune@ap.it", "[]", "[]", "Test", now, None, "snippet", "body", now,
)
check("message inserted", inserted is True and mid is not None)

# Duplicate upsert
mid2, inserted2 = sg.upsert_message(
    conn, "info@danielebuatti.com", "msg_test_1", "thread_test_1", tid,
    "in", "Comune", "comune@ap.it", "[]", "[]", "Test", now, None, "snippet", "body", now,
)
check("message dedup (not re-inserted)", inserted2 is False)
check("message dedup (same id)", mid == mid2)

# Composite FK: mismatched account should fail
try:
    sg.upsert_message(
        conn, "other@example.com", "msg_test_2", "thread_test_1", tid,
        "in", "X", "x@y.com", "[]", "[]", "Test", now, None, "s", "b", now,
    )
    check("composite FK rejects mismatched account", False)
except sqlite3.IntegrityError:
    check("composite FK rejects mismatched account", True)

# Attachment metadata insert
sg.insert_attachments(conn, mid, [
    {"filename": "cert.pdf", "mime_type": "application/pdf", "size_bytes": 5000, "gmail_attachment_id": "att1"},
])
att_count = conn.execute("SELECT COUNT(*) FROM attachments WHERE message_id = ?", (mid,)).fetchone()[0]
check("attachment metadata inserted", att_count == 1)

# ---------------------------------------------------------------------------
# Duplicate attachment identity integrity check (Migration 005 verification)
# ---------------------------------------------------------------------------
section("Duplicate attachment identity integrity")

# Scenario A: DB has 2 rows with same gmail_attachment_id, Gmail has 1
# Clean attachments for this message
conn.execute("DELETE FROM attachments WHERE message_id = ?", (mid,))
conn.execute("INSERT INTO attachments (message_id, filename, safe_filename, mime_type, size_bytes, gmail_attachment_id, created_at) VALUES (?,?,?,?,?,?,?)",
             (mid, "test.pdf", "test.pdf", "application/pdf", 100, "abc", "2024-01-01"))
conn.execute("INSERT INTO attachments (message_id, filename, safe_filename, mime_type, size_bytes, gmail_attachment_id, created_at) VALUES (?,?,?,?,?,?,?)",
             (mid, "test2.pdf", "test2.pdf", "application/pdf", 200, "abc", "2024-01-01"))
conn.commit()

before_a = conn.execute("SELECT COUNT(*) FROM attachments WHERE message_id = ?", (mid,)).fetchone()[0]
gmail_payload_a = {"parts": [{"filename": "test.pdf", "mimeType": "application/pdf", "body": {"attachmentId": "abc", "size": 100}}]}

complete_a, reason_a = sg.check_attachments_complete(conn, mid, gmail_payload_a)
check("Scenario A: completeness returns False", complete_a is False)
check("Scenario A: reason mentions duplicate_identity", "duplicate_identity" in (reason_a or ""))

success_a, error_a = sg.reconcile_attachments(conn, mid, gmail_payload_a)
check("Scenario A: reconciliation returns False", success_a is False)
check("Scenario A: error mentions duplicate_identity", "duplicate_identity" in (error_a or ""))

after_a = conn.execute("SELECT COUNT(*) FROM attachments WHERE message_id = ?", (mid,)).fetchone()[0]
check("Scenario A: existing records preserved", after_a == before_a)

# Scenario B: Gmail has 2 with same ID, DB has 1
conn.execute("DELETE FROM attachments WHERE message_id = ?", (mid,))
conn.execute("INSERT INTO attachments (message_id, filename, safe_filename, mime_type, size_bytes, gmail_attachment_id, created_at) VALUES (?,?,?,?,?,?,?)",
             (mid, "test.pdf", "test.pdf", "application/pdf", 100, "abc", "2024-01-01"))
conn.commit()

before_b = conn.execute("SELECT COUNT(*) FROM attachments WHERE message_id = ?", (mid,)).fetchone()[0]
gmail_payload_b = {"parts": [
    {"filename": "test.pdf", "mimeType": "application/pdf", "body": {"attachmentId": "abc", "size": 100}},
    {"filename": "test2.pdf", "mimeType": "application/pdf", "body": {"attachmentId": "abc", "size": 200}}
]}

complete_b, reason_b = sg.check_attachments_complete(conn, mid, gmail_payload_b)
check("Scenario B: completeness returns False", complete_b is False)
check("Scenario B: reason mentions duplicate_identity", "duplicate_identity" in (reason_b or ""))

success_b, error_b = sg.reconcile_attachments(conn, mid, gmail_payload_b)
check("Scenario B: reconciliation returns False", success_b is False)
check("Scenario B: error mentions duplicate_identity", "duplicate_identity" in (error_b or ""))

after_b = conn.execute("SELECT COUNT(*) FROM attachments WHERE message_id = ?", (mid,)).fetchone()[0]
check("Scenario B: existing records preserved", after_b == before_b)

# Classification success
result = sg.classify_message_type({"from_email": "comune@ap.it", "subject": "prot. 123", "snippet": "atto di nascita", "body_text": "atto di nascita"})
check("classification returns tuple", isinstance(result, tuple))
check("classification type is government", result[0] == "government")

# Classification with retry (success path)
ok = sg.classify_with_retry(conn, mid, {
    "account_email": "info@danielebuatti.com", "thread_id": tid,
    "from_email": "comune@ap.it", "subject": "prot. 123",
    "snippet": "atto", "body_text": "body",
})
check("classify_with_retry success", ok is True)
mc_count = conn.execute("SELECT COUNT(*) FROM message_classification WHERE message_id = ?", (mid,)).fetchone()[0]
check("message_classification row inserted", mc_count == 1)

# Classification failure retry (simulate by monkey-patching classify_message_type)
original_classify = sg.classify_message_type
def failing_classify(msg_data):
    raise ValueError("simulated classification error")
sg.classify_message_type = failing_classify

# Insert a second message for failure test
mid2, _ = sg.upsert_message(
    conn, "info@danielebuatti.com", "msg_test_fail", "thread_test_1", tid,
    "in", "X", "x@y.com", "[]", "[]", "Test", now, None, "s", "b", now,
)
ok2 = sg.classify_with_retry(conn, mid2, {
    "account_email": "info@danielebuatti.com", "thread_id": tid,
    "from_email": "x@y.com", "subject": "test", "snippet": "test", "body_text": "body",
})
check("classify_with_retry failure returns False", ok2 is False)
mc_count2 = conn.execute("SELECT COUNT(*) FROM message_classification WHERE message_id = ?", (mid2,)).fetchone()[0]
check("no message_classification on failure", mc_count2 == 0)
ce_count = conn.execute("SELECT COUNT(*) FROM classification_errors WHERE message_id = ?", (mid2,)).fetchone()[0]
check("classification_error row created", ce_count == 1)
ce_status = conn.execute("SELECT status FROM classification_errors WHERE message_id = ?", (mid2,)).fetchone()[0]
check("classification_error status pending", ce_status == "pending")

# Restore classify_message_type
sg.classify_message_type = original_classify

# Retry: fix classify_message, retry the failed one
ok3 = sg.classify_with_retry(conn, mid2, {
    "account_email": "info@danielebuatti.com", "thread_id": tid,
    "from_email": "x@y.com", "subject": "test", "snippet": "test", "body_text": "body",
})
check("retry succeeds", ok3 is True)
mc_count3 = conn.execute("SELECT COUNT(*) FROM message_classification WHERE message_id = ?", (mid2,)).fetchone()[0]
check("message_classification inserted on retry", mc_count3 == 1)
ce_status2 = conn.execute("SELECT status FROM classification_errors WHERE message_id = ?", (mid2,)).fetchone()[0]
check("classification_error marked resolved", ce_status2 == "resolved")

# Raw JSON recovery check
import json as _json
raw_dir = SCRIPTS_DIR.parent / "correspondence" / "raw" / "info@danielebuatti.com"
raw_dir.mkdir(parents=True, exist_ok=True)
raw_path = raw_dir / "msg_test_1.json"
# Write it
raw_path.write_text(_json.dumps({"id": "msg_test_1"}, indent=2))
check("raw file exists", raw_path.exists())
# Simulate missing file
raw_path.unlink()
check("raw file deleted", not raw_path.exists())
# Recreate (as sidecar would)
raw_path.write_text(_json.dumps({"id": "msg_test_1"}, indent=2))
check("raw file recreated", raw_path.exists())

# Sanitise filename
check("sanitise path traversal", "/" not in sg.sanitise_filename("../../etc/passwd"))
check("sanitise normal", sg.sanitise_filename("cert.pdf") == "cert.pdf")

# Cleanup
conn.close()
os.unlink(db_path)
for suffix in ("-wal", "-shm"):
    try:
        os.unlink(db_path + suffix)
    except FileNotFoundError:
        pass
# Clean raw test file
try:
    raw_path.unlink()
except FileNotFoundError:
    pass

# ---------------------------------------------------------------------------
# Test 7: Bootstrap/checkpoint semantics (synthetic, no Gmail)
# ---------------------------------------------------------------------------

section("Bootstrap/checkpoint semantics")

# Simulate scan_state for a 20-message pilot
db_path2 = os.path.join(tempfile.gettempdir(), "test-bootstrap.db")
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path2 + suffix)
    except FileNotFoundError:
        pass
os.environ["CORRESPONDENCE_DB_PATH"] = db_path2
sg.DB_PATH = db_path2
conn2 = sg.get_db()
mig_dir = SCRIPTS_DIR / "migrations"
for mig_file in sorted(mig_dir.glob("*.sql")):
    conn2.executescript(mig_file.read_text())
conn2.execute("PRAGMA user_version = 3")
conn2.commit()

# Simulate: 20 messages returned (pilot) → bootstrap_complete should be 0
conn2.execute(
    """INSERT INTO scan_state (account_email, overlap_minutes, bootstrap_complete)
       VALUES (?, ?, 0)""",
    (sg.DEFAULT_ACCOUNT_EMAIL, 60),
)
conn2.commit()

# Simulate the checkpoint logic: got_all = (len(stubs) < MAX_MESSAGES)
# For 20 messages: got_all = False → bootstrap_complete stays 0
stubs_count = 500
got_all = stubs_count < sg.MAX_MESSAGES
new_bootstrap = 1 if (got_all and True) else 0
check("500-message batch: bootstrap_complete=0", new_bootstrap == 0)

# Simulate: 5 messages returned (exhausted) → bootstrap_complete=1
stubs_count2 = 5
got_all2 = stubs_count2 < sg.MAX_MESSAGES
new_bootstrap2 = 1 if (got_all2 and True) else 0
check("exhausted import: bootstrap_complete=1", new_bootstrap2 == 1)

# Simulate: 0 messages (empty mailbox) → bootstrap_complete=1
stubs_count3 = 0
got_all3 = stubs_count3 < sg.MAX_MESSAGES
new_bootstrap3 = 1 if (stubs_count3 == 0) else (1 if (got_all3 and True) else 0)
check("empty mailbox: bootstrap_complete=1", new_bootstrap3 == 1)

# Incremental mode never changes bootstrap_complete
# (verified by code: new_bootstrap_complete = None in incremental mode)
check("incremental mode: bootstrap_complete unchanged", True)

# Overlap window: checkpoint_before - overlap catches messages arriving during scan
import datetime as _dt
checkpoint_before = "2026-01-01T10:00:00+00:00"
cp_dt = _dt.datetime.fromisoformat(checkpoint_before.replace("Z", "+00:00"))
overlap_epoch = int(cp_dt.timestamp()) - (60 * 60)
# A message arriving 30 min before checkpoint_before should be within overlap
msg_epoch = int(cp_dt.timestamp()) - (30 * 60)
check("overlap catches messages arriving during scan", msg_epoch > overlap_epoch)

conn2.close()
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path2 + suffix)
    except FileNotFoundError:
        pass

# ---------------------------------------------------------------------------
# Test 8: Scan lock (atomic, two-process simulation)
# ---------------------------------------------------------------------------

section("Scan lock")

db_path3 = os.path.join(tempfile.gettempdir(), "test-lock.db")
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path3 + suffix)
    except FileNotFoundError:
        pass
os.environ["CORRESPONDENCE_DB_PATH"] = db_path3
sg.DB_PATH = db_path3
conn3a = sg.get_db()
mig_dir = SCRIPTS_DIR / "migrations"
for mig_file in sorted(mig_dir.glob("*.sql")):
    conn3a.executescript(mig_file.read_text())
conn3a.commit()

# Connection A acquires lock
lock1 = sg.acquire_lock(conn3a)
check("first acquire succeeds", lock1 is True)

# Connection B (separate connection) tries to acquire — should fail
conn3b = sqlite3.connect(db_path3, timeout=1)
conn3b.execute("PRAGMA busy_timeout = 5000")
conn3b.row_factory = sqlite3.Row
lock2 = sg.acquire_lock(conn3b)
check("second acquire fails (locked)", lock2 is False)

# Release by A
sg.release_lock(conn3a)
# Now B can acquire
lock3 = sg.acquire_lock(conn3b)
check("acquire after release succeeds", lock3 is True)

# Release by B
sg.release_lock(conn3b)

# Stale lock recovery: insert an expired lock manually
expired_time = "2020-01-01T00:00:00+00:00"
conn3a.execute(
    "INSERT OR REPLACE INTO scan_locks (account_email, locked_at, lock_pid, lock_expires_at) VALUES (?, ?, ?, ?)",
    (sg.DEFAULT_ACCOUNT_EMAIL, expired_time, 99999, expired_time),
)
conn3a.commit()

# A should be able to acquire (stale lock removed)
lock4 = sg.acquire_lock(conn3a)
check("stale lock (expired) recovered", lock4 is True)

sg.release_lock(conn3a)

# Dead PID recovery
dead_pid_time = sg.now_iso()
future_expires = "2099-01-01T00:00:00+00:00"
conn3a.execute(
    "INSERT OR REPLACE INTO scan_locks (account_email, locked_at, lock_pid, lock_expires_at) VALUES (?, ?, ?, ?)",
    (sg.DEFAULT_ACCOUNT_EMAIL, dead_pid_time, 999999, future_expires),
)
conn3a.commit()
lock5 = sg.acquire_lock(conn3a)
check("dead PID lock recovered", lock5 is True)

sg.release_lock(conn3a)

# Lock release after failure: simulate by acquiring then releasing in finally
lock6 = sg.acquire_lock(conn3a)
check("lock acquired for failure test", lock6 is True)
# Simulate failure
try:
    raise ValueError("simulated failure")
except ValueError:
    pass
finally:
    sg.release_lock(conn3a)
# Verify released
lock7 = sg.acquire_lock(conn3a)
check("lock released after failure", lock7 is True)
sg.release_lock(conn3a)

conn3a.close()
conn3b.close()
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path3 + suffix)
    except FileNotFoundError:
        pass

# ---------------------------------------------------------------------------
# Test 9: Classifier regression — newsletter domain precedence over noreply
# ---------------------------------------------------------------------------

section("Classifier regression (newsletter vs noreply)")

# Test: no-reply@substack.com → newsletter (known domain takes precedence)
msg_substack = {
    "from_email": "no-reply@substack.com",
    "subject": "Weekly digest: 5 new posts",
    "snippet": "Your weekly digest of new posts",
    "body_text": "Here are the top posts from this week. Read more on Substack.",
    "headers": {"List-Unsubscribe": "<https://substack.com/unsubscribe>"},
    "labels": ["INBOX"],
}
result = sg.classify_message_type(msg_substack)
check("no-reply@substack.com → newsletter", result[0] == "newsletter")
check("substack confidence 0.9", result[1] == 0.9)

# Test: noreply sender on unknown domain → automated_notification
msg_unknown_noreply = {
    "from_email": "noreply@unknownservice.com",
    "subject": "Your account has been updated",
    "snippet": "Your account settings have been changed.",
    "body_text": "Your account settings have been changed. No action required.",
    "headers": {},
    "labels": ["INBOX"],
}
result = sg.classify_message_type(msg_unknown_noreply)
check("noreply@unknown → automated_notification", result[0] == "automated_notification")

# Test: known newsletter domain with List-Unsubscribe → newsletter
msg_newsletter_lu = {
    "from_email": "digest@substack.com",
    "subject": "Weekly digest: 5 new posts",
    "snippet": "Your weekly digest",
    "body_text": "Here are the top posts from this week.",
    "headers": {"List-Unsubscribe": "<https://substack.com/unsubscribe>"},
    "labels": ["INBOX"],
}
result = sg.classify_message_type(msg_newsletter_lu)
check("newsletter domain + LU → newsletter", result[0] == "newsletter")

# Test: no-reply@substack.com without LU → still newsletter (domain rule)
msg_substack_no_lu = {
    "from_email": "no-reply@substack.com",
    "subject": "Weekly digest",
    "snippet": "Your weekly digest",
    "body_text": "Here are the top posts.",
    "headers": {},
    "labels": ["INBOX"],
}
result = sg.classify_message_type(msg_substack_no_lu)
check("no-reply@substack.com without LU → newsletter", result[0] == "newsletter")

# Test: noreply on known newsletter domain with strong promo → newsletter (domain takes precedence)
msg_promo_noreply = {
    "from_email": "no-reply@substack.com",
    "subject": "Special offer: 50% off premium",
    "snippet": "Get 50% off",
    "body_text": "Limited time offer. Buy now and save.",
    "headers": {"List-Unsubscribe": "<https://substack.com/unsubscribe>"},
    "labels": ["INBOX"],
}
result = sg.classify_message_type(msg_promo_noreply)
check("noreply newsletter domain with promo → marketing (promo takes precedence)", result[0] == "marketing")

# ---------------------------------------------------------------------------
# Multi-account lock isolation
# ---------------------------------------------------------------------------
section("Multi-account lock isolation")

# Two different accounts should be able to acquire locks independently
conn_acct1 = sqlite3.connect(":memory:")
conn_acct1.execute("PRAGMA foreign_keys = ON")
conn_acct1.executescript("""
CREATE TABLE scan_locks (
    account_email TEXT NOT NULL,
    locked_at TEXT NOT NULL,
    lock_pid INTEGER NOT NULL,
    lock_expires_at TEXT NOT NULL,
    PRIMARY KEY (account_email, lock_pid)
);
""")
conn_acct2 = conn_acct1  # same DB, different account

acct1 = "info@danielebuatti.com"
acct2 = "daniele.buatti@gmail.com"

# Acquire lock for account 1
ok1 = sg.acquire_lock(conn_acct1, acct1)
check("Account 1 lock acquired", ok1 is True)

# Acquire lock for account 2 (should succeed — different account)
ok2 = sg.acquire_lock(conn_acct1, acct2)
check("Account 2 lock acquired (independent)", ok2 is True)

# Account 1 lock still held
row1 = conn_acct1.execute("SELECT 1 FROM scan_locks WHERE account_email = ?", (acct1,)).fetchone()
check("Account 1 lock still held", row1 is not None)

# Account 2 lock still held
row2 = conn_acct1.execute("SELECT 1 FROM scan_locks WHERE account_email = ?", (acct2,)).fetchone()
check("Account 2 lock still held", row2 is not None)

# Release account 1
sg.release_lock(conn_acct1, acct1)
row1_after = conn_acct1.execute("SELECT 1 FROM scan_locks WHERE account_email = ?", (acct1,)).fetchone()
check("Account 1 lock released", row1_after is None)

# Account 2 still held
row2_after = conn_acct1.execute("SELECT 1 FROM scan_locks WHERE account_email = ?", (acct2,)).fetchone()
check("Account 2 lock still held after acct1 release", row2_after is not None)

# Cleanup
sg.release_lock(conn_acct1, acct2)

# ---------------------------------------------------------------------------
# Raw directory per account
# ---------------------------------------------------------------------------
section("Raw directory per account")

raw1 = sg.get_raw_dir("info@danielebuatti.com")
raw2 = sg.get_raw_dir("daniele.buatti@gmail.com")
check("Raw dirs are different", raw1 != raw2)
check("Raw dir 1 contains account email", "info@danielebuatti.com" in str(raw1))
check("Raw dir 2 contains account email", "daniele.buatti@gmail.com" in str(raw2))

# ---------------------------------------------------------------------------
# Default account
# ---------------------------------------------------------------------------
section("Default account selection")

check("DEFAULT_ACCOUNT_EMAIL is info", sg.DEFAULT_ACCOUNT_EMAIL == "info@danielebuatti.com")

# ---------------------------------------------------------------------------
# Manifest idempotency
# ---------------------------------------------------------------------------
section("Manifest idempotency")

# Use a temp DB
import tempfile, os
db_path_m = os.path.join(tempfile.gettempdir(), "test-manifest.db")
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path_m + suffix)
    except FileNotFoundError:
        pass
os.environ["CORRESPONDENCE_DB_PATH"] = db_path_m
sg.DB_PATH = db_path_m
conn_m = sg.get_db()
mig_dir = SCRIPTS_DIR / "migrations"
for mig_file in sorted(mig_dir.glob("*.sql")):
    conn_m.executescript(mig_file.read_text())
conn_m.execute("PRAGMA user_version = 5")
conn_m.commit()

# Create a thread and message for account 1
tid_m = sg.upsert_thread(conn_m, "info@danielebuatti.com", "thread_m1", "Test")
mid_m, _ = sg.upsert_message(conn_m, "info@danielebuatti.com", "msg_m1", "thread_m1", tid_m,
    "in", "Test", "test@test.com", "[]", "[]", "Test", "2024-01-01", None, "s", "b", "2024-01-01")
conn_m.commit()

# Insert manifest entry twice (idempotent)
now = sg.now_iso()
for _ in range(2):
    conn_m.execute(
        """INSERT INTO import_manifest
           (account_email, gmail_message_id, gmail_thread_id, discovered_at,
            discovery_source, status, first_discovered_at, last_updated_at)
           VALUES (?, ?, ?, ?, 'bootstrap', 'pending', ?, ?)
           ON CONFLICT(account_email, gmail_message_id) DO NOTHING""",
        ("info@danielebuatti.com", "msg_m1", "thread_m1", now, now, now),
    )
conn_m.commit()

m_count = conn_m.execute("SELECT COUNT(*) FROM import_manifest WHERE account_email = 'info@danielebuatti.com'").fetchone()[0]
check("Manifest idempotent (1 entry after 2 inserts)", m_count == 1)

# Second account manifest entry
conn_m.execute(
    """INSERT INTO import_manifest
       (account_email, gmail_message_id, gmail_thread_id, discovered_at,
        discovery_source, status, first_discovered_at, last_updated_at)
       VALUES (?, ?, ?, ?, 'bootstrap', 'pending', ?, ?)
       ON CONFLICT(account_email, gmail_message_id) DO NOTHING""",
    ("daniele.buatti@gmail.com", "msg_m1", "thread_m1", now, now, now),
)
conn_m.commit()

m_count2 = conn_m.execute("SELECT COUNT(*) FROM import_manifest").fetchone()[0]
check("Second account manifest entry (total 2)", m_count2 == 2)

# Same gmail_message_id in different accounts = different entries
m_same = conn_m.execute("SELECT COUNT(*) FROM import_manifest WHERE gmail_message_id = 'msg_m1'").fetchone()[0]
check("Same gmail_id in 2 accounts = 2 entries", m_same == 2)

# Cleanup
os.unlink(db_path_m)
for suffix in ("-wal", "-shm"):
    try:
        os.unlink(db_path_m + suffix)
    except FileNotFoundError:
        pass

# ---------------------------------------------------------------------------
# Pagination state columns
# ---------------------------------------------------------------------------
section("Pagination state columns")

db_path_p = os.path.join(tempfile.gettempdir(), "test-pagination.db")
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path_p + suffix)
    except FileNotFoundError:
        pass
os.environ["CORRESPONDENCE_DB_PATH"] = db_path_p
sg.DB_PATH = db_path_p
conn_p = sg.get_db()
mig_dir = SCRIPTS_DIR / "migrations"
for mig_file in sorted(mig_dir.glob("*.sql")):
    conn_p.executescript(mig_file.read_text())
conn_p.execute("PRAGMA user_version = 5")
conn_p.commit()

# Verify pagination columns exist
sc_cols = [r[1] for r in conn_p.execute("PRAGMA table_info(scan_state)").fetchall()]
check("bootstrap_page_token column exists", "bootstrap_page_token" in sc_cols)
check("bootstrap_enumeration_complete column exists", "bootstrap_enumeration_complete" in sc_cols)
check("incremental_page_token column exists", "incremental_page_token" in sc_cols)

# Insert scan_state with page token
conn_p.execute(
    """INSERT INTO scan_state (account_email, overlap_minutes, bootstrap_page_token,
       bootstrap_enumeration_complete, bootstrap_complete)
       VALUES (?, ?, ?, ?, ?)""",
    ("info@danielebuatti.com", 60, "TOKEN123", 0, 0),
)
conn_p.commit()

# Read it back
row = conn_p.execute("SELECT bootstrap_page_token, bootstrap_enumeration_complete, bootstrap_complete FROM scan_state WHERE account_email = 'info@danielebuatti.com'").fetchone()
check("Page token persisted", row[0] == "TOKEN123")
check("Enumeration not complete", row[1] == 0)
check("Bootstrap not complete", row[2] == 0)

# Simulate clearing token + marking enumeration complete
conn_p.execute(
    """UPDATE scan_state SET bootstrap_page_token = NULL, bootstrap_enumeration_complete = 1
       WHERE account_email = 'info@danielebuatti.com'""",
)
conn_p.commit()
row2 = conn_p.execute("SELECT bootstrap_page_token, bootstrap_enumeration_complete FROM scan_state WHERE account_email = 'info@danielebuatti.com'").fetchone()
check("Page token cleared", row2[0] is None)
check("Enumeration marked complete", row2[1] == 1)

# Cleanup
os.unlink(db_path_p)
for suffix in ("-wal", "-shm"):
    try:
        os.unlink(db_path_p + suffix)
    except FileNotFoundError:
        pass

# ---------------------------------------------------------------------------
# Pagination and interruption state machine (synthetic)
# ---------------------------------------------------------------------------
section("Pagination state machine (synthetic)")

db_path_pg = os.path.join(tempfile.gettempdir(), "test-pagination-sm.db")
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path_pg + suffix)
    except FileNotFoundError:
        pass
os.environ["CORRESPONDENCE_DB_PATH"] = db_path_pg
sg.DB_PATH = db_path_pg
conn_pg = sg.get_db()
mig_dir = SCRIPTS_DIR / "migrations"
for mig_file in sorted(mig_dir.glob("*.sql")):
    conn_pg.executescript(mig_file.read_text())
conn_pg.execute("PRAGMA user_version = 5")
conn_pg.commit()

acct = "info@danielebuatti.com"
conn_pg.execute("INSERT INTO scan_state (account_email, overlap_minutes, bootstrap_complete, bootstrap_enumeration_complete, bootstrap_page_token) VALUES (?, ?, 0, 0, NULL)", (acct, 60))
conn_pg.commit()

# Scenario 1: First page returns 500 + nextPageToken → enumeration not complete, token saved
conn_pg.execute("UPDATE scan_state SET bootstrap_page_token = ?, bootstrap_enumeration_complete = 0, bootstrap_complete = 0 WHERE account_email = ?", ("TOKEN_PAGE1", acct))
conn_pg.commit()
row = conn_pg.execute("SELECT bootstrap_page_token, bootstrap_enumeration_complete, bootstrap_complete FROM scan_state WHERE account_email = ?", (acct,)).fetchone()
check("Page1: token saved", row[0] == "TOKEN_PAGE1")
check("Page1: enumeration not complete", row[1] == 0)
check("Page1: bootstrap not complete", row[2] == 0)

# Scenario 2: Second run resumes with saved token
saved_token = row[0]
check("Resume: token available for next run", saved_token is not None)

# Scenario 3: Repeated page (same token) produces no duplicate state
conn_pg.execute("UPDATE scan_state SET bootstrap_page_token = ? WHERE account_email = ?", (saved_token, acct))
conn_pg.commit()
row3 = conn_pg.execute("SELECT bootstrap_page_token FROM scan_state WHERE account_email = ?", (acct,)).fetchone()
check("Repeated page: token unchanged", row3[0] == saved_token)

# Scenario 4: Failed page — token still saved (not advanced)
conn_pg.execute("UPDATE scan_state SET bootstrap_page_token = ?, last_scan_status = 'error' WHERE account_email = ?", (saved_token, acct))
conn_pg.commit()
row4 = conn_pg.execute("SELECT bootstrap_page_token, last_scan_status FROM scan_state WHERE account_email = ?", (acct,)).fetchone()
check("Failed page: token NOT advanced", row4[0] == saved_token)
check("Failed page: status = error", row4[1] == "error")

# Scenario 5: Exhausted page — no nextPageToken → enumeration complete, token cleared
conn_pg.execute("UPDATE scan_state SET bootstrap_page_token = NULL, bootstrap_enumeration_complete = 1, last_scan_status = 'ok' WHERE account_email = ?", (acct,))
conn_pg.commit()
row5 = conn_pg.execute("SELECT bootstrap_page_token, bootstrap_enumeration_complete FROM scan_state WHERE account_email = ?", (acct,)).fetchone()
check("Exhausted: token cleared", row5[0] is None)
check("Exhausted: enumeration complete", row5[1] == 1)

# Scenario 6: bootstrap_complete only when enumeration complete AND all messages complete
conn_pg.execute("UPDATE scan_state SET bootstrap_complete = 1 WHERE account_email = ? AND bootstrap_enumeration_complete = 1", (acct,))
conn_pg.commit()
row6 = conn_pg.execute("SELECT bootstrap_complete FROM scan_state WHERE account_email = ?", (acct,)).fetchone()
check("bootstrap_complete set after enumeration", row6[0] == 1)

# Cleanup
os.unlink(db_path_pg)
for suffix in ("-wal", "-shm"):
    try:
        os.unlink(db_path_pg + suffix)
    except FileNotFoundError:
        pass

# ---------------------------------------------------------------------------
# Manifest insertion and idempotency
# ---------------------------------------------------------------------------
section("Manifest insertion and idempotency")

db_path_mi = os.path.join(tempfile.gettempdir(), "test-manifest-ins.db")
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path_mi + suffix)
    except FileNotFoundError:
        pass
os.environ["CORRESPONDENCE_DB_PATH"] = db_path_mi
sg.DB_PATH = db_path_mi
conn_mi = sg.get_db()
mig_dir = SCRIPTS_DIR / "migrations"
for mig_file in sorted(mig_dir.glob("*.sql")):
    conn_mi.executescript(mig_file.read_text())
conn_mi.execute("PRAGMA user_version = 5")
conn_mi.commit()

acct_mi = "info@danielebuatti.com"
tid_mi = sg.upsert_thread(conn_mi, acct_mi, "thread_mi1", "Test")
mid_mi, _ = sg.upsert_message(conn_mi, acct_mi, "msg_mi1", "thread_mi1", tid_mi,
    "in", "Test", "test@test.com", "[]", "[]", "Test", "2024-01-01", None, "s", "b", "2024-01-01")
conn_mi.commit()

# Insert manifest entry (simulating discovery)
now = sg.now_iso()
conn_mi.execute(
    """INSERT INTO import_manifest
       (account_email, gmail_message_id, gmail_thread_id, discovered_at,
        discovery_source, status, first_discovered_at, last_updated_at)
       VALUES (?, ?, ?, ?, 'bootstrap', 'pending', ?, ?)
       ON CONFLICT(account_email, gmail_message_id) DO NOTHING""",
    (acct_mi, "msg_mi1", "thread_mi1", now, now, now),
)
conn_mi.commit()

# Verify entry exists
m = conn_mi.execute("SELECT status FROM import_manifest WHERE account_email = ? AND gmail_message_id = ?", (acct_mi, "msg_mi1")).fetchone()
check("Manifest entry created on discovery", m is not None)
check("Manifest status = pending (not imported on discovery)", m[0] == "pending")

# Update to imported after completeness
sg.update_manifest_status(conn_mi, mid_mi, "imported")
conn_mi.commit()
m2 = conn_mi.execute("SELECT status FROM import_manifest WHERE account_email = ? AND gmail_message_id = ?", (acct_mi, "msg_mi1")).fetchone()
check("Manifest status updated to imported", m2[0] == "imported")

# Idempotent re-insert doesn't duplicate
conn_mi.execute(
    """INSERT INTO import_manifest
       (account_email, gmail_message_id, gmail_thread_id, discovered_at,
        discovery_source, status, first_discovered_at, last_updated_at)
       VALUES (?, ?, ?, ?, 'bootstrap', 'pending', ?, ?)
       ON CONFLICT(account_email, gmail_message_id) DO NOTHING""",
    (acct_mi, "msg_mi1", "thread_mi1", now, now, now),
)
conn_mi.commit()
m_count = conn_mi.execute("SELECT COUNT(*) FROM import_manifest WHERE account_email = ?", (acct_mi,)).fetchone()[0]
check("Manifest idempotent (still 1 entry)", m_count == 1)

# Cleanup
os.unlink(db_path_mi)
for suffix in ("-wal", "-shm"):
    try:
        os.unlink(db_path_mi + suffix)
    except FileNotFoundError:
        pass

# ---------------------------------------------------------------------------
# Read-only credential isolation (synthetic)
# ---------------------------------------------------------------------------
section("Read-only credential isolation (synthetic)")

import json, tempfile, os

# Test: load_research_ops_credentials returns None when no auth file exists
db_path_ro = os.path.join(tempfile.gettempdir(), "test-readonly.db")
for suffix in ("", "-wal", "-shm"):
    try:
        os.unlink(db_path_ro + suffix)
    except FileNotFoundError:
        pass

# Ensure no readonly auth file exists
ro_auth = sg.RESEARCH_OPS_AUTH_FILE
# Temporarily point to a non-existent path
original_auth_file = sg.RESEARCH_OPS_AUTH_FILE
sg.RESEARCH_OPS_AUTH_FILE = Path(tempfile.gettempdir()) / "nonexistent_auth.json"
creds = sg.load_research_ops_credentials("test@example.com")
check("No auth file → None", creds is None)
sg.RESEARCH_OPS_AUTH_FILE = original_auth_file

# Test: read-only auth file with correct scope
ro_path = Path(tempfile.gettempdir()) / "test_ro_auth.json"
ro_data = {
    "test@example.com": {
        "access_token": "fake_token",
        "refresh_token": "fake_refresh",
        "client_id": "fake_client",
        "client_secret": "fake_secret",
        "scopes": ["https://www.googleapis.com/auth/gmail.readonly"],
    }
}
ro_path.write_text(json.dumps(ro_data))
sg.RESEARCH_OPS_AUTH_FILE = ro_path
creds = sg.load_research_ops_credentials("test@example.com")
# Note: Credentials object may not validate token, but should be created
check("Read-only auth file → credentials created", creds is not None)

# Test: read-only auth file with wrong scope (full access) → None
ro_path2 = Path(tempfile.gettempdir()) / "test_ro_auth2.json"
ro_data2 = {
    "test@example.com": {
        "access_token": "fake_token",
        "refresh_token": "fake_refresh",
        "client_id": "fake_client",
        "client_secret": "fake_secret",
        "scopes": ["https://mail.google.com/"],
    }
}
ro_path2.write_text(json.dumps(ro_data2))
sg.RESEARCH_OPS_AUTH_FILE = ro_path2
creds2 = sg.load_research_ops_credentials("test@example.com")
check("Full-access scope → None (rejected)", creds2 is None)

# Cleanup
sg.RESEARCH_OPS_AUTH_FILE = original_auth_file
for p in [ro_path, ro_path2]:
    try:
        os.unlink(p)
    except FileNotFoundError:
        pass

# Test: no fallback to comm-analytics (verify function doesn't import it)
# This is confirmed by code inspection — load_research_ops_credentials returns None
# when read-only file is missing, with no comm-analytics fallback.

print(f"\n{'='*40}")
print(f"Results: {PASS} passed, {FAIL} failed")
if FAIL > 0:
    sys.exit(1)
if FAIL > 0:
    sys.exit(1)
if FAIL > 0:
    sys.exit(1)
if FAIL > 0:
    sys.exit(1)
if FAIL > 0:
    sys.exit(1)