-- =========================================================
-- 20251113211652_restore_cascade_dropped_objects.sql
-- Restores objects that were dropped due to CASCADE in migration 054
-- =========================================================

BEGIN;

-- =========================================================
-- Restore default value on logs.user_feedback.id
-- =========================================================
-- This was dropped when uuid-ossp extension was recreated
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'logs' AND table_name = 'user_feedback') THEN
    -- Check if default is missing or incorrect
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'logs' 
      AND table_name = 'user_feedback' 
      AND column_name = 'id' 
      AND column_default = 'uuid_generate_v4()'
    ) THEN
      ALTER TABLE logs.user_feedback 
      ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
  END IF;
END;
$$;

-- =========================================================
-- Restore index onet.onet_occupation_title_trgm_idx
-- =========================================================
-- This was dropped when pg_trgm extension was recreated
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'onet' AND table_name = 'occupation_data') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'onet' 
      AND indexname = 'onet_occupation_title_trgm_idx'
    ) THEN
      CREATE INDEX onet_occupation_title_trgm_idx
        ON onet.occupation_data
        USING gin (title gin_trgm_ops);
    END IF;
  END IF;
END;
$$;

-- =========================================================
-- Restore view v_active_cron_jobs
-- =========================================================
-- This was dropped when pg_cron extension was recreated
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'v_active_cron_jobs'
    ) THEN
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
    END IF;
  END IF;
END;
$$;

COMMIT;

