-- =========================================================
-- Test Users Seed Data
-- Creates specific test users for development and testing
-- =========================================================

begin;

-- =========================================================
-- Create a few specific test users for development
-- =========================================================

-- Test user 1: Construction worker
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
) values (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'testuser1@example.com',
  crypt('TestUser123!', gen_salt('bf')),
  now(),
  now(),
  jsonb_build_object('provider', 'email'),
  jsonb_build_object(
    'provider', 'email',
    'name', 'John Smith',
    'first_name', 'John',
    'last_name', 'Smith',
    'phone', '313-555-0101',
    'location', 'Detroit, MI'
  ),
  'authenticated',
  'authenticated',
  now(),
  now(),
  false
) on conflict (id) do nothing;

-- Test user 2: Manufacturing technician
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
) values (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'testuser2@example.com',
  crypt('TestUser123!', gen_salt('bf')),
  now(),
  now(),
  jsonb_build_object('provider', 'email'),
  jsonb_build_object(
    'provider', 'email',
    'name', 'Sarah Johnson',
    'first_name', 'Sarah',
    'last_name', 'Johnson',
    'phone', '616-555-0102',
    'location', 'Grand Rapids, MI'
  ),
  'authenticated',
  'authenticated',
  now(),
  now(),
  false
) on conflict (id) do nothing;

-- Test user 3: Transportation driver
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
) values (
  '33333333-3333-3333-3333-333333333333'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'testuser3@example.com',
  crypt('TestUser123!', gen_salt('bf')),
  now(),
  now(),
  jsonb_build_object('provider', 'email'),
  jsonb_build_object(
    'provider', 'email',
    'name', 'Mike Wilson',
    'first_name', 'Mike',
    'last_name', 'Wilson',
    'phone', '517-555-0103',
    'location', 'Lansing, MI'
  ),
  'authenticated',
  'authenticated',
  now(),
  now(),
  false
) on conflict (id) do nothing;

-- =========================================================
-- Create corresponding user profiles
-- =========================================================

-- User 1: Construction worker profile
insert into public.users (
  id, username, slug, display_name, headline, bio, industry_id,
  avatar_url, avatar_media_id, open_to_work, years_of_experience, skills_summary,
  created_at, updated_at
) values (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'johnsmith',
  'johnsmith',
  'John Smith',
  'Skilled Construction Professional',
  'Experienced carpenter with 8 years in residential and commercial construction. Specialized in framing, drywall, and finishing work.',
  (select id from public.industries where slug = 'construction'),
  null,
  null,
  true,
  8,
  jsonb_build_object(
    'skills', jsonb_build_array('carpentry', 'framing', 'drywall', 'electrical', 'osha-30'),
    'primary_location', jsonb_build_object('city', 'Detroit', 'state', 'MI'),
    'travel_radius_miles', 50
  ),
  now(),
  now()
) on conflict (id) do nothing;

-- User 2: Manufacturing technician profile
insert into public.users (
  id, username, slug, display_name, headline, bio, industry_id,
  avatar_url, avatar_media_id, open_to_work, years_of_experience, skills_summary,
  created_at, updated_at
) values (
  '22222222-2222-2222-2222-222222222222'::uuid,
  'sarahjohnson',
  'sarahjohnson',
  'Sarah Johnson',
  'Manufacturing Technician',
  'CNC machinist with 5 years experience in precision manufacturing. Skilled in programming, setup, and quality control.',
  (select id from public.industries where slug = 'manufacturing'),
  null,
  null,
  true,
  5,
  jsonb_build_object(
    'skills', jsonb_build_array('machining', 'cnc-operating', 'quality-control', 'cad', 'blueprints'),
    'primary_location', jsonb_build_object('city', 'Grand Rapids', 'state', 'MI'),
    'travel_radius_miles', 30
  ),
  now(),
  now()
) on conflict (id) do nothing;

-- User 3: Transportation driver profile
insert into public.users (
  id, username, slug, display_name, headline, bio, industry_id,
  avatar_url, avatar_media_id, open_to_work, years_of_experience, skills_summary,
  created_at, updated_at
) values (
  '33333333-3333-3333-3333-333333333333'::uuid,
  'mikewilson',
  'mikewilson',
  'Mike Wilson',
  'Professional Truck Driver',
  'CDL Class A driver with 10 years experience in regional and local deliveries. Clean driving record and excellent safety record.',
  (select id from public.industries where slug = 'transportation'),
  null,
  null,
  true,
  10,
  jsonb_build_object(
    'skills', jsonb_build_array('truck-driving', 'cdl', 'logistics', 'forklift', 'warehouse-operations'),
    'primary_location', jsonb_build_object('city', 'Lansing', 'state', 'MI'),
    'travel_radius_miles', 100
  ),
  now(),
  now()
) on conflict (id) do nothing;

