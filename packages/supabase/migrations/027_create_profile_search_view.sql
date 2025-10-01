-- 027_create_profile_search_view.sql
-- Creates v_profile_search view for talent/worker search and map display
-- Includes coordinate jittering for privacy protection

BEGIN;

-- Drop the view if it exists (to allow column name changes)
DROP VIEW IF EXISTS public.v_profile_search;

-- Create a function to jitter coordinates for privacy
-- Adds random offset to coordinates to prevent exact location tracking
CREATE OR REPLACE FUNCTION public.jitter_coordinate(
  coord double precision,
  max_offset_degrees double precision DEFAULT 0.03
)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  -- Add random offset between -max_offset and +max_offset
  -- 0.03 degrees ≈ 3.3km at equator, ≈ 2.1km at 45° latitude
  -- This provides privacy while maintaining general area accuracy
  SELECT coord + (random() * 2 - 1) * max_offset_degrees;
$$;

COMMENT ON FUNCTION public.jitter_coordinate IS 
  'Adds random offset to coordinate for privacy. Default ±0.03° (≈2-3km depending on latitude).';

-- Create the profile search view with jittered coordinates
CREATE OR REPLACE VIEW public.v_profile_search AS
SELECT 
  u.id,
  u.display_name AS name,
  u.headline,
  u.bio,
  u.avatar_url,
  u.open_to_work,
  u.years_of_experience,
  u.skills_summary,
  i.name AS industry_name,
  up.location,
  up.hourly_rate_cents,
  up.certifications,
  up.availability,
  up.travel_mileage,
  up.open_to_travel,
  up.education_level,
  -- Jittered coordinates for privacy (not exact location)
  public.jitter_coordinate(ST_X(up.geo::geometry)) AS longitude,
  public.jitter_coordinate(ST_Y(up.geo::geometry)) AS latitude,
  -- Gamified score calculation
  LEAST(
    COALESCE(u.years_of_experience, 0) * 3 + 
    COALESCE(jsonb_array_length(u.skills_summary->'skills'), 0) * 2 +
    CASE WHEN up.open_to_travel THEN 10 ELSE 0 END +
    CASE WHEN u.open_to_work THEN 15 ELSE 0 END,
    100
  )::integer AS gamified_score,
  u.created_at,
  u.updated_at
FROM public.users u
LEFT JOIN public.user_private up ON up.user_id = u.id
LEFT JOIN public.industries i ON i.id = u.industry_id
WHERE up.geo IS NOT NULL  -- Only include users with coordinates
  AND u.open_to_work = true;  -- Only show users open to work

-- Grant access to authenticated users
GRANT SELECT ON public.v_profile_search TO authenticated;

-- Grant access to anon for public talent search
GRANT SELECT ON public.v_profile_search TO anon;

-- Grant execute on jitter function
GRANT EXECUTE ON FUNCTION public.jitter_coordinate(double precision, double precision) TO authenticated, anon;

COMMENT ON VIEW public.v_profile_search IS 
  'Public view for searching worker/talent profiles. Coordinates are jittered (±3km) for privacy. Excludes sensitive PII. Only shows users open to work.';

COMMIT;
