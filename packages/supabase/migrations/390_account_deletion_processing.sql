-- =========================================================
-- 390_account_deletion_processing.sql
--
-- #1313: a deletion request was recorded and never carried out. The API wrote
-- a 'pending' core.account_deletions row and nothing ever read it again, while
-- Settings and the Support FAQ promised completion within 30 days.
--
-- This migration gives the new `account-deletion-process` function (scheduled
-- by 391) what it needs, and removes the foreign keys that would have made
-- the delete itself fail:
--
--   1. account_deletions gains a schedule (14-day grace period, decided by
--      Clay 2026-10-18), a cancel, and retry bookkeeping.
--   2. Every NO ACTION reference to a user becomes SET NULL, or CASCADE where
--      the row means nothing without that person. Each is justified below.
--   3. inquiry_audit_log.actor_id was NOT NULL with ON DELETE SET NULL, so
--      deleting anyone who had ever acted on an inquiry raised.
--   4. Three service-only helpers: claim due requests, list a user's storage
--      objects, and purge the rows that carry a user id with no foreign key.
--
-- What it deliberately does NOT change: the RESTRICT references (tasks,
-- punchlists, organization documents / versions / shares / folders,
-- organization locations, projects.created_by). Those are content other
-- people depend on, and the office delete route already treats them as
-- "reassign first" blockers (409). The processor reports them the same way —
-- the request is marked failed with the blocking tables named and nothing is
-- written — and the office list (GET /v1/office/account-deletions) shows it.
--
-- Retention (pending legal confirmation) is NOT decided here. Which rows are
-- kept but detached is core.anonymize_worker_payment_data (095); which buckets
-- are kept is functions/_shared/account-deletion/policy.ts.
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- 1. account_deletions: schedule, cancel, retries
-- ---------------------------------------------------------

-- The grace period, in one place. The insert trigger below is the only
-- reader; the API does not compute the date, so changing this is the whole
-- change.
CREATE OR REPLACE FUNCTION core.account_deletion_grace_period()
RETURNS interval
LANGUAGE sql
IMMUTABLE
SET search_path = ''
AS $$
  SELECT interval '14 days'
$$;

COMMENT ON FUNCTION core.account_deletion_grace_period()
  IS 'Grace period between a deletion request and the processor acting on it (#1313). Must stay well inside the 30-day promise in Settings, the FAQ and the privacy policy.';

ALTER TABLE core.account_deletions
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

-- Every environment's table was empty when this was written (checked
-- 2026-10-17), but backfill anyway so the NOT NULL below cannot fail.
UPDATE core.account_deletions
   SET scheduled_for = requested_at + core.account_deletion_grace_period()
 WHERE scheduled_for IS NULL;

ALTER TABLE core.account_deletions
  ALTER COLUMN scheduled_for SET NOT NULL;

COMMENT ON COLUMN core.account_deletions.scheduled_for
  IS 'When the processor may act: requested_at + core.account_deletion_grace_period(). Set by trigger, never by the client.';
COMMENT ON COLUMN core.account_deletions.attempts
  IS 'Processor runs that claimed this row. The processor stops retrying at 5; the office list shows what is left.';

ALTER TABLE core.account_deletions
  DROP CONSTRAINT IF EXISTS account_deletions_status_check;
ALTER TABLE core.account_deletions
  ADD CONSTRAINT account_deletions_status_check
  CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'partial', 'cancelled'));

-- One open request per worker, so a double-tap or a retry of the POST cannot
-- queue two. The route answers with the open one instead.
CREATE UNIQUE INDEX IF NOT EXISTS account_deletions_one_open_per_user
  ON core.account_deletions (deleted_user_id)
  WHERE deletion_type = 'worker'
    AND deleted_user_id IS NOT NULL
    AND status IN ('pending', 'in_progress', 'failed', 'partial');

CREATE INDEX IF NOT EXISTS account_deletions_due_idx
  ON core.account_deletions (scheduled_for)
  WHERE status IN ('pending', 'in_progress', 'failed', 'partial');

