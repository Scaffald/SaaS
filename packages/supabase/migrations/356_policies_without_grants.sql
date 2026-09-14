-- =========================================================
-- 356_policies_without_grants.sql
--
-- Six core tables carry RLS policies naming `anon` or `authenticated` and issue
-- no GRANT to those roles. A policy decides which rows a role may see; the
-- GRANT decides whether it may touch the table at all. Without both, the policy
-- is unreachable and the table answers:
--
--   permission denied for table review_pins
--   HINT: Grant the required privileges to the current role with:
--         GRANT SELECT ON core.review_pins TO authenticated;
--
-- Postgres names the fix, but only to whoever reads the raw error — through the
-- API it surfaces as a 401 or a 500.
--
-- Found smoke-testing production (#755): a public profile reads core.review_pins
-- directly, and it failed for anonymous *and* signed-in visitors. Unlike the
-- service_role drift in #751, this is not an environment difference — local has
-- the same hole, so the pinned-reviews feature has never worked anywhere. Its
-- writes go through the pin_review / unpin_review RPCs, which run as definer
-- and therefore worked, so a user could pin a review and never see it pinned.
--
-- Same class as #481, #654 and migrations 332 / 335 / 347 / 352 / 355. Those
-- fixed one table at a time, as each was found by an endpoint failing. This
-- grants every table where a policy already declares the intent, and grants
-- exactly the commands those policies cover — nothing is opened that the policy
-- author had not already decided to open:
--
--   generic_invitations  authenticated  INSERT, SELECT, UPDATE
--   inquiry_audit_log    authenticated  INSERT
--   inquiry_reminders    authenticated  SELECT
--   invitation_rules     authenticated  SELECT
--   review_pins          anon           SELECT
--   review_pins          authenticated  DELETE, INSERT, SELECT, UPDATE
--   user_relationships   authenticated  INSERT, SELECT, UPDATE
--
-- core.user_skills is deliberately NOT included, though it has the same shape.
-- Its user_skills_select_public policy names `anon`, but the predicate reads
-- core.preferences to check profile_visibility -> skills, and `anon` cannot
-- read that table either. Granting SELECT on user_skills alone only moves the
-- error:
--
--   permission denied for table preferences
--   HINT: GRANT SELECT ON core.preferences TO anon;
--
-- and taking that hint would expose every user's preference row to anonymous
-- readers. The honest fix is a SECURITY DEFINER helper the policy can call, so
-- the visibility lookup runs with the rights it needs and nothing else is
-- opened. That is a design change rather than a missing grant, so it is filed
-- separately. The API path is unaffected: the public skills widget reads
-- through the service client behind an explicit visibility check (#732).
-- =========================================================

BEGIN;

GRANT INSERT, SELECT, UPDATE         ON core.generic_invitations TO authenticated;
GRANT INSERT                         ON core.inquiry_audit_log   TO authenticated;
GRANT SELECT                         ON core.inquiry_reminders   TO authenticated;
GRANT SELECT                         ON core.invitation_rules    TO authenticated;
GRANT SELECT                         ON core.review_pins         TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.review_pins         TO authenticated;
GRANT INSERT, SELECT, UPDATE         ON core.user_relationships  TO authenticated;

COMMIT;
