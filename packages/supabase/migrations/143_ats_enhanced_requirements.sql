-- ====================================================================================
-- 143_ats_enhanced_requirements.sql
-- Adds enhanced job requirements fields to jobs table
-- ====================================================================================

BEGIN;

-- =========================================================
-- Education Requirements
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS minimum_education_level TEXT CHECK (minimum_education_level IN ('none', 'high_school', 'associate', 'bachelor', 'master', 'phd'));

COMMENT ON COLUMN core.jobs.minimum_education_level IS
  'Minimum education level required: none, high_school, associate, bachelor, master, or phd.';

-- =========================================================
-- Background Check & Verification
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS require_background_check BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS background_check_type TEXT,
  ADD COLUMN IF NOT EXISTS require_drug_test BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_drivers_license BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS drivers_license_type TEXT,
  ADD COLUMN IF NOT EXISTS security_clearance_required TEXT;

COMMENT ON COLUMN core.jobs.require_background_check IS
  'Whether a background check is required for this position.';
COMMENT ON COLUMN core.jobs.background_check_type IS
  'Type of background check required (e.g., standard, enhanced, federal).';
COMMENT ON COLUMN core.jobs.require_drug_test IS
  'Whether a drug test is required for this position.';
COMMENT ON COLUMN core.jobs.require_drivers_license IS
  'Whether a driver''s license is required for this position.';
COMMENT ON COLUMN core.jobs.drivers_license_type IS
  'Type of driver''s license required (e.g., Class D, CDL).';
COMMENT ON COLUMN core.jobs.security_clearance_required IS
  'Security clearance level required (e.g., Secret, Top Secret).';

-- =========================================================
-- Language & Physical Requirements
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS language_requirements JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS physical_requirements JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN core.jobs.language_requirements IS
  'JSONB array of language requirements: [{language: string, proficiency: basic|conversational|fluent|native}].';
COMMENT ON COLUMN core.jobs.physical_requirements IS
  'JSONB object describing physical requirements (e.g., lifting capacity, standing hours).';

-- =========================================================
-- Travel & Shift Requirements
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS travel_percentage INTEGER CHECK (travel_percentage >= 0 AND travel_percentage <= 100),
  ADD COLUMN IF NOT EXISTS shift_requirements TEXT;

COMMENT ON COLUMN core.jobs.travel_percentage IS
  'Percentage of time expected to travel (0-100).';
COMMENT ON COLUMN core.jobs.shift_requirements IS
  'Shift requirements (e.g., day shift, night shift, rotating).';

-- =========================================================
-- Indexes for Performance
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_jobs_minimum_education_level
  ON core.jobs(minimum_education_level)
  WHERE minimum_education_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_require_background_check
  ON core.jobs(require_background_check)
  WHERE require_background_check = true;

CREATE INDEX IF NOT EXISTS idx_jobs_require_drivers_license
  ON core.jobs(require_drivers_license)
  WHERE require_drivers_license = true;

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_jobs_language_requirements_gin
  ON core.jobs USING GIN(language_requirements);

CREATE INDEX IF NOT EXISTS idx_jobs_physical_requirements_gin
  ON core.jobs USING GIN(physical_requirements);

COMMIT;

