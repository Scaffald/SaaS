-- ====================================================================================
-- 145_ats_application_process_config.sql
-- Adds application process configuration fields to jobs table
-- ====================================================================================

BEGIN;

-- =========================================================
-- Custom Application Questions
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS custom_application_questions JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN core.jobs.custom_application_questions IS
  'JSONB array of custom application questions: [{id: string, question: string, type: short_text|long_text|single_choice|multiple_choice|yes_no, required: boolean, options?: string[]}].';

-- =========================================================
-- Required Attachments
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS required_attachments JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN core.jobs.required_attachments IS
  'JSONB object mapping attachment types to requirements: {type: {required: boolean, max_size_mb?: number}}.';

-- =========================================================
-- Assessment Requirements
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS requires_assessment BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS assessment_details TEXT;

COMMENT ON COLUMN core.jobs.requires_assessment IS
  'Whether this job requires candidates to complete an assessment.';
COMMENT ON COLUMN core.jobs.assessment_details IS
  'Details about the assessment (e.g., skills test, personality assessment).';

-- =========================================================
-- Video Interview
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS requires_video_interview BOOLEAN DEFAULT false;

COMMENT ON COLUMN core.jobs.requires_video_interview IS
  'Whether this job requires candidates to submit a video interview.';

-- =========================================================
-- Application Time & Expiry
-- =========================================================

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS estimated_application_time_minutes INTEGER CHECK (estimated_application_time_minutes > 0),
  ADD COLUMN IF NOT EXISTS application_expiry_days INTEGER CHECK (application_expiry_days > 0);

COMMENT ON COLUMN core.jobs.estimated_application_time_minutes IS
  'Estimated time in minutes to complete the application.';
COMMENT ON COLUMN core.jobs.application_expiry_days IS
  'Number of days before an incomplete application expires.';

-- =========================================================
-- Indexes for Performance
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_jobs_requires_assessment
  ON core.jobs(requires_assessment)
  WHERE requires_assessment = true;

CREATE INDEX IF NOT EXISTS idx_jobs_requires_video_interview
  ON core.jobs(requires_video_interview)
  WHERE requires_video_interview = true;

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_jobs_custom_application_questions_gin
  ON core.jobs USING GIN(custom_application_questions);

CREATE INDEX IF NOT EXISTS idx_jobs_required_attachments_gin
  ON core.jobs USING GIN(required_attachments);

COMMIT;

