-- =========================================================
-- 017_grant_industries_access.sql
-- Grant explicit access to industries table for anonymous users
-- =========================================================

begin;

-- Grant select permission to anonymous role
grant select on public.industries to anon;
grant select on public.industries to authenticated;

commit;
