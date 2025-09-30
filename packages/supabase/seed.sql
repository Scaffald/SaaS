-- =========================================================
-- Development Seed Data
-- This file runs when creating new database branches
-- Creates 50 realistic users with geo data, skills, and profiles
-- =========================================================

begin;

-- =========================================================
-- 1. Basic Industries
-- =========================================================
insert into public.industries (slug, name, description) values
  ('construction', 'Construction', 'Residential and commercial building trades'),
  ('manufacturing', 'Manufacturing', 'Industrial fabrication and assembly'),
  ('transportation', 'Transportation', 'Transportation, warehousing, and supply chain'),
  ('energy', 'Energy', 'Utilities, renewables, and field services')
on conflict (slug) do nothing;

-- =========================================================
-- 2. Basic Skills Taxonomy
-- =========================================================
with industry_lookup as (
  select id, slug from public.industries
),
skill_categories as (
  select * from (values
    -- Construction Industry
    ('carpentry', 'construction', null),
    ('electrical', 'construction', null),
    ('plumbing', 'construction', null),
    ('concrete', 'construction', null),
    ('roofing', 'construction', null),
    ('framing', 'construction', 'carpentry'),
    ('drywall', 'construction', 'carpentry'),
    
    -- Manufacturing Industry
    ('welding', 'manufacturing', null),
    ('machining', 'manufacturing', null),
    ('quality-control', 'manufacturing', null),
    ('assembly', 'manufacturing', null),
    ('cnc-operating', 'manufacturing', 'machining'),
    
    -- Transportation Industry
    ('truck-driving', 'transportation', null),
    ('cdl', 'transportation', 'truck-driving'),
    ('logistics', 'transportation', null),
    ('forklift', 'transportation', null),
    ('warehouse-operations', 'transportation', null),
    
    -- Energy Industry
    ('solar-installation', 'energy', 'electrical'),
    ('hvac', 'energy', null),
    ('power-systems', 'energy', 'electrical'),
    ('field-services', 'energy', null),
    
    -- Safety & Certifications (cross-industry)
    ('osha-30', 'safety', null),
    ('osha-10', 'safety', null),
    ('first-aid', 'safety', null),
    ('cpr', 'safety', null),
    ('confined-space', 'safety', null),
    ('fall-protection', 'safety', null),
    
    -- Technical & Design (cross-industry)
    ('cad', 'technical', null),
    ('blueprints', 'technical', null),
    ('estimating', 'technical', null),
    ('project-management', 'technical', null),
    ('autocad', 'technical', 'cad'),
    ('solidworks', 'technical', 'cad'),
    ('sketchup', 'technical', 'cad'),
    
    -- Soft Skills (cross-industry)
    ('leadership', 'soft-skills', null),
    ('teamwork', 'soft-skills', null),
    ('communication', 'soft-skills', null),
    ('problem-solving', 'soft-skills', null),
    ('time-management', 'soft-skills', null),
    ('customer-service', 'soft-skills', null)
  ) as t(skill_name, category, parent_skill)
),
parent_skills as (
  select id, name from public.skills
),
skill_inserts as (
  insert into public.skills (name, industry_id, parent_id)
  select 
    sc.skill_name,
    case 
      when sc.category = 'construction' then (select id from industry_lookup where slug = 'construction')
      when sc.category = 'manufacturing' then (select id from industry_lookup where slug = 'manufacturing')
      when sc.category = 'transportation' then (select id from industry_lookup where slug = 'transportation')
      when sc.category = 'energy' then (select id from industry_lookup where slug = 'energy')
      else null
    end,
    ps.id
  from skill_categories sc
  left join parent_skills ps on ps.name = sc.parent_skill
  on conflict (name) do nothing
  returning id, name
)
select count(*) as skills_created from skill_inserts;

