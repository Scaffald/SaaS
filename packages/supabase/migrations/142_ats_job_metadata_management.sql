-- ====================================================================================
-- 142_ats_job_metadata_management.sql
-- Adds job metadata and management fields to jobs table
-- ====================================================================================

BEGIN;

-- =========================================================
-- Internal Job Management
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS internal_job_code TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS cost_center TEXT,
  ADD COLUMN IF NOT EXISTS hiring_manager_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recruiter_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS number_of_openings INTEGER CHECK (number_of_openings > 0),
  ADD COLUMN IF NOT EXISTS priority_level TEXT CHECK (priority_level IN ('urgent', 'high', 'normal', 'low')),
  ADD COLUMN IF NOT EXISTS requisition_number TEXT,
  ADD COLUMN IF NOT EXISTS job_category TEXT,
  ADD COLUMN IF NOT EXISTS is_confidential BOOLEAN DEFAULT false;

COMMENT ON COLUMN core.jobs.internal_job_code IS
  'Internal reference code for this job posting.';
COMMENT ON COLUMN core.jobs.department IS
  'Department or division this job belongs to.';
COMMENT ON COLUMN core.jobs.cost_center IS
  'Cost center code for financial tracking.';
COMMENT ON COLUMN core.jobs.hiring_manager_id IS
  'User ID of the hiring manager responsible for this position.';
COMMENT ON COLUMN core.jobs.recruiter_id IS
  'User ID of the recruiter assigned to this job.';
COMMENT ON COLUMN core.jobs.number_of_openings IS
  'Number of positions available for this job.';
COMMENT ON COLUMN core.jobs.priority_level IS
  'Priority level: urgent, high, normal, or low.';
COMMENT ON COLUMN core.jobs.requisition_number IS
  'Requisition number for HR/accounting systems.';
COMMENT ON COLUMN core.jobs.job_category IS
  'Category classification for this job.';
COMMENT ON COLUMN core.jobs.is_confidential IS
  'Whether this job posting should be kept confidential.';

-- =========================================================
-- Date Tracking
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS target_start_date DATE,
  ADD COLUMN IF NOT EXISTS estimated_hire_date DATE;

COMMENT ON COLUMN core.jobs.application_deadline IS
  'Deadline for accepting applications.';
COMMENT ON COLUMN core.jobs.target_start_date IS
  'Target start date for the position (YYYY-MM-DD).';
COMMENT ON COLUMN core.jobs.estimated_hire_date IS
  'Estimated date when hiring will be completed (YYYY-MM-DD).';

-- =========================================================
-- Indexes for Performance
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_jobs_hiring_manager_id
  ON core.jobs(hiring_manager_id)
  WHERE hiring_manager_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id
  ON core.jobs(recruiter_id)
  WHERE recruiter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_application_deadline
  ON core.jobs(application_deadline)
  WHERE application_deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_priority_level
  ON core.jobs(priority_level)
  WHERE priority_level IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_internal_job_code
  ON core.jobs(internal_job_code)
  WHERE internal_job_code IS NOT NULL;

COMMIT;