-- The insert policy (130) lets a signed-in worker write their own row through
-- PostgREST. Without this, that path could choose its own scheduled_for (or
-- status) and skip the grace period — and the cancel window with it. Only the
-- service role, i.e. the API and the processor, may set these.
CREATE OR REPLACE FUNCTION core.account_deletions_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user NOT IN ('service_role', 'postgres', 'supabase_admin') THEN
    NEW.requested_at := now();
    NEW.requested_by_user_id := auth.uid();
    NEW.status := 'pending';
    NEW.scheduled_for := NULL;
    NEW.cancelled_at := NULL;
    NEW.completed_at := NULL;
    NEW.attempts := 0;
    NEW.last_attempt_at := NULL;
    NEW.payment_data_anonymized := false;
    NEW.compliance_log := '{}'::jsonb;
  END IF;

  NEW.requested_at := COALESCE(NEW.requested_at, now());
  NEW.scheduled_for := COALESCE(
    NEW.scheduled_for,
    NEW.requested_at + core.account_deletion_grace_period()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS account_deletions_before_insert ON core.account_deletions;
CREATE TRIGGER account_deletions_before_insert
  BEFORE INSERT ON core.account_deletions
  FOR EACH ROW EXECUTE FUNCTION core.account_deletions_before_insert();

-- ---------------------------------------------------------
-- 2. References that would block deleting a user
-- ---------------------------------------------------------
--
-- Re-created by looking the constraint up rather than by name, because the
-- names were generated and an environment that skipped a migration (306 and
-- 310 were recorded and never run on prod, #1146) must not fail here. A
-- table or column that does not exist is skipped with a NOTICE.
--
-- SET NULL — the row belongs to someone else (an organization, a hiring
-- project, an audit trail) and only records who acted. Once that person is
-- gone, null is the honest value:
--   account_deletions.requested_by_user_id   the request outlives its requester;
--                                             for a worker it IS the subject, so
--                                             without this the delete failed on
--                                             its own request row
--   organization_payment_methods.created_by  the org's card
--   credit_ledger.created_by                 the org's ledger
--   hire_agreements.agreed_by_user_id        retained hire record (095 retention)
--   api_keys.created_by                      the org's key keeps working
--   public.webhooks.created_by / updated_by  the org's webhook
--   application_activity.actor_user_id       the employer's pipeline history
--   privacy_data_requests.processed_by       the staff member who handled it
--   eeo_reports.generated_by                 aggregate report, no subject
--   hiring_projects.created_by               the org's project
--   hiring_project_crew.assigned_by          who assigned, not who was assigned
--   interview_slots.proposed_by              the org's slot (other candidates
--                                             may hold bookings on it)
--   scheduling_links.created_by              the org's booking link
--   hris_connections.created_by              the org's integration
--   background_check_providers.created_by    the org's provider config
--   user_skills.verified_by,                 verification pointers; the office
--   work_logs.verified_by_user_id,           route already nulls these by hand
--   skill_evidence.verified_by               (it keeps doing so — harmless)
--
-- CASCADE — the row is the deleted person's own data and means nothing
-- without them:
--   hiring_project_crew.user_id              their place on a crew
--   interview_bookings.candidate_id          their interview booking
DO $$
DECLARE
  r RECORD;
  v_con RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('core',   'account_deletions',            'requested_by_user_id', 'SET NULL', false),
      ('core',   'organization_payment_methods', 'created_by',           'SET NULL', false),
      ('core',   'credit_ledger',                'created_by',           'SET NULL', false),
      ('core',   'hire_agreements',              'agreed_by_user_id',    'SET NULL', false),
      ('core',   'api_keys',                     'created_by',           'SET NULL', true),
      ('public', 'webhooks',                     'created_by',           'SET NULL', false),
      ('public', 'webhooks',                     'updated_by',           'SET NULL', false),
      ('core',   'application_activity',         'actor_user_id',        'SET NULL', false),
      ('core',   'privacy_data_requests',        'processed_by',         'SET NULL', false),
      ('core',   'eeo_reports',                  'generated_by',         'SET NULL', false),
      ('core',   'hiring_projects',              'created_by',           'SET NULL', false),
      ('core',   'hiring_project_crew',          'assigned_by',          'SET NULL', false),
      ('core',   'hiring_project_crew',          'user_id',              'CASCADE',  false),
      ('core',   'interview_slots',              'proposed_by',          'SET NULL', true),
      ('core',   'interview_bookings',           'candidate_id',         'CASCADE',  false),
      ('core',   'scheduling_links',             'created_by',           'SET NULL', true),
      ('core',   'hris_connections',             'created_by',           'SET NULL', false),
      ('core',   'background_check_providers',   'created_by',           'SET NULL', false),
      ('core',   'user_skills',                  'verified_by',          'SET NULL', false),
      ('core',   'work_logs',                    'verified_by_user_id',  'SET NULL', false),
      ('core',   'skill_evidence',               'verified_by',          'SET NULL', false)
    ) AS t(schema_name, table_name, column_name, on_delete, drop_not_null)
  LOOP
    IF to_regclass(format('%I.%I', r.schema_name, r.table_name)) IS NULL THEN
      RAISE NOTICE '390: %.% does not exist; skipped', r.schema_name, r.table_name;
      CONTINUE;
    END IF;

    SELECT c.conname, c.confrelid::regclass AS target, c.confdeltype
      INTO v_con
      FROM pg_constraint c
      JOIN pg_attribute a
        ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
     WHERE c.contype = 'f'
       AND c.conrelid = format('%I.%I', r.schema_name, r.table_name)::regclass
       AND a.attname = r.column_name
       AND array_length(c.conkey, 1) = 1
       AND c.confrelid IN ('auth.users'::regclass, 'core.users'::regclass)
     LIMIT 1;

    IF NOT FOUND THEN
      RAISE NOTICE '390: no user foreign key on %.%.%; skipped',
        r.schema_name, r.table_name, r.column_name;
      CONTINUE;
    END IF;

    IF r.drop_not_null THEN
      EXECUTE format('ALTER TABLE %I.%I ALTER COLUMN %I DROP NOT NULL',
        r.schema_name, r.table_name, r.column_name);
    END IF;

    EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I',
      r.schema_name, r.table_name, v_con.conname);
    EXECUTE format(
      'ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES %s(id) ON DELETE %s',
      r.schema_name, r.table_name, v_con.conname, r.column_name, v_con.target, r.on_delete);
  END LOOP;
