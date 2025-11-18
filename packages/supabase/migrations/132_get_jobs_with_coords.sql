-- =========================================================
-- 132_get_jobs_with_coords.sql
-- Create RPC function to get jobs with extracted coordinates for map display
-- =========================================================

BEGIN;

-- Get jobs with extracted coordinates for map display
CREATE OR REPLACE FUNCTION core.get_jobs_with_coords()
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
LANGUAGE sql
SECURITY DEFINER
SET search_path = core, public
AS $$
  SELECT 
    j.id,
    j.title,
    j.organization_id,
    j.employment_type,
    j.remote_option,
    j.location,
    ST_X(j.geo::geometry) AS longitude,
    ST_Y(j.geo::geometry) AS latitude,
    j.address,
    j.pay_range_min_cents,
    j.pay_range_max_cents,
    j.pay_range_type,
    j.status,
    j.position_level,
    o.name AS organization_name
  FROM core.jobs j
  LEFT JOIN core.organizations o ON o.id = j.organization_id
  WHERE j.status = 'open'
    AND j.geo IS NOT NULL
  LIMIT 500;
$$;

COMMENT ON FUNCTION core.get_jobs_with_coords IS 
  'Returns open jobs with lat/lon coordinates extracted from geo column for map display';

-- Grant execute permissions (functions are already granted in 004_functions.sql, but being explicit)
GRANT EXECUTE ON FUNCTION core.get_jobs_with_coords TO authenticated;
GRANT EXECUTE ON FUNCTION core.get_jobs_with_coords TO anon;

COMMIT;

