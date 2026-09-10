-- =========================================================
-- 351_drop_redundant_review_link_policies.sql
--
-- Migration 347 added four policies to core.review_links that already existed.
-- Migration 326 created review_links_owner_{select,insert,update,delete} with
-- exactly the same predicate, `subject_user_id = auth.uid()`, at the same time
-- it enabled RLS. 347 named its copies *_own and so did not collide.
--
-- The bug 347 fixed was real and remains fixed: 326 enabled RLS and wrote the
-- policies but never issued a GRANT, so `authenticated` and `service_role` had
-- no privileges and every endpoint answered `permission denied for table
-- review_links`. That is the #481 / migration 332 / 335 pattern, and the GRANTs
-- in 347 are what resolved it.
--
-- The policy half of 347 was written from a bad reading. This query:
--
--   select polname||' | '||polcmd from pg_policy where polrelid=...
--
-- fails with `operator is not unique: text || "char"`, and it was run with
-- stderr discarded, so an error looked like an empty result and an empty result
-- looked like "no policies at all". pg_policies (the view) shows them plainly.
--
-- Nothing was widened — the duplicates are identical, and permissive policies
-- for the same command OR together — but two sets of policies saying the same
-- thing is a trap for whoever audits this table next.
-- =========================================================

BEGIN;

DROP POLICY IF EXISTS review_links_select_own ON core.review_links;
DROP POLICY IF EXISTS review_links_insert_own ON core.review_links;
DROP POLICY IF EXISTS review_links_update_own ON core.review_links;
DROP POLICY IF EXISTS review_links_delete_own ON core.review_links;

COMMIT;
