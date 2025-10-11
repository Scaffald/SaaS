-- =========================================================
-- 091_fix_user_skills_service_role_grants.sql
-- Grant service_role full access to user_skills table
-- =========================================================

BEGIN;

-- Grant all privileges to service_role on user_skills
GRANT ALL ON public.user_skills TO service_role;

-- Ensure authenticated users can access their own skills
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_skills TO authenticated;

COMMIT;
