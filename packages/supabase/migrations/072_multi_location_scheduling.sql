-- =========================================================
-- 064_multi_location_scheduling.sql
-- Adds multi-location support and scheduling details
-- =========================================================

BEGIN;

-- =========================================================
-- Add multi-location and relocation support
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS work_locations jsonb,
ADD COLUMN IF NOT EXISTS relocation_assistance_offered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS relocation_assistance_details text,
ADD COLUMN IF NOT EXISTS work_schedule_details text,
ADD COLUMN IF NOT EXISTS timezone text;

-- =========================================================
-- Create GIN index for work_locations jsonb queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_work_locations_idx ON public.jobs USING gin (work_locations);

-- =========================================================
-- Create indexes for location queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_relocation_assistance_idx ON public.jobs(relocation_assistance_offered) WHERE relocation_assistance_offered = true;
CREATE INDEX IF NOT EXISTS jobs_timezone_idx ON public.jobs(timezone) WHERE timezone IS NOT NULL;

-- =========================================================
-- Add comments for documentation
-- =========================================================
COMMENT ON COLUMN public.jobs.work_locations IS 'JSON array of work locations. Example: [{"address": {...}, "is_primary": true, "percentage_time": 100}]';
COMMENT ON COLUMN public.jobs.work_schedule_details IS 'Detailed work schedule. Example: "Monday-Friday, 7am-3:30pm"';
COMMENT ON COLUMN public.jobs.timezone IS 'Timezone for the position. Example: "America/Chicago"';

COMMIT;
