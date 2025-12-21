-- ====================================================================================
-- 147_ats_distribution_visibility.sql
-- Adds distribution and visibility fields to jobs table
-- ====================================================================================

BEGIN;

-- =========================================================
-- Posting Channels
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS posting_channels JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN core.jobs.posting_channels IS
  'JSONB object with posting channel configuration: {internal_only: boolean, external_boards?: string[], referral_bonus_enabled?: boolean, referral_bonus_cents?: number}.';

-- =========================================================
-- Featured Job Settings
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

COMMENT ON COLUMN core.jobs.is_featured IS
  'Whether this job is featured and should be highlighted in listings.';
COMMENT ON COLUMN core.jobs.featured_until IS
  'Date and time when the featured status expires.';

-- =========================================================
-- SEO & External Application
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS seo_keywords TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS external_application_url TEXT;

COMMENT ON COLUMN core.jobs.seo_keywords IS
  'Array of SEO keywords for this job posting.';
COMMENT ON COLUMN core.jobs.external_application_url IS
  'URL for external application system (if not using internal system).';

-- =========================================================
-- Indexes for Performance
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_jobs_is_featured
  ON core.jobs(is_featured)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_jobs_featured_until
  ON core.jobs(featured_until)
  WHERE featured_until IS NOT NULL;

-- GIN index for posting_channels JSONB
CREATE INDEX IF NOT EXISTS idx_jobs_posting_channels_gin
  ON core.jobs USING GIN(posting_channels);

-- GIN index for seo_keywords array
CREATE INDEX IF NOT EXISTS idx_jobs_seo_keywords_gin
  ON core.jobs USING GIN(seo_keywords);

COMMIT;

