-- =========================================================
-- 001_init.sql  (Foundational migration)
-- Consolidates your snippet + privacy/RLS + gamification
-- =========================================================

-- -------- Extensions --------
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists postgis;
create extension if not exists pg_trgm;

-- =========================================================
-- Profiles (resume-safe, public search) + RLS
-- =========================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  -- public resume-safe
  username text unique,
  slug text unique,
  name text,
  headline text,
  about text,
  avatar_url text,                 -- external provider default ok
  avatar_media_id uuid,            -- optional: internal media pointer (future)
  industry_id uuid,                -- optional: industries.id (added later if you want)
  open_to_work boolean default false,
  years_of_experience smallint,
  skills_summary jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Public profiles are viewable by everyone.';
  if not found then
    create policy "Public profiles are viewable by everyone."
      on public.profiles for select
      to anon, authenticated
      using ( true );
  end if;
end $$;

do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can insert their own profile.';
  if not found then
    create policy "Users can insert their own profile."
      on public.profiles for insert
      to authenticated
      with check ( auth.uid() = id );
  end if;
end $$;

do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can update own profile.';
  if not found then
    create policy "Users can update own profile."
      on public.profiles for update
      to authenticated
      using ( auth.uid() = id )
      with check ( auth.uid() = id );
  end if;
end $$;

-- Upsert on auth signup (seed profile row)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, slug, name)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), encode(gen_random_bytes(6),'hex')),
    coalesce(nullif(split_part(new.email, '@', 1), ''), encode(gen_random_bytes(6),'hex')),
    coalesce(new.raw_user_meta_data->>'name','')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- PII / sensitive data (gated) + RLS
-- =========================================================
create table if not exists public.user_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
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
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_private enable row level security;

-- Self can view own PII
do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='user_private' and policyname='Self can read own PII';
  if not found then
    create policy "Self can read own PII"
      on public.user_private for select
      to authenticated
      using ( user_id = auth.uid() );
  end if;
end $$;

-- Self can insert/update own PII
do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='user_private' and policyname='Self can upsert own PII';
  if not found then
    create policy "Self can upsert own PII"
      on public.user_private for insert
      to authenticated
      with check ( user_id = auth.uid() );
    create policy "Self can update own PII"
      on public.user_private for update
      to authenticated
      using ( user_id = auth.uid() )
      with check ( user_id = auth.uid() );
  end if;
end $$;

-- =========================================================
-- Subscriptions (Stripe-friendly) + helper + org context
-- =========================================================
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
create index if not exists subscriptions_owner_idx on public.subscriptions (owner_type, owner_id, status);

create or replace function public.has_active_subscription(target_org_id uuid)
returns boolean language sql stable as $$
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
returns void language sql security definer as $$
  select set_config('app.org_id', p_org_id::text, true);
$$;

-- =========================================================
-- Minimal RBAC scope for org membership checks later
-- =========================================================
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  scope text check (scope in ('platform','organization','team')) not null,
  name text not null,
  description text
);

create table if not exists public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  role_id uuid references public.roles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  scope_org_id uuid,  -- FK to organizations(id) when you add orgs
  scope_team_id uuid, -- FK to teams(id) when you add teams
  created_at timestamptz not null default now(),
  check (
    (scope_org_id is null and scope_team_id is null) or
    (scope_org_id is not null and scope_team_id is null) or
    (scope_org_id is null and scope_team_id is not null)
  )
);

-- =========================================================
-- Public & Private Views (search vs gated enrichment)
-- =========================================================
create or replace view public.v_user_search as
select
  p.id,
  p.slug,
  p.username,
  p.name,
  p.headline,
  p.about,
  p.avatar_url,
  p.avatar_media_id,
  p.industry_id,
  p.open_to_work,
  p.years_of_experience,
  p.skills_summary,
  p.created_at,
  p.updated_at
from public.profiles p;

alter view public.v_user_search set (security_barrier = on);
grant select on public.v_user_search to anon, authenticated;

create or replace view public.v_user_private as
select
  p.id,
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
  up.consent_at
from public.profiles p
join public.user_private up on up.user_id = p.id;

alter view public.v_user_private set (security_barrier = on);
grant select on public.v_user_private to authenticated;

-- Gate v_user_private reading (PII) to: self OR org member (via role_assignments) with active subscription
-- RLS is enforced on base table user_private; views just inherit.
do $$ begin
  perform 1 from pg_policies where schemaname='public' and tablename='user_private' and policyname='Org with active sub can read PII';
  if not found then
    create policy "Org with active sub can read PII"
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
  end if;
end $$;

-- =========================================================
-- Storage policies (kept from your snippet)
-- =========================================================
create policy if not exists "Give users access to own folder 1oj01fe_0"
on storage.objects as permissive
for select to public
using ( (bucket_id = 'avatars') and (auth.uid())::text = (storage.foldername(name))[1] );

create policy if not exists "Give users access to own folder 1oj01fe_1"
on storage.objects as permissive
for insert to public
with check ( (bucket_id = 'avatars') and (auth.uid())::text = (storage.foldername(name))[1] );

create policy if not exists "Give users access to own folder 1oj01fe_2"
on storage.objects as permissive
for delete to public
using ( (bucket_id = 'avatars') and (auth.uid())::text = (storage.foldername(name))[1] );

