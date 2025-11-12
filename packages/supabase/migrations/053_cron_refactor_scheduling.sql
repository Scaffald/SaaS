-- =========================================================
-- 053_cron_refactor_scheduling.sql
-- Finalises cron refactor by updating enums, helper function,
-- and scheduling SQL-based jobs with monitoring helpers.
--
-- ROLLBACK INSTRUCTIONS:
--   - DROP VIEW IF EXISTS public.v_active_cron_jobs;
--   - DROP FUNCTION IF EXISTS public.notify_admins_of_cron_failure(TEXT, TEXT);
--   - Manually unschedule jobs introduced here (cron.unschedule with job names)
--     and re-run legacy scheduling migrations if needed.
-- =========================================================

BEGIN;

-- =========================================================
-- Ensure notification types cover newly introduced events
-- =========================================================
DO $$
DECLARE
  value TEXT;
  values_to_add TEXT[] := ARRAY[
    'system.cron_failure',
    'profile.completion_reminder',
    'application.status_stale',
    'system.digest_daily',
    'system.digest_weekly'
  ];
BEGIN
  FOREACH value IN ARRAY values_to_add LOOP
    BEGIN
      EXECUTE format('ALTER TYPE core.notification_type ADD VALUE IF NOT EXISTS %L', value);
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END LOOP;
END;
$$;

-- =========================================================
-- Replace stub helper with production implementation
-- =========================================================
CREATE OR REPLACE FUNCTION public.notify_admins_of_cron_failure(
  p_job_name TEXT,
  p_error_message TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, core
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  INSERT INTO core.notifications (
    id,
    user_id,
    type,
    severity,
    title,
    message,
    metadata,
    created_at,
    routed_channels
  )
  SELECT
    gen_random_uuid(),
    u.id,
    'system.cron_failure',
    'critical',
    format('Cron Job Failed: %s', p_job_name),
    p_error_message,
    jsonb_build_object(
      'job_name', p_job_name,
      'error', p_error_message,
      'created_at', NOW()
    ),
    NOW(),
    ARRAY['in_app','email']::core.notification_channel[]
  FROM core.users u
  JOIN core.role_assignments ra ON ra.user_id = u.id
  JOIN core.roles r ON r.id = ra.role_id
  WHERE r.name = 'super_admin'
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.notify_admins_of_cron_failure(TEXT, TEXT) IS
  'Sends critical notifications to super_admin users when cron executions fail.';

-- =========================================================
-- Schedule SQL-based cron jobs via pg_cron
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_available_extensions
    WHERE name = 'pg_cron'
  ) THEN
    RAISE NOTICE 'pg_cron extension not available; skipping schedule.';
    RETURN;
  END IF;

  -- Helper to unschedule a job if it already exists
  PERFORM 1
  FROM cron.job
  WHERE jobname IN (
    'import-external-jobs',
    'notifications-send-worker',
    'notifications-check-receipts',
    'notify-digest-daily',
    'notify-digest-weekly',
    'profile-completion-reminders',
    'update-stale-applications',
    'cleanup-old-notifications',
    'archive-expired-jobs'
  );

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

  PERFORM cron.schedule(
    'import-external-jobs',
    '0 1 * * *',
    'SELECT public.import_external_jobs();'
  );

  PERFORM cron.schedule(
    'notifications-send-worker',
    '*/1 * * * *',
    'SELECT public.process_notification_queue();'
  );

  PERFORM cron.schedule(
    'notifications-check-receipts',
    '*/15 * * * *',
    'SELECT public.check_notification_receipts();'
  );

  PERFORM cron.schedule(
    'notify-digest-daily',
    '0 7 * * *',
    'SELECT public.process_daily_digest();'
  );

  PERFORM cron.schedule(
    'notify-digest-weekly',
    '0 8 * * 1',
    'SELECT public.process_weekly_digest();'
  );

  PERFORM cron.schedule(
    'profile-completion-reminders',
    '0 10 * * 3',
    'SELECT public.send_profile_completion_reminders();'
  );

  PERFORM cron.schedule(
    'update-stale-applications',
    '0 3 * * *',
    'SELECT public.update_stale_applications();'
  );

  PERFORM cron.schedule(
    'cleanup-old-notifications',
    '0 4 * * 0',
    'SELECT public.cleanup_old_notifications();'
  );

  PERFORM cron.schedule(
    'archive-expired-jobs',
    '0 2 * * *',
    'SELECT public.archive_expired_external_jobs();'
  );
END;
$$;

-- =========================================================
-- Monitoring view for active cron jobs
-- =========================================================
CREATE OR REPLACE VIEW public.v_active_cron_jobs AS
SELECT
  jobid,
  jobname,
  schedule,
  command,
  active,
  nodename,
  nodeport,
  database,
  username
FROM cron.job
WHERE active = true
ORDER BY jobname;

GRANT SELECT ON public.v_active_cron_jobs TO authenticated;

COMMENT ON VIEW public.v_active_cron_jobs IS
  'Lists active pg_cron jobs for monitoring and verification.';

DO $$
DECLARE
  v_owner REGROLE;
  v_comment TEXT := 'Managed by pg_cron. Key schedules:
    - import-external-jobs: Daily 1 AM
    - notifications-send-worker: Every minute
    - notifications-check-receipts: Every 15 minutes
    - notify-digest-daily: Daily 7 AM
    - notify-digest-weekly: Mondays 8 AM
    - profile-completion-reminders: Wednesdays 10 AM
    - update-stale-applications: Daily 3 AM
    - cleanup-old-notifications: Sundays 4 AM
    - archive-expired-jobs: Daily 2 AM';
BEGIN
  SELECT nspowner::REGROLE
  INTO v_owner
  FROM pg_namespace
  WHERE nspname = 'cron';

  IF v_owner = current_user::REGROLE THEN
    EXECUTE format('COMMENT ON SCHEMA cron IS %L', v_comment);
  ELSE
    RAISE NOTICE 'Skipping COMMENT ON SCHEMA cron; current user "%" lacks ownership (schema owner: "%").', current_user, v_owner;
  END IF;
END;
$$;

COMMIT;

