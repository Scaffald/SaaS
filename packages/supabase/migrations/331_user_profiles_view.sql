-- 331_user_profiles_view.sql
-- Create core.user_profiles as a per-user view over core.profile.
--
-- Several REST API routes query `core.user_profiles` keyed by `id` (= auth user
-- id): GET /v1/profiles/experience/summary (career_level),
-- GET /v1/profiles/education/level (education_level), and
-- GET/PATCH /v1/profiles/employment (work-preference fields). No such relation
-- existed — the data lives in core.profile keyed by user_id — so those endpoints
-- 500'd with "Could not find the table 'core.user_profiles' in the schema cache".
-- This view maps core.profile into the shape those routes expect.
--
-- security_invoker = true so core.profile's existing RLS (own select/update +
-- public read) is enforced for the *calling* user, not the view owner. Without
-- it the view would run with definer privileges and bypass profile RLS.
--
-- NOTE: the API field `hourly_rate` is mapped 1:1 from `hourly_rate_cents` (no
-- unit conversion) to preserve the current API/UI contract. The cents-vs-dollars
-- semantics are a separate question and intentionally not changed here.

BEGIN;

CREATE OR REPLACE VIEW core.user_profiles
WITH (security_invoker = true) AS
SELECT
  p.user_id                 AS id,
  p.career_level,
  p.education_level,
  p.preferred_work_locations,
  p.open_to_travel,
  p.travel_distance_miles,
  p.us_resident,
  p.authorized_countries,
  p.us_passport,
  p.drivers_license_classes,
  p.military_status,
  p.availability,
  p.hourly_rate_cents       AS hourly_rate,
  p.updated_at
FROM core.profile p;

GRANT SELECT, UPDATE ON core.user_profiles TO authenticated, service_role;

COMMIT;
