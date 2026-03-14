-- =========================================================
-- 007_seed-wizard-org.sql
-- Wizard Construction Organization Demo Data
-- Creates Wizard Construction org owned by brian.carter@wizard.construction.
-- Includes 7 @wizard.construction users, 5 jobs, 3 projects, 3 teams,
-- 8 work logs, and all role/prerequisite setup for full employer/PM demo.
-- Depends on: 001 (industries), 005 (brian.carter auth entry)
-- =========================================================

BEGIN;

-- =========================================================
-- Step 1: Create auth.users for the 6 NEW Wizard users
-- (brian.carter already exists from 005_seed-demo-prerequisites.sql)
-- =========================================================
ALTER TABLE core.users DROP CONSTRAINT IF EXISTS users_slug_format_check;

INSERT INTO auth.users (
  instance_id, id, email, phone, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  u.id::uuid, u.email, NULLIF(u.phone, ''),
  public.crypt('password123', public.gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object(
    'provider', 'email',
    'name', u.name,
    'first_name', u.first_name,
    'last_name', u.last_name,
    'location', u.location
  ),
  'authenticated', 'authenticated', NOW(), NOW(), '', '', '', ''
FROM (VALUES
  ('33333333-3333-3333-3333-333333333302', 'sarah.mitchell@wizard.construction', 'Sarah Mitchell', 'Sarah', 'Mitchell', '+1 (734) 555-0102', 'Ann Arbor, Michigan, United States'),
  ('33333333-3333-3333-3333-333333333303', 'derek.johnson@wizard.construction', 'Derek Johnson', 'Derek', 'Johnson', '+1 (313) 555-0203', 'Dearborn, Michigan, United States'),
  ('33333333-3333-3333-3333-333333333304', 'maria.gonzalez@wizard.construction', 'Maria Gonzalez', 'Maria', 'Gonzalez', '+1 (734) 555-0304', 'Livonia, Michigan, United States'),
  ('33333333-3333-3333-3333-333333333305', 'tyler.brooks@wizard.construction', 'Tyler Brooks', 'Tyler', 'Brooks', '+1 (734) 555-0405', 'Ypsilanti, Michigan, United States'),
  ('33333333-3333-3333-3333-333333333306', 'ron.mitchell@wizard.construction', 'Ron Mitchell', 'Ron', 'Mitchell', '+1 (248) 555-0506', 'Troy, Michigan, United States'),
  ('33333333-3333-3333-3333-333333333307', 'james.okafor@wizard.construction', 'James Okafor', 'James', 'Okafor', '+1 (248) 555-0607', 'Southfield, Michigan, United States')
) AS u(id, email, name, first_name, last_name, phone, location)
ON CONFLICT (id) DO NOTHING;

-- Fix slugs for new users
WITH sanitized AS (
  SELECT id,
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(COALESCE(username, display_name)), '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'),
      '^-+|-+$', '', 'g') AS slug
  FROM core.users
  WHERE id IN (
    '33333333-3333-3333-3333-333333333302'::uuid,
    '33333333-3333-3333-3333-333333333303'::uuid,
    '33333333-3333-3333-3333-333333333304'::uuid,
    '33333333-3333-3333-3333-333333333305'::uuid,
    '33333333-3333-3333-3333-333333333306'::uuid,
    '33333333-3333-3333-3333-333333333307'::uuid
  )
)
UPDATE core.users u
SET slug = CASE
  WHEN s.slug IS NULL OR LENGTH(s.slug) < 3 OR LENGTH(s.slug) > 50 THEN NULL
  ELSE s.slug
END
FROM sanitized s WHERE u.id = s.id;

-- Re-enable slug constraint
ALTER TABLE core.users
ADD CONSTRAINT users_slug_format_check
CHECK (slug IS NULL OR (LENGTH(slug) >= 3 AND LENGTH(slug) <= 50 AND slug ~ '^[a-z0-9-]+$'));

