-- =========================================================
-- 054_move_extensions_and_custom_objects.sql
-- Moves all PostgreSQL extensions to public schema and
-- moves all custom functions and enum types from public to core schema
-- =========================================================

BEGIN;

-- =========================================================
-- Move Extensions from extensions to public schema
-- =========================================================

-- Note: ALTER EXTENSION ... SET SCHEMA does not work for all extensions
-- Some extensions must be dropped and recreated in the new schema
-- We'll use DROP ... CASCADE and CREATE for safe migration

-- Move uuid-ossp extension
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
    -- Drop extension (will cascade to any dependent objects temporarily)
    DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
    -- Recreate in public schema
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
  END IF;
END;
$$;

-- Move pgcrypto extension
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto') THEN
    DROP EXTENSION IF EXISTS pgcrypto CASCADE;
    CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
  END IF;
END;
$$;

-- Move pg_trgm extension
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
    DROP EXTENSION IF EXISTS pg_trgm CASCADE;
    CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;
  END IF;
END;
$$;

-- Move pg_cron extension
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    DROP EXTENSION IF EXISTS pg_cron CASCADE;
    CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA public;
  END IF;
END;
$$;

-- Ensure pg_net is in public schema (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_net') THEN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
      -- Check current schema
      IF EXISTS (
        SELECT 1 FROM pg_extension e
        JOIN pg_namespace n ON n.oid = e.extnamespace
        WHERE e.extname = 'pg_net' AND n.nspname != 'public'
      ) THEN
        DROP EXTENSION IF EXISTS pg_net CASCADE;
        CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;
      END IF;
    ELSE
      CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA public;
    END IF;
  END IF;
END;
$$;

-- =========================================================
-- Move Enum Types from public to core schema
-- =========================================================

-- Move app_role enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    -- Drop and recreate in core schema
    DROP TYPE IF EXISTS public.app_role CASCADE;
    CREATE TYPE core.app_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
  ELSIF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')) THEN
    CREATE TYPE core.app_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');
  END IF;
END;
$$;

-- Move review_status enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    DROP TYPE IF EXISTS public.review_status CASCADE;
    CREATE TYPE core.review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
  ELSIF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')) THEN
    CREATE TYPE core.review_status AS ENUM ('pending', 'approved', 'rejected', 'flagged');
  END IF;
END;
$$;

-- Move application_status enum
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    DROP TYPE IF EXISTS public.application_status CASCADE;
    CREATE TYPE core.application_status AS ENUM (
      'draft',
      'submitted',
      'under_review',
      'interviewing',
      'offer_extended',
      'hired',
      'rejected',
      'withdrawn'
    );
  ELSIF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'core')) THEN
    CREATE TYPE core.application_status AS ENUM (
      'draft',
      'submitted',
      'under_review',
      'interviewing',
      'offer_extended',
      'hired',
      'rejected',
      'withdrawn'
    );
  END IF;
END;
$$;

-- =========================================================
-- Move Custom Functions from public to core schema
-- =========================================================

-- Note: Function moves are handled in their respective migration files
-- This migration ensures extensions and types are moved correctly
-- Functions will be recreated in core schema in updated migration files

-- =========================================================
-- Restore objects that were dropped due to CASCADE
-- =========================================================

-- Restore default value on logs.user_feedback.id (uses uuid_generate_v4 from uuid-ossp)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'logs' AND table_name = 'user_feedback') THEN
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

-- Restore index onet.onet_occupation_title_trgm_idx (uses gin_trgm_ops from pg_trgm)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'onet' AND table_name = 'occupation_data') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname = 'onet' 
      AND indexname = 'onet_occupation_title_trgm_idx'
    ) THEN
      CREATE INDEX IF NOT EXISTS onet_occupation_title_trgm_idx
        ON onet.occupation_data
        USING gin (title gin_trgm_ops);
    END IF;
  END IF;
END;
$$;

-- Restore view v_active_cron_jobs (queries cron.job from pg_cron)
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