-- =========================================================
-- Create corresponding profiles table entries
-- =========================================================

insert into public.profiles (id, name, about, avatar_path, created_at, updated_at)
select 
  u.id,
  u.display_name,
  u.bio,
  u.avatar_url,
  u.created_at,
  u.updated_at
from public.users u
where u.id in (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid
)
on conflict (id) do nothing;

-- =========================================================
-- Create corresponding user_private entries
-- =========================================================

insert into public.user_private (
  user_id, email, phone, first_name, last_name, address, geo,
  contact_prefs, veteran, us_resident, us_passport, travel_mileage,
  education_level, hourly_rate_cents, location, open_to_travel,
  drivers_license_class, phone_os, availability, certifications,
  created_at, updated_at
)
select
  u.id,
  u.id::text || '@example.com' as email,
  case 
    when u.id = '11111111-1111-1111-1111-111111111111'::uuid then '313-555-0101'
    when u.id = '22222222-2222-2222-2222-222222222222'::uuid then '616-555-0102'
    when u.id = '33333333-3333-3333-3333-333333333333'::uuid then '517-555-0103'
  end as phone,
  case 
    when u.id = '11111111-1111-1111-1111-111111111111'::uuid then 'John'
    when u.id = '22222222-2222-2222-2222-222222222222'::uuid then 'Sarah'
    when u.id = '33333333-3333-3333-3333-333333333333'::uuid then 'Mike'
  end as first_name,
  case 
    when u.id = '11111111-1111-1111-1111-111111111111'::uuid then 'Smith'
    when u.id = '22222222-2222-2222-2222-222222222222'::uuid then 'Johnson'
    when u.id = '33333333-3333-3333-3333-333333333333'::uuid then 'Wilson'
  end as last_name,
  jsonb_build_object(
    'street', '123 Main St',
    'city', case 
      when u.id = '11111111-1111-1111-1111-111111111111'::uuid then 'Detroit'
      when u.id = '22222222-2222-2222-2222-222222222222'::uuid then 'Grand Rapids'
      when u.id = '33333333-3333-3333-3333-333333333333'::uuid then 'Lansing'
    end,
    'state', 'MI',
    'postal', '48201',
    'country', 'USA'
  ) as address,
  case 
    when u.id = '11111111-1111-1111-1111-111111111111'::uuid then st_setsrid(st_makepoint(-83.0458, 42.3314), 4326)::geography
    when u.id = '22222222-2222-2222-2222-222222222222'::uuid then st_setsrid(st_makepoint(-85.6681, 42.9634), 4326)::geography
    when u.id = '33333333-3333-3333-3333-333333333333'::uuid then st_setsrid(st_makepoint(-84.5555, 42.7325), 4326)::geography
  end as geo,
  array['email', 'phone'] as contact_prefs,
  false as veteran,
  true as us_resident,
  false as us_passport,
  case 
    when u.id = '11111111-1111-1111-1111-111111111111'::uuid then 50
    when u.id = '22222222-2222-2222-2222-222222222222'::uuid then 30
    when u.id = '33333333-3333-3333-3333-333333333333'::uuid then 100
  end as travel_mileage,
  'High School' as education_level,
  case 
    when u.id = '11111111-1111-1111-1111-111111111111'::uuid then 3500
    when u.id = '22222222-2222-2222-2222-222222222222'::uuid then 3200
    when u.id = '33333333-3333-3333-3333-333333333333'::uuid then 2800
  end as hourly_rate_cents,
  case 
    when u.id = '11111111-1111-1111-1111-111111111111'::uuid then 'Detroit, MI'
    when u.id = '22222222-2222-2222-2222-222222222222'::uuid then 'Grand Rapids, MI'
    when u.id = '33333333-3333-3333-3333-333333333333'::uuid then 'Lansing, MI'
  end as location,
  true as open_to_travel,
  case 
    when u.id = '33333333-3333-3333-3333-333333333333'::uuid then 'CDL-A'
    else 'Standard'
  end as drivers_license_class,
  'iOS' as phone_os,
  array['Weekdays', 'Overtime'] as availability,
  case 
    when u.id = '11111111-1111-1111-1111-111111111111'::uuid then array['OSHA 30', 'First Aid / CPR']
    when u.id = '22222222-2222-2222-2222-222222222222'::uuid then array['OSHA 10', 'Quality Control']
    when u.id = '33333333-3333-3333-3333-333333333333'::uuid then array['CDL Medical Card', 'First Aid / CPR']
  end as certifications,
  now(),
  now()
from public.users u
where u.id in (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '22222222-2222-2222-2222-222222222222'::uuid,
  '33333333-3333-3333-3333-333333333333'::uuid
)
on conflict (user_id) do nothing;

commit;
