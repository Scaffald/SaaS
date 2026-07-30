-- =============================================================================
-- 308_function_search_path.sql
--
-- Ensures every application function in core, data, community, onet, and public
-- has an explicit, immutable search_path (Supabase advisor Issue #172). Only
-- alters functions owned by the current user to avoid touching extension/system
-- functions (e.g. public.regexp_split_to_table).
--
-- IMPORTANT: this only fills in a search_path where one is MISSING. It must
-- never overwrite a declared one. The original version of this migration set
-- `search_path = <own schema>` unconditionally, which discarded the value 37
-- functions were written with and broke every function that resolved PostGIS,
-- pg_trgm, or citext objects through search_path (ERROR 42704 `type "geometry"
-- does not exist` on /workers/map, among others). 341 repairs the fallout;
-- this preserve-don't-overwrite behaviour is what stops it recurring on a
-- fresh `db reset` or in a newly provisioned environment.
-- =============================================================================

BEGIN;

DO $$
DECLARE
  r RECORD;
  sql TEXT;
BEGIN
  FOR r IN
    SELECT
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname IN ('core', 'data', 'community', 'onet', 'public')
      AND p.prokind = 'f'
      AND p.proowner = (SELECT oid FROM pg_roles WHERE rolname = current_user)
      -- Leave functions that already declare a search_path alone; the declared
      -- value is load-bearing (cross-schema and extension object resolution).
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(coalesce(p.proconfig, ARRAY[]::text[])) AS cfg
        WHERE cfg LIKE 'search_path=%'
      )
  LOOP
    sql := format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = %I, public, extensions',
      r.nspname,
      r.proname,
      r.args,
      r.nspname
    );
    EXECUTE sql;
  END LOOP;
END;
$$;

COMMIT;
