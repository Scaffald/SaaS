-- =========================================================
-- 058_news_import_cron.sql
-- Database function and cron job for news import
-- Calls news-import Edge Function via HTTP
--
-- ROLLBACK INSTRUCTIONS:
--   - DROP FUNCTION IF EXISTS core.import_news_articles();
--   - PERFORM cron.unschedule('import-news-articles');
-- =========================================================

BEGIN;

-- Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;

-- =========================================================
-- Import News Articles Function
-- Calls the news-import Edge Function via HTTP
-- =========================================================
CREATE OR REPLACE FUNCTION core.import_news_articles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_result JSONB;
  v_response net.http_response;
  v_supabase_url TEXT;
  v_service_role_key TEXT;
  v_function_url TEXT;
BEGIN
  -- Get Supabase URL and service role key from settings
  v_supabase_url := COALESCE(
    NULLIF(current_setting('app.settings.supabase_url', true), ''),
    NULLIF(current_setting('app.supabase_url', true), ''),
    NULLIF(current_setting('supabase.external_url', true), ''),
    'http://127.0.0.1:54321'
  );
  
  v_service_role_key := COALESCE(
    NULLIF(current_setting('app.settings.service_role_key', true), ''),
    NULLIF(current_setting('app.service_role_key', true), ''),
    ''
  );

  IF v_service_role_key = '' THEN
    RAISE EXCEPTION 'Service role key not configured. Set app.settings.service_role_key or app.service_role_key.';
  END IF;

  v_function_url := v_supabase_url || '/functions/v1/news-import';

  -- Call the Edge Function via HTTP
  SELECT *
    INTO v_response
  FROM net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_service_role_key,
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );

  -- Parse response
  IF v_response.status >= 200 AND v_response.status < 300 THEN
    BEGIN
      v_result := v_response.body::jsonb;
    EXCEPTION WHEN OTHERS THEN
      v_result := jsonb_build_object(
        'success', false,
        'error', 'Failed to parse response: ' || SQLERRM,
        'status', v_response.status
      );
    END;
  ELSE
    v_result := jsonb_build_object(
      'success', false,
      'error', format('HTTP %s: %s', v_response.status, LEFT(v_response.body, 500)),
      'status', v_response.status
    );
  END IF;

  -- Log execution (if cron_execution_log table exists)
  BEGIN
    INSERT INTO core.cron_execution_log (job_name, status, result, executed_at)
    VALUES (
      'import-news-articles',
      CASE WHEN (v_result->>'success')::boolean THEN 'success' ELSE 'failed' END,
      v_result,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Table might not exist, ignore
    NULL;
  END;

  -- Notify admins on failure
  IF NOT (v_result->>'success')::boolean THEN
    PERFORM core.notify_admins_of_cron_failure(
      'import-news-articles',
      COALESCE(v_result->>'error', 'Unknown error')
    );
  END IF;

  RETURN v_result;
EXCEPTION WHEN OTHERS THEN
  -- Log failure and notify admins
  BEGIN
    INSERT INTO core.cron_execution_log (job_name, status, error_message, executed_at)
    VALUES ('import-news-articles', 'failed', SQLERRM, NOW());
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  PERFORM core.notify_admins_of_cron_failure('import-news-articles', SQLERRM);
  
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION core.import_news_articles() IS
  'Calls the news-import Edge Function to fetch and cache RSS news articles. Scheduled to run daily at 2 AM.';

-- =========================================================
-- Schedule News Import Cron Job
-- Runs daily at 2 AM (after external job import at 1 AM)
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

  -- Unschedule if already exists
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'import-news-articles') THEN
    PERFORM cron.unschedule('import-news-articles');
  END IF;

  -- Schedule news import job to run daily at 2 AM
  PERFORM cron.schedule(
    'import-news-articles',
    '0 2 * * *',
    'SELECT core.import_news_articles();'
  );
END;
$$;

COMMIT;

