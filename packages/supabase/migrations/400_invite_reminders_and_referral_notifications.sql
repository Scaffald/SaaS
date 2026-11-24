-- 400: invite reminders and "your friend joined" notifications (#1397)
--
-- 1. Two notification types for inviters:
--      referral.joined     someone signed up from your invite
--      referral.onboarded  they finished setting up their profile
--    Written by the api (POST /v1/invites/claim, POST /v1/prerequisites/
--    complete) through _shared/invites/notify.ts.
-- 2. A daily pg_cron job that calls the invites-remind function, which sends
--    the one reminder an email invite gets five days after it went out
--    (_shared/invites/reminders.ts). Same shape as 391's account-deletion
--    job: Vault secrets edge_functions_url / service_role_key (337).
--
-- ALTER TYPE ... ADD VALUE runs outside the transaction below, because a
-- value added inside a transaction can't be used until it commits.

DO $$
DECLARE
  value TEXT;
  values_to_add TEXT[] := ARRAY['referral.joined', 'referral.onboarded'];
BEGIN
  FOREACH value IN ARRAY values_to_add LOOP
    BEGIN
      EXECUTE format('ALTER TYPE core.notification_type ADD VALUE IF NOT EXISTS %L', value);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END;
$$;

BEGIN;

CREATE OR REPLACE FUNCTION core.run_invite_reminders()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = core, public, extensions
AS $function$
DECLARE
  v_base_url TEXT;
  v_service_role_key TEXT;
  v_request_id BIGINT;
BEGIN
  SELECT decrypted_secret INTO v_base_url
    FROM vault.decrypted_secrets WHERE name = 'edge_functions_url' LIMIT 1;
  SELECT decrypted_secret INTO v_service_role_key
    FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;

  v_base_url := COALESCE(
    NULLIF(v_base_url, ''),
    NULLIF(current_setting('app.settings.supabase_url', true), '') || '/functions/v1'
  );
  v_service_role_key := COALESCE(
    NULLIF(v_service_role_key, ''),
    NULLIF(current_setting('app.settings.service_role_key', true), '')
  );

  IF v_base_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE EXCEPTION 'run_invite_reminders: Vault secrets edge_functions_url / service_role_key are missing (see 337)';
  END IF;

  SELECT net.http_post(
    url := v_base_url || '/invites-remind',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_service_role_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('source', 'pg_cron', 'timestamp', NOW()::text),
    timeout_milliseconds := 55000
  ) INTO v_request_id;

  RETURN jsonb_build_object('request_id', v_request_id);
END;
$function$;

REVOKE EXECUTE ON FUNCTION core.run_invite_reminders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION core.run_invite_reminders() TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron unavailable; skipping invite reminder scheduling';
    RETURN;
  END IF;

  CREATE EXTENSION IF NOT EXISTS pg_cron;

  IF EXISTS (SELECT 1 FROM cron.job WHERE cron.job.jobname = 'invites-remind') THEN
    PERFORM cron.unschedule('invites-remind');
  END IF;

  -- 15:00 UTC: mid-morning across US time zones, when a reminder is most
  -- likely to be read; clear of the 06:15 deletion job and 07:00 digests.
  PERFORM cron.schedule(
    'invites-remind',
    '0 15 * * *',
    'SELECT core.run_invite_reminders();'
  );
END $$;

COMMIT;
