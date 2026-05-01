-- =========================================================
-- 010_seed-app-review-accounts.sql
-- Apple App Store reviewer demo accounts.
--
-- Accounts:
--   reviewer-worker@scaffald.com   — "Alex Martinez", welder, Detroit MI
--   reviewer-employer@scaffald.com — "Jamie Chen", employer at Apex Mechanical Inc.
--
-- Password (both accounts): Scaffald2026!
--
-- Employer account owns "Apex Mechanical Inc." org with 3 open trade jobs.
-- The worker account has a pre-submitted application to one Apex job so
-- the employer pipeline is non-empty for App Review.
--
-- Depends on: 001 (industries)
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING / idempotent updates
-- =========================================================

BEGIN;

-- =========================================================
-- Step 1: Create auth.users for the two reviewer accounts
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
  public.crypt('Scaffald2026!', public.gen_salt('bf')),
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
  -- Worker: Alex Martinez — Journeyman Welder, Detroit MI
  ('44444444-4444-4444-4444-444444444401',
   'reviewer-worker@scaffald.com',
   'Alex Martinez', 'Alex', 'Martinez', '',
   'Detroit, Michigan, United States'),
  -- Employer: Jamie Chen — owner of Apex Mechanical Inc., Detroit MI
  ('44444444-4444-4444-4444-444444444402',
   'reviewer-employer@scaffald.com',
   'Jamie Chen', 'Jamie', 'Chen', '',
   'Detroit, Michigan, United States')
) AS u(id, email, name, first_name, last_name, phone, location)
ON CONFLICT (id) DO NOTHING;

-- Fix slugs (same sanitization pattern used in all other seeds)
WITH sanitized AS (
  SELECT id,
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(COALESCE(username, display_name)), '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'),
      '^-+|-+$', '', 'g') AS slug
  FROM core.users
  WHERE id IN (
    '44444444-4444-4444-4444-444444444401'::uuid,
    '44444444-4444-4444-4444-444444444402'::uuid
  )
)
UPDATE core.users u
SET slug = CASE
  WHEN s.slug IS NULL OR LENGTH(s.slug) < 3 OR LENGTH(s.slug) > 50 THEN NULL
  ELSE s.slug
END
FROM sanitized s WHERE u.id = s.id;

ALTER TABLE core.users
ADD CONSTRAINT users_slug_format_check
CHECK (slug IS NULL OR (LENGTH(slug) >= 3 AND LENGTH(slug) <= 50 AND slug ~ '^[a-z0-9-]+$'));

-- =========================================================
-- Step 2: Populate core.profile with address + geo
-- =========================================================
WITH reviewer_profiles AS (
  SELECT * FROM (VALUES
    ('reviewer-worker@scaffald.com',   'Alex',  'Martinez',
     '{"street":"1001 Woodward Avenue","city":"Detroit","state":"MI","zip":"48226","country":"United States"}'::jsonb,
     -83.0458, 42.3314),
    ('reviewer-employer@scaffald.com', 'Jamie', 'Chen',
     '{"street":"615 Griswold Street","city":"Detroit","state":"MI","zip":"48226","country":"United States"}'::jsonb,
     -83.0470, 42.3320)
  ) AS t(email, first_name, last_name, address, lon, lat)
)
UPDATE core.profile p
SET
  first_name = rp.first_name,
  last_name  = rp.last_name,
  address    = rp.address,
  geo        = ST_SetSRID(ST_MakePoint(rp.lon, rp.lat), 4326)::geography
FROM reviewer_profiles rp
JOIN auth.users au ON au.email = rp.email
WHERE p.user_id = au.id;

-- =========================================================
-- Step 3: Set industry + headline + experience on core.users
-- =========================================================
UPDATE core.users u
SET
  industry_id = i.id,
  headline = CASE au.email
    WHEN 'reviewer-worker@scaffald.com'
      THEN 'Journeyman Welder | AWS D1.1 Certified | 8 Years Commercial Construction'
    WHEN 'reviewer-employer@scaffald.com'
      THEN 'Owner & President at Apex Mechanical Inc.'
  END,
  years_of_experience = CASE au.email
    WHEN 'reviewer-worker@scaffald.com'   THEN 8
    WHEN 'reviewer-employer@scaffald.com' THEN 14
  END
FROM core.industries i
JOIN auth.users au ON au.email IN (
  'reviewer-worker@scaffald.com',
  'reviewer-employer@scaffald.com'
)
WHERE i.slug = 'construction'
  AND u.id = au.id;

