-- =========================================================
-- 042_grant_user_skills_permissions.sql
-- Grant table-level permissions to authenticated role for user_skills
-- =========================================================

begin;

-- Grant SELECT, INSERT, UPDATE, DELETE permissions to authenticated role
grant select, insert, update, delete on table public.user_skills to authenticated;

commit;
