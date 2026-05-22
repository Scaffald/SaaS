-- =========================================================
-- 328_relocate_cron_functions_to_core.sql
-- SC-68: relocate the 13 cron-refactor functions from public to core.
--
-- Background:
--   The 2026-05-22 SC-67 records-only catch-up surfaced a pre-existing
--   legacy drift. Migrations 051/052/053 define these functions in the
--   `core` schema, but on dev + prod they were created in `public`
--   (likely by an earlier deploy path). Preview already has them in core.
--
-- Strategy:
--   For each of the 13 function names, look up any matching definitions
--   in `public` via pg_proc. If no corresponding `core.X(args)` exists,
--   `ALTER FUNCTION ... SET SCHEMA core` to move it. If `core.X(args)`
--   already exists (e.g. on preview), drop the stale `public.X(args)`
--   copy — `core` is canonical per the migrations.
--
--   Idempotent: re-running on an env where all 13 are already in core
--   is a no-op.
--
--   Defensive: re-schedule pg_cron jobs to call `core.X(...)` (matches
--   migration 053) if any current cron command still references public.
--
-- ROLLBACK INSTRUCTIONS:
--   For each affected function, run the inverse:
--     ALTER FUNCTION core.<name>(<args>) SET SCHEMA public;
--   Then re-run the pg_cron schedule block from migration 053, replacing
--   `core.` with `public.` in each PERFORM cron.schedule(...) call.
--   Do not roll back unless you have first confirmed that no other code
--   has started qualifying these calls as `core.*`.
-- =========================================================

BEGIN;

DO $$
DECLARE
  v_func_names TEXT[] := ARRAY[
    'archive_expired_external_jobs',
    'calculate_next_attempt',
    'check_notification_receipts',
    'cleanup_old_notifications',
    'import_external_jobs',
    'map_job_to_industry',
    'notify_admins_of_cron_failure',
    'process_daily_digest',
    'process_notification_queue',
    'process_weekly_digest',
    'record_delivery_event',
    'send_profile_completion_reminders',
    'update_stale_applications'
  ];
  v_func_name TEXT;
  r RECORD;
  v_moved INTEGER := 0;
  v_dropped INTEGER := 0;
BEGIN
  FOREACH v_func_name IN ARRAY v_func_names LOOP
    FOR r IN
      SELECT
        p.proname AS func_name,
        pg_get_function_identity_arguments(p.oid) AS args
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = v_func_name
    LOOP
      IF NOT EXISTS (
        SELECT 1
        FROM pg_proc p2
        JOIN pg_namespace n2 ON n2.oid = p2.pronamespace
        WHERE n2.nspname = 'core'
          AND p2.proname = r.func_name
          AND pg_get_function_identity_arguments(p2.oid) = r.args
      ) THEN
        EXECUTE format(
          'ALTER FUNCTION public.%I(%s) SET SCHEMA core',
          r.func_name,
          r.args
        );
        v_moved := v_moved + 1;
        RAISE NOTICE 'SC-68: moved public.%(%) → core', r.func_name, r.args;
      ELSE
        EXECUTE format(
          'DROP FUNCTION public.%I(%s)',
          r.func_name,
          r.args
        );
        v_dropped := v_dropped + 1;
        RAISE NOTICE 'SC-68: dropped duplicate public.%(%) (core copy is canonical)', r.func_name, r.args;
      END IF;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'SC-68 summary: moved=%, dropped=%', v_moved, v_dropped;
END;
$$;

-- =========================================================
-- Defensive re-schedule of pg_cron jobs.
--
-- If any current cron.job entry still references one of our 13 functions
-- as `public.X(...)`, re-create the schedule block from migration 053
-- using `core.X(...)`. Idempotent: skips entirely if no stale references
-- are found and pg_cron is unavailable.
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    RAISE NOTICE 'SC-68: pg_cron extension not available; skipping re-schedule.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE command ~ 'public\.(archive_expired_external_jobs|calculate_next_attempt|check_notification_receipts|cleanup_old_notifications|import_external_jobs|map_job_to_industry|notify_admins_of_cron_failure|process_daily_digest|process_notification_queue|process_weekly_digest|record_delivery_event|send_profile_completion_reminders|update_stale_applications)\s*\('
  ) THEN
    RAISE NOTICE 'SC-68: no stale public.* cron commands; re-schedule skipped.';
    RETURN;
  END IF;

  -- Unschedule existing jobs by name (mirrors migration 053).
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'import-external-jobs') THEN
    PERFORM cron.unschedule('import-external-jobs');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notifications-send-worker') THEN
    PERFORM cron.unschedule('notifications-send-worker');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notifications-check-receipts') THEN
    PERFORM cron.unschedule('notifications-check-receipts');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-digest-daily') THEN
    PERFORM cron.unschedule('notify-digest-daily');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'notify-digest-weekly') THEN
    PERFORM cron.unschedule('notify-digest-weekly');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'profile-completion-reminders') THEN
    PERFORM cron.unschedule('profile-completion-reminders');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'update-stale-applications') THEN
    PERFORM cron.unschedule('update-stale-applications');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup-old-notifications') THEN
    PERFORM cron.unschedule('cleanup-old-notifications');
  END IF;
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'archive-expired-jobs') THEN
    PERFORM cron.unschedule('archive-expired-jobs');
  END IF;

  PERFORM cron.schedule('import-external-jobs',          '0 1 * * *',   'SELECT core.import_external_jobs();');
  PERFORM cron.schedule('notifications-send-worker',     '*/1 * * * *', 'SELECT core.process_notification_queue();');
  PERFORM cron.schedule('notifications-check-receipts',  '*/15 * * * *','SELECT core.check_notification_receipts();');
  PERFORM cron.schedule('notify-digest-daily',           '0 7 * * *',   'SELECT core.process_daily_digest();');
  PERFORM cron.schedule('notify-digest-weekly',          '0 8 * * 1',   'SELECT core.process_weekly_digest();');
  PERFORM cron.schedule('profile-completion-reminders',  '0 10 * * 3',  'SELECT core.send_profile_completion_reminders();');
  PERFORM cron.schedule('update-stale-applications',     '0 3 * * *',   'SELECT core.update_stale_applications();');
  PERFORM cron.schedule('cleanup-old-notifications',     '0 4 * * 0',   'SELECT core.cleanup_old_notifications();');
  PERFORM cron.schedule('archive-expired-jobs',          '0 2 * * *',   'SELECT core.archive_expired_external_jobs();');

  RAISE NOTICE 'SC-68: re-scheduled pg_cron jobs to use core.* function references.';
END;
$$;

COMMIT;