create policy if not exists "Give users access to own folder 1oj01fe_3"
on storage.objects as permissive
for update to public
using ( (bucket_id = 'avatars') and (auth.uid())::text = (storage.foldername(name))[1] );

-- =========================================================
-- Installs (kept)
-- =========================================================
create table if not exists public.installs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expo_tokens text[] default array[]::text[]
);

-- =========================================================
-- Content & engagement (your domain tables, lightly hardened)
-- =========================================================
create table if not exists public.achievements (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  name varchar(255) not null,
  progress integer not null default 0,
  goal integer not null default 1,
  type varchar(50) not null,  -- e.g., 'profile', 'referral', 'activity'
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  unique (profile_id, name)
);

create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name varchar(255) not null unique,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references auth.users(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,
  title varchar(255) not null,
  content text,
  image_url varchar(255),
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);
create index if not exists posts_profile_created_idx on public.posts(profile_id, created_at desc);

create table if not exists public.user_stats (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references auth.users(id) on delete cascade,
  mrr numeric(10,2),
  arr numeric(10,2),
  weekly_post_views integer,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  unique (profile_id)
);

create table if not exists public.referrals (
  id uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references auth.users(id) on delete cascade,
  referred_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp,
  unique (referrer_id, referred_id),
  check (referrer_id <> referred_id)
);

-- =========================================================
-- Projects (kept, with optional timeline/geo fields)
-- =========================================================
create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references auth.users(id) on delete set null,
  name varchar(255) not null,
  description text,
  number_of_days int,
  paid_project boolean default false,
  street varchar(255),
  us_zip_code varchar(10),
  project_type varchar(50),
  -- optional extras for richer matching; safe to ignore in app if unused
  start_date date,
  end_date date,
  address jsonb,
  geo geography(Point,4326),
  employer_name text,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);
create index if not exists projects_profile_idx on public.projects(profile_id);

-- =========================================================
-- Gamification: computed user score (view)
-- Adjust weights as you learn; this is a sane starting point.
-- =========================================================
-- Helper: recent activity counts (last 30 days)
create or replace view public.v_user_activity_30d as
select
  p.id as profile_id,
  count(po.id) filter (where po.created_at > now() - interval '30 days') as posts_30d,
  coalesce(sum(us.weekly_post_views),0) as weekly_views -- your stat table
from public.profiles p
left join public.posts po on po.profile_id = p.id
left join public.user_stats us on us.profile_id = p.id
group by p.id;

-- Helper: referral counts
create or replace view public.v_user_referrals as
select
  p.id as profile_id,
  count(r.id) as referral_count
from public.profiles p
left join public.referrals r on r.referrer_id = p.id
group by p.id;

-- Helper: profile completion ratio (very simple heuristic)
create or replace view public.v_profile_completion as
select
  p.id as profile_id,
  (
    (case when p.name is not null and length(p.name) > 0 then 1 else 0 end) +
    (case when p.headline is not null and length(p.headline) > 0 then 1 else 0 end) +
    (case when p.about is not null and length(p.about) > 0 then 1 else 0 end) +
    (case when p.avatar_url is not null or p.avatar_media_id is not null then 1 else 0 end) +
    (case when p.skills_summary is not null and p.skills_summary <> '{}'::jsonb then 1 else 0 end)
  )::numeric / 5.0 as completion_ratio
from public.profiles p;

-- Final: overall score (0..100)
-- Weights: completion 50, referrals 30, activity 20
-- Referrals are log-scaled; activity rewards posts/views modestly.
create or replace view public.v_user_score as
with
  c as (select * from public.v_profile_completion),
  r as (select * from public.v_user_referrals),
  a as (select * from public.v_user_activity_30d)
select
  p.id as profile_id,
  round(
    least(1.0, coalesce(c.completion_ratio,0)) * 50
    + (least(1.0, ln(1 + coalesce(r.referral_count,0)) / ln(10))) * 30
    + (least(1.0,
        (coalesce(a.posts_30d,0) / 10.0) * 0.7
        + (least(coalesce(a.weekly_views,0), 1000) / 1000.0) * 0.3
      )) * 20
  )::int as score,
  coalesce(c.completion_ratio,0)       as completion_ratio,
  coalesce(r.referral_count,0)         as referral_count,
  coalesce(a.posts_30d,0)              as posts_last_30d,
  coalesce(a.weekly_views,0)           as weekly_views
from public.profiles p
left join c on c.profile_id = p.id
left join r on r.profile_id = p.id
left join a on a.profile_id = p.id;

-- Helpful indexes for search
create index if not exists profiles_search_trgm_idx
  on public.profiles using gin ((coalesce(username,'') || ' ' || coalesce(name,'') || ' ' || coalesce(headline,'') || ' ' || coalesce(about,'')) gin_trgm_ops);

create index if not exists posts_created_idx on public.posts(created_at desc);

-- =========================================================
-- (Optional) Grants on views for clients
-- =========================================================
grant select on public.v_user_score to anon, authenticated;
grant select on public.v_user_activity_30d to authenticated;
grant select on public.v_user_referrals to authenticated;
grant select on public.v_profile_completion to authenticated;