-- =========================================================
-- Step 2: Populate core.profile for all 7 Wizard users
-- =========================================================
WITH wizard_profiles AS (
  SELECT * FROM (VALUES
    ('brian.carter@wizard.construction', 'Brian', 'Carter',
     '{"street":"500 Griswold Street","city":"Detroit","state":"MI","zip":"48226","country":"United States"}'::jsonb,
     -83.0458, 42.3314),
    ('sarah.mitchell@wizard.construction', 'Sarah', 'Mitchell',
     '{"street":"301 E Liberty Street","city":"Ann Arbor","state":"MI","zip":"48104","country":"United States"}'::jsonb,
     -83.7400, 42.2808),
    ('derek.johnson@wizard.construction', 'Derek', 'Johnson',
     '{"street":"13615 Michigan Avenue","city":"Dearborn","state":"MI","zip":"48126","country":"United States"}'::jsonb,
     -83.1763, 42.3223),
    ('maria.gonzalez@wizard.construction', 'Maria', 'Gonzalez',
     '{"street":"33000 Civic Center Drive","city":"Livonia","state":"MI","zip":"48154","country":"United States"}'::jsonb,
     -83.3527, 42.3684),
    ('tyler.brooks@wizard.construction', 'Tyler', 'Brooks',
     '{"street":"1 S Huron Street","city":"Ypsilanti","state":"MI","zip":"48197","country":"United States"}'::jsonb,
     -83.6129, 42.2411),
    ('ron.mitchell@wizard.construction', 'Ron', 'Mitchell',
     '{"street":"500 W Big Beaver Road","city":"Troy","state":"MI","zip":"48084","country":"United States"}'::jsonb,
     -83.1499, 42.5584),
    ('james.okafor@wizard.construction', 'James', 'Okafor',
     '{"street":"26000 Evergreen Road","city":"Southfield","state":"MI","zip":"48076","country":"United States"}'::jsonb,
     -83.2387, 42.4734)
  ) AS t(email, first_name, last_name, address, lon, lat)
)
UPDATE core.profile p
SET
  first_name = wp.first_name,
  last_name  = wp.last_name,
  address    = wp.address,
  geo        = ST_SetSRID(ST_MakePoint(wp.lon, wp.lat), 4326)::geography
FROM wizard_profiles wp
JOIN auth.users au ON au.email = wp.email
WHERE p.user_id = au.id;

-- =========================================================
-- Step 3: Set industry + display info on core.users
-- =========================================================
UPDATE core.users u
SET
  industry_id = i.id,
  headline = CASE au.email
    WHEN 'brian.carter@wizard.construction' THEN 'President & Owner at Wizard Construction'
    WHEN 'sarah.mitchell@wizard.construction' THEN 'Senior Project Manager | 12 Years in Commercial Construction'
    WHEN 'derek.johnson@wizard.construction' THEN 'General Foreman | Structural & Concrete Specialist'
    WHEN 'maria.gonzalez@wizard.construction' THEN 'Senior Estimator | Pre-Construction & Cost Analysis'
    WHEN 'tyler.brooks@wizard.construction' THEN 'Apprentice Electrician | IBEW Local 58'
    WHEN 'ron.mitchell@wizard.construction' THEN 'Safety Officer | OSHA 30 Certified'
    WHEN 'james.okafor@wizard.construction' THEN 'Superintendent | 15 Years Large-Scale Projects'
  END,
  years_of_experience = CASE au.email
    WHEN 'brian.carter@wizard.construction' THEN 20
    WHEN 'sarah.mitchell@wizard.construction' THEN 12
    WHEN 'derek.johnson@wizard.construction' THEN 15
    WHEN 'maria.gonzalez@wizard.construction' THEN 10
    WHEN 'tyler.brooks@wizard.construction' THEN 2
    WHEN 'ron.mitchell@wizard.construction' THEN 8
    WHEN 'james.okafor@wizard.construction' THEN 15
  END
FROM core.industries i
JOIN auth.users au ON au.email ILIKE '%@wizard.construction'
WHERE i.slug = 'construction'
  AND u.id = au.id;

-- =========================================================
-- Step 4: Set preferences (user_types + prerequisites_completed_at)
-- =========================================================
WITH wizard_prefs AS (
  SELECT * FROM (VALUES
    ('brian.carter@wizard.construction',       ARRAY['employer']),
    ('sarah.mitchell@wizard.construction',     ARRAY['employer', 'worker']),
    ('derek.johnson@wizard.construction',      ARRAY['worker']),
    ('maria.gonzalez@wizard.construction',     ARRAY['employer', 'worker']),
    ('tyler.brooks@wizard.construction',       ARRAY['worker']),
    ('ron.mitchell@wizard.construction',        ARRAY['employer', 'worker']),
    ('james.okafor@wizard.construction',       ARRAY['worker'])
  ) AS t(email, user_types)
)
UPDATE core.preferences pref
SET
  user_types = wp.user_types,
  prerequisites_completed_at = NOW()
