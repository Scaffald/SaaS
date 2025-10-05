-- =========================================================
-- 036_add_skills_rls_policies.sql
-- Add RLS policies for skills table to allow authenticated users to read
-- =========================================================

begin;

-- Enable RLS on skills table if not already enabled
alter table public.skills enable row level security;

-- Drop existing policies if they exist
drop policy if exists "skills_read_authenticated" on public.skills;
drop policy if exists "skills_read_anon" on public.skills;

-- Allow authenticated users to read all skills
create policy "skills_read_authenticated"
  on public.skills
  for select
  to authenticated
  using (true);

-- Allow anonymous users to read all skills (for public skill searches)
create policy "skills_read_anon"
  on public.skills
  for select
  to anon
  using (true);

commit;
