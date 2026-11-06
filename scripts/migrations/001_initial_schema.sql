-- Migration 001: Initial correspondence schema
-- SQLite, local-only, gitignored. Version tracked via user_version pragma.

PRAGMA foreign_keys = ON;

-- Per-account scan state
CREATE TABLE IF NOT EXISTS scan_state (
  account_email TEXT PRIMARY KEY,
  checkpoint_at TEXT,
  overlap_minutes INTEGER NOT NULL DEFAULT 60,
  last_scan_at TEXT,
  last_scan_status TEXT CHECK (last_scan_status IN ('ok','error')) DEFAULT 'ok',
  last_error TEXT,
  bootstrap_complete INTEGER NOT NULL DEFAULT 0,
  bootstrap_started_at TEXT
);

-- Threads (mutable case state). Account-scoped natural key.
CREATE TABLE IF NOT EXISTS threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_email TEXT NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'needs_attention'
    CHECK (status IN ('needs_attention','ready_to_respond','waiting_external',
                      'waiting_info','research_required','completed','archived')),
  waiting_on TEXT NOT NULL DEFAULT 'me'
    CHECK (waiting_on IN ('me','them','none')),
  last_message_at TEXT,
  last_inbound_at TEXT,
  last_outbound_at TEXT,
  has_unanswered_inbound INTEGER NOT NULL DEFAULT 0,
  summary_en TEXT,
  sender_intent TEXT,
  follow_up_due_at TEXT,
  last_reviewed_at TEXT,
  analysis_version INTEGER NOT NULL DEFAULT 0,
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (account_email, gmail_thread_id),
  UNIQUE (id, account_email, gmail_thread_id)
);

-- Messages (immutable raw import). Composite FK enforces same account.
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  account_email TEXT NOT NULL,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  thread_id INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  from_name TEXT,
  from_email TEXT,
  to_json TEXT,
  cc_json TEXT,
  subject TEXT,
  received_at TEXT,
  sent_at TEXT,
  snippet TEXT,
  body_text TEXT,
  body_html_path TEXT,
  language TEXT DEFAULT 'unknown',
  raw_path TEXT,
  imported_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE (account_email, gmail_message_id),
  FOREIGN KEY (thread_id, account_email, gmail_thread_id)
    REFERENCES threads(id, account_email, gmail_thread_id) ON DELETE RESTRICT
);

-- Deterministic classification (separate from AI analysis)
CREATE TABLE IF NOT EXISTS message_classification (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL UNIQUE,
  category TEXT NOT NULL
    CHECK (category IN ('personal','work_and_opportunities','action_required',
                        'transactional','newsletter','marketing',
                        'automated_notification','likely_spam','uncertain')),
  relevance_score REAL NOT NULL DEFAULT 0.0,
  action_required INTEGER NOT NULL DEFAULT 0,
  confidence REAL NOT NULL DEFAULT 0.0,
  classified_at TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- AI-generated analysis (versioned, separate from immutable messages)
CREATE TABLE IF NOT EXISTS message_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  analysis_version INTEGER NOT NULL,
  language TEXT,
  translation_en TEXT,
  summary_en TEXT,
  sender_intent TEXT,
  model_translation TEXT,
  model_summary TEXT,
  analysed_at TEXT NOT NULL,
  UNIQUE (message_id, analysis_version),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- Thread-level analysis (versioned)
CREATE TABLE IF NOT EXISTS thread_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  analysis_version INTEGER NOT NULL,
  summary_en TEXT,
  sender_intent TEXT,
  model TEXT,
  analysed_at TEXT NOT NULL,
  UNIQUE (thread_id, analysis_version),
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
);

-- Actions (tasks). RESTRICT on thread delete preserves audit trail.
CREATE TABLE IF NOT EXISTS actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  message_id INTEGER,
  description TEXT NOT NULL,
  owner TEXT NOT NULL CHECK (owner IN ('me','them','office')),
  due_date TEXT,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','done','cancelled')),
  created_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE RESTRICT,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Links to family tree entities (many-to-many)