FROM wizard_prefs wp
JOIN auth.users au ON au.email = wp.email
WHERE pref.user_id = au.id;

-- =========================================================
-- Step 5: Create Wizard Construction organization
-- =========================================================
WITH user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'brian.carter@wizard.construction'
),
industry_lookup AS (
  SELECT id FROM core.industries WHERE slug = 'construction'
)
INSERT INTO core.organizations (
  owner_user_id, name, slug, industry_id, address, geo, website, description, visibility
)
SELECT
  u.id, 'Wizard Construction', 'wizard-construction', i.id,
  jsonb_build_object(
    'street', '500 Griswold Street', 'city', 'Detroit',
    'state', 'MI', 'postal', '48226', 'country', 'USA'
  ),
  ST_SetSRID(ST_MakePoint(-83.0458, 42.3314), 4326)::geography,
  'https://wizard.construction',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text',
            'Wizard Construction is a full-service commercial general contractor headquartered in Detroit, Michigan. Specializing in office complexes, institutional buildings, and industrial retrofits, Wizard has delivered over $500M in projects across the Metro Detroit area since 2006.')
        )
      )
    )
  ),
  'public'
FROM user_lookup u CROSS JOIN industry_lookup i
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- Step 6: Role assignments
-- =========================================================
-- Ensure org roles exist
INSERT INTO core.roles (scope, name, description)
VALUES
  ('organization', 'admin', 'Organization administrator with elevated privileges'),
  ('organization', 'member', 'Organization member')
ON CONFLICT (name) DO NOTHING;

-- Assign org admin role to employer users
INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT r.id, au.id, o.id, NULL
FROM core.roles r
CROSS JOIN auth.users au
CROSS JOIN core.organizations o
WHERE r.scope = 'organization' AND r.name = 'admin'
  AND o.slug = 'wizard-construction'
  AND au.email IN (
    'brian.carter@wizard.construction',
    'sarah.mitchell@wizard.construction',
    'maria.gonzalez@wizard.construction',
    'ron.mitchell@wizard.construction'
  )
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

-- Assign platform office role to all Wizard users (for Office/CMS access)
INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT r.id, au.id, NULL, NULL
FROM core.roles r
CROSS JOIN auth.users au
WHERE r.scope = 'platform' AND r.name = 'office'
  AND au.email ILIKE '%@wizard.construction'
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

-- =========================================================
-- Step 7: Jobs for Wizard Construction
-- =========================================================

-- Job 1: Commercial Electrician
WITH org AS (SELECT id FROM core.organizations WHERE slug = 'wizard-construction'),
     usr AS (SELECT id FROM auth.users WHERE email = 'brian.carter@wizard.construction')
INSERT INTO core.jobs (
  organization_id, created_by_user_id, title, description, status,
  employment_type, remote_option, position_level, location,
  address, geo, pay_range_min_cents, pay_range_max_cents, pay_range_type,
  posted_at, closes_at, slug
)
SELECT o.id, usr.id, 'Commercial Electrician',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Install, maintain, and repair electrical wiring, equipment, and fixtures in commercial buildings. Must hold a valid Michigan electrical license. Experience with conduit bending, panel work, and building automation systems preferred.')
    ))
  )),
  'open', 'full_time', 'on_site', 'Mid Level / Intermediate',
  'Detroit, MI',
  jsonb_build_object('street','500 Griswold Street','city','Detroit','state','MI','zip','48226','country','USA','latitude',42.3314,'longitude',-83.0458),
  ST_SetSRID(ST_MakePoint(-83.0458, 42.3314), 4326)::geography,
  6500000, 8500000, 'salary',
  NOW() - INTERVAL '4 days', NOW() + INTERVAL '45 days',
  'commercial-electrician-wizard'
FROM org o CROSS JOIN usr
ON CONFLICT (slug) DO NOTHING;