-- =========================================================
-- 3. Sample Organizations
-- =========================================================
with industry_lookup as (
  select id, slug from public.industries
),
org_data as (
  select * from (values
    ('midland-construction', 'Midland Construction Co.', 'construction', 'Midland', 43.6156, -84.2472),
    ('bay-city-manufacturing', 'Bay City Manufacturing', 'manufacturing', 'Bay City', 43.5945, -83.8889),
    ('saginaw-transportation', 'Saginaw Transportation Solutions', 'transportation', 'Saginaw', 43.4195, -83.9508),
    ('mount-pleasant-energy', 'Mount Pleasant Energy Services', 'energy', 'Mount Pleasant', 43.5972, -84.7675),
    ('detroit-industrial', 'Detroit Industrial Group', 'manufacturing', 'Detroit', 42.3314, -83.0458),
    ('grand-rapids-construction', 'Grand Rapids Construction', 'construction', 'Grand Rapids', 42.9634, -85.6681),
    ('lansing-logistics', 'Lansing Logistics', 'transportation', 'Lansing', 42.7325, -84.5555),
    ('cleveland-energy', 'Cleveland Energy Solutions', 'energy', 'Cleveland', 41.4993, -81.6944)
  ) as t(slug, name, industry_slug, city, lat, lon)
),
org_inserts as (
  insert into public.organizations (owner_user_id, name, slug, industry_id, address, geo)
  select 
    null, -- No owner for seed data
    od.name,
    od.slug,
    il.id,
    jsonb_build_object(
      'street', (floor(random()*999) + 100)::text || ' Industrial Blvd',
      'city', od.city,
      'state', case when od.city in ('Detroit', 'Grand Rapids', 'Lansing', 'Midland', 'Bay City', 'Saginaw', 'Mount Pleasant') then 'MI' else 'OH' end,
      'postal', lpad((floor(random()*90000)+10000)::int::text, 5, '0'),
      'country', 'USA'
    ),
    st_setsrid(st_makepoint(od.lon, od.lat), 4326)::geography
  from org_data od
  join industry_lookup il on il.slug = od.industry_slug
  on conflict (slug) do nothing
  returning id, slug, name
)
select count(*) as organizations_created from org_inserts;

-- =========================================================
-- 4. Sample Affiliate Programs
-- =========================================================
with industry_lookup as (
  select slug, id from public.industries
),
affiliate_rows as (
  select
    (select id from industry_lookup where slug = 'construction') as industry_id,
    'education'::public.affiliate_type as type,
    'OSHA 30-Hour Construction Training' as name,
    'Online certification' as program_type,
    'Complete your OSHA 30 requirement online with an authorized training partner.' as description,
    'Start OSHA 30' as cta_label,
    'https://partners.oshaeducationplatform.test/osha-30-construction?aff_id=scf' as affiliate_url,
    null::text as affiliate_code,
    'Commission: 12% per enrollment' as commission_terms,
    jsonb_build_object('duration_hours', 30, 'format', 'Self-paced', 'provider', 'OSHA-authorized') as metadata,
    true as is_active
  union all
  select
    (select id from industry_lookup where slug = 'manufacturing') as industry_id,
    'education'::public.affiliate_type as type,
    'NIMS CNC Operator Certification Prep' as name,
    'Online cohort' as program_type,
    'Prepare for NIMS credentialing with instructor feedback and practice assessments.' as description,
    'Reserve a seat' as cta_label,
    'https://skillslab.manufacturing.test/cnc-operator?ref=scf' as affiliate_url,
    null::text as affiliate_code,
    'Commission: 8% per enrolled candidate' as commission_terms,
    jsonb_build_object('duration_weeks', 6, 'format', 'Live virtual', 'provider', 'SkillsLab Manufacturing') as metadata,
    true as is_active
)
insert into public.affiliates (
  industry_id,
  type,
  name,
  program_type,
  description,
  cta_label,
  affiliate_url,
  affiliate_code,
  commission_terms,
  metadata,
  is_active
)
select
  industry_id,
  type,
  name,
  program_type,
  description,
  cta_label,
  affiliate_url,
  affiliate_code,
  commission_terms,
  metadata,
  is_active
from affiliate_rows
on conflict (name, affiliate_url) do nothing;

-- =========================================================
-- 5. Realistic User Generation (50 users)
-- =========================================================

