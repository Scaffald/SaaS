-- =========================================================
-- 324_work_logs_rls_inline_access_check.sql
--
-- Fix: end users (authenticated role) could not create work logs via
-- INSERT...RETURNING (or PostgREST `.select()` after insert) because the
-- SELECT/UPDATE RLS policies used `core.can_access_work_log(id)` — a
-- SECURITY DEFINER function that recursively queries `core.work_logs`.
-- When called inside RLS RETURNING evaluation, that function's inner
-- SELECT failed to see the just-inserted row, returning false and
-- causing the RETURNING side-check to reject the row. The error surfaced
-- as `new row violates row-level security policy for table "work_logs"`
-- even though `auth.uid() = user_id` was true.
--
-- Reproduced via psql with `SET LOCAL role TO authenticated; SET LOCAL
-- "request.jwt.claims" ...; INSERT ... RETURNING ...;`
--
-- Found by the dogfood-log session-end script — first end-to-end test of
-- the public create path. See docs/agents/DOGFOODING-BUGS.md.
--
-- Fix: inline the access-check logic into the policies so RLS does not
-- delegate to a SECURITY DEFINER recursive function. The function itself
-- is kept (other call sites may rely on it) but is no longer used by the
-- table's own SELECT/UPDATE policies.
-- =========================================================

BEGIN;

DROP POLICY IF EXISTS work_logs_select_self ON core.work_logs;
DROP POLICY IF EXISTS work_logs_update_self ON core.work_logs;

CREATE POLICY work_logs_select_self
  ON core.work_logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.work_log_collaborators c
      WHERE c.work_log_id = work_logs.id
        AND c.collaborator_user_id = auth.uid()
    )
  );

CREATE POLICY work_logs_update_self
  ON core.work_logs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.work_log_collaborators c
      WHERE c.work_log_id = work_logs.id
        AND c.collaborator_user_id = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.work_log_collaborators c
      WHERE c.work_log_id = work_logs.id
        AND c.collaborator_user_id = auth.uid()
    )
  );

COMMIT;
