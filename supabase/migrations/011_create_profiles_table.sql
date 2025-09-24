-- 011_create_profiles_table.sql
-- Creates the missing profiles table that the application code expects

begin;

-- Create the profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  about text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create RLS policies
drop policy if exists "users can read their own profile" on public.profiles;
create policy "users can read their own profile"
  on public.profiles for select
  to authenticated
  using ( auth.uid() = id );

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check ( auth.uid() = id );

-- Grant permissions (authenticated users only)
grant select, insert, update on public.profiles to authenticated;

commit;
