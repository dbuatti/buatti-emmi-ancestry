-- Migration 006: Add genealogy_relevance classification field
-- ============================================================
-- Adds a new column to message_classification for genealogy relevance
-- Values: definite, possible, unrelated
-- Existing messages default to unreviewed (NULL genealogy_relevance = not yet assessed)
-- This field is independent of message_type and action_status

-- Step 1: Add genealogy_relevance column (nullable, default NULL)
ALTER TABLE message_classification ADD COLUMN genealogy_relevance TEXT;

-- Step 2: Create index for genealogy_relevance for faster queries
CREATE INDEX IF NOT EXISTS idx_message_classification_genealogy_relevance ON message_classification(genealogy_relevance);

-- Step 3: Apply migration verification
SELECT 
  COUNT(*) as total_rows,
  COUNT(genealogy_relevance) as with_relevance,
  COUNT(DISTINCT genealogy_relevance) as distinct_values
FROM message_classification;
