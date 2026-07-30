-- =============================================================================
-- 341_fix_search_path_extension_resolution.sql
--
-- Repairs functions that resolve extension objects (PostGIS types/functions,
-- pg_trgm's SIMILARITY, citext) through search_path rather than by qualifying
-- them, but whose search_path does not include the schema those extensions
-- live in. Symptom: ERROR 42704 `type "geometry" does not exist`.
--
-- How each one broke:
--   * 308_function_search_path.sql blanket-overwrote every owned function's
--     search_path with its own schema, discarding the declared value. That
--     broke core.get_jobs_with_coords + core.get_organizations_with_coords
--     (declared `core, public`) and onet.search_occupations (declared nothing,
--     so it had been inheriting the role search_path).
--   * core.validate_address_in_site and core.check_site_overlaps were declared
--     `SET search_path = core` in 105 and so have been broken since birth,
--     independent of 308.
--
-- onet.search_occupations additionally needs its body rewritten, not just its
-- search_path: it declares RETURNS TABLE(onetsoc_code text, title text, ...)
-- while onet.occupation_data stores those as character(10) and varchar(150).
-- plpgsql RETURN QUERY demands an exact type match, so it raised "structure of
-- query does not match function result type" — a second latent break, also
-- predating 308. The uncast columns were breaking the SIMILARITY() calls too
-- (`function similarity(character varying, text) does not exist`).
--
-- Why `public, extensions` and not one or the other: 309 attempts to move
-- postgis/citext/pg_trgm into `extensions`, but that ALTER requires extension
-- ownership and silently no-ops on setups where migrations do not own them.
-- Listing both means these functions work whether or not 309 took effect.
--
-- Security note: this keeps every search_path explicit and immutable, so the
-- Supabase advisor #172 posture that 308 was chasing is preserved. Adding
-- `public`/`extensions` introduces no object-shadowing risk here because
-- neither schema grants CREATE to anon/authenticated (only pg_database_owner
-- holds CREATE), so an untrusted role cannot plant a shadowing object for
-- these SECURITY DEFINER functions to pick up.
-- =============================================================================

BEGIN;

-- This migration's own statements (notably ST_GeogFromText in the verification
-- block below) resolve extension objects too, so pin the session search_path
-- for the same both-states reason described above.
SET LOCAL search_path = core, onet, public, extensions;

-- Append the extension-hosting schemas to each affected function's search_path,
-- preserving whatever is already there. Idempotent: re-running is a no-op.
-- Signatures are discovered so overloads and PostGIS-typed arguments (e.g.
-- check_site_overlaps(uuid, geography)) do not have to be spelled out here.
DO $$
DECLARE
  target RECORD;
  fn RECORD;
  existing TEXT[];
  desired TEXT[];
  schema_name TEXT;
