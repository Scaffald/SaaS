-- =========================================================
-- 327_restore_profile_public_read_policy.sql
--
-- Restores the `profile_public_read` policy on core.profile that
-- migration 005 declares but which is missing on dev + prod.
-- Root cause: 005 was edited after deployment to add this policy,
-- so dev/prod never received it (preview did). Surfaced in the
-- 2026-05-22 schema-drift audit (SC-67).
-- =========================================================

BEGIN;

DROP POLICY IF EXISTS profile_public_read ON core.profile;
CREATE POLICY profile_public_read ON core.profile
  FOR SELECT TO authenticated
  USING (true);

COMMIT;
