-- =========================================================
-- 061_enhanced_requirements.sql
-- Adds enhanced job requirements and qualifications
-- =========================================================

BEGIN;

-- =========================================================
-- Add education and background requirements
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS minimum_education_level text CHECK (
  minimum_education_level IN ('none', 'high_school', 'associate', 'bachelor', 'master', 'phd')
),
ADD COLUMN IF NOT EXISTS require_background_check boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS background_check_type text,
ADD COLUMN IF NOT EXISTS require_drug_test boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS require_drivers_license boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS drivers_license_type text;

-- =========================================================
-- Add work-specific requirements
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS security_clearance_required text,
ADD COLUMN IF NOT EXISTS language_requirements jsonb,
ADD COLUMN IF NOT EXISTS physical_requirements jsonb,
ADD COLUMN IF NOT EXISTS travel_percentage integer CHECK (travel_percentage >= 0 AND travel_percentage <= 100),
ADD COLUMN IF NOT EXISTS shift_requirements text;

-- =========================================================
-- Create indexes for requirement queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_education_level_idx ON public.jobs(minimum_education_level) WHERE minimum_education_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_background_check_idx ON public.jobs(require_background_check) WHERE require_background_check = true;
CREATE INDEX IF NOT EXISTS jobs_drug_test_idx ON public.jobs(require_drug_test) WHERE require_drug_test = true;
CREATE INDEX IF NOT EXISTS jobs_drivers_license_idx ON public.jobs(require_drivers_license) WHERE require_drivers_license = true;
CREATE INDEX IF NOT EXISTS jobs_security_clearance_idx ON public.jobs(security_clearance_required) WHERE security_clearance_required IS NOT NULL;

-- =========================================================
-- Add GIN indexes for jsonb queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_language_requirements_idx ON public.jobs USING gin (language_requirements);
CREATE INDEX IF NOT EXISTS jobs_physical_requirements_idx ON public.jobs USING gin (physical_requirements);

-- =========================================================
-- Add comments for documentation
-- =========================================================
COMMENT ON COLUMN public.jobs.language_requirements IS 'JSON array of language requirements. Example: [{"language": "Spanish", "proficiency": "fluent"}]';
COMMENT ON COLUMN public.jobs.physical_requirements IS 'JSON object of physical requirements. Example: {"lifting": "50 lbs", "standing": "8 hours"}';
COMMENT ON COLUMN public.jobs.travel_percentage IS 'Percentage of time requiring travel (0-100)';
COMMENT ON COLUMN public.jobs.shift_requirements IS 'Shift type: day, night, rotating, flexible';
COMMENT ON COLUMN public.jobs.security_clearance_required IS 'Required clearance level: Secret, Top Secret, etc.';
COMMENT ON COLUMN public.jobs.drivers_license_type IS 'License type required: CDL-A, CDL-B, standard, etc.';

COMMIT;
