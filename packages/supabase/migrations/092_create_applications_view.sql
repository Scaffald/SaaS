-- =========================================================
-- 092_create_applications_view.sql
-- Creates a view for applications with user profiles and job details
-- This solves the relationship issue between applications and profiles
-- =========================================================

BEGIN;

-- Drop existing view if it exists
DROP VIEW IF EXISTS public.v_applications_with_user_profiles CASCADE;

-- Create comprehensive applications view
CREATE VIEW public.v_applications_with_user_profiles AS
SELECT
  -- All application fields
  a.id,
  a.job_id,
  a.user_id,
  a.status,
  a.current_location,
  a.willing_to_relocate,
  a.years_experience,
  a.is_authorized_to_work,
  a.earliest_start_date,
  a.screening_answers,
  a.custom_question_answers,
  a.attachments,
  a.application_score,
  a.auto_rejected,
  a.auto_reject_reason,
  a.completed_steps,
  a.is_complete,
  a.applied_at,
  a.updated_at,
  
  -- User/Candidate fields (from public.users)
  u.id as candidate_id,
  u.slug as candidate_slug,
  
  -- Profile fields (from public.profiles)
  p.name as candidate_name,
  p.about as profile_about,
  p.avatar_path as profile_avatar_path,
  
  -- Job fields
  j.id as job_id_full,
  j.slug as job_slug,
  j.title as job_title,
  j.employment_type as job_employment_type,
  j.remote_option as job_remote_option,
  j.location as job_location,
  j.status as job_status,
  j.organization_id as job_organization_id
  
FROM public.applications a
LEFT JOIN public.users u ON u.id = a.user_id
LEFT JOIN public.profiles p ON p.id = a.user_id
LEFT JOIN public.jobs j ON j.id = a.job_id;

-- Grant SELECT permissions
GRANT SELECT ON public.v_applications_with_user_profiles TO authenticated;
GRANT SELECT ON public.v_applications_with_user_profiles TO service_role;

-- Add comment
COMMENT ON VIEW public.v_applications_with_user_profiles IS 
  'Comprehensive view of applications with user profiles and job details. 
   Solves the relationship issue between applications table and profiles table.
   Profiles table references auth.users(id) which matches public.users(id).';

COMMIT;
