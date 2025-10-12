-- =========================================================
-- 075_enhance_applications_table.sql
-- Enhances applications table with screening data, scoring, and progress tracking
-- =========================================================

BEGIN;

-- =========================================================
-- Add screening answer columns
-- =========================================================
ALTER TABLE public.applications 
  ADD COLUMN IF NOT EXISTS current_location text,
  ADD COLUMN IF NOT EXISTS willing_to_relocate boolean,
  ADD COLUMN IF NOT EXISTS years_experience integer CHECK (years_experience >= 0),
  ADD COLUMN IF NOT EXISTS is_authorized_to_work boolean,
  ADD COLUMN IF NOT EXISTS earliest_start_date text;

-- =========================================================
-- Add JSON columns for structured data
-- =========================================================
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS screening_answers jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_question_answers jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '{}'::jsonb;

-- =========================================================
-- Add scoring and auto-rejection columns
-- =========================================================
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS application_score integer CHECK (application_score >= 0 AND application_score <= 100),
  ADD COLUMN IF NOT EXISTS auto_rejected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_reject_reason text;

-- =========================================================
-- Add progress tracking columns
-- =========================================================
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS completed_steps text[] DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS is_complete boolean DEFAULT false;

-- =========================================================
-- Create indexes for performance
-- =========================================================

-- Index for filtering by score (completed applications only)
CREATE INDEX IF NOT EXISTS applications_score_idx 
  ON public.applications(application_score DESC) 
  WHERE is_complete = true;

-- Index for auto-rejected applications
CREATE INDEX IF NOT EXISTS applications_auto_rejected_idx 
  ON public.applications(auto_rejected) 
  WHERE auto_rejected = true;

-- Index for location-based filtering
CREATE INDEX IF NOT EXISTS applications_location_idx 
  ON public.applications(current_location);

-- Index for work authorization filtering
CREATE INDEX IF NOT EXISTS applications_work_auth_idx 
  ON public.applications(is_authorized_to_work) 
  WHERE is_authorized_to_work IS NOT NULL;

-- Index for completion status
CREATE INDEX IF NOT EXISTS applications_complete_idx 
  ON public.applications(is_complete, applied_at DESC);

-- Composite index for job + completion status filtering
CREATE INDEX IF NOT EXISTS applications_job_complete_idx 
  ON public.applications(job_id, is_complete, applied_at DESC);

-- =========================================================
-- Add comments for documentation
-- =========================================================
COMMENT ON COLUMN public.applications.current_location IS 'Applicant current location (city, state format)';
COMMENT ON COLUMN public.applications.willing_to_relocate IS 'Whether applicant is willing to relocate';
COMMENT ON COLUMN public.applications.years_experience IS 'Years of relevant work experience';
COMMENT ON COLUMN public.applications.is_authorized_to_work IS 'Whether applicant is authorized to work in the job location';
COMMENT ON COLUMN public.applications.earliest_start_date IS 'Earliest date applicant can start (text format for flexibility)';
COMMENT ON COLUMN public.applications.screening_answers IS 'JSON object with additional screening question answers';
COMMENT ON COLUMN public.applications.custom_question_answers IS 'JSON array of custom question answers with question_id and answer';
COMMENT ON COLUMN public.applications.attachments IS 'JSON object with file metadata (resume, cover_letter, portfolio)';
COMMENT ON COLUMN public.applications.application_score IS 'Calculated application score (0-100) based on job requirements match';
COMMENT ON COLUMN public.applications.auto_rejected IS 'Whether application was automatically rejected';
COMMENT ON COLUMN public.applications.auto_reject_reason IS 'Reason for automatic rejection';
COMMENT ON COLUMN public.applications.completed_steps IS 'Array of completed application steps';
COMMENT ON COLUMN public.applications.is_complete IS 'Whether application has been fully submitted';

-- =========================================================
-- Drop and recreate view to include new fields
-- =========================================================
DROP VIEW IF EXISTS public.v_applications_with_details CASCADE;

CREATE VIEW public.v_applications_with_details AS
SELECT
  a.*,
  j.title as job_title,
  j.status as job_status,
  j.employment_type,
  j.remote_option,
  j.location as job_location,
  j.pay_range_min_cents,
  j.pay_range_max_cents,
  j.pay_range_type,
  j.minimum_years_experience as job_min_years_experience,
  j.require_work_authorization as job_requires_work_authorization,
  j.minimum_score as job_minimum_score,
  o.id as organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  p.first_name as applicant_first_name,
  p.last_name as applicant_last_name,
  p.avatar_path as applicant_avatar_path
FROM public.applications a
JOIN public.jobs j ON j.id = a.job_id
JOIN public.organizations o ON o.id = j.organization_id
JOIN public.profiles p ON p.id = a.user_id;

GRANT SELECT ON public.v_applications_with_details TO authenticated;

-- =========================================================
-- Create function to check if application is draft
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_application_draft(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_is_complete boolean;
BEGIN
  SELECT is_complete INTO v_is_complete
  FROM public.applications
  WHERE id = p_application_id;
  
  RETURN COALESCE(NOT v_is_complete, true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_application_draft TO authenticated;

-- =========================================================
-- Create function to mark application as complete
-- =========================================================
CREATE OR REPLACE FUNCTION public.complete_application(p_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated boolean;
BEGIN
  -- Mark application as complete
  UPDATE public.applications
  SET 
    is_complete = true,
    applied_at = COALESCE(applied_at, now()),
    updated_at = now()
  WHERE id = p_application_id
    AND user_id = auth.uid()
    AND is_complete = false;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_application TO authenticated;

COMMIT;
