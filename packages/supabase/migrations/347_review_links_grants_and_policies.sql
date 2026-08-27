-- =========================================================
-- 347_review_links_grants_and_policies.sql
--
-- core.review_links has RLS enabled and *no policies at all*, and grants only
-- to postgres:
--
--   grantee  | privileges
--   postgres | INSERT,SELECT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER
--
-- So every endpoint that touches it fails:
--
--   GET  /v1/reviews/links                  permission denied for table review_links
--   GET  /v1/reviews/links/by-token/{token} permission denied for table review_links
--
-- The by-token route already uses the service client precisely because it is
-- anonymous — service_role bypasses RLS, but it still needs the table GRANT,
-- which is why using the service client did not save it. Same class as #481 and
-- migrations 332/335: the table ships with RLS and the grant that makes it
-- reachable is forgotten, so it surfaces as a server error rather than a
-- permission one.
--
-- This is the reviewer's entry point — a subject shares a link, a reviewer
-- follows it from an email — so the whole review-collection flow is dead
-- without it.
-- =========================================================

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON core.review_links TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.review_links TO service_role;

-- The subject owns their links, and only their own.
--
-- GET /v1/reviews/links selects with no subject_user_id filter and leans on RLS
-- to scope the result, so this predicate is the only thing standing between a
-- caller and every share link on the platform. The handler is being given an
-- explicit filter as well, but the policy has to be correct on its own.
DROP POLICY IF EXISTS review_links_select_own ON core.review_links;
CREATE POLICY review_links_select_own ON core.review_links
  FOR SELECT
  TO authenticated
  USING (subject_user_id = auth.uid());

DROP POLICY IF EXISTS review_links_insert_own ON core.review_links;
CREATE POLICY review_links_insert_own ON core.review_links
  FOR INSERT
  TO authenticated
  WITH CHECK (subject_user_id = auth.uid());

-- Revoking is an UPDATE of is_revoked. WITH CHECK repeats the predicate so a
-- row cannot be reassigned to somebody else on the way out.
DROP POLICY IF EXISTS review_links_update_own ON core.review_links;
CREATE POLICY review_links_update_own ON core.review_links
  FOR UPDATE
  TO authenticated
  USING (subject_user_id = auth.uid())
  WITH CHECK (subject_user_id = auth.uid());

DROP POLICY IF EXISTS review_links_delete_own ON core.review_links;
CREATE POLICY review_links_delete_own ON core.review_links
  FOR DELETE
  TO authenticated
  USING (subject_user_id = auth.uid());

-- Deliberately no policy for `anon`. A reviewer following a share link is
-- anonymous, but they reach the row through the service client in
-- GET /v1/reviews/links/by-token/{token}, which checks expiry, revocation and
-- use count before returning anything. Granting anon a direct SELECT would let
-- anyone enumerate the table through PostgREST, and the token is the only
-- secret protecting it.

COMMIT;
