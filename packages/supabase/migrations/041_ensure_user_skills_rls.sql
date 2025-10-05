-- =========================================================
-- 041_ensure_user_skills_rls.sql
-- Ensure RLS policies for user_skills table are properly configured
-- =========================================================

begin;

-- Ensure RLS is enabled
alter table public.user_skills enable row level security;

-- Drop and recreate all policies to ensure they exist
drop policy if exists "user_skills_read" on public.user_skills;
drop policy if exists "user_skills_insert" on public.user_skills;
drop policy if exists "user_skills_update" on public.user_skills;
drop policy if exists "user_skills_delete" on public.user_skills;

-- Allow users to read their own skills
create policy "user_skills_read"
  on public.user_skills
  for select
  to authenticated
  using (user_id = auth.uid());

-- Allow users to insert their own skills
create policy "user_skills_insert"
  on public.user_skills
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Allow users to update their own skills
create policy "user_skills_update"
  on public.user_skills
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Allow users to delete their own skills
create policy "user_skills_delete"
  on public.user_skills
  for delete
  to authenticated
  using (user_id = auth.uid());

commit;
