-- =========================================================
-- 110_publish_scheduled_jobs_cron.sql
-- Creates a function and cron job to automatically publish
-- jobs that have reached their scheduled_publish_at time
-- =========================================================

BEGIN;

-- =========================================================
-- Function to publish scheduled jobs
-- =========================================================
CREATE OR REPLACE FUNCTION core.publish_scheduled_jobs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_published_count INTEGER := 0;
  v_job_record RECORD;
  v_error_count INTEGER := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Find all draft jobs that are scheduled to be published now or in the past
  FOR v_job_record IN
    SELECT id, title, scheduled_publish_at
    FROM core.jobs
    WHERE status = 'draft'
      AND scheduled_publish_at IS NOT NULL
      AND scheduled_publish_at <= NOW()
    ORDER BY scheduled_publish_at ASC
    FOR UPDATE SKIP LOCKED
  LOOP
    BEGIN
      -- Update job to published status
      UPDATE core.jobs
      SET 
        status = 'open',
        posted_at = COALESCE(scheduled_publish_at, NOW()),
        scheduled_publish_at = NULL,  -- Clear the scheduled time
        updated_at = NOW()
      WHERE id = v_job_record.id;

      v_published_count := v_published_count + 1;

      -- Log successful publication (if logging table exists)
      BEGIN
        INSERT INTO core.cron_execution_log (job_name, status, executed_at, metadata)
        VALUES (
          'publish-scheduled-jobs',
          'success',
          NOW(),
          jsonb_build_object(
            'job_id', v_job_record.id,
            'job_title', v_job_record.title,
            'scheduled_at', v_job_record.scheduled_publish_at
          )
        );
      EXCEPTION WHEN OTHERS THEN
        -- Log table might not exist, ignore
        NULL;
      END;

    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := array_append(v_errors, format('Job %s: %s', v_job_record.id, SQLERRM));

      -- Log error
      BEGIN
        INSERT INTO core.cron_execution_log (job_name, status, error_message, executed_at, metadata)
        VALUES (
          'publish-scheduled-jobs',
          'failed',
          SQLERRM,
          NOW(),
          jsonb_build_object('job_id', v_job_record.id, 'job_title', v_job_record.title)
        );
      EXCEPTION WHEN OTHERS THEN
        NULL;
      END;
    END;
  END LOOP;

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'published', v_published_count,
    'errors', v_error_count,
    'error_details', v_errors
  );
EXCEPTION WHEN OTHERS THEN
  -- Log overall failure
  BEGIN
    INSERT INTO core.cron_execution_log (job_name, status, error_message, executed_at)
    VALUES ('publish-scheduled-jobs', 'failed', SQLERRM, NOW());
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'published', v_published_count
  );
END;
$$;

COMMENT ON FUNCTION core.publish_scheduled_jobs() IS
  'Publishes draft jobs that have reached their scheduled_publish_at time. Updates status to open, sets posted_at, and clears scheduled_publish_at. Runs via cron every minute.';

-- =========================================================
-- Schedule Cron Job
-- Runs every minute to check for scheduled jobs to publish
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
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-jobs') THEN
    PERFORM cron.unschedule('publish-scheduled-jobs');
  END IF;

  -- Schedule to run every minute
  PERFORM cron.schedule(
    'publish-scheduled-jobs',
    '*/1 * * * *',
    'SELECT core.publish_scheduled_jobs();'
  );
END;
$$;

COMMIT;

