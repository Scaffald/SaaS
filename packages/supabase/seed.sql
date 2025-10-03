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
  where sc.category != 'construction'  -- Skip construction skills, will be seeded via CSI taxonomy
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
unique_people(n, first_name, last_name, headline, specialty) as (
  values
    (1, 'Marcus', 'Washington', 'Master Electrician & Safety Instructor', 'electrical,osha-30,leadership'),
    (2, 'Sarah', 'Chen', 'Licensed Plumber & Project Manager', 'plumbing,project-management,blueprints'),
    (3, 'James', 'Rodriguez', 'Certified Welder (AWS D1.1)', 'welding,quality-control,teamwork'),
    (4, 'Emily', 'Thompson', 'HVAC Technician & EPA Certified', 'hvac,troubleshooting,customer-service'),
    (5, 'David', 'Martinez', 'Heavy Equipment Operator', 'crane-operation,safety,communication'),
    (6, 'Jennifer', 'Anderson', 'Commercial Carpenter & Foreman', 'carpentry,framing,leadership'),
    (7, 'Michael', 'Taylor', 'CNC Machinist & Programmer', 'cnc-operating,machining,cad'),
    (8, 'Lisa', 'Moore', 'Industrial Electrician', 'electrical,plc,troubleshooting'),
    (9, 'Robert', 'Jackson', 'CDL-A Driver & Logistics Coordinator', 'truck-driving,logistics,time-management'),
    (10, 'Maria', 'Garcia', 'Quality Control Inspector', 'quality-control,documentation,problem-solving'),
    (11, 'Christopher', 'White', 'Solar Installation Specialist', 'solar-installation,electrical,roofing'),
    (12, 'Ashley', 'Harris', 'Concrete Finisher & Formwork Specialist', 'concrete,formwork,precision'),
    (13, 'Daniel', 'Martin', 'Industrial Maintenance Technician', 'maintenance,welding,electrical'),
    (14, 'Jessica', 'Lee', 'CAD Designer & Estimator', 'cad,estimating,solidworks'),
    (15, 'Matthew', 'Clark', 'Pipefitter & Steamfitter', 'pipefitting,welding,blueprints'),
    (16, 'Amanda', 'Lewis', 'Warehouse Manager & Forklift Trainer', 'warehouse-operations,forklift,leadership'),
    (17, 'Joshua', 'Walker', 'Roofing Contractor & Safety Officer', 'roofing,fall-protection,osha-30'),
    (18, 'Nicole', 'Hall', 'Manufacturing Engineer', 'process-improvement,quality-control,lean-manufacturing'),
    (19, 'Andrew', 'Young', 'Drywall Installer & Finisher', 'drywall,taping,finishing'),
    (20, 'Stephanie', 'King', 'Field Service Technician', 'field-services,troubleshooting,customer-service'),
    (21, 'Brandon', 'Wright', 'Structural Welder & Fabricator', 'welding,fabrication,blueprints'),
    (22, 'Rachel', 'Scott', 'Assembly Line Supervisor', 'assembly,leadership,lean-manufacturing'),
    (23, 'Kevin', 'Torres', 'Millwright & Precision Alignment', 'millwright,alignment,maintenance'),
    (24, 'Lauren', 'Nguyen', 'AutoCAD Specialist & Detailer', 'autocad,detailing,technical-drawing'),
    (25, 'Tyler', 'Hill', 'Journeyman Electrician', 'electrical,residential,commercial'),
    (26, 'Megan', 'Flores', 'Paint & Coating Specialist', 'painting,coating,surface-prep'),
    (27, 'Justin', 'Green', 'Excavator Operator & Site Foreman', 'excavation,grading,site-management'),
    (28, 'Brittany', 'Adams', 'HVAC Service Manager', 'hvac,customer-service,scheduling'),
    (29, 'Ryan', 'Baker', 'Precision Machinist', 'machining,measurement,quality'),
    (30, 'Samantha', 'Nelson', 'Electrical Apprentice & Student', 'electrical,learning,safety'),
    (31, 'Eric', 'Carter', 'Bridge & Highway Construction', 'concrete,rebar,heavy-civil'),
    (32, 'Angela', 'Mitchell', 'Insulation Installer', 'insulation,energy-efficiency,safety'),
    (33, 'Brian', 'Perez', 'Diesel Mechanic & Fleet Maintenance', 'diesel-repair,diagnostics,preventive-maintenance'),
    (34, 'Melissa', 'Roberts', 'Crane Operator (CCO Certified)', 'crane-operation,rigging,safety'),
    (35, 'Jason', 'Turner', 'Sheet Metal Fabricator', 'sheet-metal,fabrication,precision'),
    (36, 'Heather', 'Phillips', 'Construction Project Coordinator', 'project-management,scheduling,communication'),
    (37, 'Aaron', 'Campbell', 'Fire Sprinkler Installer', 'sprinkler-systems,welding,nfpa'),
    (38, 'Amy', 'Parker', 'CNC Operator & Setup Technician', 'cnc-operating,tooling,quality'),
    (39, 'Nathan', 'Evans', 'Industrial Painter', 'industrial-painting,coating,surface-prep'),
    (40, 'Laura', 'Edwards', 'Inventory Control Specialist', 'inventory-management,data-entry,organization'),
    (41, 'Jacob', 'Collins', 'Glazier & Window Installer', 'glass-installation,measuring,safety'),
    (42, 'Michelle', 'Stewart', 'Production Scheduler', 'scheduling,erp-systems,coordination'),
    (43, 'Jordan', 'Sanchez', 'Power Lineman & Utility Worker', 'power-systems,climbing,safety'),
    (44, 'Kimberly', 'Morris', 'Industrial Hygienist', 'safety,testing,compliance'),
    (45, 'Nicholas', 'Rogers', 'Tile Setter & Flooring Specialist', 'tile,flooring,layout'),
    (46, 'Rebecca', 'Reed', 'Shipping & Receiving Coordinator', 'logistics,inventory,documentation'),
    (47, 'Adam', 'Cook', 'Boilermaker & Pressure Vessel Welder', 'welding,boilermaking,confined-space'),
    (48, 'Catherine', 'Morgan', 'Quality Assurance Engineer', 'quality-control,iso-certification,auditing'),
    (49, 'Sean', 'Bell', 'Landscaping & Site Development', 'landscaping,grading,equipment-operation'),
    (50, 'Diana', 'Murphy', 'Industrial Electrician & PLC Programmer', 'electrical,plc,automation')
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
    up.n,
    up.first_name,
    up.last_name,
    (up.first_name || ' ' || up.last_name) as display_name,
    lower('seeduser_' || up.n::text) as username,
    lower('seeduser-' || up.n::text) as slug,
    up.headline,
    format(
      'Based in %s, %s with %s years of experience. Specializing in %s. %s',
      h.city,
      h.state,
      (5 + floor(random()*21))::text,
      up.headline,
      case 
        when random() < 0.3 then 'Available for immediate start.'
        when random() < 0.6 then 'Open to contract and permanent positions.'
        else 'Seeking challenging opportunities in the field.'
      end
    ) as bio,
    (random() < 0.7) as open_to_work,
    (5 + floor(random()*21))::smallint as years_of_experience,
    (
      select jsonb_build_object(
        'skills', (
          select jsonb_agg(skill) 
          from unnest(string_to_array(up.specialty, ',')) as skill
        ),
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
    lower(replace(up.first_name,' ','')) || '.' || lower(replace(up.last_name,' ','')) || '.' || up.n::text || '@example.test' as email
  from unique_people up
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

-- =========================================================
-- ATS Pipelines & Applications
-- =========================================================

with org_lookup as (
  select slug, id
  from public.organizations
  where slug in (
    'midland-construction',
    'bay-city-manufacturing',
    'saginaw-transportation'
  )
), pipeline_values as (
  select *
  from (values
    ('midland_default', '16ccfce4-9695-470c-b3c7-26bdc02da0c2', 'midland-construction', 'Default Hiring Pipeline', 'General hiring flow covering screening through onboarding.', true),
    ('midland_trades', 'd941995f-d4af-4d88-8e34-14956fdc4067', 'midland-construction', 'Skilled Trades Pipeline', 'Hands-on field roles with trade assessments.', false),
    ('baycity_default', '8b86087a-a163-4bd1-b46a-3ef20297031d', 'bay-city-manufacturing', 'Manufacturing Pipeline', 'Standard pipeline for plant roles.', true),
    ('baycity_trades', '66a4ae76-78e5-41d3-821b-6bf3d9ff28fa', 'bay-city-manufacturing', 'Technical Maintenance Pipeline', 'Advanced maintenance and reliability roles.', false),
    ('saginaw_default', 'e9b6393a-6bb7-41a0-9e8f-081467030c01', 'saginaw-transportation', 'Logistics Pipeline', 'Default flow for drivers and dispatchers.', true),
    ('saginaw_operations', 'c6267902-0bb4-4094-9c79-13d90fd86455', 'saginaw-transportation', 'Operations Support Pipeline', 'Coordinators and dispatch support roles.', false)
  ) as t(pipeline_key, pipeline_id, org_slug, name, description, is_default)
)
insert into public.pipelines (id, organization_id, name, description, is_default)
select
  pipeline_id::uuid,
  o.id,
  name,
  description,
  is_default
from pipeline_values pv
join org_lookup o on o.slug = pv.org_slug
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      is_default = excluded.is_default,
      updated_at = now();

with pipeline_lookup as (
  select * from (values
    ('midland_default', '16ccfce4-9695-470c-b3c7-26bdc02da0c2'::uuid),
    ('midland_trades', 'd941995f-d4af-4d88-8e34-14956fdc4067'::uuid),
    ('baycity_default', '8b86087a-a163-4bd1-b46a-3ef20297031d'::uuid),
    ('baycity_trades', '66a4ae76-78e5-41d3-821b-6bf3d9ff28fa'::uuid),
    ('saginaw_default', 'e9b6393a-6bb7-41a0-9e8f-081467030c01'::uuid),
    ('saginaw_operations', 'c6267902-0bb4-4094-9c79-13d90fd86455'::uuid)
  ) as t(pipeline_key, pipeline_id)
), stage_values as (
  select *
  from (values
    ('midland_default_applied', '93401cfb-d749-491f-8d4e-755337f7a4d4', 'midland_default', 'Applied', 'Application received', 1, '#2563EB', 3),
    ('midland_default_screen', '755980a7-b2e6-419c-b2d8-08f755490d7b', 'midland_default', 'Screen', 'Initial recruiter screen', 2, '#0EA5E9', 5),
    ('midland_default_interview', 'ee70bbe2-1a98-40eb-a2bc-c414da3ff843', 'midland_default', 'Interview', 'Hiring manager interviews', 3, '#F97316', 7),
    ('midland_default_offer', 'd2c0ffc6-f703-479c-8b8c-1416cfb09f42', 'midland_default', 'Offer', 'Offer & approvals', 4, '#FACC15', 5),
    ('midland_default_hired', '77c71fe9-2a8c-42ef-9d12-93d49f1bcab0', 'midland_default', 'Hired', 'Offer accepted & onboarding', 5, '#22C55E', 0),
    ('midland_default_rejected', 'c07af6b7-a41e-4125-b546-b205c41cb6d9', 'midland_default', 'Rejected', 'Archived candidates', 6, '#EF4444', 0),

    ('midland_trades_applied', '7637f6a1-6768-4710-b070-5d0fbe4ebabf', 'midland_trades', 'Applied', 'Application received', 1, '#2563EB', 2),
    ('midland_trades_screen', '2a2f8263-9109-4840-9ce6-bf8fa1da4a71', 'midland_trades', 'Screen', 'Trades recruiter screen', 2, '#0EA5E9', 4),
    ('midland_trades_interview', '699ec0a9-94cd-436f-8010-fa9bc68ae005', 'midland_trades', 'Interview', 'Hands-on assessment', 3, '#F97316', 6),
    ('midland_trades_offer', 'e32ea005-7296-4768-aa8e-1d955d14da40', 'midland_trades', 'Offer', 'Offer & verification', 4, '#FACC15', 4),
    ('midland_trades_hired', '45267e08-0ef3-422a-bd59-e3e21027ed6e', 'midland_trades', 'Hired', 'Start date scheduled', 5, '#22C55E', 0),
    ('midland_trades_rejected', '13fc37c9-3d63-4716-937c-67ba5fde83b8', 'midland_trades', 'Rejected', 'Did not meet requirements', 6, '#EF4444', 0),

    ('baycity_default_applied', 'da6f9c42-5a44-4832-a4a6-e8730e78e721', 'baycity_default', 'Applied', 'Application received', 1, '#2563EB', 3),
    ('baycity_default_screen', 'd1d8bb24-8561-4803-a5e4-b8f39e6f5f82', 'baycity_default', 'Screen', 'HR screen', 2, '#0EA5E9', 4),
    ('baycity_default_interview', '998de0a1-d155-491a-9f19-38d4c187e242', 'baycity_default', 'Interview', 'Plant leadership interviews', 3, '#F97316', 6),
    ('baycity_default_offer', 'cf464446-9a59-46ee-8f36-8da7c46f6883', 'baycity_default', 'Offer', 'Offer negotiation', 4, '#FACC15', 5),
    ('baycity_default_hired', '2336da71-8e8c-46dd-8263-2d0c6f1df919', 'baycity_default', 'Hired', 'Onboarding scheduled', 5, '#22C55E', 0),
    ('baycity_default_rejected', '0ad53efc-9e2c-4c16-a390-796dcf094bcc', 'baycity_default', 'Rejected', 'Archived', 6, '#EF4444', 0),

    ('baycity_trades_applied', 'f68c93f1-fe07-47e1-adaf-28d620d5346d', 'baycity_trades', 'Applied', 'Application received', 1, '#2563EB', 2),
    ('baycity_trades_screen', 'c6b55445-0c3f-4274-b81a-ec4d4507ecd4', 'baycity_trades', 'Screen', 'Technical phone screen', 2, '#0EA5E9', 4),
    ('baycity_trades_interview', '3e40b6ba-debd-4b4f-82c7-b65d37874560', 'baycity_trades', 'Interview', 'Panel interview', 3, '#F97316', 6),
    ('baycity_trades_offer', '4a7db62e-461c-4843-85e6-3a9539eeef97', 'baycity_trades', 'Offer', 'Offer & approvals', 4, '#FACC15', 4),
    ('baycity_trades_hired', '26ef3ace-bbc9-423f-8063-daf0cbfefff7', 'baycity_trades', 'Hired', 'Onboarding scheduled', 5, '#22C55E', 0),
    ('baycity_trades_rejected', 'b2786788-1261-467c-bb95-87118f69b19c', 'baycity_trades', 'Rejected', 'Archived', 6, '#EF4444', 0),

    ('saginaw_default_applied', '191ec5f9-0beb-4d04-98c5-44a36863f32d', 'saginaw_default', 'Applied', 'Application received', 1, '#2563EB', 3),
    ('saginaw_default_screen', '44fd80bf-d003-4ce3-9402-85de23f448de', 'saginaw_default', 'Screen', 'Dispatcher screen', 2, '#0EA5E9', 4),
    ('saginaw_default_interview', '270532eb-976f-4200-9372-65c2591ac617', 'saginaw_default', 'Interview', 'Ride-along & manager interview', 3, '#F97316', 7),
    ('saginaw_default_offer', '93b5a3b5-3c09-45ae-8cbb-76de3ef65aa9', 'saginaw_default', 'Offer', 'Offer & compliance', 4, '#FACC15', 5),
    ('saginaw_default_hired', 'd99c4379-00d5-4c61-af11-33e9aa1ed399', 'saginaw_default', 'Hired', 'Orientation scheduled', 5, '#22C55E', 0),
    ('saginaw_default_rejected', '0dad9984-84c6-45d6-a214-44b68aa4df2f', 'saginaw_default', 'Rejected', 'Archived', 6, '#EF4444', 0),

    ('saginaw_operations_applied', '92de2904-c594-4f39-9b9c-fc15861f8750', 'saginaw_operations', 'Applied', 'Application received', 1, '#2563EB', 2),
    ('saginaw_operations_screen', 'f6dce416-814f-466f-94a4-ecc9945086a5', 'saginaw_operations', 'Screen', 'Operations screen', 2, '#0EA5E9', 3),
    ('saginaw_operations_interview', '15df9375-f5a7-4784-b5f2-61c8c1d358d1', 'saginaw_operations', 'Interview', 'Panel interview', 3, '#F97316', 5),
    ('saginaw_operations_offer', 'c68887b0-f32a-40bd-ac82-0fc8602b14c5', 'saginaw_operations', 'Offer', 'Offer approvals', 4, '#FACC15', 4),
    ('saginaw_operations_hired', '42e88f3f-fa80-42c8-ab4b-1cb8ef6050bd', 'saginaw_operations', 'Hired', 'Orientation scheduled', 5, '#22C55E', 0),
    ('saginaw_operations_rejected', 'b8ddb71b-22f7-4a6b-96d7-6adaa59cc503', 'saginaw_operations', 'Rejected', 'Archived', 6, '#EF4444', 0)
  ) as t(stage_key, stage_id, pipeline_key, name, description, stage_order, color, sla_days)
)
insert into public.pipeline_stages (id, pipeline_id, name, description, stage_order, color, sla_days)
select
  stage_id::uuid,
  pl.pipeline_id,
  name,
  description,
  stage_order,
  color,
  sla_days
from stage_values sv
join pipeline_lookup pl on pl.pipeline_key = sv.pipeline_key
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description,
      stage_order = excluded.stage_order,
      color = excluded.color,
      sla_days = excluded.sla_days,
      updated_at = now();

with org_lookup as (
  select slug, id
  from public.organizations
  where slug in (
    'midland-construction',
    'bay-city-manufacturing',
    'saginaw-transportation'
  )
), job_values as (
  select *
  from (values
    ('midland_field_superintendent', 'midland-construction', 'Field Superintendent', 'Oversee field crews and ensure quality across active job sites.', 'open', 'full_time', 'on_site', 'Midland, MI', 'midland-field-superintendent', 21, 'midland_default'),
    ('midland_journeyman_electrician', 'midland-construction', 'Journeyman Electrician', 'Install and service electrical systems across commercial builds.', 'open', 'full_time', 'on_site', 'Saginaw, MI', 'midland-journeyman-electrician', 10, 'midland_trades'),
    ('baycity_line_operator', 'bay-city-manufacturing', 'Production Line Operator', 'Operate automated packaging lines using lean manufacturing practices.', 'open', 'full_time', 'on_site', 'Bay City, MI', 'baycity-production-line-operator', 18, 'baycity_default'),
    ('baycity_maintenance_tech', 'bay-city-manufacturing', 'Maintenance Technician', 'Perform preventative maintenance on CNC and fabrication equipment.', 'open', 'full_time', 'on_site', 'Bay City, MI', 'baycity-maintenance-technician', 8, 'baycity_trades'),
    ('saginaw_route_driver', 'saginaw-transportation', 'Route Driver', 'Deliver freight across the tri-city region with daily home time.', 'open', 'full_time', 'on_site', 'Saginaw, MI', 'saginaw-route-driver', 25, 'saginaw_default'),
    ('saginaw_dispatch_specialist', 'saginaw-transportation', 'Dispatch Specialist', 'Coordinate drivers, routes, and after-hours escalations.', 'open', 'full_time', 'hybrid', 'Saginaw, MI', 'saginaw-dispatch-specialist', 5, 'saginaw_operations')
  ) as t(job_key, org_slug, title, description, status, employment_type, remote_option, location, slug, posted_days_ago, pipeline_key)
)
insert into public.jobs (organization_id, title, description, status, employment_type, remote_option, location, slug, posted_at, created_at, updated_at)
select
  o.id,
  j.title,
  j.description,
  j.status,
  j.employment_type,
  j.remote_option,
  j.location,
  j.slug,
  now() - (j.posted_days_ago || ' days')::interval,
  now(),
  now()
from job_values j
join org_lookup o on o.slug = j.org_slug
on conflict (slug) do update
  set title = excluded.title,
      description = excluded.description,
      status = excluded.status,
      employment_type = excluded.employment_type,
      remote_option = excluded.remote_option,
      location = excluded.location,
      posted_at = excluded.posted_at,
      updated_at = now();

with job_values as (
  select *
  from (values
    ('midland_field_superintendent', 'midland-field-superintendent', 'midland_default'),
    ('midland_journeyman_electrician', 'midland-journeyman-electrician', 'midland_trades'),
    ('baycity_line_operator', 'baycity-production-line-operator', 'baycity_default'),
    ('baycity_maintenance_tech', 'baycity-maintenance-technician', 'baycity_trades'),
    ('saginaw_route_driver', 'saginaw-route-driver', 'saginaw_default'),
    ('saginaw_dispatch_specialist', 'saginaw-dispatch-specialist', 'saginaw_operations')
  ) as t(job_key, slug, pipeline_key)
), jobs as (
  select j.job_key, jb.id, j.pipeline_key
  from job_values j
  join public.jobs jb on jb.slug = j.slug
), pipeline_lookup as (
  select * from (values
    ('midland_default', '16ccfce4-9695-470c-b3c7-26bdc02da0c2'::uuid),
    ('midland_trades', 'd941995f-d4af-4d88-8e34-14956fdc4067'::uuid),
    ('baycity_default', '8b86087a-a163-4bd1-b46a-3ef20297031d'::uuid),
    ('baycity_trades', '66a4ae76-78e5-41d3-821b-6bf3d9ff28fa'::uuid),
    ('saginaw_default', 'e9b6393a-6bb7-41a0-9e8f-081467030c01'::uuid),
    ('saginaw_operations', 'c6267902-0bb4-4094-9c79-13d90fd86455'::uuid)
  ) as t(pipeline_key, pipeline_id)
)
insert into public.job_pipelines (job_id, pipeline_id, assigned_by)
select
  jobs.id,
  pl.pipeline_id,
  null::uuid
from jobs
join pipeline_lookup pl on pl.pipeline_key = jobs.pipeline_key
on conflict (job_id, pipeline_id) do update
  set assigned_by = excluded.assigned_by;

with user_lookup as (
  select slug, id
  from public.users
  where slug in (
    'seeduser-1','seeduser-2','seeduser-3','seeduser-4',
    'seeduser-5','seeduser-6','seeduser-7','seeduser-8'
  )
), job_lookup as (
  select slug, id
  from public.jobs
  where slug in (
    'midland-field-superintendent',
    'midland-journeyman-electrician',
    'baycity-production-line-operator',
    'baycity-maintenance-technician',
    'saginaw-route-driver',
    'saginaw-dispatch-specialist'
  )
), candidate_link_values as (
  select *
  from (values
    ('e259e34f-ef5a-4fe8-8f1f-25cce6b0ee97', 'saginaw-route-driver', 'seeduser-5', 'talent_pool', 'Talent Pool Import', 'Prequalified CDL-A driver ready for immediate placement.', 'seeduser-6'),
    ('376f1a9e-a298-4d2d-95da-acc3e39a9c66', 'midland-journeyman-electrician', 'seeduser-7', 'referral', 'Employee Referral', 'Referred by current crew lead.', 'seeduser-2'),
    ('212d4939-ca4d-449b-bde7-294b25edbe1f', 'baycity-production-line-operator', 'seeduser-8', 'sourced', 'Indeed Resume', 'Strong packaging experience with GMP background.', 'seeduser-3')
  ) as t(id, job_slug, user_slug, relationship_type, source, notes, created_by_slug)
)
insert into public.candidate_job_links (id, job_id, user_id, relationship_type, source, notes, created_by)
select
  cv.id::uuid,
  jl.id,
  ul.id,
  cv.relationship_type,
  cv.source,
  cv.notes,
  cbl.id
from candidate_link_values cv
join job_lookup jl on jl.slug = cv.job_slug
join user_lookup ul on ul.slug = cv.user_slug
left join user_lookup cbl on cbl.slug = cv.created_by_slug
on conflict (job_id, user_id, relationship_type) do update
  set source = excluded.source,
      notes = excluded.notes,
      created_by = excluded.created_by,
      updated_at = now();

with user_lookup as (
  select slug, id
  from public.users
  where slug in (
    'seeduser-1','seeduser-2','seeduser-3','seeduser-4',
    'seeduser-5','seeduser-6','seeduser-7','seeduser-8'
  )
), job_lookup as (
  select slug, id
  from public.jobs
  where slug in (
    'midland-field-superintendent',
    'midland-journeyman-electrician',
    'baycity-production-line-operator',
    'baycity-maintenance-technician'
  )
), pipeline_lookup as (
  select * from (values
    ('midland_default', '16ccfce4-9695-470c-b3c7-26bdc02da0c2'::uuid),
    ('midland_trades', 'd941995f-d4af-4d88-8e34-14956fdc4067'::uuid),
    ('baycity_default', '8b86087a-a163-4bd1-b46a-3ef20297031d'::uuid),
    ('baycity_trades', '66a4ae76-78e5-41d3-821b-6bf3d9ff28fa'::uuid)
  ) as t(pipeline_key, pipeline_id)
), stage_lookup as (
  select * from (values
    ('midland_default_applied', '93401cfb-d749-491f-8d4e-755337f7a4d4'::uuid),
    ('midland_default_screen', '755980a7-b2e6-419c-b2d8-08f755490d7b'::uuid),
    ('midland_trades_applied', '7637f6a1-6768-4710-b070-5d0fbe4ebabf'::uuid),
    ('midland_trades_screen', '2a2f8263-9109-4840-9ce6-bf8fa1da4a71'::uuid),
    ('midland_trades_interview', '699ec0a9-94cd-436f-8010-fa9bc68ae005'::uuid),
    ('baycity_default_applied', 'da6f9c42-5a44-4832-a4a6-e8730e78e721'::uuid),
    ('baycity_default_screen', 'd1d8bb24-8561-4803-a5e4-b8f39e6f5f82'::uuid),
    ('baycity_default_interview', '998de0a1-d155-491a-9f19-38d4c187e242'::uuid),
    ('baycity_default_offer', 'cf464446-9a59-46ee-8f36-8da7c46f6883'::uuid),
    ('baycity_trades_applied', 'f68c93f1-fe07-47e1-adaf-28d620d5346d'::uuid),
    ('baycity_trades_screen', 'c6b55445-0c3f-4274-b81a-ec4d4507ecd4'::uuid),
    ('baycity_trades_rejected', 'b2786788-1261-467c-bb95-87118f69b19c'::uuid)
  ) as t(stage_key, stage_id)
), application_values as (
  select *
  from (values
    ('5b91cafe-467b-44e1-931d-9ff2fb2a04ce', 'midland-field-superintendent', 'seeduser-1', 'screen', 'midland_default', 'midland_default_screen', 21, 14),
    ('14276c1e-fb7a-4180-bbfe-e8d2b7100d8b', 'midland-journeyman-electrician', 'seeduser-2', 'interview', 'midland_trades', 'midland_trades_interview', 18, 7),
    ('64307b56-c4f3-4458-9e82-3856cb83c9a7', 'baycity-production-line-operator', 'seeduser-3', 'offer', 'baycity_default', 'baycity_default_offer', 24, 3),
    ('c3babd4f-c7fe-4e45-85db-0d5a647be6ca', 'baycity-maintenance-technician', 'seeduser-4', 'rejected', 'baycity_trades', 'baycity_trades_rejected', 12, 2)
  ) as t(id, job_slug, user_slug, status, pipeline_key, stage_key, applied_days_ago, stage_days_ago)
)
insert into public.applications (id, job_id, user_id, status, pipeline_id, pipeline_stage_id, stage_entered_at, stage_changed_at, created_at)
select
  av.id::uuid,
  jl.id,
  ul.id,
  av.status,
  pl.pipeline_id,
  sl.stage_id,
  now() - (av.stage_days_ago || ' days')::interval,
  now() - (av.stage_days_ago || ' days')::interval,
  now() - (av.applied_days_ago || ' days')::interval
from application_values av
join job_lookup jl on jl.slug = av.job_slug
join user_lookup ul on ul.slug = av.user_slug
join pipeline_lookup pl on pl.pipeline_key = av.pipeline_key
join stage_lookup sl on sl.stage_key = av.stage_key
on conflict (id) do update
  set status = excluded.status,
      pipeline_id = excluded.pipeline_id,
      pipeline_stage_id = excluded.pipeline_stage_id,
      stage_entered_at = excluded.stage_entered_at,
      stage_changed_at = excluded.stage_changed_at;

with user_lookup as (
  select slug, id
  from public.users
  where slug in (
    'seeduser-1','seeduser-2','seeduser-3','seeduser-4',
    'seeduser-5','seeduser-6','seeduser-7','seeduser-8'
  )
), stage_lookup as (
  select * from (values
    ('midland_default_applied', '93401cfb-d749-491f-8d4e-755337f7a4d4'::uuid),
    ('midland_default_screen', '755980a7-b2e6-419c-b2d8-08f755490d7b'::uuid),
    ('midland_trades_applied', '7637f6a1-6768-4710-b070-5d0fbe4ebabf'::uuid),
    ('midland_trades_screen', '2a2f8263-9109-4840-9ce6-bf8fa1da4a71'::uuid),
    ('midland_trades_interview', '699ec0a9-94cd-436f-8010-fa9bc68ae005'::uuid),
    ('baycity_default_applied', 'da6f9c42-5a44-4832-a4a6-e8730e78e721'::uuid),
    ('baycity_default_screen', 'd1d8bb24-8561-4803-a5e4-b8f39e6f5f82'::uuid),
    ('baycity_default_interview', '998de0a1-d155-491a-9f19-38d4c187e242'::uuid),
    ('baycity_default_offer', 'cf464446-9a59-46ee-8f36-8da7c46f6883'::uuid),
    ('baycity_trades_applied', 'f68c93f1-fe07-47e1-adaf-28d620d5346d'::uuid),
    ('baycity_trades_screen', 'c6b55445-0c3f-4274-b81a-ec4d4507ecd4'::uuid),
    ('baycity_trades_rejected', 'b2786788-1261-467c-bb95-87118f69b19c'::uuid)
  ) as t(stage_key, stage_id)
), history_values as (
  select *
  from (values
    ('0b68c04d-48d5-4a7e-932e-3b3d60169f55', '5b91cafe-467b-44e1-931d-9ff2fb2a04ce', null, 'midland_default_applied', 'seeduser-1', 21, null, 'Application submitted by candidate.'),
    ('feef831b-682f-4422-a7f8-83341d6183a9', '5b91cafe-467b-44e1-931d-9ff2fb2a04ce', 'midland_default_applied', 'midland_default_screen', 'seeduser-5', 14, 'Initial review complete', 'Moved to recruiter screen.'),

    ('db493079-026f-4f54-a71d-2b8428ec8e26', '14276c1e-fb7a-4180-bbfe-e8d2b7100d8b', null, 'midland_trades_applied', 'seeduser-2', 18, null, 'Application submitted.'),
    ('421e62ab-15b8-4ca4-be59-1564760db82a', '14276c1e-fb7a-4180-bbfe-e8d2b7100d8b', 'midland_trades_applied', 'midland_trades_screen', 'seeduser-6', 12, 'Trade experience verified', 'Meets licensure requirements.'),
    ('79549bc7-72c7-43d0-8ddf-6c91d0ff3f3d', '14276c1e-fb7a-4180-bbfe-e8d2b7100d8b', 'midland_trades_screen', 'midland_trades_interview', 'seeduser-6', 7, 'Assessment passed', 'Scheduled panel interview.'),

    ('a60b10d8-ef67-428e-84a1-8c6718a1a63e', '64307b56-c4f3-4458-9e82-3856cb83c9a7', null, 'baycity_default_applied', 'seeduser-3', 24, null, 'Candidate applied via job board.'),
    ('1b17056d-9ab9-47da-80e9-9789d464dcb5', '64307b56-c4f3-4458-9e82-3856cb83c9a7', 'baycity_default_applied', 'baycity_default_screen', 'seeduser-7', 18, 'Phone screen completed', 'Strong GMP background.'),
    ('1110f9d7-46fa-4d0b-a71a-49e3f1c5918c', '64307b56-c4f3-4458-9e82-3856cb83c9a7', 'baycity_default_screen', 'baycity_default_interview', 'seeduser-7', 10, 'Panel interview complete', 'Ready for offer review.'),
    ('c2e04ae3-8701-4a36-b3fb-86f8580615ad', '64307b56-c4f3-4458-9e82-3856cb83c9a7', 'baycity_default_interview', 'baycity_default_offer', 'seeduser-7', 3, 'Offer approved', 'Offer letter sent.'),

    ('ece74563-cd77-4f0a-87f5-2099b8eb8ac1', 'c3babd4f-c7fe-4e45-85db-0d5a647be6ca', null, 'baycity_trades_applied', 'seeduser-4', 12, null, 'Candidate applied via referral.'),
    ('14729c85-60ed-4b9d-85b1-890cec6d2d27', 'c3babd4f-c7fe-4e45-85db-0d5a647be6ca', 'baycity_trades_applied', 'baycity_trades_screen', 'seeduser-8', 8, 'Technical screen completed', 'Awaiting assessment results.'),
    ('d6d5e802-85ab-4a81-a6a7-3cc0787b3fed', 'c3babd4f-c7fe-4e45-85db-0d5a647be6ca', 'baycity_trades_screen', 'baycity_trades_rejected', 'seeduser-8', 2, 'Failed assessment', 'Candidate did not pass technical evaluation.')
  ) as t(id, application_id, from_stage_key, to_stage_key, changed_by_slug, days_ago, reason, notes)
)
insert into public.application_stage_history (id, application_id, from_stage_id, to_stage_id, changed_by, reason, notes, created_at)
select
  hv.id::uuid,
  hv.application_id::uuid,
  fsl.stage_id,
  tsl.stage_id,
  ul.id,
  hv.reason,
  hv.notes,
  now() - (hv.days_ago || ' days')::interval
from history_values hv
left join stage_lookup fsl on fsl.stage_key = hv.from_stage_key
join stage_lookup tsl on tsl.stage_key = hv.to_stage_key
left join user_lookup ul on ul.slug = hv.changed_by_slug
on conflict (id) do update
  set from_stage_id = excluded.from_stage_id,
      to_stage_id = excluded.to_stage_id,
      changed_by = excluded.changed_by,
      reason = excluded.reason,
      notes = excluded.notes,
      created_at = excluded.created_at;

commit;
