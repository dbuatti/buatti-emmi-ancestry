-- Migration 005: Historical import infrastructure

-- ============================================================
-- Part A: failed_messages table
-- ============================================================

CREATE TABLE IF NOT EXISTS failed_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_email TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT,
  error_type TEXT NOT NULL CHECK (error_type IN ('transient', 'permanent', 'transient_exhausted')),
  error_reason TEXT,
  error_message TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'resolved', 'permanent_failure')),
  first_failed_at TEXT NOT NULL,
  last_failed_at TEXT NOT NULL,
  resolved_at TEXT,
  UNIQUE (account_email, gmail_message_id)
);

CREATE INDEX IF NOT EXISTS idx_failed_messages_status
  ON failed_messages(status);
CREATE INDEX IF NOT EXISTS idx_failed_messages_retry
  ON failed_messages(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_failed_messages_account
  ON failed_messages(account_email);

-- ============================================================
-- Part B: failed_message_attempts audit table
-- ============================================================

CREATE TABLE IF NOT EXISTS failed_message_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  failed_message_id INTEGER NOT NULL,
  attempt_number INTEGER NOT NULL,
  error_type TEXT NOT NULL,
  error_reason TEXT,
  error_message TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  FOREIGN KEY (failed_message_id) REFERENCES failed_messages(id) ON DELETE CASCADE,
  UNIQUE (failed_message_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_failed_attempts_message
  ON failed_message_attempts(failed_message_id);

-- ============================================================
-- Part C: import_manifest table
-- ============================================================

CREATE TABLE IF NOT EXISTS import_manifest (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_email TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT,
  discovered_at TEXT NOT NULL,
  discovery_page_token TEXT,
  discovery_source TEXT NOT NULL DEFAULT 'bootstrap'
    CHECK (discovery_source IN ('bootstrap', 'incremental')),
  status TEXT NOT NULL DEFAULT 'discovered'
    CHECK (status IN ('discovered', 'imported', 'pending', 'permanent_failure', 'unavailable')),
  error_message TEXT,
  first_discovered_at TEXT NOT NULL,
  last_updated_at TEXT NOT NULL,
  UNIQUE (account_email, gmail_message_id)
);

CREATE INDEX IF NOT EXISTS idx_manifest_account_status
  ON import_manifest(account_email, status);
CREATE INDEX IF NOT EXISTS idx_manifest_source
  ON import_manifest(account_email, discovery_source);
CREATE INDEX IF NOT EXISTS idx_manifest_message
  ON import_manifest(account_email, gmail_message_id);

-- ============================================================
-- Part D: scan_state columns
-- ============================================================

ALTER TABLE scan_state ADD COLUMN bootstrap_enumeration_complete INTEGER NOT NULL DEFAULT 0;
ALTER TABLE scan_state ADD COLUMN bootstrap_page_token TEXT;
ALTER TABLE scan_state ADD COLUMN incremental_page_token TEXT;
ALTER TABLE scan_state ADD COLUMN incremental_query TEXT;
ALTER TABLE scan_state ADD COLUMN incremental_started_at TEXT;
ALTER TABLE scan_state ADD COLUMN incremental_checkpoint_at TEXT;

-- ============================================================
-- Part E: attachments unavailable tracking
-- ============================================================

ALTER TABLE attachments ADD COLUMN unavailable INTEGER NOT NULL DEFAULT 0;
ALTER TABLE attachments ADD COLUMN unavailable_reason TEXT;
ALTER TABLE attachments ADD COLUMN unavailable_at TEXT;