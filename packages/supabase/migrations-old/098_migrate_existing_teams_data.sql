-- =========================================================
-- 098_migrate_existing_teams_data.sql
-- Backfill data for enhanced team management schema (REQ-91)
-- =========================================================

BEGIN;

-- -----------------------------------------------------------------
-- Safety snapshots (idempotent)
-- -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS core.teams_backup_pre_migration AS
SELECT * FROM core.teams;

CREATE TABLE IF NOT EXISTS core.team_members_backup_pre_migration AS
SELECT * FROM core.team_members;

CREATE TABLE IF NOT EXISTS core.jobs_team_assignment_backup AS
SELECT id, assigned_team_id
FROM core.jobs
WHERE assigned_team_id IS NOT NULL;

-- -----------------------------------------------------------------
-- Backfill core.teams columns introduced in REQ-91 schema upgrades
-- -----------------------------------------------------------------
UPDATE core.teams
SET
  description = COALESCE(
    description,
    '{"type":"doc","content":[]}'::jsonb
  ),
  purpose = COALESCE(NULLIF(purpose, ''), 'department'),
  visibility = COALESCE(visibility, 'organization'),
  invitation_policy = COALESCE(invitation_policy, 'invite_only'),
  invitation_expiration_days = COALESCE(invitation_expiration_days, 7),
  allow_self_join = COALESCE(allow_self_join, FALSE),
  auto_assign_jobs = COALESCE(auto_assign_jobs, FALSE),
  metadata = COALESCE(metadata, '{}'::jsonb),
  settings = COALESCE(settings, '{}'::jsonb),
  analytics_metadata = COALESCE(analytics_metadata, '{}'::jsonb),
  analytics_refresh_interval_minutes = COALESCE(analytics_refresh_interval_minutes, 60),
  workload_strategy = COALESCE(workload_strategy, 'manual'),
  workload_settings = COALESCE(workload_settings, '{}'::jsonb),
  default_role_key = COALESCE(NULLIF(default_role_key, ''), 'member'),
  is_archived = COALESCE(is_archived, FALSE),
  updated_at = COALESCE(updated_at, created_at)
WHERE TRUE;

-- -----------------------------------------------------------------
-- Backfill core.team_members new fields
-- -----------------------------------------------------------------
UPDATE core.team_members
SET
  status = COALESCE(NULLIF(status, ''), 'active'),
  joined_at = COALESCE(joined_at, created_at, NOW()),
  metadata = COALESCE(metadata, '{}'::jsonb),
  permissions_override = COALESCE(permissions_override, '{}'::jsonb),
  updated_at = COALESCE(updated_at, created_at, NOW())
WHERE TRUE;

-- -----------------------------------------------------------------
-- Normalize jobs.assigned_team_id and enforce new FK constraint
-- -----------------------------------------------------------------
-- Remove references to teams that no longer exist
UPDATE core.jobs AS j
SET assigned_team_id = NULL
WHERE assigned_team_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM core.teams t
    WHERE t.id = j.assigned_team_id
  );

ALTER TABLE core.jobs
  DROP CONSTRAINT IF EXISTS jobs_assigned_team_id_fkey;

ALTER TABLE core.jobs
  ADD CONSTRAINT jobs_assigned_team_id_fkey
  FOREIGN KEY (assigned_team_id)
  REFERENCES core.teams(id)
  ON DELETE SET NULL;

COMMIT;

