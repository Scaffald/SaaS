-- =========================================================
-- 137_review_category_ratings_grants.sql
-- Add missing GRANT statements for review_category_ratings
-- and review_soft_skill_votes tables
-- =========================================================

BEGIN;

-- Review Category Ratings
-- Grant SELECT to anon and authenticated (public read)
-- Grant INSERT, UPDATE to authenticated (authenticated write)
-- Grant ALL to service_role (full access)
GRANT SELECT ON core.review_category_ratings TO anon, authenticated;
GRANT INSERT, UPDATE ON core.review_category_ratings TO authenticated;
GRANT ALL ON core.review_category_ratings TO service_role;

-- Review Soft Skill Votes
-- Grant SELECT to anon and authenticated (public read)
-- Grant INSERT, UPDATE to authenticated (authenticated write)
-- Grant ALL to service_role (full access)
GRANT SELECT ON core.review_soft_skill_votes TO anon, authenticated;
GRANT INSERT, UPDATE ON core.review_soft_skill_votes TO authenticated;
GRANT ALL ON core.review_soft_skill_votes TO service_role;

COMMIT;

