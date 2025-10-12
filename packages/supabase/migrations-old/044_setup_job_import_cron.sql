-- =========================================================
-- 044_setup_job_import_cron.sql
-- Sets up pg_cron scheduled jobs for automated import and cleanup
-- =========================================================

BEGIN;

-- =========================================================
-- Enable pg_cron extension
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =========================================================
-- Grant permissions for cron jobs
-- =========================================================
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- =========================================================
-- Schedule: Import external jobs every 3 hours
-- =========================================================
-- Runs at: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
SELECT cron.schedule(
  'import-external-jobs',
  '0 */3 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/job-import-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'source', 'cron',
      'timestamp', NOW()::text
    )
  ) AS request_id;
  $$
);

-- =========================================================
-- Schedule: Archive expired jobs daily at 2:00 AM
-- =========================================================
SELECT cron.schedule(
  'archive-expired-jobs',
  '0 2 * * *',
  $$
  UPDATE external_jobs
  SET 
    is_active = false,
    archived_at = NOW()
  WHERE is_active = true
    AND (
      -- Explicitly expired
      expires_date < NOW()
      -- Or older than 30 days without explicit expiration
      OR (expires_date IS NULL AND posted_date < NOW() - INTERVAL '30 days')
    );
  $$
);

-- =========================================================
-- Schedule: Delete old archived jobs weekly (Sundays at 3:00 AM)
-- =========================================================
SELECT cron.schedule(
  'delete-old-archived-jobs',
  '0 3 * * 0',
  $$
  DELETE FROM external_jobs
  WHERE archived_at IS NOT NULL
    AND archived_at < NOW() - INTERVAL '90 days';
  $$
);

-- =========================================================
-- Schedule: Reset error counts for feeds weekly (Mondays at 1:00 AM)
-- =========================================================
SELECT cron.schedule(
  'reset-feed-error-counts',
  '0 1 * * 1',
  $$
  UPDATE external_job_feeds
  SET 
    error_count = 0,
    last_error = NULL
  WHERE error_count > 0
    AND last_success_at > NOW() - INTERVAL '7 days';
  $$
);

-- =========================================================
-- View active cron jobs
-- =========================================================
CREATE OR REPLACE VIEW v_cron_jobs AS
SELECT
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active,
  jobname
FROM cron.job
WHERE jobname LIKE 'import-%' 
   OR jobname LIKE 'archive-%' 
   OR jobname LIKE 'delete-%'
   OR jobname LIKE 'reset-%'
ORDER BY jobname;

GRANT SELECT ON v_cron_jobs TO authenticated;

-- =========================================================
-- Function to manually trigger job import
-- =========================================================
CREATE OR REPLACE FUNCTION trigger_job_import()
RETURNS JSONB AS $$
DECLARE
  v_response JSONB;
BEGIN
  -- Call the job import orchestrator via HTTP
  SELECT net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/job-import-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'source', 'manual',
      'triggered_by', auth.uid()::text,
      'timestamp', NOW()::text
    )
  ) INTO v_response;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Job import triggered successfully',
    'request_id', v_response
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (will be restricted by RLS in application)
GRANT EXECUTE ON FUNCTION trigger_job_import() TO authenticated;

COMMIT;
