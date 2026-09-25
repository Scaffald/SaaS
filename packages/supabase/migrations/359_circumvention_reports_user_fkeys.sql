-- =========================================================
-- 359_circumvention_reports_user_fkeys.sql
--
-- Re-point `core.circumvention_reports`' two user foreign keys at
-- `core.users`, so `/office/violations` can load at all (#901).
--
-- `GET /v1/legal-agreements/violation-reports` returned 500 on every request,
-- for every caller including `super_admin`:
--
--   {"error":"Failed to load violation reports: Could not find a relationship
--     between 'circumvention_reports' and 'users' in the schema cache"}
--
-- The list query names its embeds explicitly
-- (`packages/supabase/functions/api/routes/legal-agreements.ts`):
--
--   reported_by:users!circumvention_reports_reported_by_user_id_fkey(...)
--   worker:users!circumvention_reports_worker_user_id_fkey(...)
--
-- Both constraints exist. The difference is what they point AT. Migration 129
-- created the table with three user columns split across two schemas:
--
--   reported_by_user_id UUID REFERENCES auth.users(id)
--   worker_user_id      UUID REFERENCES core.users(id) ON DELETE SET NULL
--   reviewed_by_user_id UUID REFERENCES auth.users(id)
--
-- The request runs against the `core` schema, and PostgREST only resolves
-- embeds within the schemas it exposes — `auth` is not one of them. So
-- `users!..._reported_by_user_id_fkey` has no resolvable target, and the whole
-- select fails, taking the `worker` embed down with it even though that one
-- was always fine.
--
-- `core.users.id` is itself `REFERENCES auth.users(id) ON DELETE CASCADE`, so
-- the two tables share an id space and re-pointing loses nothing.
--
-- A second thing this fixes: the old constraints had no ON DELETE action, so
-- they defaulted to NO ACTION *against auth.users*. Deleting the account of
-- anyone who had ever filed or reviewed a report would fail at that
-- constraint — account deletion (migration 130) blocked by a violation
-- report. ON DELETE SET NULL keeps the report and releases the account: this
-- table is the record of someone trying to take a hire off-platform, and it
-- must outlive the accounts involved.
-- =========================================================

BEGIN;

-- A row pointing at an auth user with no `core.users` row would fail the new
-- constraint. Null those first: the reference is already unresolvable, and the
-- report is the part worth keeping.
UPDATE core.circumvention_reports r
   SET reported_by_user_id = NULL
 WHERE r.reported_by_user_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM core.users u WHERE u.id = r.reported_by_user_id);

UPDATE core.circumvention_reports r
   SET reviewed_by_user_id = NULL
 WHERE r.reviewed_by_user_id IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM core.users u WHERE u.id = r.reviewed_by_user_id);

-- Drop and re-add rather than guard with IF NOT EXISTS: the constraint names
-- already exist, pointing at the wrong table, so an existence check would make
-- this migration a no-op.
ALTER TABLE core.circumvention_reports
  DROP CONSTRAINT IF EXISTS circumvention_reports_reported_by_user_id_fkey;
ALTER TABLE core.circumvention_reports
  ADD CONSTRAINT circumvention_reports_reported_by_user_id_fkey
  FOREIGN KEY (reported_by_user_id)
  REFERENCES core.users(id)
  ON DELETE SET NULL;

ALTER TABLE core.circumvention_reports
  DROP CONSTRAINT IF EXISTS circumvention_reports_reviewed_by_user_id_fkey;
ALTER TABLE core.circumvention_reports
  ADD CONSTRAINT circumvention_reports_reviewed_by_user_id_fkey
  FOREIGN KEY (reviewed_by_user_id)
  REFERENCES core.users(id)
  ON DELETE SET NULL;

-- PostgREST caches the relationship graph; without this it keeps answering
-- "could not find a relationship" until something else restarts it.
NOTIFY pgrst, 'reload schema';

COMMIT;
