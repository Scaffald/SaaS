-- Fix anonymous user access to external jobs tables

-- Grant SELECT permissions to anon role
GRANT SELECT ON external_jobs TO anon;
GRANT SELECT ON external_job_feeds TO anon;
GRANT SELECT ON external_job_industries TO anon;
GRANT SELECT ON external_job_skills TO anon;

-- Grant SELECT on industries table (needed for joins)
GRANT SELECT ON industries TO anon;

-- Ensure the RLS policies are working correctly
-- Drop and recreate the policies to ensure they're active

DROP POLICY IF EXISTS external_jobs_read_active ON external_jobs;
CREATE POLICY external_jobs_read_active ON external_jobs
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS external_feeds_read_all ON external_job_feeds;
CREATE POLICY external_feeds_read_all ON external_job_feeds
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
