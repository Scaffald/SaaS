-- =========================================================
-- Fix map RPC functions to use plpgsql for PostgREST compatibility
-- =========================================================

BEGIN;

-- Update get_organizations_with_coords to use plpgsql
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

-- Update get_jobs_with_coords to use plpgsql
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

COMMIT;


