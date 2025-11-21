-- =========================================================
-- 20251121073134_req_255_soft_skills_policies.sql
-- RLS updates for soft skills self-assessment visibility
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- Restrict user_skills visibility to owner or public profile
-- ---------------------------------------------------------

DROP POLICY IF EXISTS user_skills_select ON core.user_skills;

CREATE POLICY user_skills_select_public
  ON core.user_skills
  FOR SELECT
  TO anon, authenticated
  USING (
    auth.uid() = user_id
    OR COALESCE(
      (
        SELECT (prefs.profile_visibility ->> 'skills')::BOOLEAN
        FROM core.preferences prefs
        WHERE prefs.user_id = user_id
      ),
      true
    )
  );

CREATE POLICY user_skills_select_service_role
  ON core.user_skills
  FOR SELECT
  TO service_role
  USING (true);

COMMIT;


