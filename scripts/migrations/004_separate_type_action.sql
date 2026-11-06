-- Migration 004: Separate message_type and action_status (CONSERVATIVE)

-- ============================================================
-- Part A: message_classification (additive columns)
-- ============================================================

-- Step 1: Add new columns (additive, no data loss)
ALTER TABLE message_classification ADD COLUMN message_type TEXT
  CHECK (message_type IN ('personal','government','newsletter','marketing',
                          'automated_notification','transactional','uncertain'));

ALTER TABLE message_classification ADD COLUMN action_status TEXT
  CHECK (action_status IN ('needs_review','needs_reply','no_action_needed','completed'));

ALTER TABLE message_classification ADD COLUMN type_confidence REAL DEFAULT 0.0;
ALTER TABLE message_classification ADD COLUMN action_confidence REAL DEFAULT 0.0;

-- Step 2: Migrate existing data CONSERVATIVELY
-- Only map where meaning is genuinely equivalent. Otherwise 'uncertain'.
UPDATE message_classification SET
  message_type = CASE category
    WHEN 'newsletter' THEN 'newsletter'
    WHEN 'marketing' THEN 'marketing'
    WHEN 'automated_notification' THEN 'automated_notification'
    WHEN 'transactional' THEN 'transactional'
    WHEN 'personal' THEN 'personal'
    WHEN 'action_required' THEN 'uncertain'
    WHEN 'work_and_opportunities' THEN 'uncertain'
    WHEN 'likely_spam' THEN 'uncertain'
    WHEN 'uncertain' THEN 'uncertain'
    ELSE 'uncertain'
  END,
  action_status = CASE category
    WHEN 'action_required' THEN 'needs_review'
    ELSE 'no_action_needed'
  END,
  type_confidence = CASE category
    WHEN 'newsletter' THEN 0.85
    WHEN 'marketing' THEN 0.8
    WHEN 'automated_notification' THEN 0.85
    WHEN 'transactional' THEN 0.85
    WHEN 'personal' THEN 0.6
    ELSE 0.3
  END,
  action_confidence = CASE category
    WHEN 'action_required' THEN 0.7
    ELSE 0.5
  END
WHERE message_type IS NULL;

-- Step 3: Create triggers (null-safe IS NOT comparison)
CREATE TRIGGER IF NOT EXISTS trg_mc_action_required_insert
AFTER INSERT ON message_classification
FOR EACH ROW
BEGIN
  UPDATE message_classification SET
    action_required = CASE NEW.action_status
      WHEN 'needs_review' THEN 1
      WHEN 'needs_reply' THEN 1
      WHEN 'no_action_needed' THEN 0
      WHEN 'completed' THEN 0
      ELSE 0
    END
  WHERE id = NEW.id
    AND action_required IS NOT CASE NEW.action_status
      WHEN 'needs_review' THEN 1
      WHEN 'needs_reply' THEN 1
      WHEN 'no_action_needed' THEN 0
      WHEN 'completed' THEN 0
      ELSE 0
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_mc_action_required_update
AFTER UPDATE OF action_status ON message_classification
FOR EACH ROW
BEGIN
  UPDATE message_classification SET
    action_required = CASE NEW.action_status
      WHEN 'needs_review' THEN 1
      WHEN 'needs_reply' THEN 1
      WHEN 'no_action_needed' THEN 0
      WHEN 'completed' THEN 0
      ELSE 0
    END
  WHERE id = NEW.id
    AND action_required IS NOT CASE NEW.action_status
      WHEN 'needs_review' THEN 1
      WHEN 'needs_reply' THEN 1
      WHEN 'no_action_needed' THEN 0
      WHEN 'completed' THEN 0
      ELSE 0
    END;
END;

CREATE TRIGGER IF NOT EXISTS trg_mc_action_required_before_direct
BEFORE UPDATE OF action_required ON message_classification
FOR EACH ROW
WHEN NEW.action_required IS NOT CASE NEW.action_status
  WHEN 'needs_review' THEN 1
  WHEN 'needs_reply' THEN 1
  WHEN 'no_action_needed' THEN 0
  WHEN 'completed' THEN 0
  ELSE 0
END
BEGIN
  SELECT RAISE(ABORT, 'action_required must match action_status');
END;

