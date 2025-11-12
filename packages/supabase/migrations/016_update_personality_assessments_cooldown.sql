-- =========================================================
-- 016_update_personality_assessments_cooldown.sql
-- Add cooldown tracking and diary fields to personality assessments
-- =========================================================

BEGIN;
-- Add cooldown and diary fields
ALTER TABLE core.personality_assessments
  ADD COLUMN IF NOT EXISTS next_luscher_test_available_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS diary_response TEXT,
  ADD COLUMN IF NOT EXISTS diary_response_sentiment TEXT;
-- Update current_step enum to include 'intro' and 'results'
-- Note: PostgreSQL doesn't support direct enum modification, so we'll use CHECK constraint
-- The existing enum already supports the needed values, but we'll add a comment
COMMENT ON COLUMN core.personality_assessments.current_step IS 'Current step: intro, luscher1, cooldown, luscher2, results, or completed';
-- Create index for cooldown queries
CREATE INDEX IF NOT EXISTS idx_personality_assessments_next_available
  ON core.personality_assessments(user_id, next_luscher_test_available_at)
  WHERE next_luscher_test_available_at IS NOT NULL;
-- Comments
COMMENT ON COLUMN core.personality_assessments.next_luscher_test_available_at IS 'Timestamp when user can retake the unified Luscher test (7-day cooldown after completion)';
COMMENT ON COLUMN core.personality_assessments.diary_response IS 'Optional diary entry from cooldown step';
COMMENT ON COLUMN core.personality_assessments.diary_response_sentiment IS 'Sentiment tag derived from diary response';
COMMIT;
