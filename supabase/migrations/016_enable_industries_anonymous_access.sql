-- =========================================================
-- 016_enable_industries_anonymous_access.sql
-- Enable anonymous access to industries table for registration form
-- =========================================================

begin;

-- Enable RLS on industries table if not already enabled
alter table public.industries enable row level security;

-- Create policy to allow anonymous and authenticated users to read industries
drop policy if exists "industries_public_read" on public.industries;
create policy "industries_public_read"
  on public.industries for select
  to anon, authenticated
  using (true);

commit;
