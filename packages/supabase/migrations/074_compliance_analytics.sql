-- =========================================================
-- 066_compliance_analytics.sql
-- Adds compliance tracking and analytics fields
-- =========================================================

BEGIN;

-- =========================================================
-- Add EEO/EEOC compliance tracking
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS eeo_job_category text,
ADD COLUMN IF NOT EXISTS is_veteran_friendly boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_disability_friendly boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS affirmative_action_plan boolean DEFAULT false;

-- =========================================================
-- Add analytics and tracking fields
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS source_tracking_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS utm_parameters jsonb;

-- =========================================================
-- Create indexes for compliance queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_eeo_category_idx ON public.jobs(eeo_job_category) WHERE eeo_job_category IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_veteran_friendly_idx ON public.jobs(is_veteran_friendly) WHERE is_veteran_friendly = true;
CREATE INDEX IF NOT EXISTS jobs_disability_friendly_idx ON public.jobs(is_disability_friendly) WHERE is_disability_friendly = true;
CREATE INDEX IF NOT EXISTS jobs_affirmative_action_idx ON public.jobs(affirmative_action_plan) WHERE affirmative_action_plan = true;
CREATE INDEX IF NOT EXISTS jobs_source_tracking_idx ON public.jobs(source_tracking_enabled) WHERE source_tracking_enabled = true;

-- =========================================================
-- Create GIN index for utm_parameters jsonb queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_utm_parameters_idx ON public.jobs USING gin (utm_parameters);

-- =========================================================
-- Add comments for documentation
-- =========================================================
COMMENT ON COLUMN public.jobs.eeo_job_category IS 'Standard EEO job category for compliance reporting';
COMMENT ON COLUMN public.jobs.is_veteran_friendly IS 'Whether job is veteran-friendly';
COMMENT ON COLUMN public.jobs.is_disability_friendly IS 'Whether job is disability-friendly';
COMMENT ON COLUMN public.jobs.affirmative_action_plan IS 'Whether job is part of affirmative action plan';
COMMENT ON COLUMN public.jobs.source_tracking_enabled IS 'Whether to track application sources';
COMMENT ON COLUMN public.jobs.utm_parameters IS 'JSON object of UTM parameters for tracking. Example: {"utm_source": "linkedin", "utm_medium": "job_board", "utm_campaign": "q4_hiring"}';

COMMIT;
