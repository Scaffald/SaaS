-- =========================================================
-- 392_jobs_read_policy.sql
--
-- #1317: core.jobs was readable by anyone. `jobs_read` (005_policies.sql) is
-- `FOR SELECT TO anon, authenticated USING (true)`, so the public anon key read
-- every draft, paused and confidential posting straight out of PostgREST — the
-- api's status and `is_confidential` filters were the only thing hiding them,
-- and PostgREST serves `core` directly.
--
-- Replaced by two SELECT policies (permissive, so OR'ed):
--
--   jobs_read_public  anon + authenticated. What the public api serves:
--                     status open or closed, and not confidential. Closed is
--                     included because GET /v1/jobs/{id} has no status filter
--                     and job detail pages of filled roles stay linkable.
--                     `is_confidential` is nullable (142), hence IS NOT TRUE.
--                     `visibility` is deliberately not read: prod has the
--                     column and a fresh migrate may not (see jobs.ts).
--
--   jobs_read_scoped  authenticated. Every row of a job the caller
--                     - belongs to the organisation of: owner, or any
--                       role_assignments row scoped to it. Any org role, not
--                       admin-only: a job posting is not applicant PII, and
--                       this is the same "org member" rule is_org_member and
--                       the inquiry policies use. application-access.ts
--                       narrows to admin only for pipeline PII (#1316);
--                     - is platform staff for: office or super_admin, the
--                       userHasPlatformRole rule;
--                     - applied to: an applicant keeps reading the job after
--                       it is paused, closed or drafted again, because their
--                       applications list embeds it (applications.ts).
--
-- The three lookups are SECURITY DEFINER helpers. core.applications' own read
-- policy queries core.jobs, so reading applications from a jobs policy as the
-- caller would recurse; the helpers read as their owner instead. They return
-- the caller's own org ids / applied job ids / staff flag, wrapped in
-- `(select …)` so Postgres evaluates each once per statement, not per row.
--
-- Every other policy that sub-selects core.jobs (applications, inquiries,
-- messages, job_certifications, storage application-attachments) does so to
-- find the caller's own organisation's jobs, which jobs_read_scoped keeps
-- visible to them.
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.current_user_job_org_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT o.id
  FROM core.organizations o
  WHERE o.owner_user_id = auth.uid()
  UNION
  SELECT ra.scope_org_id
  FROM core.role_assignments ra
  WHERE ra.user_id = auth.uid()
    AND ra.scope_org_id IS NOT NULL;
$function$;

COMMENT ON FUNCTION core.current_user_job_org_ids() IS
  'Organisations whose jobs the caller may read in full: owned, or holding any org-scoped role (#1317). RLS helper for core.jobs.';

CREATE OR REPLACE FUNCTION core.current_user_is_platform_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM core.role_assignments ra
    JOIN core.roles r ON r.id = ra.role_id
    WHERE ra.user_id = auth.uid()
      AND r.scope = 'platform'
      AND r.name IN ('office', 'super_admin')
  );
$function$;

COMMENT ON FUNCTION core.current_user_is_platform_staff() IS
  'True when the caller holds the platform office or super_admin role — the SQL twin of userHasPlatformRole (#1317).';

CREATE OR REPLACE FUNCTION core.current_user_applied_job_ids()
 RETURNS SETOF uuid
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT a.job_id
  FROM core.applications a
  WHERE a.user_id = auth.uid();
$function$;

COMMENT ON FUNCTION core.current_user_applied_job_ids() IS
  'Jobs the caller has applied to, whatever their status now (#1317). RLS helper for core.jobs.';

-- Only the authenticated policy calls them. Postgres grants EXECUTE to PUBLIC
-- on create; anon has no use for them (.radium/supabase-backend.md).
REVOKE EXECUTE ON FUNCTION core.current_user_job_org_ids() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION core.current_user_is_platform_staff() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION core.current_user_applied_job_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION core.current_user_job_org_ids() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION core.current_user_is_platform_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION core.current_user_applied_job_ids() TO authenticated, service_role;

DROP POLICY IF EXISTS jobs_read ON core.jobs;
DROP POLICY IF EXISTS jobs_read_public ON core.jobs;
DROP POLICY IF EXISTS jobs_read_scoped ON core.jobs;

CREATE POLICY jobs_read_public ON core.jobs
  FOR SELECT TO anon, authenticated
  USING (status IN ('open', 'closed') AND is_confidential IS NOT TRUE);

CREATE POLICY jobs_read_scoped ON core.jobs
  FOR SELECT TO authenticated
  USING (
    (SELECT core.current_user_is_platform_staff())
    OR organization_id IN (SELECT core.current_user_job_org_ids())
    OR id IN (SELECT core.current_user_applied_job_ids())
  );

COMMIT;
