-- =========================================================
-- Users Seed Data
-- Creates 50 realistic users with geographic distribution
-- Includes auth.users, public.users, profiles, and user_private entries
-- =========================================================

begin;

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

commit;
