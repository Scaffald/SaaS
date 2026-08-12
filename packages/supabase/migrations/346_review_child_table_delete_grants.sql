-- =========================================================
-- 346_review_child_table_delete_grants.sql
--
-- The review wizard replaces two of its child sets wholesale rather than
-- merging them: skill ratings and soft-skill votes. The reviewer sends the full
-- list on every save, so a skill they removed has to actually disappear — a
-- merge would strand it.
--
-- `authenticated` could not delete from either table:
--
--   review_skill_ratings      INSERT, SELECT              -- no DELETE grant,
--                                                         -- and no DELETE policy
--   review_soft_skill_votes   INSERT, SELECT, UPDATE      -- no DELETE grant,
--                                                         -- but an author-scoped
--                                                         -- ALL policy already
--
-- Both endpoints returned 500 "permission denied" against a live stack. Same
-- class as #481: the table is created with RLS and a policy, and the GRANT that
-- makes the policy reachable is forgotten, so the failure surfaces as a server
-- error rather than a permission one.
--
-- review_category_ratings is untouched — it is upserted on its (review_id,
-- category) primary key and never needs a delete.
-- =========================================================

BEGIN;

GRANT DELETE ON core.review_skill_ratings TO authenticated;
GRANT DELETE ON core.review_soft_skill_votes TO authenticated;

-- review_soft_skill_votes already carries review_soft_skill_votes_write (ALL,
-- scoped to the parent review's author), so the grant alone is enough there.
-- review_skill_ratings has only rsr_insert and rsr_read; this mirrors
-- rsr_insert's predicate so a reviewer can clear their own ratings and nobody
-- else's.
DROP POLICY IF EXISTS rsr_delete ON core.review_skill_ratings;
CREATE POLICY rsr_delete ON core.review_skill_ratings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM core.reviews r
      WHERE r.id = review_skill_ratings.review_id
        AND r.author_user_id = auth.uid()
    )
  );

COMMIT;
