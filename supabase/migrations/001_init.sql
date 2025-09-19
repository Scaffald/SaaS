-- =========================================================
-- 001_core.sql — foundational schema for resume + PII split
-- =========================================================
begin;

-- Required extensions
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists postgis;
create extension if not exists pg_trgm;

-- =========================
-- Domain reference tables
-- =========================
create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  slug citext unique not null,
  name text not null,
  description text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Public resume-safe profile
-- =========================
create table if not exists public.users (
  id uuid primary key,
  username text unique,
  slug text unique,
  display_name text,
  headline text,
  bio text,
  industry_id uuid references public.industries(id),
  avatar_url text,
  avatar_media_id uuid,
  open_to_work boolean default false,
  years_of_experience smallint,
  skills_summary jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- Private / PII profile data
-- =========================
create table if not exists public.user_private (
  user_id uuid primary key references public.users(id) on delete cascade,
  email citext unique,
  phone text,
  address jsonb,
  geo geography(Point,4326),
  contact_prefs text[],
  veteran boolean,
  us_resident boolean,
  us_passport boolean,
  travel_mileage smallint,
  education_level text,
  hourly_rate_cents int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================
-- RBAC lite
-- =========================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  scope text check (scope in ('platform','organization','team')) not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references public.roles(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  scope_org_id uuid,
  scope_team_id uuid,
  created_at timestamptz not null default now(),
  check (
    (scope_org_id is null and scope_team_id is null)
    or (scope_org_id is not null and scope_team_id is null)
    or (scope_org_id is null and scope_team_id is not null)
  )
);

-- =========================
-- Subscriptions (Stripe friendly)
-- =========================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_type text check (owner_type in ('user','organization')) not null,
  owner_id uuid not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  plan_tier text,
  status text check (status in ('trialing','active','past_due','canceled','incomplete','unpaid')) not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_owner_idx
  on public.subscriptions (owner_type, owner_id, status);

-- =========================
-- helper functions
-- =========================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  fallback_slug text;
begin
  fallback_slug := substr(md5(random()::text), 1, 12);
  insert into public.users (id, username, slug, display_name, created_at, updated_at)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), fallback_slug),
    coalesce(nullif(split_part(new.email, '@', 1), ''), fallback_slug),
    coalesce(new.raw_user_meta_data->>'name', fallback_slug),
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.has_active_subscription(target_org_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1
    from public.subscriptions s
    where s.owner_type = 'organization'
      and s.owner_id = target_org_id
      and s.status = 'active'
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

create or replace function public.set_org_context(p_org_id uuid)
returns void
language sql security definer
as $$
  select set_config('app.org_id', p_org_id::text, true);
$$;

-- =========================
-- views
-- =========================
create or replace view public.v_user_search as
select
  u.id,
  u.slug,
  u.username,
  u.display_name,
  u.headline,
  u.bio,
  u.industry_id,
  u.avatar_url,
  u.avatar_media_id,
  u.open_to_work,
  u.years_of_experience,
  u.skills_summary,
  u.created_at,
  u.updated_at
from public.users u;

create or replace view public.v_user_private as
select
  u.id,
  up.email,
  up.phone,
  up.address,
  up.geo,
  up.contact_prefs,
  up.veteran,
  up.us_resident,
  up.us_passport,
  up.travel_mileage,
  up.education_level,
  up.hourly_rate_cents,
  up.created_at,
  up.updated_at
from public.users u
join public.user_private up on up.user_id = u.id;

alter view public.v_user_search set (security_barrier = on);
alter view public.v_user_private set (security_barrier = on);

grant select on public.v_user_search to anon, authenticated;
grant select on public.v_user_private to authenticated;

-- =========================
-- RLS policies
-- =========================
alter table public.users enable row level security;
alter table public.user_private enable row level security;

drop policy if exists "public can read resume rows" on public.users;
create policy "public can read resume rows"
  on public.users for select
  to anon, authenticated
  using ( true );

drop policy if exists "user can update own resume" on public.users;
create policy "user can update own resume"
  on public.users for update
  to authenticated
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

drop policy if exists "user sees their own PII" on public.user_private;
create policy "user sees their own PII"
  on public.user_private for select
  to authenticated
  using ( user_id = auth.uid() );

drop policy if exists "user manages their own PII" on public.user_private;
create policy "user manages their own PII"
  on public.user_private for insert
  to authenticated
  with check ( user_id = auth.uid() );

drop policy if exists "user updates their own PII" on public.user_private;
create policy "user updates their own PII"
  on public.user_private for update
  to authenticated
  using ( user_id = auth.uid() )
  with check ( user_id = auth.uid() );

drop policy if exists "org with active sub can see PII" on public.user_private;
create policy "org with active sub can see PII"
  on public.user_private for select
  to authenticated
  using (
    current_setting('app.org_id', true) is not null
    and exists (
      select 1
      from public.role_assignments ra
      where ra.user_id = auth.uid()
        and ra.scope_org_id = (current_setting('app.org_id', true))::uuid
    )
    and public.has_active_subscription((current_setting('app.org_id', true))::uuid)
  );

-- =========================
-- helpful indexes
-- =========================
create index if not exists users_bio_trgm_idx
  on public.users using gin ((coalesce(username,'') || ' ' || coalesce(display_name,'') || ' ' || coalesce(bio,'')) gin_trgm_ops);

create index if not exists users_skills_summary_gin_idx
  on public.users using gin (skills_summary jsonb_path_ops);

commit;
