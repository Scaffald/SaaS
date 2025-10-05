-- =========================================================
-- 037_add_user_skills_rls_policies.sql
-- Add RLS policies for user_skills table
-- =========================================================

begin;

-- Enable RLS on user_skills table if not already enabled
alter table public.user_skills enable row level security;

-- Drop existing policies if they exist
drop policy if exists "user_skills_read" on public.user_skills;
drop policy if exists "user_skills_insert" on public.user_skills;
drop policy if exists "user_skills_update" on public.user_skills;
drop policy if exists "user_skills_delete" on public.user_skills;

-- Allow users to read their own skills
create policy "user_skills_read"
  on public.user_skills
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Allow users to insert their own skills
create policy "user_skills_insert"
  on public.user_skills
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Allow users to update their own skills
create policy "user_skills_update"
  on public.user_skills
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow users to delete their own skills
create policy "user_skills_delete"
  on public.user_skills
  for delete
  to authenticated
  using (auth.uid() = user_id);

commit;
