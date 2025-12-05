-- =========================================================
-- 023_profile_wizard_progress.sql
-- Adds JSONB columns to core.preferences for profile wizard state
-- =========================================================

BEGIN;
ALTER TABLE core.preferences
  ADD COLUMN IF NOT EXISTS wizard_progress JSONB DEFAULT '{}'::jsonb;
ALTER TABLE core.preferences
  ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE core.preferences
  ADD COLUMN IF NOT EXISTS completion_history JSONB DEFAULT '{}'::jsonb;
ALTER TABLE core.preferences
  ADD COLUMN IF NOT EXISTS nudge_history JSONB DEFAULT '{}'::jsonb;
COMMIT;
