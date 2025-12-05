-- =========================================================
-- 022_req_92_employment_claims.sql
-- Adds support for organization employment claims linked to user experience
-- =========================================================

BEGIN;
-- =========================================================
-- Extend user_experience to track claim source metadata
-- =========================================================
ALTER TABLE core.user_experience
  ADD COLUMN source TEXT NOT NULL DEFAULT 'self_reported';
ALTER TABLE core.user_experience
  ADD COLUMN claimed_at TIMESTAMPTZ;
ALTER TABLE core.user_experience
  ADD CONSTRAINT user_experience_source_check
  CHECK (source IN ('self_reported', 'claim'));
COMMENT ON COLUMN core.user_experience.source
  IS 'Origin of the experience record (self-reported via profile or auto-created from an organization claim)';
COMMENT ON COLUMN core.user_experience.claimed_at
  IS 'Timestamp when a user created an organization claim via the dashboard workflow';
-- Backfill any null sources defensively
UPDATE core.user_experience
SET source = 'self_reported'
WHERE source IS NULL;
-- One active claim per user and organization combination
CREATE UNIQUE INDEX IF NOT EXISTS user_experience_claim_unique_idx
  ON core.user_experience(user_id, organization_id)
  WHERE organization_id IS NOT NULL AND source = 'claim';
COMMIT;
