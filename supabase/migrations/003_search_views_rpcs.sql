-- =========================================================
-- 003_search_views_rpcs.sql
-- Full-text search, PostGIS helpers, RPCs, seed skills
-- Depends on: users, user_private, industries
-- =========================================================

begin;

-- ---------- 1) Full-text search columns + triggers ----------

-- USERS (resume-safe fields) - adapted from profiles
alter table public.users
  add column if not exists search_tsv tsvector;

create or replace function public.users_tsv_update() returns trigger
language plpgsql as $$
begin
  new.search_tsv :=
    setweight(to_tsvector('simple', coalesce(new.username,'')), 'C') ||
    setweight(to_tsvector('simple', coalesce(new.display_name,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.headline,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(new.bio,'')), 'C');
  return new;
end;
$$;

drop trigger if exists trg_users_tsv on public.users;
create trigger trg_users_tsv
before insert or update of username, display_name, headline, bio
on public.users
for each row execute procedure public.users_tsv_update();

-- ---------- 2) Indexes for text + geo ----------

-- FTS
create index if not exists users_tsv_idx on public.users using gin (search_tsv);

-- Geo (you already added some; keep idempotent)
create index if not exists user_private_geo_idx on public.user_private using gist (geo);

-- Useful compound indexes
create index if not exists users_open_to_work_idx on public.users(open_to_work, created_at desc);
create index if not exists users_industry_idx on public.users(industry_id, created_at desc);

-- ---------- 3) Denormalized search views ----------

-- PROFILE SEARCH: users + industry + score (adapted from v_user_search)
create or replace view public.v_profile_search as
select
  u.id,
  u.username,
  u.slug,
  u.display_name as name,
  u.headline,
  u.bio as about,
  u.industry_id,
  i.name as industry_name,
  u.avatar_url,
  u.avatar_media_id,
  u.open_to_work,
  u.years_of_experience,
  u.skills_summary,
  u.created_at,
  u.updated_at,
  u.search_tsv,
  -- Simple scoring based on years of experience and open_to_work
  coalesce(u.years_of_experience, 0) + 
  case when u.open_to_work then 10 else 0 end as gamified_score
from public.users u
left join public.industries i on i.id = u.industry_id;

grant select on public.v_profile_search to anon, authenticated;

-- USER DIRECTORY: users + industry + basic stats
create or replace view public.v_user_directory as
select
  u.id,
  u.username,
  u.slug,
  u.display_name as name,
  u.headline,
  u.industry_id,
  i.name as industry_name,
  u.open_to_work,
  u.years_of_experience,
  u.created_at,
  u.search_tsv
from public.users u
left join public.industries i on i.id = u.industry_id;

grant select on public.v_user_directory to anon, authenticated;

-- ---------- 4) PostGIS helper + RPCs ----------

-- Distance in miles helper (immutable so it can be indexed in expressions)
create or replace function public.distance_miles(a geography, b geography)
returns numeric language sql immutable as $$
  select case when a is null or b is null then null else st_distance(a,b) / 1609.344 end;
$$;

-- Nearby USERS (resume-safe list; PII is still gated at view join time)
create or replace function public.nearby_users(
  p_lon double precision,
  p_lat double precision,
  p_radius_miles double precision default 50
)
returns table (
  id uuid,
  name text,
  headline text,
  years_of_experience smallint,
  miles_away numeric
)
language sql stable as $$
  with center as (
    select st_setsrid(st_makepoint(p_lon, p_lat),4326)::geography as g
  )
  select
    u.id, u.display_name as name, u.headline, u.years_of_experience,
    round(public.distance_miles(up.geo, c.g)::numeric, 2) as miles_away
  from public.users u
  join public.user_private up on up.user_id = u.id
  cross join center c
  where up.geo is not null
    and st_dwithin(up.geo, c.g, p_radius_miles * 1609.344)
  order by miles_away asc;
$$;

-- User search by text (full-text search)
create or replace function public.search_users(
  search_query text,
  limit_count int default 20
)
returns table (
  id uuid,
  name text,
  headline text,
  years_of_experience smallint,
  rank real
)
language sql stable as $$
  select
    u.id,
    u.display_name as name,
    u.headline,
    u.years_of_experience,
    ts_rank(u.search_tsv, plainto_tsquery('simple', search_query)) as rank
  from public.users u
  where u.search_tsv @@ plainto_tsquery('simple', search_query)
  order by rank desc, u.created_at desc
  limit limit_count;
$$;

-- Industry suggestions by prefix (case-insensitive)
create or replace function public.suggest_industries(prefix text, lim int default 10)
returns table (id uuid, name text, slug text)
language sql stable as $$
  select id, name, slug
  from public.industries
  where lower(name) like lower(prefix) || '%'
  order by name asc
  limit lim;
$$;

grant execute on function public.nearby_users(double precision, double precision, double precision) to anon, authenticated;
grant execute on function public.search_users(text, int) to anon, authenticated;
grant execute on function public.suggest_industries(text, int) to anon, authenticated;

-- ---------- 5) Update existing users with search vectors ----------

-- Populate search_tsv for existing users
update public.users 
set search_tsv = 
  setweight(to_tsvector('simple', coalesce(username,'')), 'C') ||
  setweight(to_tsvector('simple', coalesce(display_name,'')), 'A') ||
  setweight(to_tsvector('simple', coalesce(headline,'')), 'B') ||
  setweight(to_tsvector('simple', coalesce(bio,'')), 'C')
where search_tsv is null;

-- ---------- 6) Enhanced RLS policies for search ----------

-- Allow public search on users (resume-safe data only)
drop policy if exists "public can search users" on public.users;
create policy "public can search users"
  on public.users for select
  to anon, authenticated
  using ( true );

-- Update existing policy to be more explicit
drop policy if exists "public can read resume rows" on public.users;
create policy "public can read resume rows"
  on public.users for select
  to anon, authenticated
  using ( true );

commit;
