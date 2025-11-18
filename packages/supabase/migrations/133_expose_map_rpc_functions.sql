-- =========================================================
-- 133_expose_map_rpc_functions.sql
-- Creates public schema wrapper functions to expose
-- core.get_organizations_with_coords and core.get_jobs_with_coords
-- via Supabase REST API
-- =========================================================

BEGIN;

-- Create public schema wrapper function for get_organizations_with_coords
-- This allows REST API calls to work (Supabase JS client with .schema("core") works without this)
CREATE OR REPLACE FUNCTION public.get_organizations_with_coords()
RETURNS TABLE (
  id uuid,
  name text,
  slug citext,
  longitude float8,
  latitude float8,
  address jsonb,
  industry_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM core.get_organizations_with_coords();
END;
$$;

COMMENT ON FUNCTION public.get_organizations_with_coords() IS
  'Public wrapper for core.get_organizations_with_coords. Returns public organizations with lat/lon coordinates for map display.';

-- Create public schema wrapper function for get_jobs_with_coords
CREATE OR REPLACE FUNCTION public.get_jobs_with_coords()
RETURNS TABLE (
  id uuid,
  title text,
  organization_id uuid,
  employment_type text,
  remote_option text,
  location text,
  longitude float8,
  latitude float8,
  address jsonb,
  pay_range_min_cents integer,
  pay_range_max_cents integer,
  pay_range_type text,
  status text,
  position_level text,
  organization_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM core.get_jobs_with_coords();
END;
$$;

COMMENT ON FUNCTION public.get_jobs_with_coords() IS
  'Public wrapper for core.get_jobs_with_coords. Returns open jobs with lat/lon coordinates extracted from geo column for map display.';

-- Grant execute permissions to authenticated and anon roles
GRANT EXECUTE ON FUNCTION public.get_organizations_with_coords() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organizations_with_coords() TO anon;
GRANT EXECUTE ON FUNCTION public.get_jobs_with_coords() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_jobs_with_coords() TO anon;

COMMIT;

