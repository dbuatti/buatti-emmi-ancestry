#!/usr/bin/env python3
"""
Gmail sync sidecar for the Family Tree Correspondence project.

Read-only with respect to Gmail: fetches messages, never sends/deletes/labels.
Imports into the local SQLite correspondence database.

Usage:
  python scripts/sync-gmail.py                    # bootstrap import (max 500 messages)
  python scripts/sync-gmail.py --incremental       # incremental sync (new messages only)
  python scripts/sync-gmail.py --dry-run           # list metadata only, no DB writes

Account: info@danielebuatti.com only.
Max messages per bootstrap run: 500 (strict cap, no pagination beyond first page).
"""

import argparse
import base64
import hashlib
import json
import os
import re
import sqlite3
import sys
import threading
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

DEFAULT_ACCOUNT_EMAIL = "info@danielebuatti.com"
MAX_MESSAGES = 500
READONLY_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]
OVERLAP_MINUTES = 60
LOCK_TIMEOUT_MINUTES = 10
HEARTBEAT_INTERVAL_SECONDS = 30
COMM_ANALYTICS_DIR = os.path.expanduser("~/dyad-apps/comm-analytics")

# Resolve project root (script is in scripts/)
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DB_PATH = os.environ.get("CORRESPONDENCE_DB_PATH",
                         str(PROJECT_ROOT / ".local" / "correspondence.db"))
ATTACHMENTS_DIR = PROJECT_ROOT / "correspondence"
# Separate auth file for Research Operations Centre (read-only scope)
RESEARCH_OPS_AUTH_FILE = PROJECT_ROOT / ".local" / "gmail_auth_readonly.json"


def get_raw_dir(account_email):
    """Return the raw JSON directory for a given account."""
    return PROJECT_ROOT / "correspondence" / "raw" / account_email


def load_research_ops_credentials(account_email):
    """Load OAuth credentials from the Research Operations Centre read-only auth file.

    Falls back to comm-analytics credentials if the read-only file does not exist
    or does not contain the account. This allows gradual migration.

    Returns a google.oauth2.credentials.Credentials object or None.
    """
    import json as _json
    from google.oauth2.credentials import Credentials

    # Try read-only auth file first
    auth_file = RESEARCH_OPS_AUTH_FILE
    if auth_file.exists():
        try:
            accounts = _json.loads(auth_file.read_text())
            if account_email in accounts:
                account = accounts[account_email]
                access_token = account.get("access_token")
                refresh_token = account.get("refresh_token")
                if access_token:
                    client_id = account.get("client_id", "")
                    client_secret = account.get("client_secret", "")
                    if not client_id or not client_secret:
                        secrets_path = Path(COMM_ANALYTICS_DIR) / "client_secrets.json"
                        if secrets_path.exists():
                            try:
                                secrets = _json.loads(secrets_path.read_text())
                                installed = secrets.get("installed", {})
                                client_id = client_id or installed.get("client_id", "")
                                client_secret = client_secret or installed.get("client_secret", "")
                            except Exception:
                                pass
                    creds = Credentials(
                        token=access_token,
                        refresh_token=refresh_token,
                        token_uri="https://oauth2.googleapis.com/token",
                        client_id=client_id,
                        client_secret=client_secret,
                        scopes=account.get("scopes", READONLY_SCOPES),
                    )

                    # Validate scopes — must be read-only only
                    granted = set(creds.scopes or account.get("scopes", []))
                    required = set(READONLY_SCOPES)
                    if not granted.issubset(required) or granted != required:
                        # Check if any non-readonly scope is present
                        forbidden = granted - required
                        if forbidden:
                            print(f"ERROR: Account {account_email} has non-read-only scopes: {forbidden}")
                            print("Re-authorize with read-only scope only.")
                            return None
                    if creds.expired and creds.refresh_token:
                        from google.auth.transport.requests import Request
                        creds.refresh(Request())
                        account["access_token"] = creds.token
                        if creds.expiry:
                            account["token_expiry"] = creds.expiry.strftime("%Y-%m-%dT%H:%M:%SZ")
                        auth_file.write_text(_json.dumps(accounts, indent=2, ensure_ascii=False))
                    return creds
        except Exception:
            pass

    # NO fallback to comm-analytics. Research Operations Centre uses read-only
    # scope only. If the read-only auth file does not contain the account,
    # credentials are None — the user must authorise separately.
    return None

# Add comm-analytics to path for token loading (read-only reuse)
sys.path.insert(0, COMM_ANALYTICS_DIR)
sys.path.insert(0, os.path.join(COMM_ANALYTICS_DIR, "src"))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def now_iso():
    return datetime.now(timezone.utc).isoformat()


def epoch_ms_to_iso(ms_str):
    """Convert Gmail internalDate (epoch ms string) to ISO8601."""
    try:
        ts = int(ms_str) / 1000.0
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
    except (ValueError, TypeError, OSError):
        return None


def decode_base64url(data):
    """Decode Gmail's base64url-encoded body data."""
    if not data:
        return ""
    padded = data + "=" * (4 - len(data) % 4)
    try:
        return base64.urlsafe_b64decode(padded).decode("utf-8", "replace")
    except Exception:
        return ""


def decode_base64_bytes(data):
    """Decode Gmail base64/base64url attachment data to raw bytes (binary-safe)."""
    if not data:
        return b""
    padded = data + "=" * (4 - len(data) % 4)
    try:
        return base64.urlsafe_b64decode(padded.encode("ascii"))
    except Exception:
        return b""