-- Geographic hubs for realistic distribution
with hubs(city, state, lat, lon, area_code, postal_prefix) as (
  values
    ('Detroit',        'MI', 42.3314, -83.0458, '313', '482'),
    ('Grand Rapids',   'MI', 42.9634, -85.6681, '616', '495'),
    ('Lansing',        'MI', 42.7325, -84.5555, '517', '489'),
    ('Cleveland',      'OH', 41.4993, -81.6944, '216', '441'),
    ('Columbus',       'OH', 39.9612, -82.9988, '614', '432'),
    ('Cincinnati',     'OH', 39.1031, -84.5120, '513', '452'),
    ('Indianapolis',   'IN', 39.7684, -86.1581, '317', '462'),
    ('Fort Wayne',     'IN', 41.0793, -85.1394, '260', '468'),
    ('Chicago',        'IL', 41.8781, -87.6298, '312', '606'),
    ('Rockford',       'IL', 42.2711, -89.0937, '815', '611'),
    ('Milwaukee',      'WI', 43.0389, -87.9065, '414', '532'),
    ('Madison',        'WI', 43.0731, -89.4012, '608', '537'),
    ('Minneapolis',    'MN', 44.9778, -93.2650, '612', '554'),
    ('Duluth',         'MN', 46.7867, -92.1005, '218', '558'),
    ('Pittsburgh',     'PA', 40.4406, -79.9959, '412', '152'),
    ('Philadelphia',   'PA', 39.9526, -75.1652, '215', '191'),
    ('Buffalo',        'NY', 42.8864, -78.8784, '716', '142'),
    ('Albany',         'NY', 42.6526, -73.7562, '518', '122'),
    ('Rochester',      'NY', 43.1566, -77.6088, '585', '146'),
    ('Newark',         'NJ', 40.7357, -74.1724, '973', '071'),
    ('Jersey City',    'NJ', 40.7178, -74.0431, '201', '073'),
    ('Hartford',       'CT', 41.7658, -72.6734, '860', '061'),
    ('New Haven',      'CT', 41.3083, -72.9279, '203', '065'),
    ('Providence',     'RI', 41.8240, -71.4128, '401', '029'),
    ('Springfield',    'MA', 42.1015, -72.5898, '413', '011'),
    ('Boston',         'MA', 42.3601, -71.0589, '617', '021'),
    ('Manchester',     'NH', 42.9956, -71.4548, '603', '031'),
    ('Burlington',     'VT', 44.4759, -73.2121, '802', '054'),
    ('Portland',       'ME', 43.6591, -70.2568, '207', '041')
),
first_names(name) as (
  values
    ('Alex'),('Jordan'),('Taylor'),('Casey'),('Riley'),('Avery'),('Parker'),('Morgan'),('Drew'),('Quinn'),
    ('Sam'),('Chris'),('Jamie'),('Reese'),('Skyler'),('Cameron'),('Rowan'),('Hayden'),('Dakota'),('Emerson'),
    ('Logan'),('Harper'),('Finley'),('Sawyer'),('Lennon'),('Blake'),('River'),('Phoenix'),('Sage'),('Kai'),
    ('Max'),('Zoe'),('Maya'),('Leo'),('Nova'),('Jade'),('Finn'),('Luna'),('Asher'),('Eli')
),
last_names(name) as (
  values
    ('Smith'),('Johnson'),('Williams'),('Brown'),('Jones'),('Miller'),('Davis'),('Garcia'),('Rodriguez'),('Wilson'),
    ('Martinez'),('Anderson'),('Taylor'),('Thomas'),('Hernandez'),('Moore'),('Martin'),('Jackson'),('Thompson'),('White'),
    ('Lopez'),('Lee'),('Gonzalez'),('Harris'),('Clark'),('Lewis'),('Robinson'),('Walker'),('Hall'),('Allen'),
    ('Young'),('King'),('Wright'),('Scott'),('Torres'),('Nguyen'),('Hill'),('Flores'),('Green'),('Adams')
),
certification_bank(cert) as (
  values
    ('OSHA 10'),('OSHA 30'),('First Aid / CPR'),('CDL Medical Card'),('MSHA Part 48'),('NCCER Core'),('Scaffold Safety'),('Confined Space Training')
),
skill_bank(skill) as (
  values
    ('carpentry'),('framing'),('drywall'),('electrical'),('plumbing'),
    ('hvac'),('concrete'),('roofing'),('welding'),('machining'),
    ('cad'),('estimating'),('osha-30'),('forklift'),('blueprints'),
    ('quality-control'),('assembly'),('cnc-operating'),('truck-driving'),('logistics'),
    ('warehouse-operations'),('solar-installation'),('power-systems'),('field-services'),
    ('leadership'),('teamwork'),('communication'),('problem-solving'),('project-management')
),
industry_lookup as (
  select id, slug from public.industries
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
    format(
      'Based in %s, %s. Experienced in %s.',
      h.city,
      h.state,
      (
        select string_agg(skill, ', ')
        from (
          select skill from skill_bank order by random() limit 3
        ) s
      )
    ) as bio,
    (random() < 0.7) as open_to_work,
    (5 + floor(random()*21))::smallint as years_of_experience,
    (
      select jsonb_build_object(
        'skills', (select jsonb_agg(skill) from (select skill from skill_bank order by random() limit 5) x),
        'primary_location', jsonb_build_object('city', h.city, 'state', h.state),
        'travel_radius_miles', extra.travel_radius
      )
    )::jsonb as skills_summary,
    (select slug from industry_lookup order by random() limit 1) as industry_slug,
    h.city as base_city,
    h.state as base_state,
    h.lat as base_lat,
    h.lon as base_lon,
    extra.street_address,
    extra.postal_code,
    extra.phone,
    extra.availability,
    extra.certifications,
    extra.contact_preferences,
    extra.phone_os,
    extra.drivers_license_class,
    extra.travel_radius,
    (extra.travel_radius > 60) as open_to_travel,
    format('%s, %s', h.city, h.state) as location_label,
    lower(replace(fn.name,' ','')) || '.' || lower(replace(ln.name,' ','')) || '.' || gs.n::text || '@example.test' as email
  from generate_series(1, 50) as gs(n)
  cross join lateral (select name from first_names order by random() limit 1) fn
  cross join lateral (select name from last_names order by random() limit 1) ln
  cross join lateral (select * from hubs order by random() limit 1) h
  cross join lateral (
    select
      format(
        '%s-%s-%s',
        h.area_code,
        lpad((floor(random()*900)::int + 100)::text, 3, '0'),
        lpad((floor(random()*9000)::int + 1000)::text, 4, '0')
      ) as phone,
      format(
        '%s %s %s',
        (100 + floor(random()*900))::int,
        (array['Main','Oak','Maple','Cedar','Pine','Industrial','Market','River','Broad','Center','Union','Heritage'])[ceil(random()*12)::int],
        (array['St','Ave','Blvd','Rd','Dr','Ln','Way','Pl'])[ceil(random()*8)::int]
      ) as street_address,
      h.postal_prefix || lpad((floor(random()*100)::int)::text, 2, '0') as postal_code,
      (case when random() < 0.6 then (80 + floor(random()*141)) else (20 + floor(random()*46)) end)::smallint as travel_radius,
      (array['CDL-A','CDL-B','CDL-C','Standard','Standard','Standard'])[ceil(random()*6)::int] as drivers_license_class,
      (array['iOS','iOS','Android','Android','Android'])[ceil(random()*5)::int] as phone_os,
      coalesce(
        (
          select array_agg(option)
          from (
            select option
            from unnest(array['Weekdays','Weekends','Night Shift','On Call','Overtime','Travel Assignments']) as option
            order by random()
            limit (2 + floor(random()*2))::int
          ) av
        ),
        array['Weekdays','Overtime']
      ) as availability,
      coalesce(
        (
          select array_agg(cert)
          from (
            select cert
            from certification_bank
            order by random()
            limit (1 + floor(random()*3))::int
          ) c
        ),
        array['OSHA 10']
      ) as certifications,
      case when random() < 0.4 then array['email','phone'] else array['email','phone','sms'] end as contact_preferences
  ) extra
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
    jsonb_build_object(
      'provider', 'email',
      'name', s.display_name,
      'first_name', s.first_name,
      'last_name', s.last_name,
      'phone', s.phone,
      'location', s.location_label
    ),
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
  left join industry_lookup ip on ip.slug = s.industry_slug
  on conflict (id) do update
    set username = excluded.username,
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
),

