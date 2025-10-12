-- =========================================================
-- 063_application_process_configuration.sql
-- Adds application process configuration and custom questions
-- =========================================================

BEGIN;

-- =========================================================
-- Add custom application questions and requirements
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS custom_application_questions jsonb,
ADD COLUMN IF NOT EXISTS required_attachments jsonb,
ADD COLUMN IF NOT EXISTS requires_assessment boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS assessment_details text,
ADD COLUMN IF NOT EXISTS requires_video_interview boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS estimated_application_time_minutes integer CHECK (estimated_application_time_minutes > 0),
ADD COLUMN IF NOT EXISTS application_expiry_days integer DEFAULT 90 CHECK (application_expiry_days > 0);

-- =========================================================
-- Create GIN indexes for jsonb queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_custom_questions_idx ON public.jobs USING gin (custom_application_questions);
CREATE INDEX IF NOT EXISTS jobs_required_attachments_idx ON public.jobs USING gin (required_attachments);

-- =========================================================
-- Create indexes for application process queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_requires_assessment_idx ON public.jobs(requires_assessment) WHERE requires_assessment = true;
CREATE INDEX IF NOT EXISTS jobs_requires_video_idx ON public.jobs(requires_video_interview) WHERE requires_video_interview = true;

-- =========================================================
-- Add comments for documentation
-- =========================================================
COMMENT ON COLUMN public.jobs.custom_application_questions IS 'JSON array of custom questions. Example: [{"id": "q1", "question": "Why do you want this role?", "type": "long_text", "required": true}]';
COMMENT ON COLUMN public.jobs.required_attachments IS 'JSON object of attachment requirements. Example: {"resume": {"required": true}, "cover_letter": {"required": false}, "portfolio": {"required": false, "max_size_mb": 10}}';
COMMENT ON COLUMN public.jobs.estimated_application_time_minutes IS 'Estimated time to complete application';
COMMENT ON COLUMN public.jobs.application_expiry_days IS 'Days after which application expires (default 90)';

COMMIT;
