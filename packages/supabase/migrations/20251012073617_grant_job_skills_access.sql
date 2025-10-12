-- Grant SELECT access to job_skills table for public job queries
-- Anonymous and authenticated users need to read job skills for job listings

BEGIN;

-- Grant SELECT on job_skills for anon and authenticated users
GRANT SELECT ON job_skills TO anon;
GRANT SELECT ON job_skills TO authenticated;

-- Service role should already have ALL privileges, but ensure it's explicit
GRANT ALL ON job_skills TO service_role;

COMMIT;
