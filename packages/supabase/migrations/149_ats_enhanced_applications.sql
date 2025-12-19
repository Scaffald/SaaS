-- ====================================================================================
-- 149_ats_enhanced_applications.sql
-- Adds scoring, progress tracking, and enhanced fields to applications table
-- ====================================================================================

BEGIN;

-- =========================================================
-- Application Scoring
-- =========================================================

ALTER TABLE core.applications
  ADD COLUMN IF NOT EXISTS score_total INTEGER CHECK (score_total >= 0 AND score_total <= 100),
  ADD COLUMN IF NOT EXISTS score_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS score_calculated_at TIMESTAMPTZ;

COMMENT ON COLUMN core.applications.score_total IS
  'Total application score (0-100) calculated from various criteria.';
COMMENT ON COLUMN core.applications.score_breakdown IS
  'JSONB object with score breakdown: {skills_match: number, certifications: number, experience: number, screening_answers: number}.';
COMMENT ON COLUMN core.applications.score_calculated_at IS
  'Timestamp when the score was last calculated.';

-- =========================================================
-- Progress Tracking
-- =========================================================

ALTER TABLE core.applications
  ADD COLUMN IF NOT EXISTS current_step TEXT CHECK (current_step IN ('screening', 'custom_questions', 'attachments', 'assessment', 'video_interview', 'review')),
  ADD COLUMN IF NOT EXISTS completed_steps TEXT[] DEFAULT '{}';

COMMENT ON COLUMN core.applications.current_step IS
  'Current step in the application process: screening, custom_questions, attachments, assessment, video_interview, or review.';
COMMENT ON COLUMN core.applications.completed_steps IS
  'Array of completed step names.';

-- =========================================================
-- Enhanced Screening & Attachments
-- =========================================================

ALTER TABLE core.applications
  ADD COLUMN IF NOT EXISTS screening_answers JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attachment_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN core.applications.screening_answers IS
  'JSONB object with screening question answers: {current_location?: string, willing_to_relocate?: boolean, years_experience?: number, is_authorized_to_work?: boolean, earliest_start_date?: string}.';
COMMENT ON COLUMN core.applications.attachment_metadata IS
  'JSONB object with attachment metadata: {resume?: {path, filename, size, mime_type, uploaded_at}, cover_letter?: {...}, portfolio?: {...}, assessment?: {...}, video_interview?: {...}}.';

-- =========================================================
-- Indexes for Performance
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_applications_score_total
  ON core.applications(score_total DESC)
  WHERE score_total IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_score_calculated_at
  ON core.applications(score_calculated_at DESC)
  WHERE score_calculated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_applications_current_step
  ON core.applications(current_step)
  WHERE current_step IS NOT NULL;

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_applications_score_breakdown_gin
  ON core.applications USING GIN(score_breakdown);

CREATE INDEX IF NOT EXISTS idx_applications_screening_answers_gin
  ON core.applications USING GIN(screening_answers);

CREATE INDEX IF NOT EXISTS idx_applications_attachment_metadata_gin
  ON core.applications USING GIN(attachment_metadata);

-- GIN index for completed_steps array
CREATE INDEX IF NOT EXISTS idx_applications_completed_steps_gin
  ON core.applications USING GIN(completed_steps);

COMMIT;

