-- =========================================================
-- 060_job_metadata_management.sql
-- Adds internal job metadata and management fields
-- =========================================================

BEGIN;

-- =========================================================
-- Add internal management fields
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS internal_job_code text,
ADD COLUMN IF NOT EXISTS department text,
ADD COLUMN IF NOT EXISTS cost_center text,
ADD COLUMN IF NOT EXISTS hiring_manager_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS recruiter_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS number_of_openings integer DEFAULT 1 CHECK (number_of_openings > 0),
ADD COLUMN IF NOT EXISTS priority_level text CHECK (priority_level IN ('urgent', 'high', 'normal', 'low')) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS requisition_number text,
ADD COLUMN IF NOT EXISTS job_category text,
ADD COLUMN IF NOT EXISTS is_confidential boolean DEFAULT false;

-- =========================================================
-- Add date tracking fields
-- =========================================================
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS application_deadline timestamptz,
ADD COLUMN IF NOT EXISTS target_start_date date,
ADD COLUMN IF NOT EXISTS estimated_hire_date date;

-- =========================================================
-- Add constraints for logical date ordering
-- =========================================================
ALTER TABLE public.jobs
ADD CONSTRAINT application_deadline_before_start CHECK (
  application_deadline IS NULL OR target_start_date IS NULL OR
  application_deadline::date <= target_start_date
);

-- =========================================================
-- Create indexes for management queries
-- =========================================================
CREATE INDEX IF NOT EXISTS jobs_hiring_manager_idx ON public.jobs(hiring_manager_id) WHERE hiring_manager_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_recruiter_idx ON public.jobs(recruiter_id) WHERE recruiter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_priority_idx ON public.jobs(priority_level);
CREATE INDEX IF NOT EXISTS jobs_department_idx ON public.jobs(department) WHERE department IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_deadline_idx ON public.jobs(application_deadline) WHERE application_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS jobs_confidential_idx ON public.jobs(is_confidential) WHERE is_confidential = true;

-- =========================================================
-- Add comments for documentation
-- =========================================================
COMMENT ON COLUMN public.jobs.internal_job_code IS 'Internal reference code for tracking';
COMMENT ON COLUMN public.jobs.requisition_number IS 'HR system requisition number';
COMMENT ON COLUMN public.jobs.is_confidential IS 'Whether this is a confidential search';
COMMENT ON COLUMN public.jobs.priority_level IS 'Hiring urgency: urgent, high, normal, low';

COMMIT;
