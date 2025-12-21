-- ====================================================================================
-- 148_ats_compliance_analytics.sql
-- Adds compliance and analytics fields to jobs table
-- ====================================================================================

BEGIN;

-- =========================================================
-- EEO Compliance
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS eeo_job_category TEXT,
  ADD COLUMN IF NOT EXISTS is_veteran_friendly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_disability_friendly BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS affirmative_action_plan BOOLEAN DEFAULT false;

COMMENT ON COLUMN core.jobs.eeo_job_category IS
  'EEO job category classification (e.g., Professional, Technical, Administrative).';
COMMENT ON COLUMN core.jobs.is_veteran_friendly IS
  'Whether this job is marked as veteran-friendly.';
COMMENT ON COLUMN core.jobs.is_disability_friendly IS
  'Whether this job is marked as disability-friendly.';
COMMENT ON COLUMN core.jobs.affirmative_action_plan IS
  'Whether this job is part of an affirmative action plan.';

-- =========================================================
-- Source Tracking & Analytics
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS source_tracking_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS utm_parameters JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN core.jobs.source_tracking_enabled IS
  'Whether to track application sources for analytics.';
COMMENT ON COLUMN core.jobs.utm_parameters IS
  'JSONB object with UTM parameters: {utm_source?: string, utm_medium?: string, utm_campaign?: string, utm_term?: string, utm_content?: string}.';

-- =========================================================
-- Indexes for Performance
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_jobs_is_veteran_friendly
  ON core.jobs(is_veteran_friendly)
  WHERE is_veteran_friendly = true;

CREATE INDEX IF NOT EXISTS idx_jobs_is_disability_friendly
  ON core.jobs(is_disability_friendly)
  WHERE is_disability_friendly = true;

CREATE INDEX IF NOT EXISTS idx_jobs_source_tracking_enabled
  ON core.jobs(source_tracking_enabled)
  WHERE source_tracking_enabled = true;

-- GIN index for utm_parameters JSONB
CREATE INDEX IF NOT EXISTS idx_jobs_utm_parameters_gin
  ON core.jobs USING GIN(utm_parameters);

COMMIT;

