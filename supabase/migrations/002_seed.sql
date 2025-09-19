-- =========================================================
-- 002_seed_users.sql  — Seed ~50 users near Central Michigan
-- Requires: postgis, pgcrypto, citext; profiles + user_private
-- =========================================================
begin;

-- Optional: wipe previous seed data (DEV ONLY)
-- delete from public.user_private;
-- delete from public.profiles where username like 'seeduser_%';

with
-- Central Michigan hubs (lat, lon)
hubs(city, lat, lon) as (
  values
  ('Mount Pleasant', 43.5972, -84.7675),
  ('Midland',        43.6156, -84.2472),
  ('Clare',          43.8195, -84.7689),
  ('Harrison',       44.0192, -84.7992),
  ('Gladwin',        43.9806, -84.4867),
  ('Alma',           43.3789, -84.6597),
  ('St. Louis',      43.4092, -84.6092),
  ('Saginaw',        43.4195, -83.9508),
  ('Bay City',       43.5945, -83.8889),
  ('Big Rapids',     43.6981, -85.4834),
  ('Reed City',      43.8750, -85.5101)
),

first_names(name) as (
  values
  ('Alex'),('Jordan'),('Taylor'),('Casey'),('Riley'),('Avery'),('Parker'),('Morgan'),('Drew'),('Quinn'),
  ('Sam'),('Chris'),('Jamie'),('Reese'),('Skyler'),('Cameron'),('Rowan'),('Hayden'),('Dakota'),('Emerson'),
  ('Logan'),('Harper'),('Finley'),('Sawyer'),('Lennon')
),

last_names(name) as (
  values
  ('Smith'),('Johnson'),('Williams'),('Brown'),('Jones'),('Miller'),('Davis'),('Garcia'),('Rodriguez'),('Wilson'),
  ('Martinez'),('Anderson'),('Taylor'),('Thomas'),('Hernandez'),('Moore'),('Martin'),('Jackson'),('Thompson'),('White'),
  ('Lopez'),('Lee'),('Gonzalez'),('Harris'),('Clark')
),

-- Some resume-ish skill tags to sprinkle in
skill_bank(skill) as (
  values
  ('carpentry'),('framing'),('drywall'),('electrical'),('plumbing'),
  ('hvac'),('concrete'),('roofing'),('welding'),('machining'),
  ('cad'),('estimating'),('osha-30'),('forklift'),('blueprints')
),

-- Build 50 synthetic identities with locations jittered around hubs
seed_rows as (
  select
    gen_random_uuid() as id,
    -- pick names
    (select name from first_names order by random() limit 1) as first_name,
    (select name from last_names order by random() limit 1)  as last_name,
    -- hub selection
    (select city from hubs order by random() limit 1) as base_city,
    (select lat  from hubs order by random() limit 1) as base_lat,
    (select lon  from hubs order by random() limit 1) as base_lon,
    -- username/slug/email
    row_number() over () as n
  from generate_series(1,50)
),

profiles_insert as (
  insert into public.profiles (
    id, username, slug, name, headline, about,
    avatar_url, avatar_media_id, industry_id,
    open_to_work, years_of_experience, skills_summary,
    created_at, updated_at
  )
  select
    s.id,
    lower('seeduser_' || s.n) as username,
    lower('seeduser-' || s.n) as slug,
    (s.first_name || ' ' || s.last_name) as name,
    -- headline & about
    case when random() < 0.5 then 'Skilled Trades Professional' else 'Industrial Technician' end as headline,
    'Experienced in ' || (select string_agg(skill, ', ') from (select skill from skill_bank order by random() limit 3) t) || '.' as about,
    null::text as avatar_url,
    null::uuid as avatar_media_id,
    null::uuid as industry_id,
    (random() < 0.7) as open_to_work,
    (5 + floor(random()*21))::smallint as years_of_experience,  -- 5..25 yrs
    (
      select jsonb_build_object(
        'skills', (select jsonb_agg(skill) from (select skill from skill_bank order by random() limit 5) x)
      )
    )::jsonb as skills_summary,
    now(), now()
  from seed_rows s
  returning id
),

-- Join back to seed_rows to place PII + GEO
joined as (
  select p.id, s.*
  from profiles_insert p
  join seed_rows s on p.id = s.id
)

insert into public.user_private (
  user_id, email, phone, address, geo, contact_prefs,
  veteran, us_resident, us_passport, travel_mileage, education_level,
  hourly_rate_cents, consent_at, created_at, updated_at
)
select
  j.id as user_id,
  (lower(replace(j.first_name,' ',''))
   || '.'
   || lower(replace(j.last_name,' ',''))
   || '.' || j.n::text || '@example.test')::citext as email,
  -- pseudo phone
  ('989-5' || lpad((floor(random()*9000)+1000)::int::text, 4, '0')) as phone,
  jsonb_build_object(
    'street', (case when random()<0.5 then (floor(random()*999)::int || ' Main St') else (floor(random()*999)::int || ' Industrial Dr') end),
    'city', j.base_city,
    'state', 'MI',
    'postal', (lpad((floor(random()*90000)+10000)::int::text,5,'0')),
    'country', 'USA'
  ) as address,
  -- jitter: ~ up to ~35 miles (0.5 degrees) around hub
  st_setsrid(
    st_makepoint(
      j.base_lon + ((random() - 0.5) * 0.8),  -- lon jitter
      j.base_lat + ((random() - 0.5) * 0.8)   -- lat jitter
    ), 4326
  )::geography as geo,
  array['email','phone']::text[] as contact_prefs,
  (random() < 0.1) as veteran,
  true as us_resident,
  (random() < 0.3) as us_passport,
  (10 + floor(random()*91))::smallint as travel_mileage, -- 10..100 mi
  (array['High School','Trade School','Associate','Bachelor','Master'])[ceil(random()*5)] as education_level,
  (2000 + floor(random()*5000))::int as hourly_rate_cents, -- $20.00..$70.00
  now() as consent_at,
  now(), now();

commit;

-- Helpful geo indexes for performance (safe to run repeatedly)
create index if not exists user_private_geo_idx on public.user_private using gist (geo);
create index if not exists profiles_name_trgm_idx
  on public.profiles using gin ((coalesce(username,'') || ' ' || coalesce(name,'') || ' ' || coalesce(headline,'') || ' ' || coalesce(about,'')) gin_trgm_ops);