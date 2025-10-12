-- =========================================================
-- 045_fix_external_jobs_permissions.sql
-- Comprehensive fix for external jobs table permissions
-- Grants proper access to anon, authenticated, and service_role
-- =========================================================

BEGIN;

-- =========================================================
-- Grant table-level permissions
-- =========================================================

-- External Job Feeds
GRANT SELECT ON external_job_feeds TO anon, authenticated;
GRANT ALL ON external_job_feeds TO service_role;

-- External Jobs
GRANT SELECT ON external_jobs TO anon, authenticated;
GRANT ALL ON external_jobs TO service_role;

-- External Job Industries Junction
GRANT SELECT ON external_job_industries TO anon, authenticated;
GRANT ALL ON external_job_industries TO service_role;

-- External Job Skills Junction  
GRANT SELECT ON external_job_skills TO anon, authenticated;
GRANT ALL ON external_job_skills TO service_role;

-- =========================================================
-- Ensure RLS policies are active and correct
-- =========================================================

-- External Job Feeds policies
DROP POLICY IF EXISTS external_feeds_read_all ON external_job_feeds;
CREATE POLICY external_feeds_read_all ON external_job_feeds
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS external_feeds_admin_full ON external_job_feeds;
CREATE POLICY external_feeds_admin_full ON external_job_feeds
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- External Jobs policies
DROP POLICY IF EXISTS external_jobs_read_active ON external_jobs;
CREATE POLICY external_jobs_read_active ON external_jobs
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS external_jobs_admin_full ON external_jobs;
CREATE POLICY external_jobs_admin_full ON external_jobs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- External Job Industries policies
DROP POLICY IF EXISTS external_job_industries_read ON external_job_industries;
CREATE POLICY external_job_industries_read ON external_job_industries
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS external_job_industries_admin_write ON external_job_industries;
CREATE POLICY external_job_industries_admin_write ON external_job_industries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- External Job Skills policies
DROP POLICY IF EXISTS external_job_skills_read ON external_job_skills;
CREATE POLICY external_job_skills_read ON external_job_skills
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS external_job_skills_admin_write ON external_job_skills;
CREATE POLICY external_job_skills_admin_write ON external_job_skills
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM role_assignments ra
      JOIN roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- =========================================================
-- Grant access to related tables needed for joins
-- =========================================================

-- Industries table (needed for joins in external_job_industries)
GRANT SELECT ON industries TO anon, authenticated;
GRANT ALL ON industries TO service_role;

-- Skills table (needed for joins in external_job_skills)
GRANT SELECT ON skills TO anon, authenticated;
GRANT ALL ON skills TO service_role;

COMMIT;