-- Step 4: Backfill action_required for existing rows (null-safe IS NOT)
UPDATE message_classification SET
  action_required = CASE action_status
    WHEN 'needs_review' THEN 1
    WHEN 'needs_reply' THEN 1
    WHEN 'no_action_needed' THEN 0
    WHEN 'completed' THEN 0
    ELSE 0
  END
WHERE action_required IS NULL
   OR action_required IS NOT CASE action_status
        WHEN 'needs_review' THEN 1
        WHEN 'needs_reply' THEN 1
        WHEN 'no_action_needed' THEN 0
        WHEN 'completed' THEN 0
        ELSE 0
      END;

-- ============================================================
-- Part B: classification_overrides (table recreation for nullable category)
-- ============================================================

-- Step 5: Create new table with nullable category, message_type, action_status
CREATE TABLE classification_overrides_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scope TEXT NOT NULL CHECK (scope IN ('sender','thread')),
  sender_email TEXT,
  thread_id INTEGER,
  -- Legacy field: retained for backward compatibility, now nullable
  category TEXT CHECK (category IN ('personal','work_and_opportunities','action_required',
                                   'transactional','newsletter','marketing',
                                   'automated_notification','likely_spam','uncertain')),
  -- New fields: independently nullable
  message_type TEXT CHECK (message_type IN ('personal','government','newsletter','marketing',
                                           'automated_notification','transactional','uncertain')),
  action_status TEXT CHECK (action_status IN ('needs_review','needs_reply','no_action_needed','completed')),
  relevance_score REAL,
  action_required INTEGER,
  type_confidence REAL,
  action_confidence REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (thread_id) REFERENCES threads(id) ON DELETE CASCADE,
  CHECK (
    (scope = 'sender' AND sender_email IS NOT NULL AND thread_id IS NULL) OR
    (scope = 'thread' AND thread_id IS NOT NULL AND sender_email IS NULL)
  )
);

-- Step 6: Copy existing data (preserves all rows, including legacy category)
-- Legacy category values are preserved as-is. New fields populated only where
-- meaning is genuinely equivalent; otherwise NULL.
INSERT INTO classification_overrides_new
  (id, scope, sender_email, thread_id, category, message_type, action_status,
   relevance_score, action_required, type_confidence, action_confidence,
   created_at, updated_at)
SELECT
  id, scope, sender_email, thread_id, category,
  -- Migrate category to message_type only where genuinely equivalent
  CASE category
    WHEN 'newsletter' THEN 'newsletter'
    WHEN 'marketing' THEN 'marketing'
    WHEN 'automated_notification' THEN 'automated_notification'
    WHEN 'transactional' THEN 'transactional'
    WHEN 'personal' THEN 'personal'
    -- uncertain and likely_spam → 'uncertain' (preserve manual decision)
    WHEN 'uncertain' THEN 'uncertain'
    WHEN 'likely_spam' THEN 'uncertain'
    -- action_required, work_and_opportunities → NULL (not equivalent to a type)
    ELSE NULL
  END,
  -- Migrate category to action_status only where genuinely equivalent
  CASE category
    WHEN 'action_required' THEN 'needs_review'
    ELSE NULL
  END,
  relevance_score, action_required,
  CASE category
    WHEN 'newsletter' THEN 0.85
    WHEN 'marketing' THEN 0.8
    WHEN 'automated_notification' THEN 0.85
    WHEN 'transactional' THEN 0.85
    WHEN 'personal' THEN 0.6
    WHEN 'uncertain' THEN 1.0
    WHEN 'likely_spam' THEN 1.0
    ELSE NULL
  END,
  CASE category
    WHEN 'action_required' THEN 0.7
    ELSE NULL
  END,
  created_at, updated_at
FROM classification_overrides;

-- Step 7: Replace old table
DROP TABLE classification_overrides;
ALTER TABLE classification_overrides_new RENAME TO classification_overrides;

-- Step 8: Recreate indexes (lost during table drop)
CREATE UNIQUE INDEX IF NOT EXISTS idx_override_sender
  ON classification_overrides(sender_email) WHERE scope = 'sender';
CREATE UNIQUE INDEX IF NOT EXISTS idx_override_thread
  ON classification_overrides(thread_id) WHERE scope = 'thread';