-- Job 2: Plumbing Foreman
WITH org AS (SELECT id FROM core.organizations WHERE slug = 'wizard-construction'),
     usr AS (SELECT id FROM auth.users WHERE email = 'brian.carter@wizard.construction')
INSERT INTO core.jobs (
  organization_id, created_by_user_id, title, description, status,
  employment_type, remote_option, position_level, location,
  address, geo, pay_range_min_cents, pay_range_max_cents, pay_range_type,
  posted_at, closes_at, slug
)
SELECT o.id, usr.id, 'Plumbing Foreman',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Lead a crew of 6-10 plumbers on commercial new-construction and renovation projects. Responsible for scheduling, quality control, code compliance, and coordination with other trades. Master plumber license required.')
    ))
  )),
  'open', 'full_time', 'on_site', 'Senior / Lead',
  'Ann Arbor, MI',
  jsonb_build_object('city','Ann Arbor','state','MI','zip','48104','country','USA','latitude',42.2808,'longitude',-83.7400),
  ST_SetSRID(ST_MakePoint(-83.7400, 42.2808), 4326)::geography,
  7500000, 10000000, 'salary',
  NOW() - INTERVAL '6 days', NOW() + INTERVAL '60 days',
  'plumbing-foreman-wizard'
FROM org o CROSS JOIN usr
ON CONFLICT (slug) DO NOTHING;

-- Job 3: Safety Coordinator
WITH org AS (SELECT id FROM core.organizations WHERE slug = 'wizard-construction'),
     usr AS (SELECT id FROM auth.users WHERE email = 'sarah.mitchell@wizard.construction')
INSERT INTO core.jobs (
  organization_id, created_by_user_id, title, description, status,
  employment_type, remote_option, position_level, location,
  address, geo, pay_range_min_cents, pay_range_max_cents, pay_range_type,
  posted_at, closes_at, slug
)
SELECT o.id, usr.id, 'Safety Coordinator',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Develop and enforce site safety programs across all Wizard Construction projects. Conduct daily inspections, toolbox talks, and incident investigations. OSHA 30-Hour Construction certification required. CHST preferred.')
    ))
  )),
  'open', 'full_time', 'hybrid', 'Mid Level / Intermediate',
  'Detroit, MI / Hybrid',
  jsonb_build_object('city','Detroit','state','MI','zip','48226','country','USA','latitude',42.3314,'longitude',-83.0458),
  ST_SetSRID(ST_MakePoint(-83.0458, 42.3314), 4326)::geography,
  6000000, 8000000, 'salary',
  NOW() - INTERVAL '2 days', NOW() + INTERVAL '30 days',
  'safety-coordinator-wizard'
FROM org o CROSS JOIN usr
ON CONFLICT (slug) DO NOTHING;

-- Job 4: Heavy Equipment Operator
WITH org AS (SELECT id FROM core.organizations WHERE slug = 'wizard-construction'),
     usr AS (SELECT id FROM auth.users WHERE email = 'brian.carter@wizard.construction')
INSERT INTO core.jobs (
  organization_id, created_by_user_id, title, description, status,
  employment_type, remote_option, position_level, location,
  address, geo, pay_range_min_cents, pay_range_max_cents, pay_range_type,
  posted_at, closes_at, slug
)
SELECT o.id, usr.id, 'Heavy Equipment Operator',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Operate excavators, bulldozers, backhoes, and skid steers on commercial construction sites. Perform grading, trenching, and site prep. CDL Class A or B preferred. Minimum 1 year experience with heavy equipment.')
    ))
  )),
  'open', 'full_time', 'on_site', 'Entry Level',
  'Dearborn, MI',
  jsonb_build_object('city','Dearborn','state','MI','zip','48126','country','USA','latitude',42.3223,'longitude',-83.1763),
  ST_SetSRID(ST_MakePoint(-83.1763, 42.3223), 4326)::geography,
  5000000, 7000000, 'salary',
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '45 days',
  'heavy-equipment-operator-wizard'
FROM org o CROSS JOIN usr
ON CONFLICT (slug) DO NOTHING;

-- Job 5: HVAC Technician (closed – filled)
WITH org AS (SELECT id FROM core.organizations WHERE slug = 'wizard-construction'),
     usr AS (SELECT id FROM auth.users WHERE email = 'sarah.mitchell@wizard.construction')