profiles_upsert as (
  insert into public.profiles (
    id,
    name,
    about,
    avatar_path,
    created_at,
    updated_at
  )
  select
    s.id,
    s.display_name,
    s.bio,
    null::text,
    now(),
    now()
  from seed_rows s
  on conflict (id) do update set
    name = excluded.name,
    about = excluded.about,
    updated_at = now()
  returning id
)

insert into public.user_private (
  user_id,
  email,
  phone,
  first_name,
  last_name,
  address,
  geo,
  contact_prefs,
  veteran,
  us_resident,
  us_passport,
  travel_mileage,
  education_level,
  hourly_rate_cents,
  location,
  open_to_travel,
  drivers_license_class,
  phone_os,
  availability,
  certifications,
  created_at,
  updated_at
)
select
  s.id,
  s.email::citext,
  s.phone,
  s.first_name,
  s.last_name,
  jsonb_build_object(
    'street', s.street_address,
    'city', s.base_city,
    'state', s.base_state,
    'postal', s.postal_code,
    'country', 'USA'
  ) as address,
  st_setsrid(
    st_makepoint(
      s.base_lon + ((random() - 0.5) * 0.5),
      s.base_lat + ((random() - 0.5) * 0.5)
    ), 4326
  )::geography as geo,
  s.contact_preferences,
  (random() < 0.1) as veteran,
  true as us_resident,
  (random() < 0.3) as us_passport,
  s.travel_radius,
  (array['High School','Trade School','Associate','Bachelor','Master'])[ceil(random()*5)] as education_level,
  (2000 + floor(random()*5000))::int as hourly_rate_cents,
  s.location_label,
  s.open_to_travel,
  s.drivers_license_class,
  s.phone_os,
  s.availability,
  s.certifications,
  now(),
  now()
from seed_rows s
on conflict (user_id) do update set
  email = excluded.email,
  phone = excluded.phone,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  address = excluded.address,
  geo = excluded.geo,
  contact_prefs = excluded.contact_prefs,
  veteran = excluded.veteran,
  us_resident = excluded.us_resident,
  us_passport = excluded.us_passport,
  travel_mileage = excluded.travel_mileage,
  education_level = excluded.education_level,
  hourly_rate_cents = excluded.hourly_rate_cents,
  location = excluded.location,
  open_to_travel = excluded.open_to_travel,
  drivers_license_class = excluded.drivers_license_class,
  phone_os = excluded.phone_os,
  availability = excluded.availability,
  certifications = excluded.certifications,
  updated_at = now();

commit;