END $$;

-- ---------------------------------------------------------
-- 3. inquiry_audit_log.actor_id: NOT NULL contradicted its ON DELETE SET NULL
-- ---------------------------------------------------------
-- The audit row (what happened to the inquiry) is kept; who did it becomes
-- unknown once that person is deleted.
DO $$
BEGIN
  IF to_regclass('core.inquiry_audit_log') IS NOT NULL THEN
    ALTER TABLE core.inquiry_audit_log ALTER COLUMN actor_id DROP NOT NULL;
  END IF;
END $$;

-- ---------------------------------------------------------
-- 4. Service-only helpers for the processor
-- ---------------------------------------------------------

-- Claim due requests, one transaction, so two concurrent runs (a cron tick
-- overlapping a manual invoke) never take the same row. A row left
-- 'in_progress' by a run that died is reclaimed after p_stale.
--
-- Organization requests are not claimed: deleting an organization needs
-- decisions this path does not make (its members, its Stripe customer, its
-- documents). They stay 'pending' and the office list flags them for manual
-- handling (#1313).
--
-- p_ids narrows the claim to named requests: an operator re-running one
-- request, and the gated test, which must not act on anyone else's row in a
-- shared local database.
CREATE OR REPLACE FUNCTION core.claim_due_account_deletions(
  p_limit INTEGER DEFAULT 1,
  p_max_attempts INTEGER DEFAULT 5,
  p_stale INTERVAL DEFAULT interval '1 hour',
  p_retry_after INTERVAL DEFAULT interval '12 hours',
  p_ids UUID[] DEFAULT NULL
)
RETURNS SETOF core.account_deletions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  UPDATE core.account_deletions d
     SET status = 'in_progress',
         attempts = d.attempts + 1,
         last_attempt_at = now()
   WHERE d.id IN (
     SELECT x.id
       FROM core.account_deletions x
      WHERE x.deletion_type = 'worker'
        AND x.cancelled_at IS NULL
        AND x.scheduled_for <= now()
        AND x.attempts < p_max_attempts
        AND (p_ids IS NULL OR x.id = ANY (p_ids))
        AND (
          x.status = 'pending'
          -- A retry waits: without this the run that just marked a row
          -- failed would claim it straight back and spend every attempt in
          -- one go. Under the daily cron this means "retry tomorrow".
          OR (x.status IN ('failed', 'partial')
              AND (x.last_attempt_at IS NULL OR x.last_attempt_at < now() - p_retry_after))
          OR (x.status = 'in_progress' AND x.last_attempt_at < now() - p_stale)
        )
      ORDER BY x.scheduled_for
      LIMIT GREATEST(p_limit, 0)
      FOR UPDATE SKIP LOCKED
   )
  RETURNING d.*;
END;
$$;

-- Every object a user owns in the given buckets: under their {uid}/ folder,
-- which is how every user-keyed bucket's insert policy lays them out, or
-- uploaded by them. Read here because the Storage API can only list one
-- folder level at a time; the files themselves are removed through the API.
CREATE OR REPLACE FUNCTION core.account_deletion_storage_objects(
  p_user_id UUID,
  p_buckets TEXT[]
)
RETURNS TABLE (bucket_id TEXT, name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT o.bucket_id, o.name
    FROM storage.objects o
   WHERE o.bucket_id = ANY (p_buckets)
     AND (
       (storage.foldername(o.name))[1] = p_user_id::text
       OR o.owner_id = p_user_id::text
     )
   ORDER BY o.bucket_id, o.name
$$;

-- Rows that carry a user's id or contact details with no foreign key, so the
-- auth delete cascades past them:
--   archived_notifications  the user's own notifications, archived (052)
--   inquiry_comments.read_by a uuid[] of readers
--   organization_audit_log.actor_email  detached with actor_user_id by the
--                           FK's SET NULL, but the email column stayed behind
-- Returns counts only.
CREATE OR REPLACE FUNCTION core.account_deletion_purge_unlinked(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_archived INTEGER := 0;
  v_read_by INTEGER := 0;
  v_audit INTEGER := 0;
BEGIN
  IF to_regclass('core.archived_notifications') IS NOT NULL THEN
    DELETE FROM core.archived_notifications WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_archived = ROW_COUNT;
  END IF;

  IF to_regclass('core.inquiry_comments') IS NOT NULL THEN
    UPDATE core.inquiry_comments
       SET read_by = array_remove(read_by, p_user_id)
     WHERE p_user_id = ANY (read_by);
    GET DIAGNOSTICS v_read_by = ROW_COUNT;
  END IF;

  IF to_regclass('core.organization_audit_log') IS NOT NULL THEN
    UPDATE core.organization_audit_log
       SET actor_email = NULL
     WHERE actor_user_id = p_user_id
       AND actor_email IS NOT NULL;
    GET DIAGNOSTICS v_audit = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'archived_notifications_deleted', v_archived,
    'inquiry_comment_reads_removed', v_read_by,
    'organization_audit_emails_cleared', v_audit
  );
END;
$$;

-- Postgres grants EXECUTE to PUBLIC on create; these are processor-only
-- (.radium/supabase-backend.md, #1143).
REVOKE EXECUTE ON FUNCTION core.claim_due_account_deletions(INTEGER, INTEGER, INTERVAL, INTERVAL, UUID[])
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION core.account_deletion_storage_objects(UUID, TEXT[])
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION core.account_deletion_purge_unlinked(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION core.claim_due_account_deletions(INTEGER, INTEGER, INTERVAL, INTERVAL, UUID[])
  TO service_role;
GRANT EXECUTE ON FUNCTION core.account_deletion_storage_objects(UUID, TEXT[])
  TO service_role;
GRANT EXECUTE ON FUNCTION core.account_deletion_purge_unlinked(UUID)
  TO service_role;

-- The trigger function runs as the inserting role; it needs nothing granted
-- (trigger execution is not EXECUTE-checked), and nobody should call it.
REVOKE EXECUTE ON FUNCTION core.account_deletions_before_insert()
  FROM PUBLIC, anon, authenticated;

-- Read by the insert trigger as whichever role inserts: the API (service
-- role) and a signed-in worker through the 130 insert policy. Never anon.
REVOKE EXECUTE ON FUNCTION core.account_deletion_grace_period()
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION core.account_deletion_grace_period()
  TO authenticated, service_role;

-- anonymize_worker_payment_data (095) is called by the processor through
-- PostgREST. It is SECURITY INVOKER, so a client calling it could only touch
-- rows its own RLS allows — but nothing client-side has a reason to call it.
REVOKE EXECUTE ON FUNCTION core.anonymize_worker_payment_data(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION core.anonymize_worker_payment_data(UUID)
  TO service_role;

COMMIT;
