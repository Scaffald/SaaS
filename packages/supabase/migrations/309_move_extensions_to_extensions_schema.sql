-- =============================================================================
-- 405_move_extensions_to_extensions_schema.sql
--
-- Moves extensions from public to the extensions schema (Supabase advisor #173).
-- Target extensions: citext, postgis, uuid-ossp, pgcrypto, pg_trgm.
-- pg_net does not support SET SCHEMA and must remain in public.
--
-- Schema "extensions" already exists (from wrappers in 098).
--
-- Note: ALTER EXTENSION ... SET SCHEMA requires extension ownership. If
-- migrations run as a role that does not own the extensions (e.g. on some
-- hosted setups), you may see "must be owner of extension" warnings; the
-- ALTERs can be run manually as the project/extension owner. The search_path
-- updates below are still applied so that when extensions are in "extensions",
-- unqualified references continue to work.
-- =============================================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS extensions;

-- Move only extensions that support SET SCHEMA and that we own (idempotent).
-- pg_net is skipped: it does not support SET SCHEMA.
DO $$
DECLARE
  ext RECORD;
BEGIN
  FOR ext IN
    SELECT e.extname, n.nspname
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE n.nspname = 'public'
      AND e.extname IN ('citext', 'postgis', 'uuid-ossp', 'pgcrypto', 'pg_trgm')
      AND e.extowner = (SELECT oid FROM pg_roles WHERE rolname = current_user)
  LOOP
    BEGIN
      EXECUTE format('ALTER EXTENSION %I SET SCHEMA extensions', ext.extname);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not move extension % to extensions: %', ext.extname, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- Ensure search_path includes extensions so existing unqualified references still work
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated', 'service_role', 'postgres')
  LOOP
    EXECUTE format('ALTER ROLE %I SET search_path TO public, extensions, pg_catalog', r.rolname);
  END LOOP;
END;
$$;

COMMIT;
