-- =========================================================
-- 014_add_frequency_xp.sql - Add Frequency XP to Users
-- Adds gamification XP tracking for user engagement
-- =========================================================

BEGIN;

-- Add frequency_xp column to core.users table
ALTER TABLE core.users
  ADD COLUMN IF NOT EXISTS frequency_xp INTEGER DEFAULT 0 NOT NULL;

-- Create index for XP queries
CREATE INDEX IF NOT EXISTS idx_users_frequency_xp
  ON core.users(frequency_xp DESC)
  WHERE frequency_xp > 0;

-- Add comment
COMMENT ON COLUMN core.users.frequency_xp IS 'Frequency XP points earned through consistent engagement (weekly assessments, etc.)';

COMMIT;