-- =========================================================
-- Step 4: Set preferences (user_types + prerequisites_completed_at)
-- Skips onboarding so reviewers land directly in the app.
-- =========================================================
WITH reviewer_prefs AS (
  SELECT * FROM (VALUES
    ('reviewer-worker@scaffald.com',   ARRAY['worker']),
    ('reviewer-employer@scaffald.com', ARRAY['employer'])
  ) AS t(email, user_types)
)
UPDATE core.preferences pref
SET
  user_types                 = rp.user_types,
  prerequisites_completed_at = NOW()
FROM reviewer_prefs rp
JOIN auth.users au ON au.email = rp.email
WHERE pref.user_id = au.id;

-- =========================================================
-- Step 5: Create Apex Mechanical Inc. organization
-- Owned by reviewer-employer@scaffald.com
-- =========================================================
WITH owner AS (SELECT id FROM auth.users WHERE email = 'reviewer-employer@scaffald.com'),
     industry AS (SELECT id FROM core.industries WHERE slug = 'construction')
INSERT INTO core.organizations (
  owner_user_id, name, slug, industry_id,
  address, geo, website, description, visibility
)
SELECT
  o.id, 'Apex Mechanical Inc.', 'apex-mechanical', i.id,
  jsonb_build_object(
    'street', '615 Griswold Street', 'city', 'Detroit',
    'state', 'MI', 'postal', '48226', 'country', 'USA'
  ),
  ST_SetSRID(ST_MakePoint(-83.0470, 42.3320), 4326)::geography,
  'https://apexmechanical.example',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text',
            'Apex Mechanical Inc. is a Detroit-based mechanical contractor specializing in commercial HVAC, plumbing, pipe fabrication, and industrial welding. With 14 years serving southeast Michigan, we build and maintain critical systems for hospitals, data centers, and manufacturing plants.')
        )
      )
    )
  ),
  'public'
FROM owner o CROSS JOIN industry i
ON CONFLICT (slug) DO NOTHING;

-- Ensure organization-scoped roles exist (this seed cannot assume
-- another seed has run them; some prod databases haven't been
-- bootstrapped with org roles yet).
INSERT INTO core.roles (scope, name, description)
VALUES
  ('organization', 'admin', 'Organization administrator with elevated privileges'),
  ('organization', 'member', 'Organization member')
ON CONFLICT (name) DO NOTHING;

-- Assign org admin role to employer reviewer
INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT r.id, au.id, o.id, NULL
FROM core.roles r
CROSS JOIN auth.users au
CROSS JOIN core.organizations o
WHERE r.scope = 'organization' AND r.name = 'admin'
  AND o.slug = 'apex-mechanical'
  AND au.email = 'reviewer-employer@scaffald.com'
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

-- =========================================================
-- Step 6: Create 3 open jobs at Apex Mechanical
-- Located in Detroit so the worker reviewer sees them on the map.
-- =========================================================

-- Job 1: Pipe Welder / Fabricator
WITH org AS (SELECT id FROM core.organizations WHERE slug = 'apex-mechanical'),
     usr AS (SELECT id FROM auth.users WHERE email = 'reviewer-employer@scaffald.com')
INSERT INTO core.jobs (
  organization_id, created_by_user_id, title, description, status,
  employment_type, remote_option, position_level,
  location, address, geo,
  pay_range_min_cents, pay_range_max_cents, pay_range_type,
  posted_at, closes_at, slug
)
SELECT
  o.id, u.id,
  'Pipe Welder / Fabricator',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Weld and fabricate carbon steel, stainless, and chrome-moly piping for industrial and commercial mechanical systems. Must hold current AWS D1.1 certification. 5+ years of commercial pipe welding experience required. SMAW, GTAW, and FCAW processes. Prevailing wage project — certified payroll applies.')
    ))
  )),
  'open', 'full_time', 'on_site', 'Mid Level / Intermediate',
  'Detroit, MI',
  jsonb_build_object('street','615 Griswold Street','city','Detroit','state','MI','zip','48226','country','USA','latitude',42.3320,'longitude',-83.0470),
  ST_SetSRID(ST_MakePoint(-83.0470, 42.3320), 4326)::geography,
  7000000, 9500000, 'salary',
  NOW() - INTERVAL '3 days', NOW() + INTERVAL '45 days',
  'pipe-welder-fabricator-apex'
FROM org o CROSS JOIN usr u
ON CONFLICT (slug) DO NOTHING;

