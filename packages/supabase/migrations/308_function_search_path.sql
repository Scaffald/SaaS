-- =============================================================================
-- 308_function_search_path.sql
--
-- Sets an explicit search_path on application functions in core, data, community,
-- onet, and public (Supabase advisor Issue #172). Uses the function's own schema
-- as search_path. Only alters functions owned by the current user to avoid
-- touching extension/system functions (e.g. public.regexp_split_to_table).
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
  LOOP
    sql := format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = %I',
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
