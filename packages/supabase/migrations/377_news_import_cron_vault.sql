-- =========================================================
-- 377_news_import_cron_vault.sql
--
-- The nightly import-news-articles cron has imported nothing on prod since
-- 2025-11-21: core.cached_news_articles' newest row is from that day, while
-- cron.job_run_details reported "succeeded" every night (#1155 functions
-- audit, 2026-10-16).
--
-- core.import_news_articles (058) read its URL and key from
-- app.settings.supabase_url / app.settings.service_role_key. Those settings do
-- not exist on hosted projects — 337 says so, and moved the notification crons
-- to Vault, but missed this one. So the function raised "Service role key not
-- configured", its own EXCEPTION handler swallowed that, and the cron job
-- succeeded. It also treated net.http_post as synchronous; pg_net is async and
-- returns a request id, so its success/failure branch could never have run,
-- and the core.cron_execution_log it wrote to does not exist either.
--
-- Rewritten on 337's pattern: URL and key from Vault (edge_functions_url,
-- service_role_key — present on all three projects), the old settings kept as
-- the local fallback, fire-and-forget, returns the pg_net request id. The
-- response lands in net._http_response like every other cron call. A missing
-- secret now raises out of the cron job, so cron.job_run_details shows
-- "failed" instead of a false success.
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.import_news_articles()
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

  -- Local stacks have no Vault rows; fall back to the settings 058 used.
  v_base_url := COALESCE(
    NULLIF(v_base_url, ''),
    NULLIF(current_setting('app.settings.supabase_url', true), '') || '/functions/v1'
  );
  v_service_role_key := COALESCE(
    NULLIF(v_service_role_key, ''),
    NULLIF(current_setting('app.settings.service_role_key', true), '')
  );

  IF v_base_url IS NULL OR v_service_role_key IS NULL THEN
    RAISE EXCEPTION 'import_news_articles: Vault secrets edge_functions_url / service_role_key are missing (see 337)';
  END IF;

  SELECT net.http_post(
    url := v_base_url || '/news-import',
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

COMMIT;
