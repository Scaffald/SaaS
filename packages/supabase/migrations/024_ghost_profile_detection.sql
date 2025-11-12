-- 024_ghost_profile_detection.sql
-- Ghost profile detection, scoring view, and cron scheduling

BEGIN;
-- =====================================================================
-- Weighted completion scoring view
-- =====================================================================
CREATE OR REPLACE VIEW core.v_profile_completion_scores AS
SELECT
  p.user_id,
  (
    (CASE
      WHEN COALESCE(p.first_name, '') <> ''
        AND COALESCE(p.last_name, '') <> ''
        AND COALESCE(u.headline, '') <> ''
      THEN 20 ELSE 0 END) +
    (CASE
      WHEN (
        SELECT COUNT(*) FROM core.user_skills us
        WHERE us.user_id = p.user_id
      ) >= 3
      THEN 20 ELSE 0 END) +
    (CASE
      WHEN EXISTS (
        SELECT 1 FROM core.user_experience ue
        WHERE ue.user_id = p.user_id
          AND COALESCE(ue.job_title, '') <> ''
          AND COALESCE(ue.company_name, '') <> ''
      )
      THEN 20 ELSE 0 END) +
    (CASE
      WHEN EXISTS (
        SELECT 1
        FROM core.user_certifications uc
        JOIN core.certifications c
          ON c.id = uc.certification_id
        WHERE uc.user_id = p.user_id
          AND COALESCE(c.name, '') <> ''
          AND COALESCE(c.issuing_organization, '') <> ''
      )
      THEN 15 ELSE 0 END) +
    (CASE
      WHEN (p.address IS NOT NULL AND p.address <> '{}'::jsonb)
        OR COALESCE(array_length(p.preferred_work_locations, 1), 0) > 0
      THEN 15 ELSE 0 END) +
    (CASE
      WHEN COALESCE(p.education_level, '') <> ''
        OR EXISTS (
          SELECT 1 FROM core.user_education ed
          WHERE ed.user_id = p.user_id
        )
      THEN 10 ELSE 0 END)
  )::integer AS completion_score
FROM core.profile p
JOIN core.users u ON u.id = p.user_id;
COMMENT ON VIEW core.v_profile_completion_scores IS
  'Weighted profile completion score (0-100) per user.';
-- =====================================================================
-- Ghost profile refresh function
-- =====================================================================
CREATE OR REPLACE FUNCTION core.refresh_ghost_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public, pg_temp
AS $$
DECLARE
  current_time timestamptz := now();
BEGIN
  WITH completion AS (
    SELECT
      prefs.user_id,
      COALESCE(scores.completion_score, 0) AS completion_score,
      prefs.prerequisites_completed_at
    FROM core.preferences prefs
    LEFT JOIN core.v_profile_completion_scores scores
      ON scores.user_id = prefs.user_id
  ),
  flagged AS (
    SELECT
      completion.user_id,
      completion.completion_score,
      completion.prerequisites_completed_at,
      CASE
        WHEN completion.prerequisites_completed_at IS NULL THEN false
        WHEN completion.prerequisites_completed_at >
          (current_time - interval '30 days') THEN false
        ELSE completion.completion_score < 50
      END AS is_ghost
    FROM completion
  )
  UPDATE core.preferences prefs
  SET ui_preferences = jsonb_strip_nulls(
        (COALESCE(prefs.ui_preferences, '{}'::jsonb)
          - 'ghost_profile_marked_at'
          - 'ghost_profile_last_checked_at'
          - 'ghost_profile_completion_score')
        || jsonb_build_object(
          'is_ghost_profile', flagged.is_ghost,
          'ghost_profile_marked_at',
            CASE WHEN flagged.is_ghost
              THEN to_char(current_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
              ELSE NULL END,
          'ghost_profile_last_checked_at',
            to_char(current_time, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'ghost_profile_completion_score',
            CASE WHEN flagged.is_ghost THEN flagged.completion_score ELSE NULL END
        )
      )
  FROM flagged
  WHERE prefs.user_id = flagged.user_id;
END;
$$;
COMMENT ON FUNCTION core.refresh_ghost_profiles IS
  'Evaluates completion scores and flags profiles <50% complete after 30 days.';
-- =====================================================================
-- Cron scheduling (weekly, Monday 03:00 UTC)
-- =====================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron') THEN
    IF EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'ghost_profile_refresh'
    ) THEN
      PERFORM cron.unschedule('ghost_profile_refresh');
    END IF;
    PERFORM cron.schedule(
      'ghost_profile_refresh',
      '0 3 * * 1',
      'SELECT core.refresh_ghost_profiles();'
    );
  END IF;
END;
$$;
-- =====================================================================
-- Deterministic coordinate jitter function (ensure updated signature)
-- =====================================================================
CREATE OR REPLACE FUNCTION core.jitter_coordinate_deterministic(
  coord double precision,
  user_id uuid,
  coord_type text DEFAULT 'lng',
  max_offset_degrees double precision DEFAULT 0.03
)
RETURNS double precision
LANGUAGE sql
STABLE
AS $$
  SELECT coord + (
    ('x' || substr(
      md5(user_id::text || coord_type),
      1,
      8
    ))::bit(32)::bigint::double precision / 4294967295.0 * 2 - 1
  ) * max_offset_degrees;
$$;
COMMENT ON FUNCTION core.jitter_coordinate_deterministic IS 
  'Adds deterministic offset to coordinate for privacy using user ID hash. Coordinates remain stable across queries while maintaining privacy. Use coord_type ''lng'' for longitude, ''lat'' for latitude. Default ±0.03° (≈2-3km depending on latitude).';
-- =====================================================================
-- Search view update with ghost penalty
-- =====================================================================
CREATE OR REPLACE VIEW core.v_profile_search AS
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
  pp.location,
  pp.hourly_rate_cents,
  pp.certifications,
  pp.availability,
  pp.travel_mileage,
  pp.open_to_travel,
  pp.education_level,
  core.jitter_coordinate_deterministic(ST_X(pp.geo::public.geometry), u.id, 'lng') AS longitude,
  core.jitter_coordinate_deterministic(ST_Y(pp.geo::public.geometry), u.id, 'lat') AS latitude,
  ROUND(
    LEAST(
      COALESCE(u.years_of_experience, 0) * 3 + 
      COALESCE(jsonb_array_length(u.skills_summary->'skills'), 0) * 2 +
      CASE WHEN pp.open_to_travel THEN 10 ELSE 0 END +
      CASE WHEN u.open_to_work THEN 15 ELSE 0 END,
      100
    ) * CASE
          WHEN COALESCE((prefs.ui_preferences->>'is_ghost_profile')::boolean, false)
            THEN 0.5
          ELSE 1.0
        END
  )::integer AS gamified_score,
  u.created_at,
  u.updated_at
FROM core.users u
LEFT JOIN core.profile pp ON pp.user_id = u.id
LEFT JOIN core.preferences prefs ON prefs.user_id = u.id
LEFT JOIN core.industries i ON i.id = u.industry_id
WHERE pp.geo IS NOT NULL;
COMMENT ON VIEW core.v_profile_search IS 
  'Public worker search view with ghost profile suppression.';
COMMIT;
