-- ====================================================================================
-- 141_ats_job_screening_team_management.sql
-- Adds application screening requirements and team management fields to jobs table
-- ====================================================================================

BEGIN;

-- =========================================================
-- Application Screening Requirements
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS require_current_location BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_relocation_willingness BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS minimum_years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS require_work_authorization BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_earliest_start_date BOOLEAN DEFAULT false;

COMMENT ON COLUMN core.jobs.require_current_location IS
  'Whether the job application requires candidates to provide their current location.';
COMMENT ON COLUMN core.jobs.require_relocation_willingness IS
  'Whether the job application requires candidates to indicate willingness to relocate.';
COMMENT ON COLUMN core.jobs.minimum_years_experience IS
  'Minimum years of experience required for this job.';
COMMENT ON COLUMN core.jobs.require_work_authorization IS
  'Whether the job application requires candidates to confirm work authorization.';
COMMENT ON COLUMN core.jobs.require_earliest_start_date IS
  'Whether the job application requires candidates to provide their earliest start date.';

-- =========================================================
-- Auto-Rejection Configuration
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS enable_auto_reject BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reject_criteria JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN core.jobs.enable_auto_reject IS
  'Whether automatic rejection is enabled for this job based on criteria.';
COMMENT ON COLUMN core.jobs.auto_reject_criteria IS
  'JSONB object containing auto-rejection criteria: score_minimum, require_work_authorization, require_all_skills, require_all_certifications.';

-- =========================================================
-- Team Management and Visibility
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS assigned_team_id UUID REFERENCES core.teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_ids UUID[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS team_visibility TEXT CHECK (team_visibility IN ('internal_only', 'external_only', 'both')),
  ADD COLUMN IF NOT EXISTS show_team_on_posting BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS minimum_score INTEGER CHECK (minimum_score >= 0 AND minimum_score <= 100);

COMMENT ON COLUMN core.jobs.assigned_team_id IS
  'Primary team assigned to manage this job posting.';
COMMENT ON COLUMN core.jobs.team_ids IS
  'Array of team IDs that have access to this job.';
COMMENT ON COLUMN core.jobs.team_visibility IS
  'Visibility level for team information: internal_only, external_only, or both.';
COMMENT ON COLUMN core.jobs.show_team_on_posting IS
  'Whether to display team information on the public job posting.';
COMMENT ON COLUMN core.jobs.minimum_score IS
  'Minimum application score (0-100) required for this job.';

-- =========================================================
-- Indexes for Performance
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_jobs_assigned_team_id
  ON core.jobs(assigned_team_id)
  WHERE assigned_team_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_minimum_score
  ON core.jobs(minimum_score)
  WHERE minimum_score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_enable_auto_reject
  ON core.jobs(enable_auto_reject)
  WHERE enable_auto_reject = true;

-- GIN index for team_ids array searches
CREATE INDEX IF NOT EXISTS idx_jobs_team_ids_gin
  ON core.jobs USING GIN(team_ids);

COMMIT;

