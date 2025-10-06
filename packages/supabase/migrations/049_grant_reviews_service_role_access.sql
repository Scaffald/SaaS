-- =========================================================
-- 049_grant_reviews_service_role_access.sql
-- Grant proper access to reviews tables for all roles
-- =========================================================

begin;

-- Grant access to authenticated users (for creating/managing their own reviews)
grant select, insert, update, delete on public.reviews to authenticated;
grant select, insert, update, delete on public.review_skill_ratings to authenticated;
grant select, insert, update, delete on public.review_soft_skill_votes to authenticated;
grant select, insert, update, delete on public.review_skill_suggestions to authenticated;
grant select, insert, update, delete on public.review_aspects to authenticated;
grant select, insert, update, delete on public.review_progress to authenticated;
grant select, insert, update, delete on public.review_category_ratings to authenticated;

-- Grant read access to anonymous users (for viewing released reviews)
grant select on public.reviews to anon;
grant select on public.review_skill_ratings to anon;
grant select on public.review_soft_skill_votes to anon;
grant select on public.review_skill_suggestions to anon;
grant select on public.review_aspects to anon;
grant select on public.review_progress to anon;
grant select on public.review_category_ratings to anon;

-- Grant full access to service_role (for admin operations)
grant all on public.reviews to service_role;
grant all on public.review_skill_ratings to service_role;
grant all on public.review_soft_skill_votes to service_role;
grant all on public.review_skill_suggestions to service_role;
grant all on public.review_aspects to service_role;
grant all on public.review_progress to service_role;
grant all on public.review_category_ratings to service_role;

commit;