def strip_html_tags(html):
    """Minimal HTML to text conversion."""
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"(?i)<br\s*/?>", "\n", html)
    html = re.sub(r"(?i)</(p|div|tr|li|h[1-6])>", "\n", html)
    text = re.sub(r"<[^>]+>", " ", html)
    text = (text.replace("&nbsp;", " ").replace("&amp;", "&")
                .replace("&lt;", "<").replace("&gt;", ">")
                .replace("&#39;", "'").replace("&quot;", '"'))
    text = re.sub(r"[ \t\u00a0]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_address_header(header_value):
    """Parse 'Name <email>, Name2 <email2>' into list of {name, email}."""
    if not header_value:
        return []
    result = []
    for match in re.finditer(r'(?:"([^"]*)"|([^,<]+?))?\s*<([^>]+)>', header_value):
        name = (match.group(1) or match.group(2) or "").strip().strip('"')
        email = match.group(3).strip()
        if email and "@" in email:
            result.append({"name": name, "email": email})
    if not result:
        for part in header_value.split(","):
            part = part.strip()
            if "@" in part and "<" not in part:
                result.append({"name": "", "email": part})
    return result


def get_header(headers, name):
    """Extract a header value by name (case-insensitive)."""
    for h in headers:
        if h.get("name", "").lower() == name.lower():
            return h.get("value", "")
    return ""


# ---------------------------------------------------------------------------
# Body extraction (recursive, multipart-safe)
# ---------------------------------------------------------------------------

def extract_body(payload):
    """Extract plain text body from a Gmail message payload.

    Recursively walks multipart structures. Prefers text/plain over text/html.
    Never interprets attachment parts as body.
    """
    if not payload:
        return ""

    if "parts" in payload:
        plain = None
        html = None
        for part in payload["parts"]:
            if part.get("filename") or part.get("body", {}).get("attachmentId"):
                continue
            mime = part.get("mimeType", "")
            if mime == "text/plain":
                data = part.get("body", {}).get("data", "")
                if data:
                    plain = decode_base64url(data)
            elif mime == "text/html":
                data = part.get("body", {}).get("data", "")
                if data:
                    html = decode_base64url(data)
            elif mime.startswith("multipart/"):
                nested_plain, nested_html = extract_body_parts(part)
                if nested_plain and not plain:
                    plain = nested_plain
                if nested_html and not html:
                    html = nested_html
        if plain:
            return plain
        if html:
            return strip_html_tags(html)
        return ""

    data = payload.get("body", {}).get("data", "")
    if data:
        mime = payload.get("mimeType", "")
        decoded = decode_base64url(data)
        if mime == "text/html":
            return strip_html_tags(decoded)
        return decoded
    return ""


def extract_body_parts(payload):
    """Helper: returns (plain, html) tuple from a multipart payload."""
    plain = None
    html = None
    if "parts" in payload:
        for part in payload["parts"]:
            if part.get("filename") or part.get("body", {}).get("attachmentId"):
                continue
            mime = part.get("mimeType", "")
            if mime == "text/plain":
                data = part.get("body", {}).get("data", "")
                if data:
                    plain = decode_base64url(data)
            elif mime == "text/html":
                data = part.get("body", {}).get("data", "")
                if data:
                    html = decode_base64url(data)
            elif mime.startswith("multipart/"):
                np, nh = extract_body_parts(part)
                if np and not plain:
                    plain = np
                if nh and not html:
                    html = nh
    return plain, html


def extract_attachment_metadata(payload):
    """Extract attachment metadata (no downloads). Returns list of dicts."""
    result = []
    if not payload:
        return result
    if "parts" in payload:
        for part in payload["parts"]:
            if part.get("filename") or part.get("body", {}).get("attachmentId"):
                result.append({
                    "filename": part.get("filename", "unnamed"),
                    "mime_type": part.get("mimeType", "application/octet-stream"),
                    "size_bytes": part.get("body", {}).get("size", 0),
                    "gmail_attachment_id": part.get("body", {}).get("attachmentId"),
                })
            if "parts" in part:
                result.extend(extract_attachment_metadata(part))
    return result


# ---------------------------------------------------------------------------
# Sanitisation
# ---------------------------------------------------------------------------

def sanitise_filename(name):
    """Sanitise a filename for safe disk storage."""
    if not name:
        return "unnamed"
    name = name.replace("/", "_").replace("\\", "_").replace("\x00", "")
    name = re.sub(r"[^A-Za-z0-9_.\-]", "_", name)
    name = re.sub(r"_+", "_", name)
    if len(name) > 200:
        name = name[:200]
    return name or "unnamed"


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    """Open SQLite database with WAL, FK, busy_timeout. Ensure scan_locks table exists."""
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA busy_timeout = 5000")
    conn.row_factory = sqlite3.Row
    # Safety net: ensure scan_locks table exists (migration 003 may not be applied)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS scan_locks (
            account_email TEXT PRIMARY KEY,
            locked_at TEXT NOT NULL,
            lock_pid INTEGER NOT NULL,
            lock_expires_at TEXT NOT NULL
        )
    """)
    conn.commit()
    return conn


def acquire_lock(conn, account_email=None):
    """Atomically acquire a scan lock. Returns True on success, False if locked."""
    if account_email is None:
        account_email = DEFAULT_ACCOUNT_EMAIL
    now = datetime.now(timezone.utc)
    lock_expires = (now + timedelta(minutes=LOCK_TIMEOUT_MINUTES)).isoformat()
    now_str = now.isoformat()

    # Remove stale lock if expired or PID is dead
    row = conn.execute(
        "SELECT lock_pid, lock_expires_at FROM scan_locks WHERE account_email = ?",
        (account_email,),
    ).fetchone()
    if row:
        expired = row["lock_expires_at"] < now_str
        pid_dead = False
        try:
            os.kill(row["lock_pid"], 0)
        except (OSError, ProcessLookupError):
            pid_dead = True
        if expired or pid_dead:
            conn.execute("DELETE FROM scan_locks WHERE account_email = ?", (account_email,))
            conn.commit()

    # Atomic insert (fails if lock exists due to PK constraint)
    try:
        conn.execute("BEGIN IMMEDIATE")
        conn.execute(
            """INSERT INTO scan_locks (account_email, locked_at, lock_pid, lock_expires_at)
               VALUES (?, ?, ?, ?)""",
            (account_email, now_str, os.getpid(), lock_expires),
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        conn.execute("ROLLBACK")
        return False
    except Exception:
        try:
            conn.execute("ROLLBACK")
        except Exception:
            pass
        return False


def release_lock(conn, account_email=None):
    """Release the scan lock (only the owner can release)."""
    if account_email is None:
        account_email = DEFAULT_ACCOUNT_EMAIL
    try:
        conn.execute(
            "DELETE FROM scan_locks WHERE account_email = ? AND lock_pid = ?",
            (account_email, os.getpid()),
        )
        conn.commit()
    except Exception:
        pass


# ---------------------------------------------------------------------------
# Heartbeat (renews lock during long-running scans)
# ---------------------------------------------------------------------------

# Module-level state for heartbeat thread
_heartbeat_stop = threading.Event()
_lost_lock = threading.Event()
_heartbeat_thread = None


class LockLostError(Exception):
    """Raised when the scan lock is lost during operation."""
    pass


def _heartbeat_worker(db_path, stop_event, lost_event, account_email):
    """Background thread that renews the lock periodically.

    Uses a separate DB connection to avoid thread-safety issues with the
    main thread's connection. Runs until stop_event is set.
    """
    if account_email is None:
        account_email = DEFAULT_ACCOUNT_EMAIL
    hb_conn = None
    try:
        hb_conn = sqlite3.connect(db_path, timeout=10)
        hb_conn.execute("PRAGMA busy_timeout = 10000")
        hb_conn.row_factory = sqlite3.Row
        while not stop_event.wait(HEARTBEAT_INTERVAL_SECONDS):
            try:
                new_expires = (datetime.now(timezone.utc) + timedelta(
                    minutes=LOCK_TIMEOUT_MINUTES)).isoformat()
                cur = hb_conn.execute(
                    """UPDATE scan_locks SET lock_expires_at = ?
                       WHERE account_email = ? AND lock_pid = ?""",
                    (new_expires, account_email, os.getpid()),
                )
                hb_conn.commit()
                if cur.rowcount == 0:
                    # Lock no longer belongs to us
                    lost_event.set()
                    return
            except sqlite3.OperationalError:
                # SQLITE_BUSY or similar — retry once after short sleep
                time.sleep(1)
                try:
                    new_expires = (datetime.now(timezone.utc) + timedelta(
                        minutes=LOCK_TIMEOUT_MINUTES)).isoformat()
                    cur = hb_conn.execute(
                        """UPDATE scan_locks SET lock_expires_at = ?
                           WHERE account_email = ? AND lock_pid = ?""",
                        (new_expires, account_email, os.getpid()),
                    )
                    hb_conn.commit()
                    if cur.rowcount == 0:
                        lost_event.set()
                        return
                except Exception:
                    lost_event.set()
                    return
            except Exception:
                lost_event.set()
                return
    except Exception:
        lost_event.set()
    finally:
        if hb_conn:
            try:
                hb_conn.close()
            except Exception:
                pass


def start_heartbeat(db_path, account_email=None):
    """Start the heartbeat background thread. Returns the thread."""
    global _heartbeat_thread
    if account_email is None:
        account_email = DEFAULT_ACCOUNT_EMAIL
    _heartbeat_stop.clear()
    _lost_lock.clear()
    t = threading.Thread(
        target=_heartbeat_worker,
        args=(db_path, _heartbeat_stop, _lost_lock, account_email),
        daemon=True,
        name="scan-heartbeat",
    )
    t.start()
    _heartbeat_thread = t
    return t


def stop_heartbeat():
    """Stop the heartbeat thread and wait for it to finish."""
    global _heartbeat_thread
    _heartbeat_stop.set()
    if _heartbeat_thread is not None and _heartbeat_thread.is_alive():
        _heartbeat_thread.join(timeout=5)
    _heartbeat_thread = None


def upsert_thread(conn, account_email, gmail_thread_id, subject):
    """Create or resolve a thread. Returns thread id."""
    now = now_iso()
    conn.execute(
        """INSERT INTO threads (account_email, gmail_thread_id, subject, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(account_email, gmail_thread_id) DO NOTHING""",
        (account_email, gmail_thread_id, subject, now, now),
    )
    row = conn.execute(
        "SELECT id FROM threads WHERE account_email = ? AND gmail_thread_id = ?",
        (account_email, gmail_thread_id),
    ).fetchone()
    return row["id"]


def upsert_message(conn, account_email, gmail_message_id, gmail_thread_id, thread_id,
                   direction, from_name, from_email, to_json, cc_json, subject,
                   received_at, sent_at, snippet, body_text, imported_at):
    """Upsert a message. Returns (message_id, was_inserted).

    Checks existence before insert to avoid relying on cur.rowcount, which can
    be unreliable under sustained load with WAL mode and concurrent connections.
    """
    existing = conn.execute(
        "SELECT id, imported_at FROM messages WHERE account_email = ? AND gmail_message_id = ?",
        (account_email, gmail_message_id),
    ).fetchone()
    if existing:
        return existing["id"], False

    # Count rows before insert
    count_before = conn.execute(
        "SELECT COUNT(*) FROM messages WHERE account_email = ? AND gmail_message_id = ?",
        (account_email, gmail_message_id),
    ).fetchone()[0]

    cur = conn.execute(
        """INSERT INTO messages (account_email, gmail_message_id, gmail_thread_id, thread_id,
               direction, from_name, from_email, to_json, cc_json, subject, received_at,
               sent_at, snippet, body_text, imported_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(account_email, gmail_message_id) DO NOTHING""",
        (account_email, gmail_message_id, gmail_thread_id, thread_id, direction,
         from_name, from_email, to_json, cc_json, subject, received_at, sent_at,
         snippet, body_text, imported_at),
    )

    # Verify by checking if the row now exists with our imported_at
    row = conn.execute(
        "SELECT id, imported_at FROM messages WHERE account_email = ? AND gmail_message_id = ?",
        (account_email, gmail_message_id),
    ).fetchone()
    if row and row["imported_at"] == imported_at:
        return row["id"], True
    return row["id"], False


def insert_attachments(conn, message_id, attachments_meta):
    """Insert attachment metadata (no downloads)."""
    now = now_iso()
    for att in attachments_meta:
        safe_name = sanitise_filename(att["filename"])
        conn.execute(
            """INSERT INTO attachments (message_id, filename, safe_filename, mime_type,
                   size_bytes, gmail_attachment_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (message_id, att["filename"], safe_name, att["mime_type"],
             att["size_bytes"], att["gmail_attachment_id"], now),
        )


def write_raw_json(account_email, gmail_message_id, raw_msg):
    """Write raw message JSON (idempotent overwrite)."""
    raw_dir = get_raw_dir(account_email)
    raw_dir.mkdir(parents=True, exist_ok=True)
    path = raw_dir / f"{gmail_message_id}.json"
    path.write_text(json.dumps(raw_msg, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(path)


def check_raw_json_exists(account_email, gmail_message_id):
    """Check if raw JSON file exists."""
    path = get_raw_dir(account_email) / f"{gmail_message_id}.json"
    return path.exists()


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------

def resolve_override_field(override, field):
    """Resolve a field from an override, preferring new fields over legacy category.

    For message_type: check message_type first, then map category conservatively.
    For action_status: check action_status first, then map category conservatively.
    Returns None if neither is set or mapping is not genuinely equivalent.
    """
    if override is None:
        return None

    if field == 'message_type':
        if override.get('message_type') is not None:
            return override['message_type']
        cat = override.get('category')
        legacy_type_map = {
            'newsletter': 'newsletter',
            'marketing': 'marketing',
            'automated_notification': 'automated_notification',
            'transactional': 'transactional',
            'personal': 'personal',
            'uncertain': 'uncertain',
            'likely_spam': 'uncertain',
        }
        return legacy_type_map.get(cat)

    if field == 'action_status':
        if override.get('action_status') is not None:
            return override['action_status']
        cat = override.get('category')
        legacy_action_map = {
            'action_required': 'needs_review',
        }
        return legacy_action_map.get(cat)

    return None


STRONG_PROMO_KEYWORDS = [
    "new range", "new product", "pre-order", "now available", "sale",
    "discount", "special offer", "limited time", "buy now", "shop now",
    "get it now", "new collection", "product update", "product updates",
]

KNOWN_MARKETING_SENDERS = {
    "hello@astropad.com",
    "news@email.audient.com",
    "help@mail.kit.com",
}

KNOWN_NEWSLETTER_DOMAINS = {
    "substack.com", "convertkit-mail.com", "mailchimpapp.com",
    "send.zapier.com", "deeperlearning.producthunt.com",
    "news.wakingup.com", "creator.patreon.com",
}


def classify_message_type(msg_data):
    """Deterministic message type classification. Returns (type, confidence)."""
    from_email = (msg_data.get("from_email") or "").lower()
    subject = (msg_data.get("subject") or "").lower()
    snippet = (msg_data.get("snippet") or "").lower()
    body = (msg_data.get("body_text") or "").lower()
    headers = msg_data.get("headers", {})
    labels = msg_data.get("labels", [])

    domain = from_email.split("@")[-1] if "@" in from_email else ""

    # Rule 1: Government domain
    if domain.endswith(".gov.it") or domain.endswith(".pec.it") or domain == "pec.aruba.it":
        return ("government", 0.95)
    # Rule 2: PEC body
    if "posta certificata" in body or "messaggio di posta certificata" in body:
        return ("government", 0.95)
    # Rule 3: Italian government keywords
    gov_keywords = ["comune", "protocollo", "atto", "certificato", "ufficio",
                    "ministero", "registro", "matricolare", "anagrafe",
                    "prefettura", "questura", "tribunale"]
    if any(kw in subject or kw in body for kw in gov_keywords):
        return ("government", 0.9)
    # Rule 4: noreply/no-reply sender check (deferred — known newsletter domains override)
    is_noreply = any(p in from_email for p in ["noreply", "no-reply", "no_reply", "donotreply"])
    has_lu = bool(headers.get("List-Unsubscribe"))
    combined_text = subject + " " + body
    has_strong_promo = any(kw in combined_text for kw in STRONG_PROMO_KEYWORDS)
    # Rule 5: List-Unsubscribe + strong promotional keywords
    if has_lu and has_strong_promo:
        return ("marketing", 0.8)
    # Rule 6: List-Unsubscribe + known marketing sender
    if has_lu and from_email in KNOWN_MARKETING_SENDERS:
        return ("marketing", 0.85)
    # Rule 7: Known marketing sender (without List-Unsubscribe) — confidence 0.75
    if from_email in KNOWN_MARKETING_SENDERS:
        return ("marketing", 0.75)
    # Rule 8: Known newsletter domains (take precedence over noreply)
    if domain in KNOWN_NEWSLETTER_DOMAINS or any(d in domain for d in KNOWN_NEWSLETTER_DOMAINS):
        return ("newsletter", 0.9)
    # Rule 9: noreply/no-reply sender (for non-newsletter domains)
    if is_noreply:
        return ("automated_notification", 0.85)
    # Rule 10: List-Unsubscribe (no promotional signals) -> newsletter
    if has_lu:
        return ("newsletter", 0.85)
    # Rule 11: CATEGORY_UPDATES (no List-Unsubscribe, no noreply)
    if "CATEGORY_UPDATES" in labels and not has_lu:
        return ("automated_notification", 0.7)
    # Rule 12: Human sender, no marketing signals, body >= 100 chars
    body_len = len(body.strip())
    if body_len >= 100 and not is_noreply and not has_lu:
        return ("personal", 0.6)
    # Rule 13: Fallback
    return ("uncertain", 0.3)


def infer_action_status(msg_data, message_type):
    """Infer action status. Conservative: don't assume replies needed."""
    has_attachments = msg_data.get("has_attachments", False)
    body = (msg_data.get("body_text") or "").lower()
    subject = (msg_data.get("subject") or "").lower()

    explicit_request = any(kw in body or kw in subject for kw in
        ["please confirm", "can you send", "could you provide", "we need",
         "please reply", "let me know", "waiting for your", "please review",
         "can you", "could you", "please send", "please provide"])

    has_direct_question = ("?" in body and
        not any(kw in body for kw in ["do you have any questions", "feel free to",
                                     "contact us if", "any questions?"]))

    if message_type == 'government':
        if has_attachments:
            return ("needs_review", 0.7)
        if explicit_request:
            return ("needs_reply", 0.6)
        return ("no_action_needed", 0.5)

    if message_type == 'personal':
        # Scheduling/administrative keywords suggest needs_review
        scheduling_keywords = ["reschedul", "cancel", "change", "move", "postpone",
                              "schedule", "lesson", "appointment", "meeting",
                              "billing", "invoice", "payment", "fee"]
        if any(kw in body or kw in subject for kw in scheduling_keywords):
            return ("needs_review", 0.6)
        if explicit_request:
            return ("needs_reply", 0.6)
        if has_direct_question:
            return ("needs_reply", 0.4)
        return ("no_action_needed", 0.7)

    return ("no_action_needed", 0.9)


def get_effective_classification(conn, message, thread):
    """
    Calculate effective message_type and action_status.

    Override precedence: thread > sender > automated.
    Thread-level message_type applies to INCOMING messages only.
    Outgoing messages are always 'personal' (from the user).
    """
    msg_id = message['id']
    thread_id = message['thread_id']
    from_email = message['from_email']
    direction = message['direction']
    msg_data = message

    thread_override = get_override(conn, scope='thread', thread_id=thread_id)
    sender_override = get_override(conn, scope='sender', sender_email=from_email)

    thread_type = resolve_override_field(thread_override, 'message_type')
    thread_action = resolve_override_field(thread_override, 'action_status')
    sender_type = resolve_override_field(sender_override, 'message_type')
    sender_action = resolve_override_field(sender_override, 'action_status')

    if direction == 'out':
        if sender_type is not None:
            effective_type = sender_type
            type_conf = sender_override.get('type_confidence', 0.95)
            type_source = 'sender_override'
        else:
            effective_type = 'personal'
            type_conf = 1.0
            type_source = 'outgoing'
    else:
        if thread_type is not None:
            effective_type = thread_type
            type_conf = thread_override.get('type_confidence', 1.0)
            type_source = 'thread_override'
        elif sender_type is not None:
            effective_type = sender_type
            type_conf = sender_override.get('type_confidence', 0.95)
            type_source = 'sender_override'
        else:
            type_result = classify_message_type(msg_data)
            effective_type = type_result[0]
            type_conf = type_result[1]
            type_source = 'automated'

    if thread_action is not None:
        effective_action = thread_action
        action_conf = thread_override.get('action_confidence', 1.0)
        action_source = 'thread_override'
    elif sender_action is not None:
        effective_action = sender_action
        action_conf = sender_override.get('action_confidence', 0.95)
        action_source = 'sender_override'
    else:
        action_result = infer_action_status(msg_data, effective_type)
        effective_action = action_result[0]
        action_conf = action_result[1]
        action_source = 'automated'

    return {
        'message_type': effective_type,
        'type_confidence': type_conf,
        'type_source': type_source,
        'action_status': effective_action,
        'action_confidence': action_conf,
        'action_source': action_source,
    }


def get_override(conn, scope, thread_id=None, sender_email=None):
    """Get a classification override by scope. Returns dict or None."""
    if scope == 'thread' and thread_id is not None:
        row = conn.execute(
            "SELECT * FROM classification_overrides WHERE scope='thread' AND thread_id=?",
            (thread_id,),
        ).fetchone()
    elif scope == 'sender' and sender_email is not None:
        row = conn.execute(
            "SELECT * FROM classification_overrides WHERE scope='sender' AND sender_email=?",
            (sender_email,),
        ).fetchone()
    else:
        return None
    return dict(row) if row else None


def classify_with_retry(conn, message_id, msg_data):
    """Classify a message, handling retries for technical failures.

    Returns True if classification succeeded, False if failed (error stored).
    Does NOT insert into message_classification on technical failure.
    """
    now = now_iso()

    err_row = conn.execute(
        """SELECT * FROM classification_errors
           WHERE message_id = ? AND status = 'pending'
             AND (next_retry_at IS NULL OR next_retry_at <= ?)""",
        (message_id, now),
    ).fetchone()

    try:
        # Use get_effective_classification for override-aware logic
        # Need to fetch thread row for effective classification
        thread_row = conn.execute(
            "SELECT * FROM threads WHERE id = ?", (msg_data["thread_id"],)
        ).fetchone()
        thread_dict = dict(thread_row) if thread_row else {"id": msg_data["thread_id"]}

        # Build message dict for effective classification
        msg_dict = dict(msg_data)
        msg_dict["id"] = message_id
        msg_dict["direction"] = msg_data.get("direction", "in")

        eff = get_effective_classification(conn, msg_dict, thread_dict)

        # Determine action_required boolean from action_status
        action_req = 1 if eff['action_status'] in ('needs_review', 'needs_reply') else 0

        # Map message_type to a valid category (category CHECK constraint
        # does not include 'government', so map it to 'personal')
        _category = eff['message_type']
        if _category == 'government':
            _category = 'personal'

        conn.execute(
            """INSERT INTO message_classification
               (message_id, category, message_type, action_status,
                relevance_score, action_required, confidence,
                type_confidence, action_confidence, classified_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (message_id, _category, eff['message_type'], eff['action_status'],
             eff['type_confidence'], action_req, eff['type_confidence'],
             eff['type_confidence'], eff['action_confidence'], now),
        )

        if err_row:
            conn.execute(
                """UPDATE classification_errors SET status='resolved', resolved_at=?
                   WHERE id = ?""",
                (now, err_row["id"]),
            )
        return True

    except Exception as e:
        error_msg = f"{type(e).__name__}: {e}"
        if err_row:
            new_retry = err_row["retry_count"] + 1
            if new_retry >= err_row["max_retries"]:
                conn.execute(
                    """UPDATE classification_errors
                       SET retry_count=?, error_message=?, status='failed_permanent',
                           next_retry_at=NULL
                       WHERE id=?""",
                    (new_retry, error_msg, err_row["id"]),
                )
            else:
                backoff_seconds = (2 ** new_retry) * 60
                next_retry = datetime.now(timezone.utc).timestamp() + backoff_seconds
                next_retry_iso = datetime.fromtimestamp(next_retry, tz=timezone.utc).isoformat()
                conn.execute(
                    """UPDATE classification_errors
                       SET retry_count=?, error_message=?, next_retry_at=?
                       WHERE id=?""",
                    (new_retry, error_msg, next_retry_iso, err_row["id"]),
                )
        else:
            conn.execute(
                """INSERT INTO classification_errors
                   (message_id, error_message, retry_count, max_retries, next_retry_at,
                    status, failed_at)
                   VALUES (?, ?, 0, 3, NULL, 'pending', ?)""",
                (message_id, error_msg, now),
            )
        return False


# ---------------------------------------------------------------------------
# Attachment identity helpers
# ---------------------------------------------------------------------------

def gmail_attachment_identity(att):
    """Build a structured identity tuple for a Gmail attachment."""
    if att.get("gmail_attachment_id"):
        return ("gmail", att["gmail_attachment_id"])
    return ("fallback", att["filename"], att["size_bytes"], att["mime_type"])


def db_attachment_identity(db_att):
    """Build a structured identity tuple for a DB attachment row."""
    if db_att["gmail_attachment_id"]:
        return ("gmail", db_att["gmail_attachment_id"])
    return ("fallback", db_att["filename"], db_att["size_bytes"], db_att["mime_type"])


def count_attachments_in_payload(payload):
    """Count attachment parts in a Gmail payload."""
    return len(extract_attachment_metadata(payload))


def reconcile_attachments(conn, message_id, gmail_payload):
    """Reconcile attachment metadata. Preserves local records, marks removed as unavailable.

    Uses explicit identity matching (no INSERT OR IGNORE reliance).
    Returns (success: bool, error: str or None).
    If ambiguous fallback identities exist, returns error without modifying any rows.
    """
    gmail_atts = extract_attachment_metadata(gmail_payload)

    # Build identity lists (with multiplicity)
    gmail_identities = [gmail_attachment_identity(att) for att in gmail_atts]

    # Check for ambiguous fallback identities in Gmail BEFORE any modifications
    gmail_fallback_keys = [k for k in gmail_identities if k[0] == "fallback"]
    if len(gmail_fallback_keys) != len(set(gmail_fallback_keys)):
        return False, "ambiguous_fallback_identity: duplicate fallback keys in Gmail response"

    if len(gmail_identities) != len(set(gmail_identities)):
        return False, "duplicate_identity: duplicate attachment identities in Gmail response"

    db_atts = conn.execute(
        "SELECT id, gmail_attachment_id, filename, size_bytes, mime_type, unavailable "
        "FROM attachments WHERE message_id = ?",
        (message_id,),
    ).fetchall()

    db_identities = [db_attachment_identity(db_att) for db_att in db_atts]

    # Check for ambiguous fallback identities in DB BEFORE any modifications
    db_fallback_keys = [k for k in db_identities if k[0] == "fallback"]
    if len(db_fallback_keys) != len(set(db_fallback_keys)):
        return False, "ambiguous_fallback_identity: duplicate fallback keys in DB"

    if len(db_identities) != len(set(db_identities)):
        return False, "duplicate_identity: duplicate attachment identities in DB"

    # Mark removed attachments as unavailable (never delete)
    db_counter = {}
    for db_att in db_atts:
        db_key = db_attachment_identity(db_att)
        db_counter[db_key] = db_counter.get(db_key, 0) + 1

    for db_att in db_atts:
        db_key = db_attachment_identity(db_att)
        if db_key not in gmail_identities or db_counter.get(db_key, 0) == 0:
            if not db_att["unavailable"]:
                conn.execute(
                    """UPDATE attachments SET unavailable = 1,
                       unavailable_reason = 'Not present in Gmail response',
                       unavailable_at = ?
                       WHERE id = ?""",
                    (now_iso(), db_att["id"]),
                )

    # Reset unavailable for reappeared attachments
    for db_att in db_atts:
        db_key = db_attachment_identity(db_att)
        if db_key in gmail_identities and db_att["unavailable"]:
            conn.execute(
                """UPDATE attachments SET unavailable = 0,
                   unavailable_reason = NULL,
                   unavailable_at = NULL
                   WHERE id = ?""",
                (db_att["id"],),
            )

    # Insert missing attachments (explicit identity check, positional matching)
    db_key_counts = {}
    for db_key in db_identities:
        db_key_counts[db_key] = db_key_counts.get(db_key, 0) + 1

    for i, att in enumerate(gmail_atts):
        gmail_key = gmail_identities[i]
        if db_key_counts.get(gmail_key, 0) > 0:
            db_key_counts[gmail_key] -= 1
        else:
            conn.execute(
                """INSERT INTO attachments
                   (message_id, filename, safe_filename, mime_type, size_bytes,
                    gmail_attachment_id, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (message_id, att["filename"], sanitise_filename(att["filename"]),
                 att["mime_type"], att["size_bytes"], att["gmail_attachment_id"],
                 now_iso()),
            )

    # Update changed metadata (size, mime_type only)
    for att in gmail_atts:
        if att["gmail_attachment_id"]:
            conn.execute(
                """UPDATE attachments SET
                     size_bytes = COALESCE(?, size_bytes),
                     mime_type = COALESCE(?, mime_type)
                   WHERE message_id = ? AND gmail_attachment_id = ?""",
                (att["size_bytes"], att["mime_type"], message_id, att["gmail_attachment_id"]),
            )

    return True, None


def check_attachments_complete(conn, message_id, gmail_payload):
    """Check attachment completeness using identity comparison with multiset counting."""
    gmail_atts = extract_attachment_metadata(gmail_payload)
    gmail_identities = [gmail_attachment_identity(att) for att in gmail_atts]

    gmail_fallback_keys = [k for k in gmail_identities if k[0] == "fallback"]
    if len(gmail_fallback_keys) != len(set(gmail_fallback_keys)):
        return False, "ambiguous_fallback_identity: duplicate fallback keys in Gmail response"

    if len(gmail_identities) != len(set(gmail_identities)):
        return False, "duplicate_identity: duplicate attachment identities in Gmail response"

    db_atts = conn.execute(
        "SELECT gmail_attachment_id, filename, size_bytes, mime_type, unavailable "
        "FROM attachments WHERE message_id = ?",
        (message_id,),
    ).fetchall()

    db_identities = [db_attachment_identity(db_att) for db_att in db_atts]

    db_fallback_keys = [k for k in db_identities if k[0] == "fallback"]
    if len(db_fallback_keys) != len(set(db_fallback_keys)):
        return False, "ambiguous_fallback_identity: duplicate fallback keys in DB"

    if len(db_identities) != len(set(db_identities)):
        return False, "duplicate_identity: duplicate attachment identities in DB"

    db_copy = list(db_identities)
    missing = []
    for key in gmail_identities:
        if key in db_copy:
            db_copy.remove(key)
        else:
            missing.append(key)
    if missing:
        return False, "missing_attachments: %d identities not found in DB" % len(missing)

    for db_att in db_atts:
        db_key = db_attachment_identity(db_att)
        if db_key not in gmail_identities:
            if not db_att["unavailable"]:
                return False, "unmarked_removed_attachment: %s" % db_att["filename"]

    return True, None


def is_message_complete(conn, message_id, raw_dir):
    """Check if a message is fully imported. Returns (complete: bool, reason: str or None)."""
    msg = conn.execute(
        "SELECT * FROM messages WHERE id = ? AND deleted_at IS NULL", (message_id,)
    ).fetchone()
    if not msg:
        return False, "missing_message_row"

    raw_path = raw_dir / ("%s.json" % msg["gmail_message_id"])
    if not raw_path.exists():
        return False, "missing_raw_json"
    try:
        with open(raw_path) as f:
            raw = json.load(f)
        if "id" not in raw or "threadId" not in raw or "internalDate" not in raw:
            return False, "invalid_raw_json"
    except (json.JSONDecodeError, Exception):
        return False, "invalid_raw_json"

    att_complete, att_reason = check_attachments_complete(conn, message_id, raw.get("payload", {}))
    if not att_complete:
        return False, att_reason

    cls = conn.execute(
        "SELECT message_type, action_status FROM message_classification WHERE message_id = ?",
        (message_id,),
    ).fetchone()
    if not cls:
        return False, "missing_classification"
    if not cls["message_type"]:
        return False, "missing_message_type"
    if not cls["action_status"]:
        return False, "missing_action_status"

    return True, None


# ---------------------------------------------------------------------------
# Attachment download (Phase 2 — local file retrieval via Gmail API)
# ---------------------------------------------------------------------------

ATTACHMENTS_DOWNLOAD_DIR = PROJECT_ROOT / "correspondence" / "attachments"


def attachment_storage_path(gmail_message_id, gmail_attachment_id, filename,
                             size_bytes=0, mime_type="application/octet-stream"):
    """Return a collision-safe local storage path for a Gmail attachment.

    Layout:
        correspondence/attachments/<gmail_message_id>/<sha256(gmail_attachment_id)[:32]>_<safe_filename>

    The storage filename is prefixed with a short sha256 hex digest of the
    (globally unique) Gmail attachment id, so two attachments that happen to
    share an original filename can never land on the same physical file — even
    when they come from different messages. The original filename is preserved
    separately via the DB columns `filename` / `safe_filename` and appears as
    the final path component (sanitised).

    When gmail_attachment_id is missing (fallback identity path), a
    deterministic sha256 of the composite identity (message + filename + mime +
    size) is used, so fallback-detected attachments are collision-safe too.

    Returns a pathlib.Path under ATTACHMENTS_DOWNLOAD_DIR.
    """
    if gmail_attachment_id:
        unique_key = hashlib.sha256(
            gmail_attachment_id.encode("utf-8")
        ).hexdigest()[:32]
    else:
        unique_key = hashlib.sha256(
            f"{gmail_message_id or ''}|{filename or ''}|{mime_type or ''}|{size_bytes or 0}".encode("utf-8")
        ).hexdigest()[:32]
    safe_name = sanitise_filename(filename)
    message_key = gmail_message_id or "unknown"
    return ATTACHMENTS_DOWNLOAD_DIR / message_key / f"{unique_key}_{safe_name}"


def download_attachment(service, gmail_message_id, gmail_attachment_id, filename,
                       size_bytes=0, mime_type="application/octet-stream"):
    """Download a single Gmail attachment via the Gmail API.

    GET /users/me/messages/{messageId}/attachments/{id}

    Returns (local_path, error). local_path is None on failure.

    Local storage: correspondence/attachments/<gmail_message_id>/<sha256(gmail_attachment_id)[:32]>_<safe_filename>
    (collision-safe: unique per attachment, original filename preserved via safe_filename)
    """
    try:
        resp = service.users().messages().attachments().get(
            userId="me", id=gmail_attachment_id, messageId=gmail_message_id,
        ).execute()
        content = decode_base64_bytes(resp.get("data", ""))
        if not content:
            return None, "empty_attachment_data"
        target = attachment_storage_path(
            gmail_message_id, gmail_attachment_id, filename, size_bytes, mime_type,
        )
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(content)
        return str(target), None
    except Exception as e:
        return None, f"{type(e).__name__}: {e}"


def run_download(dry_run=False, account_email=None, gmail_message_id=None):
    """Download attachments from Gmail into local disk (Phase 2, RC).

    Downloads only attachments that have a gmail_attachment_id and no local_path
    yet (idempotent: once local_path is set, the row is skipped).

    Storage is collision-safe: each attachment is written to a unique physical
    path (correspondence/attachments/<gmail_message_id>/<sha256(gmail_attachment_id)[:32]>_<safe_filename>),
    so identically-named attachments from different messages never overwrite
    each other. Re-downloading the same Gmail attachment id deterministically
    rewrites the same file with identical content.

    gmail_message_id: optional Gmail message ID filter — download only that
    message's attachments.

    Returns summary dict: {"downloaded": [...], "skipped": [...], "failed": [...]}
    """
    if account_email is None:
        account_email = DEFAULT_ACCOUNT_EMAIL

    creds = load_research_ops_credentials(account_email)
    if creds is None:
        print(f"ERROR: No credentials for {account_email}.")
        print(f"Re-authorize with read-only scope:")
        print(f"  python scripts/sync-gmail.py --auth --account {account_email}")
        return None

    # Refresh token if needed
    try:
        from google.auth.transport.requests import Request
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            import json as _json
            auth_file = RESEARCH_OPS_AUTH_FILE
            if auth_file.exists():
                accounts = _json.loads(auth_file.read_text())
                if account_email in accounts:
                    accounts[account_email]["access_token"] = creds.token
                    if creds.expiry:
                        accounts[account_email]["token_expiry"] = creds.expiry.strftime(
                            "%Y-%m-%dT%H:%M:%SZ")
                    auth_file.write_text(_json.dumps(accounts, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"ERROR: Token refresh failed: {e}")
        return None

    from googleapiclient.discovery import build
    service = build("gmail", "v1", credentials=creds)

    conn = get_db()
    downloaded = []
    skipped = []
    failed = []

    try:
        query = """
            SELECT a.id AS att_id, a.filename, a.safe_filename, a.mime_type,
                   a.size_bytes, a.gmail_attachment_id, a.local_path, a.unavailable,
                   m.gmail_message_id AS gmail_msg_id
            FROM attachments a
            JOIN messages m ON m.id = a.message_id
            WHERE a.unavailable = 0
              AND a.gmail_attachment_id IS NOT NULL
              AND (a.local_path IS NULL OR a.local_path = '')
              AND m.account_email = ?
        """
        params = [account_email]
        if gmail_message_id:
            query += " AND m.gmail_message_id = ?"
            params.append(gmail_message_id)
        query += " ORDER BY a.id"

        rows = conn.execute(query, params).fetchall()

        for att in rows:
            if att["local_path"]:
                skipped.append({
                    "att_id": att["att_id"],
                    "gmail_attachment_id": att["gmail_attachment_id"],
                    "filename": att["filename"],
                    "reason": "already_downloaded",
                })
                continue

            local_path, err = download_attachment(
                service, att["gmail_msg_id"], att["gmail_attachment_id"], att["filename"],
                size_bytes=att["size_bytes"], mime_type=att["mime_type"],
            )
            if local_path is None:
                failed.append({
                    "att_id": att["att_id"],
                    "gmail_attachment_id": att["gmail_attachment_id"],
                    "filename": att["filename"],
                    "error": err,
                })
                continue

            if dry_run:
                downloaded.append({
                    "att_id": att["att_id"],
                    "gmail_attachment_id": att["gmail_attachment_id"],
                    "filename": att["filename"],
                    "local_path": local_path,
                    "dry_run": True,
                })
                continue

            conn.execute(
                "UPDATE attachments SET local_path = ? WHERE id = ?",
                (local_path, att["att_id"]),
            )
            conn.commit()
            downloaded.append({
                "att_id": att["att_id"],
                "gmail_attachment_id": att["gmail_attachment_id"],
                "filename": att["filename"],
                "local_path": local_path,
            })

    finally:
        try:
            conn.close()
        except Exception:
            pass

    return {
        "downloaded": downloaded,
        "skipped": skipped,
        "failed": failed,
        "total_candidates": len(rows),
    }


# Map message_type to legacy category (for the category column CHECK constraint)
LEGACY_CATEGORY_MAP = {
    "government": "personal",
    "marketing": "marketing",
    "newsletter": "newsletter",
    "personal": "personal",
    "automated_notification": "automated_notification",
    "uncertain": "uncertain",
}

def repair_classification(conn, message_id, msg_data):
    """Repair an incomplete classification. Respects manual overrides."""
    cls = conn.execute(
        "SELECT message_type, action_status, category FROM message_classification WHERE message_id = ?",
        (message_id,),
    ).fetchone()

    if cls and cls["message_type"] and cls["action_status"]:
        return

    msg = conn.execute(
        "SELECT thread_id, from_email, direction FROM messages WHERE id = ?", (message_id,)
    ).fetchone()
    thread_override = get_override(conn, scope='thread', thread_id=msg["thread_id"])
    sender_override = get_override(conn, scope='sender', sender_email=msg["from_email"])

    thread_type = resolve_override_field(thread_override, 'message_type')
    thread_action = resolve_override_field(thread_override, 'action_status')
    sender_type = resolve_override_field(sender_override, 'message_type')
    sender_action = resolve_override_field(sender_override, 'action_status')

    if thread_type is not None:
        eff_type = thread_type
        type_conf = thread_override.get('type_confidence', 1.0)
    elif sender_type is not None:
        eff_type = sender_type
        type_conf = sender_override.get('type_confidence', 0.95)
    else:
        type_result = classify_message_type(msg_data)
        eff_type = type_result[0]
        type_conf = type_result[1]

    if thread_action is not None:
        eff_action = thread_action
        action_conf = thread_override.get('action_confidence', 1.0)
    elif sender_action is not None:
        eff_action = sender_action
        action_conf = sender_override.get('action_confidence', 0.95)
    else:
        action_result = infer_action_status(msg_data, eff_type)
        eff_action = action_result[0]
        action_conf = action_result[1]

    legacy_cat = LEGACY_CATEGORY_MAP.get(eff_type, 'uncertain')
    action_req = 1 if eff_action in ('needs_review', 'needs_reply') else 0

    if cls:
        conn.execute(
            """UPDATE message_classification SET
                 message_type = COALESCE(message_type, ?),
                 action_status = COALESCE(action_status, ?),
                 type_confidence = COALESCE(NULLIF(type_confidence, 0.0), ?),
                 action_confidence = COALESCE(NULLIF(action_confidence, 0.0), ?),
                 category = COALESCE(NULLIF(category, ''), ?)
               WHERE message_id = ?""",
            (eff_type, eff_action, type_conf, action_conf, legacy_cat, message_id),
        )
    else:
        conn.execute(
            """INSERT INTO message_classification
               (message_id, category, message_type, action_status,
                relevance_score, action_required, confidence,
                type_confidence, action_confidence, classified_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (message_id, legacy_cat, eff_type, eff_action,
             type_conf, action_req, type_conf,
             type_conf, action_conf, now_iso()),
        )


def repair_message(conn, service, msg_id, gmail_msg_id, raw_dir):
    """Repair an incomplete message. Only fills gaps, never overwrites existing data.

    Gmail API calls are OUTSIDE the transaction. DB operations are inside.
    """
    msg = service.users().messages().get(userId="me", id=gmail_msg_id, format="full").execute()

    body_text = extract_body(msg.get("payload", {}))

    write_raw_json(account_email, gmail_msg_id, msg)

    conn.execute("BEGIN IMMEDIATE")
    try:
        conn.execute(
            """UPDATE messages SET
                 body_text = COALESCE(NULLIF(body_text, ''), ?),
                 snippet = COALESCE(NULLIF(snippet, ''), ?),
                 subject = COALESCE(NULLIF(subject, ''), ?),
                 from_name = COALESCE(NULLIF(from_name, ''), ?),
                 from_email = COALESCE(NULLIF(from_email, ''), ?)
               WHERE id = ?""",
            (body_text, msg.get("snippet", ""),
             get_header(msg.get("payload", {}).get("headers", []), "Subject"),
             parse_address_header(get_header(msg.get("payload", {}).get("headers", []), "From"))[0].get("name", "") if parse_address_header(get_header(msg.get("payload", {}).get("headers", []), "From")) else None,
             parse_address_header(get_header(msg.get("payload", {}).get("headers", []), "From"))[0].get("email", "") if parse_address_header(get_header(msg.get("payload", {}).get("headers", []), "From")) else None,
             msg_id),
        )

        success, error = reconcile_attachments(conn, msg_id, msg.get("payload", {}))
        if not success:
            raise Exception("Attachment reconciliation failed: %s" % error)

        cls = conn.execute(
            "SELECT message_type, action_status FROM message_classification WHERE message_id = ?",
            (msg_id,),
        ).fetchone()
        if not cls or not cls["message_type"] or not cls["action_status"]:
            msg_data = {
                "from_email": conn.execute("SELECT from_email FROM messages WHERE id = ?", (msg_id,)).fetchone()[0],
                "subject": conn.execute("SELECT subject FROM messages WHERE id = ?", (msg_id,)).fetchone()[0],
                "snippet": conn.execute("SELECT snippet FROM messages WHERE id = ?", (msg_id,)).fetchone()[0],
                "body_text": conn.execute("SELECT body_text FROM messages WHERE id = ?", (msg_id,)).fetchone()[0],
                "headers": {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])},
                "labels": msg.get("labelIds", []),
                "has_attachments": len(extract_attachment_metadata(msg.get("payload", {}))) > 0,
            }
            repair_classification(conn, msg_id, msg_data)

        complete, reason = is_message_complete(conn, msg_id, raw_dir)
        if complete:
            update_manifest_status(conn, msg_id, "imported")
        else:
            update_manifest_status(conn, msg_id, "pending")

        conn.commit()
    except Exception as e:
        conn.execute("ROLLBACK")
        raise


def record_failure(conn, account, msg_id, thread_id, err_type, err_reason, error_msg,
                   max_attempts=5):
    """Record a message failure. Returns (status, attempt_number)."""
    now = now_iso()

    if err_type == 'permanent':
        conn.execute(
            """INSERT INTO failed_messages
               (account_email, gmail_message_id, gmail_thread_id, error_type, error_reason,
                error_message, attempt_count, max_attempts, next_retry_at, status,
                first_failed_at, last_failed_at)
               VALUES (?, ?, ?, 'permanent', ?, ?, 1, 0, NULL, 'permanent_failure', ?, ?)
               ON CONFLICT(account_email, gmail_message_id) DO UPDATE SET
                 error_type = 'permanent',
                 error_reason = excluded.error_reason,
                 error_message = excluded.error_message,
                 status = 'permanent_failure',
                 last_failed_at = excluded.last_failed_at""",
            (account, msg_id, thread_id, err_reason, error_msg, now, now),
        )
        failed_id = conn.execute(
            "SELECT id FROM failed_messages WHERE account_email=? AND gmail_message_id=?",
            (account, msg_id),
        ).fetchone()[0]
        conn.execute(
            """INSERT INTO failed_message_attempts
               (failed_message_id, attempt_number, error_type, error_reason,
                error_message, attempted_at)
               VALUES (?, 1, 'permanent', ?, ?, ?)""",
            (failed_id, err_reason, error_msg, now),
        )
        conn.execute(
            """UPDATE import_manifest SET
                 status = 'permanent_failure',
                 error_message = ?,
                 last_updated_at = ?
               WHERE account_email = ? AND gmail_message_id = ?""",
            (error_msg, now, account, msg_id),
        )
        return 'permanent_failure', 1

    err_row = conn.execute(
        "SELECT * FROM failed_messages WHERE account_email=? AND gmail_message_id=?",
        (account, msg_id),
    ).fetchone()

    if err_row is None:
        new_attempt = 1
    else:
        new_attempt = err_row["attempt_count"] + 1

    if new_attempt >= max_attempts:
        status = 'permanent_failure'
        error_type_final = 'transient_exhausted'
        next_retry = None
    else:
        status = 'pending'
        error_type_final = 'transient'
        backoff_seconds = (2 ** new_attempt) * 60
        next_retry_ts = datetime.now(timezone.utc).timestamp() + backoff_seconds
        next_retry = datetime.fromtimestamp(next_retry_ts, tz=timezone.utc).isoformat()

    if err_row is None:
        cur = conn.execute(
            """INSERT INTO failed_messages
               (account_email, gmail_message_id, gmail_thread_id, error_type, error_reason,
                error_message, attempt_count, max_attempts, next_retry_at, status,
                first_failed_at, last_failed_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (account, msg_id, thread_id, error_type_final, err_reason, error_msg,
             new_attempt, max_attempts, next_retry, status, now, now),
        )
        failed_id = cur.lastrowid
    else:
        conn.execute(
            """UPDATE failed_messages SET
                 attempt_count = ?,
                 error_type = ?,
                 error_reason = ?,
                 error_message = ?,
                 next_retry_at = ?,
                 status = ?,
                 last_failed_at = ?
               WHERE id = ?""",
            (new_attempt, error_type_final, err_reason, error_msg, next_retry, status, now,
             err_row["id"]),
        )
        failed_id = err_row["id"]

    conn.execute(
        """INSERT INTO failed_message_attempts
           (failed_message_id, attempt_number, error_type, error_reason,
            error_message, attempted_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (failed_id, new_attempt, err_type, err_reason, error_msg, now),
    )

    if status == 'permanent_failure':
        conn.execute(
            """UPDATE import_manifest SET
                 status = 'permanent_failure',
                 error_message = ?,
                 last_updated_at = ?
               WHERE account_email = ? AND gmail_message_id = ?""",
            (error_msg, now, account, msg_id),
        )
    else:
        conn.execute(
            """UPDATE import_manifest SET
                 status = 'pending',
                 error_message = ?,
                 last_updated_at = ?
               WHERE account_email = ? AND gmail_message_id = ?""",
            (error_msg, now, account, msg_id),
        )

    return status, new_attempt


def handle_message_not_found(conn, account, gmail_msg_id, gmail_thread_id):
    """Handle a 404 from Gmail. Preserves local records, marks manifest unavailable."""
    now = now_iso()

    conn.execute(
        """UPDATE import_manifest SET
             status = 'unavailable',
             error_message = 'Message no longer available in Gmail (404)',
             last_updated_at = ?
           WHERE account_email = ? AND gmail_message_id = ?""",
        (now, account, gmail_msg_id),
    )

    conn.execute(
        """UPDATE failed_messages SET
             status = 'resolved',
             resolved_at = ?,
             error_message = 'Resolved: message no longer available in Gmail'
           WHERE account_email = ? AND gmail_message_id = ?""",
        (now, account, gmail_msg_id),
    )


def update_manifest_status(conn, msg_id, status):
    """Update manifest status for a message."""
    msg = conn.execute(
        "SELECT account_email, gmail_message_id FROM messages WHERE id = ?", (msg_id,)
    ).fetchone()
    if not msg:
        return
    conn.execute(
        """UPDATE import_manifest SET
             status = ?,
             error_message = NULL,
             last_updated_at = ?
           WHERE account_email = ? AND gmail_message_id = ?""",
        (status, now_iso(), msg["account_email"], msg["gmail_message_id"]),
    )


# ---------------------------------------------------------------------------
# Pilot manifest backfill
# ---------------------------------------------------------------------------

def backfill_pilot_manifest(conn, raw_dir, account_email=None):
    """Backfill import_manifest for existing messages of a given account.

    Uses the same reconcile_attachments() and is_message_complete() functions
    as historical imports. No separate code path. No Gmail access.

    Returns: (imported_count, failed_count, failed_details)
    """
    if account_email is None:
        account_email = DEFAULT_ACCOUNT_EMAIL

    messages = conn.execute(
        "SELECT id, account_email, gmail_message_id, gmail_thread_id, imported_at "
        "FROM messages WHERE account_email = ? AND deleted_at IS NULL "
        "ORDER BY id",
        (account_email,),
    ).fetchall()

    imported_count = 0
    failed_count = 0
    failed_details = []

    for msg in messages:
        msg_id = msg["id"]
        gmail_msg_id = msg["gmail_message_id"]
        gmail_thread_id = msg["gmail_thread_id"]
        account = msg["account_email"]

        # Step 1: Verify message row exists (already have it from query)

        # Step 2: Verify raw JSON is valid
        raw_path = raw_dir / ("%s.json" % gmail_msg_id)
        raw = None
        if raw_path.exists():
            try:
                with open(raw_path) as f:
                    raw = json.load(f)
                if "id" not in raw or "threadId" not in raw or "internalDate" not in raw:
                    raw = None
            except (json.JSONDecodeError, Exception):
                raw = None

        if raw is None:
            conn.execute(
                """INSERT INTO import_manifest
                   (account_email, gmail_message_id, gmail_thread_id, discovered_at,
                    discovery_source, status, error_message, first_discovered_at, last_updated_at)
                   VALUES (?, ?, ?, ?, 'bootstrap', 'pending',
                           'Raw JSON missing or invalid', ?, ?)
                   ON CONFLICT(account_email, gmail_message_id) DO UPDATE SET
                     status = 'pending',
                     error_message = 'Raw JSON missing or invalid',
                     last_updated_at = excluded.last_updated_at""",
                (account, gmail_msg_id, gmail_thread_id, msg["imported_at"],
                 msg["imported_at"], now_iso()),
            )
            failed_count += 1
            failed_details.append({"msg_id": msg_id, "reason": "Raw JSON missing or invalid"})
            continue

        # Step 3: Reconcile attachment metadata (SAME function as historical import)
        success, error = reconcile_attachments(conn, msg_id, raw.get("payload", {}))
        if not success:
            conn.execute(
                """INSERT INTO import_manifest
                   (account_email, gmail_message_id, gmail_thread_id, discovered_at,
                    discovery_source, status, error_message, first_discovered_at, last_updated_at)
                   VALUES (?, ?, ?, ?, 'bootstrap', 'pending', ?, ?, ?)
                   ON CONFLICT(account_email, gmail_message_id) DO UPDATE SET
                     status = 'pending',
                     error_message = excluded.error_message,
                     last_updated_at = excluded.last_updated_at""",
                (account, gmail_msg_id, gmail_thread_id, msg["imported_at"],
                 "Attachment reconciliation failed: %s" % error, msg["imported_at"], now_iso()),
            )
            failed_count += 1
            failed_details.append({"msg_id": msg_id, "reason": "Attachment reconciliation: %s" % error})
            continue

        # Step 4: Verify classification exists with both required fields
        cls = conn.execute(
            "SELECT message_type, action_status FROM message_classification WHERE message_id = ?",
            (msg_id,),
        ).fetchone()

        if not cls or not cls["message_type"] or not cls["action_status"]:
            msg_data = {
                "from_email": conn.execute("SELECT from_email FROM messages WHERE id = ?", (msg_id,)).fetchone()[0],
                "subject": conn.execute("SELECT subject FROM messages WHERE id = ?", (msg_id,)).fetchone()[0],
                "snippet": conn.execute("SELECT snippet FROM messages WHERE id = ?", (msg_id,)).fetchone()[0],
                "body_text": conn.execute("SELECT body_text FROM messages WHERE id = ?", (msg_id,)).fetchone()[0],
                "headers": {h["name"]: h["value"] for h in raw["payload"]["headers"]},
                "labels": raw.get("labelIds", []),
                "has_attachments": len(extract_attachment_metadata(raw.get("payload", {}))) > 0,
            }
            repair_classification(conn, msg_id, msg_data)

        # Step 5: Run all 4 completeness checks (SAME function as historical import)
        complete, reason = is_message_complete(conn, msg_id, raw_dir)
        if not complete:
            conn.execute(
                """INSERT INTO import_manifest
                   (account_email, gmail_message_id, gmail_thread_id, discovered_at,
                    discovery_source, status, error_message, first_discovered_at, last_updated_at)
                   VALUES (?, ?, ?, ?, 'bootstrap', 'pending', ?, ?, ?)
                   ON CONFLICT(account_email, gmail_message_id) DO UPDATE SET
                     status = 'pending',
                     error_message = excluded.error_message,
                     last_updated_at = excluded.last_updated_at""",
                (account, gmail_msg_id, gmail_thread_id, msg["imported_at"],
                 "Completeness check failed: %s" % reason, msg["imported_at"], now_iso()),
            )
            failed_count += 1
            failed_details.append({"msg_id": msg_id, "reason": reason})
            continue

        # Step 6: Mark as imported
        conn.execute(
            """INSERT INTO import_manifest
               (account_email, gmail_message_id, gmail_thread_id, discovered_at,
                discovery_source, status, first_discovered_at, last_updated_at)
               VALUES (?, ?, ?, ?, 'bootstrap', 'imported', ?, ?)
               ON CONFLICT(account_email, gmail_message_id) DO UPDATE SET
                 status = 'imported',
                 error_message = NULL,
                 last_updated_at = excluded.last_updated_at""",
            (account, gmail_msg_id, gmail_thread_id, msg["imported_at"],
             msg["imported_at"], now_iso()),
        )
        imported_count += 1

    conn.commit()
    return imported_count, failed_count, failed_details


# ---------------------------------------------------------------------------
# Pilot manifest backfill
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Main sync (unchanged structure)
# ---------------------------------------------------------------------------

def run_sync(dry_run=False, mode="bootstrap", account_email=None):
    """Run sync. mode='bootstrap' (historical) or 'incremental' (new messages).

    Bootstrap: fetches historical messages (no date filter). Sets bootstrap_complete=1
    only when all messages are exhausted (fewer than MAX_MESSAGES returned).

    Incremental: fetches new messages since checkpoint. Never changes bootstrap_complete.
    """
    if account_email is None:
        account_email = DEFAULT_ACCOUNT_EMAIL

    # Load credentials (read-only scope, separate from comm-analytics)
    creds = load_research_ops_credentials(account_email)
    if creds is None:
        print(f"ERROR: No credentials for {account_email}.")
        print("Re-authorize with read-only scope:")
        print(f"  python scripts/sync-gmail.py --auth --account {account_email}")
        sys.exit(1)

    # Refresh token if needed
    try:
        from google.auth.transport.requests import Request
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            import json as _json
            auth_file = RESEARCH_OPS_AUTH_FILE
            if auth_file.exists():
                accounts = _json.loads(auth_file.read_text())
                if account_email in accounts:
                    accounts[account_email]["access_token"] = creds.token
                    if creds.expiry:
                        accounts[account_email]["token_expiry"] = creds.expiry.strftime(
                            "%Y-%m-%dT%H:%M:%SZ")
                    auth_file.write_text(_json.dumps(accounts, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"ERROR: Token refresh failed: {e}")
        print("Re-authorize with:")
        print(f"  cd {COMM_ANALYTICS_DIR}")
        print(f"  python src/oauth_setup.py init --email {account_email} --secrets client_secrets.json")
        sys.exit(1)

    from googleapiclient.discovery import build
    service = build("gmail", "v1", credentials=creds)

    # Open database
    conn = None
    if not dry_run:
        conn = get_db()
        conn.execute(
            """INSERT INTO scan_state (account_email, overlap_minutes)
               VALUES (?, ?)
               ON CONFLICT(account_email) DO NOTHING""",
            (account_email, OVERLAP_MINUTES),
        )
        conn.commit()

        # --- LOCK ACQUISITION (atomic) ---
        if not acquire_lock(conn, account_email):
            print("ERROR: Another scan is already running. Aborting.")
            conn.close()
            sys.exit(1)
        print("Lock acquired.")

        # Start heartbeat (renews lock during long-running scans)
        start_heartbeat(DB_PATH, account_email)
        print("Heartbeat started.")
        print(f"[{now_iso()}] Gmail sync starting (mode={mode}, account={account_email})")

    try:
        # Check if bootstrap is complete
        bootstrap_complete = False
        bootstrap_enumeration_complete = False
        bootstrap_page_token = None
        checkpoint_before = now_iso()
        if conn:
            row = conn.execute(
                "SELECT bootstrap_complete, bootstrap_enumeration_complete, bootstrap_page_token, checkpoint_at FROM scan_state WHERE account_email = ?",
                (account_email,),
            ).fetchone()
            if row and row["bootstrap_complete"]:
                bootstrap_complete = True
            if row and row["bootstrap_enumeration_complete"]:
                bootstrap_enumeration_complete = True
            if row and row["bootstrap_page_token"]:
                bootstrap_page_token = row["bootstrap_page_token"]
            if row and row["checkpoint_at"]:
                checkpoint_before = row["checkpoint_at"]

        # Build query based on mode
        if mode == "incremental":
            # Incremental: fetch new messages since checkpoint
            overlap = OVERLAP_MINUTES
            checkpoint_epoch = None
            try:
                cp_dt = datetime.fromisoformat(checkpoint_before.replace("Z", "+00:00"))
                checkpoint_epoch = int(cp_dt.timestamp()) - (overlap * 60)
            except (ValueError, TypeError):
                checkpoint_epoch = int(datetime.now(timezone.utc).timestamp()) - (24 * 3600)
            query = f"after:{checkpoint_epoch}"
            print(f"Incremental sync: fetching messages after {checkpoint_before} (with {overlap}min overlap)...")
        else:
            # Bootstrap: fetch historical messages (no date filter)
            query = "-in:spam -in:trash"
            print(f"Bootstrap sync: fetching up to {MAX_MESSAGES} historical messages...")

        # Step 1: Fetch message list (strict cap for bootstrap, no pagination)
        try:
            if mode == "incremental":
                resp = service.users().messages().list(
                    userId="me", maxResults=MAX_MESSAGES, q=query,
                ).execute()
            else:
                list_params = {"userId": "me", "maxResults": MAX_MESSAGES, "q": "-in:spam -in:trash"}
                if bootstrap_page_token:
                    list_params["pageToken"] = bootstrap_page_token
                resp = service.users().messages().list(**list_params).execute()
        except Exception as e:
            print(f"ERROR: Gmail API list failed: {e}")
            if conn:
                conn.execute(
                    """UPDATE scan_state SET last_scan_at=?, last_scan_status='error',
                       last_error=? WHERE account_email=?""",
                    (now_iso(), str(e), account_email),
                )
                conn.commit()
                stop_heartbeat()
                release_lock(conn, account_email)
                conn.close()
            sys.exit(1)

        stubs = resp.get("messages", [])
        # Strict cap: do NOT follow nextPageToken
        if len(stubs) > MAX_MESSAGES:
            stubs = stubs[:MAX_MESSAGES]

        print(f"Found {len(stubs)} messages.")

        if dry_run:
            for s in stubs:
                print(f"  {s['id']} (thread: {s['threadId']})")
            print("Dry run — no changes made.")
            if conn:
                stop_heartbeat()
                release_lock(conn, account_email)
                conn.close()
            return {"dry_run": True, "count": len(stubs)}

        if not stubs:
            # No messages to import
            if mode == "bootstrap":
                # Empty mailbox → bootstrap complete
                if conn:
                    conn.execute(
                        """UPDATE scan_state SET checkpoint_at=?, bootstrap_complete=1,
                           last_scan_at=?, last_scan_status='ok'
                           WHERE account_email=?""",
                        (checkpoint_before, now_iso(), account_email),
                    )
                    conn.commit()
            if conn:
                stop_heartbeat()
                release_lock(conn, account_email)
                conn.close()
            print("No messages found.")
            return {"imported": 0}

        # Step 2: Fetch and import each message
        imported_count = 0
        skipped_count = 0
        errors = []

        for stub in stubs:
            msg_id = stub["id"]
            thread_id_gmail = stub["threadId"]

            # Check if we lost the lock during a previous operation
            if _lost_lock.is_set():
                print("ERROR: Lock lost during scan. Stopping before further imports.")
                errors.append({"message_id": msg_id, "error": "Lock lost"})
                break

            try:
                msg = service.users().messages().get(
                    userId="me", id=msg_id, format="full",
                ).execute()

                headers = msg.get("payload", {}).get("headers", [])
                from_header = get_header(headers, "From")
                to_header = get_header(headers, "To")
                cc_header = get_header(headers, "Cc")
                subject = get_header(headers, "Subject")

                from_parsed = parse_address_header(from_header)
                from_name = from_parsed[0]["name"] if from_parsed else ""
                from_email = from_parsed[0]["email"] if from_parsed else ""

                to_parsed = parse_address_header(to_header)
                cc_parsed = parse_address_header(cc_header)

                labels = msg.get("labelIds", [])
                direction = "out" if "SENT" in labels else "in"
                if direction == "in" and from_email.lower() == account_email.lower():
                    direction = "out"

                internal_date = msg.get("internalDate", "0")
                iso_date = epoch_ms_to_iso(internal_date)

                received_at = iso_date if direction == "in" else None
                sent_at = iso_date if direction == "out" else None

                snippet = msg.get("snippet", "")
                body_text = extract_body(msg.get("payload", {}))
                attachments_meta = extract_attachment_metadata(msg.get("payload", {}))

                raw_json = msg

                conn.execute("BEGIN IMMEDIATE")

                tid = upsert_thread(conn, account_email, thread_id_gmail, subject)

                mid, was_inserted = upsert_message(
                    conn, account_email, msg_id, thread_id_gmail, tid, direction,
                    from_name, from_email, json.dumps(to_parsed), json.dumps(cc_parsed),
                    subject, received_at, sent_at, snippet, body_text, now_iso(),
                )

                if was_inserted and attachments_meta:
                    insert_attachments(conn, mid, attachments_meta)

                # Ensure manifest entry exists (idempotent)
                now = now_iso()
                conn.execute(
                    """INSERT INTO import_manifest
                       (account_email, gmail_message_id, gmail_thread_id, discovered_at,
                        discovery_source, status, first_discovered_at, last_updated_at)
                       VALUES (?, ?, ?, ?, 'bootstrap', 'pending', ?, ?)
                       ON CONFLICT(account_email, gmail_message_id) DO NOTHING""",
                    (account_email, msg_id, thread_id_gmail, now, now, now),
                )

                conn.commit()

                # Write raw JSON (always, idempotent overwrite)
                write_raw_json(account_email, msg_id, raw_json)

                if was_inserted:
                    imported_count += 1
                else:
                    skipped_count += 1

                print(f"  {'+' if was_inserted else '='} {msg_id} ({direction}) thread={thread_id_gmail}")

            except Exception as e:
                try:
                    conn.execute("ROLLBACK")
                except Exception:
                    pass
                error_msg = f"{type(e).__name__}: {e}"
                errors.append({"message_id": msg_id, "error": error_msg})
                print(f"  ! {msg_id}: {error_msg}")

        # Step 3: Classification
        print("Running classification...")
        new_msg_ids = conn.execute(
            """SELECT id, account_email, gmail_message_id, thread_id, from_email,
                      subject, snippet, body_text
               FROM messages
               WHERE account_email = ? AND imported_at >= ?""",
            (account_email, checkpoint_before),
        ).fetchall()

        pending_errors = conn.execute(
            """SELECT ce.*, m.account_email, m.gmail_message_id, m.thread_id,
                      m.from_email, m.subject, m.snippet, m.body_text
               FROM classification_errors ce
               JOIN messages m ON m.id = ce.message_id
               WHERE ce.status = 'pending'
                 AND (ce.next_retry_at IS NULL OR ce.next_retry_at <= ?)""",
            (now_iso(),),
        ).fetchall()

        to_classify = list(new_msg_ids)
        for err in pending_errors:
            if err["message_id"] not in {r["id"] for r in new_msg_ids}:
                to_classify.append(err)

        for msg_row in to_classify:
            msg_data = {
                "account_email": msg_row["account_email"],
                "thread_id": msg_row["thread_id"],
                "from_email": msg_row["from_email"],
                "subject": msg_row["subject"],
                "snippet": msg_row["snippet"],
                "body_text": msg_row["body_text"],
            }
            existing = conn.execute(
                "SELECT 1 FROM message_classification WHERE message_id = ?",
                (msg_row["id"],),
            ).fetchone()
            if existing:
                continue

            classify_with_retry(conn, msg_row["id"], msg_data)
            conn.commit()

        # Step 3b: Update manifest status for processed messages (bootstrap only)
        if mode == "bootstrap":
            for stub in stubs:
                msg_row = conn.execute(
                    "SELECT id FROM messages WHERE account_email = ? AND gmail_message_id = ?",
                    (account_email, stub["id"]),
                ).fetchone()
                if msg_row:
                    complete, reason = is_message_complete(conn, msg_row["id"], get_raw_dir(account_email))
                    if complete:
                        update_manifest_status(conn, msg_row["id"], "imported")
                    else:
                        update_manifest_status(conn, msg_row["id"], "pending")
            conn.commit()

        # Step 4: Checkpoint and bootstrap_complete
        # Determine if historical bootstrap is complete:
        # Only in bootstrap mode, and only if fewer than MAX_MESSAGES were returned
        # (meaning the mailbox is exhausted). Incremental mode never changes
        # bootstrap_complete.
        if mode == "bootstrap":
            next_page_token = resp.get("nextPageToken")
            enumeration_complete = next_page_token is None
            all_complete = True
            for stub in stubs:
                msg_row = conn.execute(
                    "SELECT id FROM messages WHERE account_email = ? AND gmail_message_id = ?",
                    (account_email, stub["id"]),
                ).fetchone()
                if msg_row:
                    complete, reason = is_message_complete(conn, msg_row["id"], get_raw_dir(account_email))
                    if not complete:
                        all_complete = False
                        break
            new_bootstrap_complete = 1 if (enumeration_complete and all_complete and not errors) else 0
            new_enumeration_complete = 1 if enumeration_complete else 0
        else:
            # Incremental: never change bootstrap_complete or enumeration state
            new_bootstrap_complete = None
            new_enumeration_complete = None
            next_page_token = None

        if not errors:
            if new_bootstrap_complete is not None:
                conn.execute(
                    """UPDATE scan_state SET checkpoint_at=?, bootstrap_complete=?,
                       bootstrap_enumeration_complete=?, bootstrap_page_token=?,
                       last_scan_at=?, last_scan_status='ok', last_error=NULL
                       WHERE account_email=?""",
                    (checkpoint_before, new_bootstrap_complete, new_enumeration_complete,
                     next_page_token, now_iso(), account_email),
                )
            else:
                conn.execute(
                    """UPDATE scan_state SET checkpoint_at=?, last_scan_at=?,
                       last_scan_status='ok', last_error=NULL
                       WHERE account_email=?""",
                    (now_iso(), now_iso(), account_email),
                )
            conn.commit()
            if mode == "bootstrap":
                if new_bootstrap_complete:
                    print(f"Bootstrap complete. Checkpoint set to {checkpoint_before}.")
                else:
                    print(f"Bootstrap incomplete (pilot: {len(stubs)} messages). "
                          f"bootstrap_complete=0. Checkpoint preserved: {checkpoint_before}.")
            else:
                print(f"Incremental sync complete. Checkpoint advanced.")
        else:
            conn.execute(
                """UPDATE scan_state SET last_scan_at=?, last_scan_status='error',
                   last_error=? WHERE account_email=?""",
                (now_iso(), "; ".join(e["error"] for e in errors), account_email),
            )
            conn.commit()
            print(f"Checkpoint NOT advanced ({len(errors)} errors).")

    finally:
        # Clean up: stop heartbeat, release lock, close DB
        stop_heartbeat()
        if conn:
            try:
                release_lock(conn, account_email)
            except Exception:
                pass
            try:
                conn.close()
            except Exception:
                pass

    # Results (only reached if no unhandled exception)
    print(f"\nImported: {imported_count}, Skipped (dup): {skipped_count}, Errors: {len(errors)}")
    if errors:
        for e in errors:
            print(f"  ! {e['message_id']}: {e['error']}")

    return {
        "imported": imported_count,
        "skipped": skipped_count,
        "errors": len(errors),
        "total_processed": len(stubs),
        "bootstrap_complete": new_bootstrap_complete if new_bootstrap_complete is not None else bootstrap_complete,
    }


def main():
    global MAX_MESSAGES
    parser = argparse.ArgumentParser(description="Gmail sync sidecar")
    parser.add_argument("--account", default=DEFAULT_ACCOUNT_EMAIL,
                        help="Gmail account email (default: %s)" % DEFAULT_ACCOUNT_EMAIL)
    parser.add_argument("--auth", action="store_true",
                        help="Print OAuth authorization instructions for read-only scope")
    parser.add_argument("--max-messages", type=int, default=None,
                        help="Override MAX_MESSAGES for this run (default: %d)" % MAX_MESSAGES)
    parser.add_argument("--dry-run", action="store_true",
                        help="List metadata only, no DB writes")
    parser.add_argument("--incremental", action="store_true",
                        help="Incremental sync (new messages only)")
    parser.add_argument("--download", action="store_true",
                        help="Download Gmail attachments to local disk (Phase 2)")
    parser.add_argument("--download-message", default=None, metavar="GMAIL_MESSAGE_ID",
                        help="Optional Gmail message ID to scope downloads to")
    args = parser.parse_args()

    if args.auth:
        # Genuine separate OAuth flow using read-only scope only
        import json as _json
        from google_auth_oauthlib.flow import InstalledAppFlow
        from pathlib import Path as _Path

        secrets_path = _Path(COMM_ANALYTICS_DIR) / "client_secrets.json"
        if not secrets_path.exists():
            print(f"ERROR: client_secrets.json not found at {secrets_path}")
            print("Download OAuth client credentials from Google Cloud Console.")
            sys.exit(1)

        print(f"Starting read-only OAuth flow for {args.account}")
        print(f"Scope: {READONLY_SCOPES[0]}")
        print("A browser window will open for authorization.")

        flow = InstalledAppFlow.from_client_secrets_file(
            str(secrets_path), scopes=READONLY_SCOPES,
        )
        creds = flow.run_local_server(port=0)

        # Validate scopes
        granted = set(creds.scopes or [])
        if granted != set(READONLY_SCOPES):
            print(f"ERROR: Granted scopes {granted} do not match required {set(READONLY_SCOPES)}")
            sys.exit(1)

        # Save to read-only auth file
        auth_file = RESEARCH_OPS_AUTH_FILE
        accounts = {}
        if auth_file.exists():
            try:
                accounts = _json.loads(auth_file.read_text())
            except Exception:
                accounts = {}

        accounts[args.account] = {
            "access_token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_expiry": creds.expiry.strftime("%Y-%m-%dT%H:%M:%SZ") if creds.expiry else None,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": list(creds.scopes or READONLY_SCOPES),
        }

        auth_file.parent.mkdir(parents=True, exist_ok=True)
        auth_file.write_text(_json.dumps(accounts, indent=2, ensure_ascii=False))
        print(f"Credentials saved to: {auth_file}")
        print(f"Account: {args.account}")
        print(f"Scopes: {accounts[args.account]['scopes']}")
        sys.exit(0)

    if args.download:
        summary = run_download(
            dry_run=args.dry_run,
            account_email=args.account,
            gmail_message_id=args.download_message,
        )
        if summary is None:
            sys.exit(1)
        print(json.dumps(summary, indent=2, default=str))
        return

    mode = "incremental" if args.incremental else "bootstrap"
    # Override MAX_MESSAGES if specified
    if args.max_messages is not None:
        MAX_MESSAGES = args.max_messages
    try:
        run_sync(dry_run=args.dry_run, mode=mode, account_email=args.account)
    except KeyboardInterrupt:
        print("\nInterrupted by user.")
        stop_heartbeat()
        sys.exit(130)
    except Exception as e:
        print(f"ERROR: Unexpected error: {e}")
        stop_heartbeat()
        sys.exit(1)


if __name__ == "__main__":
    main()