CREATE TABLE IF NOT EXISTS thread_links (
  thread_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person','record','lead','question')),
  entity_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (thread_id, entity_type, entity_id),
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  safe_filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  gmail_attachment_id TEXT,
  local_path TEXT,
  ocr_text TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- AI job queue (lease-based, versioned idempotency)
CREATE TABLE IF NOT EXISTS ai_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_key TEXT NOT NULL UNIQUE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('message','thread')),
  entity_id INTEGER NOT NULL,
  message_id INTEGER,
  thread_id INTEGER,
  step TEXT NOT NULL CHECK (step IN ('classify','translate','summarise',
                                     'extract_actions','draft_reply')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','running','done','failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  locked_at TEXT,
  lock_expires_at TEXT,
  next_retry_at TEXT,
  last_error TEXT,
  request_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (
    (entity_type = 'message' AND message_id IS NOT NULL AND thread_id IS NULL) OR
    (entity_type = 'thread' AND thread_id IS NOT NULL AND message_id IS NULL)
  ),
  FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE
);

-- Classification overrides (sender-level and thread-level)
CREATE TABLE IF NOT EXISTS classification_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL CHECK (scope IN ('sender','thread')),
  sender_email TEXT,
  thread_id INTEGER,
  category TEXT NOT NULL
    CHECK (category IN ('personal','work_and_opportunities','action_required',
                        'transactional','newsletter','marketing',
                        'automated_notification','likely_spam','uncertain')),
  relevance_score REAL,
  action_required INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  CHECK (
    (scope = 'sender' AND sender_email IS NOT NULL AND thread_id IS NULL) OR
    (scope = 'thread' AND thread_id IS NOT NULL AND sender_email IS NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_override_sender
  ON classification_overrides(sender_email) WHERE scope = 'sender';
CREATE UNIQUE INDEX IF NOT EXISTS idx_override_thread
  ON classification_overrides(thread_id) WHERE scope = 'thread';

-- Triggers: actions.message_id must belong to the same thread
CREATE TRIGGER IF NOT EXISTS trg_action_message_same_thread_insert
BEFORE INSERT ON actions
FOR EACH ROW
WHEN NEW.message_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN (SELECT thread_id FROM messages WHERE id = NEW.message_id) IS NULL
      THEN RAISE(ABORT, 'message_id references nonexistent message')
    WHEN (SELECT thread_id FROM messages WHERE id = NEW.message_id) != NEW.thread_id
      THEN RAISE(ABORT, 'message does not belong to the specified thread')
  END;
END;

CREATE TRIGGER IF NOT EXISTS trg_action_message_same_thread_update
BEFORE UPDATE OF message_id, thread_id ON actions
FOR EACH ROW
WHEN NEW.message_id IS NOT NULL
BEGIN
  SELECT CASE
    WHEN (SELECT thread_id FROM messages WHERE id = NEW.message_id) IS NULL
      THEN RAISE(ABORT, 'message_id references nonexistent message')
    WHEN (SELECT thread_id FROM messages WHERE id = NEW.message_id) != NEW.thread_id
      THEN RAISE(ABORT, 'message does not belong to the specified thread')
  END;
END;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_received ON messages(received_at);
CREATE INDEX IF NOT EXISTS idx_messages_account_thread ON messages(account_email, gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_threads_status ON threads(status);
CREATE INDEX IF NOT EXISTS idx_threads_account ON threads(account_email);
CREATE INDEX IF NOT EXISTS idx_actions_thread ON actions(thread_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
CREATE INDEX IF NOT EXISTS idx_actions_due ON actions(due_date);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_status ON ai_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_retry ON ai_jobs(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_ai_jobs_lease ON ai_jobs(lock_expires_at);
CREATE INDEX IF NOT EXISTS idx_message_classification_category ON message_classification(category);