BEGIN
  FOR target IN
    SELECT * FROM (VALUES
      ('core', 'get_jobs_with_coords'),           -- ST_X/ST_Y, ::geometry
      ('core', 'get_organizations_with_coords'),  -- ST_X/ST_Y, ::geometry, citext
      ('core', 'validate_address_in_site'),       -- ST_Contains, ::geometry
      ('core', 'check_site_overlaps'),            -- ST_Area/Intersection/Overlaps
      ('onet', 'search_occupations'),             -- SIMILARITY (pg_trgm)
      ('public', 'get_jobs_with_coords'),         -- wrapper
      ('public', 'get_organizations_with_coords') -- wrapper, returns citext
    ) AS t(nspname, proname)
  LOOP
    FOR fn IN
      SELECT p.oid, pg_get_function_identity_arguments(p.oid) AS args, p.proconfig
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = target.nspname
        AND p.proname = target.proname
        AND p.prokind = 'f'
    LOOP
      -- Pull the current search_path out of proconfig, if one is set.
      existing := NULL;
      SELECT string_to_array(
               replace(split_part(cfg, '=', 2), ' ', ''), ','
             )
        INTO existing
      FROM unnest(coalesce(fn.proconfig, ARRAY[]::text[])) AS cfg
      WHERE cfg LIKE 'search_path=%';

      -- No explicit search_path yet: start from the function's own schema so we
      -- never widen resolution more than necessary.
      desired := coalesce(existing, ARRAY[target.nspname]);

      FOREACH schema_name IN ARRAY ARRAY['public', 'extensions'] LOOP
        IF NOT (desired @> ARRAY[schema_name]) THEN
          desired := desired || schema_name;
        END IF;
      END LOOP;

      IF desired IS DISTINCT FROM existing THEN
        EXECUTE format(
          'ALTER FUNCTION %I.%I(%s) SET search_path = %s',
          target.nspname,
          target.proname,
          fn.args,
          (SELECT string_agg(quote_ident(s), ', ') FROM unnest(desired) AS s)
        );
        RAISE NOTICE 'search_path for %.%(%) -> %',
          target.nspname, target.proname, fn.args, array_to_string(desired, ', ');
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- onet.search_occupations needs its body corrected as well: cast the char(10)
-- and varchar(150) columns to text so both the declared return type and the
-- SIMILARITY() overload resolve. Return signature is unchanged, so CREATE OR
-- REPLACE is sufficient (no DROP, so existing GRANTs are preserved).
CREATE OR REPLACE FUNCTION onet.search_occupations(
  search_query TEXT,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  onetsoc_code TEXT,
  title TEXT,
  description TEXT,
  similarity_score REAL
)
LANGUAGE plpgsql
STABLE
SET search_path = onet, public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT
    od.onetsoc_code::text,
    od.title::text,
    od.description,
    GREATEST(
      SIMILARITY(od.title::text, search_query),
      SIMILARITY(od.onetsoc_code::text, search_query),
      SIMILARITY(COALESCE(od.description, ''), search_query)
    ) AS similarity_score
  FROM onet.occupation_data od
  WHERE
    od.title ILIKE '%' || search_query || '%'
    OR od.onetsoc_code ILIKE '%' || search_query || '%'
    OR od.description ILIKE '%' || search_query || '%'
    OR SIMILARITY(od.title::text, search_query) > 0.3
  ORDER BY similarity_score DESC, od.title
  LIMIT GREATEST(max_results, 1);
END;
$$;

GRANT EXECUTE ON FUNCTION onet.search_occupations(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION onet.search_occupations(TEXT, INTEGER) TO anon;

-- Fail the migration rather than shipping a silent regression: every function
-- above must actually resolve its extension objects now.
DO $$
DECLARE
  broken TEXT[] := ARRAY[]::TEXT[];
BEGIN
  BEGIN
    PERFORM * FROM public.get_jobs_with_coords() LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    broken := broken || format('public.get_jobs_with_coords: %s', SQLERRM);
  END;

  BEGIN
    PERFORM * FROM public.get_organizations_with_coords() LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    broken := broken || format('public.get_organizations_with_coords: %s', SQLERRM);
  END;

  BEGIN
    PERFORM * FROM onet.search_occupations('carpenter', 1);
  EXCEPTION WHEN OTHERS THEN
    broken := broken || format('onet.search_occupations: %s', SQLERRM);
  END;

  BEGIN
    PERFORM core.validate_address_in_site(
      '00000000-0000-0000-0000-000000000000'::uuid,
      '00000000-0000-0000-0000-000000000000'::uuid
    );
  EXCEPTION WHEN OTHERS THEN
    broken := broken || format('core.validate_address_in_site: %s', SQLERRM);
  END;

  BEGIN
    PERFORM * FROM core.check_site_overlaps(
      '00000000-0000-0000-0000-000000000000'::uuid,
      ST_GeogFromText('POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))')
    );
  EXCEPTION WHEN OTHERS THEN
    broken := broken || format('core.check_site_overlaps: %s', SQLERRM);
  END;

  IF array_length(broken, 1) > 0 THEN
    RAISE EXCEPTION 'search_path repair incomplete: %', array_to_string(broken, ' | ');
  END IF;
END;
$$;

COMMIT;
