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
-- IMPORTANT: also REVOKE column-level SELECT on `verification_data`
-- from anon. That JSONB blob holds license numbers, license type,
-- and verifier identity — facts we never want to expose publicly,
-- even on verified rows. PostgREST honours arbitrary `select=`
-- expressions, so a per-row RLS policy without column scoping would
-- let any anon request `?select=user_id,verification_data` and
-- harvest licenses. Column-level REVOKE closes that hole.
--
-- ROLLBACK:
--   GRANT SELECT (verification_data) ON community.memberships TO anon;
--   DROP POLICY IF EXISTS memberships_anon_select_verified ON community.memberships;
-- =========================================================

BEGIN;

CREATE POLICY memberships_anon_select_verified ON community.memberships
  FOR SELECT TO anon
  USING (is_verified = true);

COMMENT ON POLICY memberships_anon_select_verified ON community.memberships IS
  'SC-42: anon can read only verified memberships, for public profile badges. Unverified rows stay hidden. anon SELECT is additionally restricted by column-level GRANT (see below) so verification_data is never exposed.';

-- Lock anon to a column whitelist. Postgres column privileges are additive —
-- a column-level REVOKE on top of a table-level GRANT does nothing, since
-- the broader table grant still confers access to every column. The only
-- way to restrict anon's reachable columns is to REVOKE the table grant
-- and re-GRANT the explicit column list.
--
-- authenticated retains the broad table-level GRANT from migration 314.
REVOKE SELECT ON community.memberships FROM anon;
GRANT SELECT (id, community_id, user_id, joined_at, is_verified)
  ON community.memberships TO anon;

COMMIT;
