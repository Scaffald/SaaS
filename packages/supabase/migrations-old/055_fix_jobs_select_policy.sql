-- =========================================================
-- 055_fix_jobs_select_policy.sql
-- Add missing SELECT policy for jobs table
-- =========================================================

BEGIN;

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "jobs_select" ON public.jobs;

-- Create comprehensive SELECT policy for jobs
CREATE POLICY "jobs_select"
  ON public.jobs FOR SELECT
  TO anon, authenticated
  USING (
    -- Public can view published jobs (status = 'open')
    status = 'open'
    -- OR organization owner can view all their jobs
    OR EXISTS (
      SELECT 1 FROM public.organizations o 
      WHERE o.id = public.jobs.organization_id AND o.owner_user_id = auth.uid()
    )
    -- OR platform admin can view all jobs
    OR EXISTS (
      SELECT 1 FROM public.role_assignments ra
      JOIN public.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND r.scope = 'platform'
        AND r.name IN ('admin', 'super_admin')
    )
  );

COMMIT;
