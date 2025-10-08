-- =========================================================
-- 059_grant_jobs_table_access.sql
-- Grant SELECT permissions on jobs table to anon and authenticated roles
-- =========================================================

BEGIN;

-- Grant SELECT on jobs table to anon and authenticated
-- This allows the RLS policies to work properly
GRANT SELECT ON public.jobs TO anon, authenticated;

-- Also grant SELECT on related tables that are joined in queries
GRANT SELECT ON public.organizations TO anon, authenticated;
GRANT SELECT ON public.job_certifications TO anon, authenticated;
GRANT SELECT ON public.job_skills TO anon, authenticated;
GRANT SELECT ON public.certifications TO anon, authenticated;
GRANT SELECT ON public.skills TO anon, authenticated;

COMMIT;
