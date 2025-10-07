-- =========================================================
-- 056_fix_jobs_service_role_grants.sql
-- Grant necessary permissions to service_role for jobs table
-- =========================================================

BEGIN;

-- Grant all permissions to service_role for jobs table
-- Service role should be able to bypass RLS when needed
GRANT ALL ON public.jobs TO service_role;

-- Also ensure service role has permissions on related tables
GRANT ALL ON public.job_skills TO service_role;

COMMIT;
