-- =========================================================
-- 391_account_deletion_cron.sql
--
-- #1313: run `account-deletion-process` once a day. It carries out worker
-- deletion requests whose 14-day grace period (390) has passed, so a request
-- completes between day 14 and day 15 — inside the 30-day promise, with daily
-- retries for anything that fails (up to 5 attempts, then it waits in the
-- office list at GET /v1/office/account-deletions).
--
-- 377's pattern rather than 362's: the call is wrapped in a function that
-- raises when either Vault secret is missing, so cron.job_run_details shows
-- "failed" instead of a silent success that posted nowhere. URL and key come
-- from Vault at run time (edge_functions_url, service_role_key — seeding
-- instructions in 337), so this migration is identical in every environment
-- and cron.job holds no secret. Local stacks have no Vault rows and fall back
-- to the app.settings 058 used.
--
-- The edge function must be deployed before this matters; until it is, the
-- post 404s and the response is visible in net._http_response.
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.run_account_deletion_processor()
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
    RAISE EXCEPTION 'run_account_deletion_processor: Vault secrets edge_functions_url / service_role_key are missing (see 337)';
  END IF;

  SELECT net.http_post(
    url := v_base_url || '/account-deletion-process',
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

-- It reads the service-role key out of Vault; only cron (postgres) and the
-- service role may run it (#1143).
REVOKE EXECUTE ON FUNCTION core.run_account_deletion_processor()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION core.run_account_deletion_processor() TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron unavailable; skipping account deletion scheduling';
    RETURN;
  END IF;

  CREATE EXTENSION IF NOT EXISTS pg_cron;

  IF EXISTS (SELECT 1 FROM cron.job WHERE cron.job.jobname = 'account-deletion-process') THEN
    PERFORM cron.unschedule('account-deletion-process');
  END IF;

  -- 06:15 UTC: clear of the 02:00 news import and rollups and the 07:00
  -- digests.
  PERFORM cron.schedule(
    'account-deletion-process',
    '15 6 * * *',
    'SELECT core.run_account_deletion_processor();'
  );
END $$;

COMMIT;