INSERT INTO core.jobs (
  organization_id, created_by_user_id, title, description, status,
  employment_type, remote_option, position_level, location,
  address, geo, pay_range_min_cents, pay_range_max_cents, pay_range_type,
  posted_at, closes_at, slug
)
SELECT o.id, usr.id, 'HVAC Technician',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Install and service commercial HVAC systems including rooftop units, split systems, and VRF. EPA 608 Universal certification required. This position has been filled.')
    ))
  )),
  'closed', 'full_time', 'on_site', 'Mid Level / Intermediate',
  'Southfield, MI',
  jsonb_build_object('city','Southfield','state','MI','zip','48076','country','USA','latitude',42.4734,'longitude',-83.2387),
  ST_SetSRID(ST_MakePoint(-83.2387, 42.4734), 4326)::geography,
  5500000, 7500000, 'salary',
  NOW() - INTERVAL '60 days', NOW() - INTERVAL '10 days',
  'hvac-technician-wizard'
FROM org o CROSS JOIN usr
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- Step 8: Construction projects (for work logs)
-- =========================================================
INSERT INTO core.construction_projects (
  id, organization_id, name, project_number, status, description, is_archived, archived
)
SELECT p.id, o.id, p.name, p.project_number, p.status, p.description, false, false
FROM core.organizations o
CROSS JOIN (VALUES
  ('d0000001-0000-4000-8000-000000000001'::uuid, 'Detroit Metro Office Complex', 'WIZ-DM-001', 'active', 'New 12-story mixed-use office complex in downtown Detroit'),
  ('d0000002-0000-4000-8000-000000000002'::uuid, 'Ann Arbor University Dormitory', 'WIZ-AA-002', 'active', '200-bed student dormitory with dining hall and study spaces'),
  ('d0000003-0000-4000-8000-000000000003'::uuid, 'Dearborn Industrial Retrofit', 'WIZ-DB-003', 'active', 'Convert 80,000 sqft manufacturing plant into modern flex space')
) AS p(id, name, project_number, status, description)
WHERE o.slug = 'wizard-construction'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Step 9: Teams
-- =========================================================
WITH member_role AS (
  SELECT id FROM core.team_roles WHERE key = 'member' AND organization_id IS NULL LIMIT 1
),
org AS (
  SELECT id, (SELECT id FROM member_role) AS role_id
  FROM core.organizations WHERE slug = 'wizard-construction' LIMIT 1
),
brian AS (
  SELECT id FROM auth.users WHERE email = 'brian.carter@wizard.construction' LIMIT 1
)
INSERT INTO core.teams (organization_id, name, slug, default_role_id, default_role_key, created_by)
SELECT org.id, t.name, t.slug, org.role_id, 'member', brian.id
FROM org CROSS JOIN brian
CROSS JOIN (VALUES
  ('Field Operations', 'wizard-field-operations'),
  ('Safety & Compliance', 'wizard-safety-compliance'),
  ('Estimating & Pre-Con', 'wizard-estimating-precon')
) AS t(name, slug)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- Step 10: Team members (all @wizard.construction users on all teams)
-- =========================================================
INSERT INTO core.team_members (team_id, user_id, role_id)
SELECT t.id, au.id, t.default_role_id
FROM core.teams t
CROSS JOIN auth.users au
WHERE t.slug IN ('wizard-field-operations', 'wizard-safety-compliance', 'wizard-estimating-precon')
  AND au.email ILIKE '%@wizard.construction'
ON CONFLICT (team_id, user_id) DO NOTHING;

-- =========================================================
-- Step 11: Work logs (8 entries, mixed statuses)
-- =========================================================
INSERT INTO core.work_logs (
  id, user_id, project_id, entry_type, log_date,
  time_entries, work_description, tasks_completed,
  status, submitted_at, verified_by_user_id, verified_at, visibility
)
SELECT wl.id, u.id, wl.project_id, 'daily', wl.log_date,
  '[{"start": "07:00", "end": "15:30"}]'::jsonb,
  wl.work_description, wl.tasks_completed, wl.status,
  wl.submitted_at, verifier.id, wl.verified_at, 'private'
