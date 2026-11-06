-- Migration 002: Classification errors table for retryable classification failures
-- Stores technical classification failures separately from successful classifications.

CREATE TABLE IF NOT EXISTS classification_errors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  next_retry_at TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','resolved','failed_permanent')),
  failed_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_classification_errors_status
  ON classification_errors(status);
CREATE INDEX IF NOT EXISTS idx_classification_errors_retry
  ON classification_errors(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_classification_errors_message
  ON classification_errors(message_id);