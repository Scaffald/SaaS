-- =========================================================
-- 002_seed.sql — seed industries and 50 Central Michigan users
-- =========================================================
begin;

-- Upsert a small industry catalog
with industry_rows(slug, name, description) as (
  values
    ('construction', 'Construction', 'Residential and commercial building trades'),
    ('manufacturing', 'Manufacturing', 'Industrial fabrication and assembly'),
    ('transportation', 'Transportation', 'Transportation, warehousing, and supply chain'),
    ('energy', 'Energy', 'Utilities, renewables, and field services')
),
upserted_industries as (
  insert into public.industries (slug, name, description, updated_at)
  select r.slug, r.name, r.description, now()
  from industry_rows r
  on conflict (slug) do update
    set name = excluded.name,
        description = excluded.description,
        updated_at = now()
  returning id, slug
),
industry_pool as (
  select distinct on (slug) slug, id
  from (
    select slug, id from upserted_industries
    union all
    select r.slug, i.id
    from industry_rows r
    join public.industries i on i.slug = r.slug
  ) s
),

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
skill_bank(skill) as (
  values
    ('carpentry'),('framing'),('drywall'),('electrical'),('plumbing'),
    ('hvac'),('concrete'),('roofing'),('welding'),('machining'),
    ('cad'),('estimating'),('osha-30'),('forklift'),('blueprints')
),
seed_rows as (
  select
    gen_random_uuid() as id,
    gs.n,
    fn.name as first_name,
    ln.name as last_name,
    (fn.name || ' ' || ln.name) as display_name,
    lower('seeduser_' || gs.n::text) as username,
    lower('seeduser-' || gs.n::text) as slug,
    case when random() < 0.5 then 'Skilled Trades Professional' else 'Industrial Technician' end as headline,
    'Experienced in ' || (
      select string_agg(skill, ', ')
      from (
        select skill from skill_bank order by random() limit 3
      ) s
    ) || '.' as bio,
    (random() < 0.7) as open_to_work,
    (5 + floor(random()*21))::smallint as years_of_experience,
    (
      select jsonb_build_object(
        'skills', (select jsonb_agg(skill) from (select skill from skill_bank order by random() limit 5) x)
      )
    )::jsonb as skills_summary,
    (select slug from industry_pool order by random() limit 1) as industry_slug,
    (select city from hubs order by random() limit 1) as base_city,
    (select lat from hubs order by random() limit 1) as base_lat,
    (select lon from hubs order by random() limit 1) as base_lon,
    lower(replace(fn.name,' ','')) || '.' || lower(replace(ln.name,' ','')) || '.' || gs.n::text || '@example.test' as email
  from generate_series(1, 50) as gs(n)
  cross join lateral (select name from first_names order by random() limit 1) fn
  cross join lateral (select name from last_names order by random() limit 1) ln
),

user_accounts as (
  insert into auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    is_super_admin
  )
  select
    s.id,
    '00000000-0000-0000-0000-000000000000'::uuid,
    s.email,
    crypt('SeedUser123!', gen_salt('bf')),
    now(),
    now(),
    jsonb_build_object('provider', 'email'),
    jsonb_build_object('name', s.display_name),
    'authenticated',
    'authenticated',
    now(),
    now(),
    false
  from seed_rows s
  on conflict (id) do update set
    email = excluded.email,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = excluded.updated_at
  returning id
),

users_upsert as (
  insert into public.users (
    id, username, slug, display_name, headline, bio, industry_id,
    avatar_url, avatar_media_id, open_to_work, years_of_experience, skills_summary,
    created_at, updated_at
  )
  select
    s.id,
    s.username,
    s.slug,
    s.display_name,
    s.headline,
    s.bio,
    ip.id,
    null::text as avatar_url,
    null::uuid as avatar_media_id,
    s.open_to_work,
    s.years_of_experience,
    s.skills_summary,
    now(), now()
  from seed_rows s
  left join industry_pool ip on ip.slug = s.industry_slug
  on conflict (id) do update set
    username = excluded.username,
    slug = excluded.slug,
    display_name = excluded.display_name,
    headline = excluded.headline,
    bio = excluded.bio,
    industry_id = excluded.industry_id,
    avatar_url = excluded.avatar_url,
    avatar_media_id = excluded.avatar_media_id,
    open_to_work = excluded.open_to_work,
    years_of_experience = excluded.years_of_experience,
    skills_summary = excluded.skills_summary,
    updated_at = now()
  returning id
)

insert into public.user_private (
  user_id,
  email,
  phone,
  address,
  geo,
  contact_prefs,
  veteran,
  us_resident,
  us_passport,
  travel_mileage,
  education_level,
  hourly_rate_cents,
  created_at,
  updated_at
)
select
  s.id,
  s.email::citext,
  ('989-5' || lpad((floor(random()*9000)+1000)::int::text, 4, '0')) as phone,
  jsonb_build_object(
    'street', (case when random()<0.5 then (floor(random()*999)::int || ' Main St') else (floor(random()*999)::int || ' Industrial Dr') end),
    'city', s.base_city,
    'state', 'MI',
    'postal', lpad((floor(random()*90000)+10000)::int::text,5,'0'),
    'country', 'USA'
  ) as address,
  st_setsrid(
    st_makepoint(
      s.base_lon + ((random() - 0.5) * 0.8),
      s.base_lat + ((random() - 0.5) * 0.8)
    ), 4326
  )::geography as geo,
  array['email','phone']::text[] as contact_prefs,
  (random() < 0.1) as veteran,
  true as us_resident,
  (random() < 0.3) as us_passport,
  (10 + floor(random()*91))::smallint as travel_mileage,
  (array['High School','Trade School','Associate','Bachelor','Master'])[ceil(random()*5)] as education_level,
  (2000 + floor(random()*5000))::int as hourly_rate_cents,
  now(),
  now()
from seed_rows s
on conflict (user_id) do update set
  email = excluded.email,
  phone = excluded.phone,
  address = excluded.address,
  geo = excluded.geo,
  contact_prefs = excluded.contact_prefs,
  veteran = excluded.veteran,
  us_resident = excluded.us_resident,
  us_passport = excluded.us_passport,
  travel_mileage = excluded.travel_mileage,
  education_level = excluded.education_level,
  hourly_rate_cents = excluded.hourly_rate_cents,
  updated_at = now();

commit;