FROM (VALUES
  -- Draft entries
  ('e0000001-0000-4000-8000-000000000001'::uuid, 'd0000001-0000-4000-8000-000000000001'::uuid,
   (CURRENT_DATE - 18), 'Excavation and foundation layout for tower A.',
   ARRAY['Dig footings','Set rebar cages']::text[],
   'draft', NULL::timestamptz, NULL::timestamptz,
   'derek.johnson@wizard.construction', NULL),

  ('e0000002-0000-4000-8000-000000000002'::uuid, 'd0000003-0000-4000-8000-000000000003'::uuid,
   (CURRENT_DATE - 16), 'Demolition of existing partition walls in east wing.',
   ARRAY['Remove drywall','Strip electrical']::text[],
   'draft', NULL::timestamptz, NULL::timestamptz,
   'tyler.brooks@wizard.construction', NULL),

  -- Pending verification
  ('e0000003-0000-4000-8000-000000000003'::uuid, 'd0000001-0000-4000-8000-000000000001'::uuid,
   (CURRENT_DATE - 14), 'Concrete pour for level 2 slab on deck.',
   ARRAY['Place concrete','Finish and cure']::text[],
   'pending_verification', (NOW() - INTERVAL '2 days'), NULL::timestamptz,
   'james.okafor@wizard.construction', NULL),

  ('e0000004-0000-4000-8000-000000000004'::uuid, 'd0000002-0000-4000-8000-000000000002'::uuid,
   (CURRENT_DATE - 12), 'Structural steel erection for dormitory frame.',
   ARRAY['Set columns','Bolt connections']::text[],
   'pending_verification', (NOW() - INTERVAL '1 day'), NULL::timestamptz,
   'derek.johnson@wizard.construction', NULL),

  -- Verified entries
  ('e0000005-0000-4000-8000-000000000005'::uuid, 'd0000002-0000-4000-8000-000000000002'::uuid,
   (CURRENT_DATE - 10), 'MEP rough-in for dormitory floors 1-2.',
   ARRAY['Run ductwork','Install plumbing risers']::text[],
   'verified', (NOW() - INTERVAL '4 days'), (NOW() - INTERVAL '3 days'),
   'ron.mitchell@wizard.construction', 'sarah.mitchell@wizard.construction'),

  ('e0000006-0000-4000-8000-000000000006'::uuid, 'd0000003-0000-4000-8000-000000000003'::uuid,
   (CURRENT_DATE - 7), 'New electrical service installation 800A 3-phase.',
   ARRAY['Set transformer','Pull feeders']::text[],
   'verified', (NOW() - INTERVAL '3 days'), (NOW() - INTERVAL '2 days'),
   'tyler.brooks@wizard.construction', 'james.okafor@wizard.construction'),

  ('e0000007-0000-4000-8000-000000000007'::uuid, 'd0000001-0000-4000-8000-000000000001'::uuid,
   (CURRENT_DATE - 4), 'Curtain wall installation on south elevation.',
   ARRAY['Install anchors','Hang panels']::text[],
   'verified', (NOW() - INTERVAL '2 days'), (NOW() - INTERVAL '1 day'),
   'derek.johnson@wizard.construction', 'brian.carter@wizard.construction'),

  ('e0000008-0000-4000-8000-000000000008'::uuid, 'd0000002-0000-4000-8000-000000000002'::uuid,
   (CURRENT_DATE - 1), 'Fire protection sprinkler layout for floors 3-4.',
   ARRAY['Hang mains','Install branch lines']::text[],
   'verified', (NOW() - INTERVAL '12 hours'), (NOW() - INTERVAL '6 hours'),
   'maria.gonzalez@wizard.construction', 'brian.carter@wizard.construction')
) AS wl(id, project_id, log_date, work_description, tasks_completed, status, submitted_at, verified_at, user_email, verifier_email)
JOIN auth.users u ON u.email = wl.user_email
LEFT JOIN auth.users verifier ON verifier.email = wl.verifier_email
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. All Wizard users share password: password123
-- 2. Brian Carter (brian.carter@wizard.construction) is created in 005;
--    this seed creates the other 6 users and all org data
-- 3. User IDs: 33333333-3333-3333-3333-33333333330X
-- 4. Project IDs: d0000001..d0000003
-- 5. Work Log IDs: e0000001..e0000008
-- 6. Depends on: 001 (industries), 005 (brian.carter auth entry)
-- 7. Idempotent: ON CONFLICT DO NOTHING on all inserts
-- =========================================================
