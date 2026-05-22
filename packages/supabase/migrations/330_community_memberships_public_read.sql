-- =========================================================
-- 330_community_memberships_public_read.sql
-- SC-42: surface community participation as profile badges.
--
-- The public worker profile (anon-accessible via vanity URL) needs
-- to render the user's verified community memberships so we can
-- show chips like "Active in: Electrical, HVAC". Currently the
-- memberships table only allows authenticated SELECT, which blocks
-- the anon read.
--
-- Add a narrow anon SELECT policy that exposes ONLY verified
-- memberships (is_verified = true). Unverified / pending-license
-- rows stay private — they reveal an intent to join without a
-- corroborating credential, which we don't want public.
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS memberships_anon_select_verified ON community.memberships;
-- =========================================================

BEGIN;

CREATE POLICY memberships_anon_select_verified ON community.memberships
  FOR SELECT TO anon
  USING (is_verified = true);

COMMENT ON POLICY memberships_anon_select_verified ON community.memberships IS
  'SC-42: anon can read only verified memberships, for public profile badges. Unverified rows stay hidden.';

COMMIT;