-- Job 2: HVAC Install Technician
WITH org AS (SELECT id FROM core.organizations WHERE slug = 'apex-mechanical'),
     usr AS (SELECT id FROM auth.users WHERE email = 'reviewer-employer@scaffald.com')
INSERT INTO core.jobs (
  organization_id, created_by_user_id, title, description, status,
  employment_type, remote_option, position_level,
  location, address, geo,
  pay_range_min_cents, pay_range_max_cents, pay_range_type,
  posted_at, closes_at, slug
)
SELECT
  o.id, u.id,
  'HVAC Install Technician',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Install rooftop units, air handlers, ductwork, and controls on new commercial construction and tenant improvement projects across Metro Detroit. EPA 608 Universal certification required. Sheet metal and controls experience a plus. We provide tools, PPE, and vehicle allowance.')
    ))
  )),
  'open', 'full_time', 'on_site', 'Entry / Junior',
  'Detroit, MI',
  jsonb_build_object('city','Detroit','state','MI','zip','48226','country','USA','latitude',42.3314,'longitude',-83.0458),
  ST_SetSRID(ST_MakePoint(-83.0458, 42.3314), 4326)::geography,
  5500000, 7500000, 'salary',
  NOW() - INTERVAL '5 days', NOW() + INTERVAL '30 days',
  'hvac-install-technician-apex'
FROM org o CROSS JOIN usr u
ON CONFLICT (slug) DO NOTHING;

-- Job 3: Scaffold Foreman
WITH org AS (SELECT id FROM core.organizations WHERE slug = 'apex-mechanical'),
     usr AS (SELECT id FROM auth.users WHERE email = 'reviewer-employer@scaffald.com')
INSERT INTO core.jobs (
  organization_id, created_by_user_id, title, description, status,
  employment_type, remote_option, position_level,
  location, address, geo,
  pay_range_min_cents, pay_range_max_cents, pay_range_type,
  posted_at, closes_at, slug
)
SELECT
  o.id, u.id,
  'Scaffold Foreman',
  jsonb_build_object('type', 'doc', 'content', jsonb_build_array(
    jsonb_build_object('type', 'paragraph', 'content', jsonb_build_array(
      jsonb_build_object('type', 'text', 'text',
        'Supervise erection and dismantling of frame, system, and suspended scaffold on active industrial turnaround and plant maintenance sites. NCCER Scaffold Foreman certification or equivalent required. Safety leadership, fall protection, and load calculation competency essential. Union referral or direct hire.')
    ))
  )),
  'open', 'full_time', 'on_site', 'Senior / Lead',
  'Detroit, MI',
  jsonb_build_object('city','Detroit','state','MI','zip','48226','country','USA','latitude',42.3400,'longitude',-83.0550),
  ST_SetSRID(ST_MakePoint(-83.0550, 42.3400), 4326)::geography,
  8000000, 11000000, 'salary',
  NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days',
  'scaffold-foreman-apex'
FROM org o CROSS JOIN usr u
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- Step 7: Pre-submit reviewer-worker application to Pipe Welder
-- so the employer pipeline is non-empty for review.
-- =========================================================
WITH job AS (SELECT id FROM core.jobs WHERE slug = 'pipe-welder-fabricator-apex'),
     worker AS (SELECT id FROM auth.users WHERE email = 'reviewer-worker@scaffald.com')
INSERT INTO core.applications (
  job_id, user_id, status, answers, is_shortlisted, stage_changed_at, created_at
)
SELECT
  j.id, w.id,
  'new',
  jsonb_build_object(
    'experience', '8 years commercial pipe welding — hospitals, refineries, and HVAC plants',
    'certifications', 'AWS D1.1, OSHA 10, Forklift',
    'availability', 'Immediate'
  ),
  false,
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
FROM job j CROSS JOIN worker w
WHERE j.id IS NOT NULL
ON CONFLICT (job_id, user_id) DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- Password for both accounts: Scaffald2026!
-- Worker UUIDs start with: 44444444-4444-4444-4444-444444444401
-- Employer UUID:            44444444-4444-4444-4444-444444444402
-- Org slug: apex-mechanical
-- Jobs: pipe-welder-fabricator-apex, hvac-install-technician-apex, scaffold-foreman-apex
--
-- PRODUCTION: These accounts must also be created in prod before App Review.
-- Use the Supabase dashboard (Authentication → Add User) or the admin API.
-- See app-store-assets/metadata/app-store-metadata.md § App Review Information.
-- =========================================================
