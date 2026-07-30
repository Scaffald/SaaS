-- 337: Schedule the notification pipeline via pg_cron, configured from Vault.
--
-- Migration 025 tried to schedule these jobs using `supabase.external_url` and
-- `app.service_role_key` settings. Neither setting exists on hosted projects,
-- so in production the DO block quietly scheduled nothing: cron.job had no
-- notification entries and core.notification_deliveries sat empty forever.
-- That silent failure is issue #436.
--
-- This version reads BOTH environment-specific values from Vault at run time,
-- so the migration is identical everywhere and cron.job text contains no
-- secret. Rotating the key or moving the project means updating a Vault row,
-- not re-scheduling jobs. Until both secrets exist the jobs run but the
-- http_post goes nowhere / 401s — inert, and visible in net._http_response.
--
-- Seed per environment (values differ per project):
--
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1',
--     'edge_functions_url', 'Base URL for pg_cron -> edge function calls');
--   select vault.create_secret('<service-role-key>', 'service_role_key',
--     'Service role JWT for pg_cron -> edge function calls');
--
-- The edge functions compare the Bearer to SUPABASE_SERVICE_ROLE_KEY
-- (functions/_shared/notifications/auth.ts), so the Vault value must be that
-- key, not a new random string.

DO $$
DECLARE
  j RECORD;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron unavailable; skipping notification cron scheduling';
    RETURN;
  END IF;

  CREATE EXTENSION IF NOT EXISTS pg_cron;

  FOR j IN
    SELECT * FROM (VALUES
      ('notifications-send-worker',    '*/1 * * * *',  'notify-send-worker'),
      ('notifications-check-receipts', '*/15 * * * *', 'notify-check-receipts'),
      ('notifications-digest-daily',   '0 7 * * *',    'notify-digest-daily'),
      ('notifications-digest-weekly',  '0 8 * * 1',    'notify-digest-weekly'),
      ('notifications-background-check-expiration', '30 7 * * *', 'notify-background-check-expiration'),
      ('notifications-id-verification-expiration',  '45 7 * * *', 'notify-id-verification-expiration')
    ) AS t(jobname, schedule, fn)
  LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE cron.job.jobname = j.jobname) THEN
      PERFORM cron.unschedule(j.jobname);
    END IF;

    PERFORM cron.schedule(
      j.jobname,
      j.schedule,
      format($cmd$
        SELECT net.http_post(
          url := (
            SELECT decrypted_secret FROM vault.decrypted_secrets
            WHERE name = 'edge_functions_url' LIMIT 1
          ) || %L,
          headers := jsonb_build_object(
            'Authorization', 'Bearer ' || (
              SELECT decrypted_secret FROM vault.decrypted_secrets
              WHERE name = 'service_role_key' LIMIT 1
            ),
            'Content-Type', 'application/json'
          ),
          body := jsonb_build_object('source', 'pg_cron', 'timestamp', NOW()::text),
          timeout_milliseconds := 55000
        );
      $cmd$, '/' || j.fn)
    );
  END LOOP;
END $$;
