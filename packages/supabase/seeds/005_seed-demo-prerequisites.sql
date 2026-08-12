-- =========================================================
-- 005_seed-demo-prerequisites.sql
-- Seeds demo AccountSwitcher users with completed prerequisites
-- so they skip the /onboarding step.
--
-- Also covers the three accounts tests/infrastructure/playwright/setup/setup/
-- auth.setup.ts authenticates as, so the Playwright setup project can produce
-- its storage-state files and specs can reach protected routes (#575).
--
-- 1. Creates auth.users entries for the 4 unseeded demo accounts
-- 2. Populates core.profile (first_name, last_name, address, geo)
-- 3. Sets core.users.industry_id (construction)
-- 4. Sets core.preferences (user_types, prerequisites_completed_at,
--    accepted_privacy_policy_at, accepted_terms_of_service_at)
-- =========================================================

BEGIN;

-- =========================================================
-- Step 1: Create auth.users for the 4 new demo accounts
-- =========================================================
-- Temporarily drop slug constraint (trigger sets slug from username)
ALTER TABLE core.users DROP CONSTRAINT IF EXISTS users_slug_format_check;

INSERT INTO auth.users (
  instance_id,
  id,
  email,
  phone,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  users.id::uuid,
  users.email,
  NULLIF(users.phone, ''),
  public.crypt('password123', public.gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object(
    'provider', 'email',
    'name', users.name,
    'first_name', users.first_name,
    'last_name', users.last_name,
    'location', users.location
  ),
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '', '', '', ''
FROM (VALUES
  -- Brian Carter – Employer at Wizard Construction (Detroit, MI)
  ('22222222-2222-2222-2222-222222222201', 'brian.carter@wizard.construction', 'Brian Carter', 'Brian', 'Carter', '', 'Detroit, Michigan, United States'),
  -- Marcus Rivera – Plumber (Grand Rapids, MI)
  ('22222222-2222-2222-2222-222222222202', 'marcus.rivera@example.test', 'Marcus Rivera', 'Marcus', 'Rivera', '', 'Grand Rapids, Michigan, United States'),
  -- Jake Hendricks – Electrician (Ann Arbor, MI)
  ('22222222-2222-2222-2222-222222222203', 'jake.hendricks@example.test', 'Jake Hendricks', 'Jake', 'Hendricks', '', 'Ann Arbor, Michigan, United States'),
  -- Carlos Gutierrez – Carpenter (Lansing, MI)
  ('22222222-2222-2222-2222-222222222204', 'carlos.gutierrez@example.test', 'Carlos Gutierrez', 'Carlos', 'Gutierrez', '', 'Lansing, Michigan, United States')
) AS users(id, email, name, first_name, last_name, phone, location)
ON CONFLICT (id) DO NOTHING;

-- Fix slugs for the new users (same pattern as 002)
WITH sanitized AS (
  SELECT
    id,
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(COALESCE(username, display_name)), '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    ) AS slug
  FROM core.users
  WHERE id IN (
    '22222222-2222-2222-2222-222222222201'::uuid,
    '22222222-2222-2222-2222-222222222202'::uuid,
    '22222222-2222-2222-2222-222222222203'::uuid,
    '22222222-2222-2222-2222-222222222204'::uuid
  )
)
UPDATE core.users u
SET slug = CASE
  WHEN s.slug IS NULL OR LENGTH(s.slug) < 3 OR LENGTH(s.slug) > 50 THEN NULL
  ELSE s.slug
END
FROM sanitized s
WHERE u.id = s.id;

-- Re-enable the slug constraint
ALTER TABLE core.users
ADD CONSTRAINT users_slug_format_check
CHECK (
  slug IS NULL OR (
    LENGTH(slug) >= 3 AND
    LENGTH(slug) <= 50 AND
    slug ~ '^[a-z0-9-]+$'
  )
);

-- =========================================================
-- Step 2: Populate core.profile with address + geo for all 7 demo users
-- =========================================================
WITH demo_profiles AS (
  SELECT * FROM (VALUES
    -- Clay (Admin) – Clare, MI
    ('clay@unicorn.love',
     'Clay', 'Unicorn',
     '{"street":"123 Main Street","city":"Clare","state":"MI","zip":"48617","country":"United States"}'::jsonb,
     -84.7697, 43.8197),

    -- The two accounts auth.setup.ts authenticates as, beyond zach. Without
    -- an address they fail the prerequisites check on hasAddress and land on
    -- /onboarding, which blocked the whole Playwright setup project (#575).
    ('ewongagent@gmail.com',
     'Eric', 'Wong',
     '{"street":"200 Market Street","city":"Charlotte","state":"NC","zip":"28202","country":"United States"}'::jsonb,
     -80.8431, 35.2271),

    ('lexis.salah@eths.education.com',
     'Lexis', 'Salah',
     '{"street":"88 Elm Street","city":"Evanston","state":"IL","zip":"60201","country":"United States"}'::jsonb,
     -87.6877, 42.0451),

    -- Zach Servideo – Ipswich, MA
    ('zach@unicorn.love',
     'Zach', 'Servideo',
     '{"street":"10 Central Street","city":"Ipswich","state":"MA","zip":"01938","country":"United States"}'::jsonb,
     -70.8417, 42.6792),

    -- Luke Bloxham – Beverly, MA
    ('bloxhambuilding@gmail.com',
     'Luke', 'Bloxham',
     '{"street":"45 Rantoul Street","city":"Beverly","state":"MA","zip":"01915","country":"United States"}'::jsonb,
     -70.8800, 42.5584),

    -- Brian Carter – Detroit, MI
    ('brian.carter@wizard.construction',
     'Brian', 'Carter',
     '{"street":"500 Griswold Street","city":"Detroit","state":"MI","zip":"48226","country":"United States"}'::jsonb,
     -83.0458, 42.3314),

    -- Marcus Rivera – Grand Rapids, MI
    ('marcus.rivera@example.test',
     'Marcus', 'Rivera',
     '{"street":"100 Monroe Center NW","city":"Grand Rapids","state":"MI","zip":"49503","country":"United States"}'::jsonb,
     -85.6681, 42.9634),

    -- Jake Hendricks – Ann Arbor, MI
    ('jake.hendricks@example.test',
     'Jake', 'Hendricks',
     '{"street":"220 E Huron Street","city":"Ann Arbor","state":"MI","zip":"48104","country":"United States"}'::jsonb,
     -83.7430, 42.2808),

    -- Carlos Gutierrez – Lansing, MI
    ('carlos.gutierrez@example.test',
     'Carlos', 'Gutierrez',
     '{"street":"124 W Allegan Street","city":"Lansing","state":"MI","zip":"48933","country":"United States"}'::jsonb,
     -84.5555, 42.7325)
  ) AS t(email, first_name, last_name, address, lon, lat)
)
UPDATE core.profile p
SET
  first_name = dp.first_name,
  last_name  = dp.last_name,
  address    = dp.address,
  geo        = ST_SetSRID(ST_MakePoint(dp.lon, dp.lat), 4326)::geography
FROM demo_profiles dp
JOIN auth.users au ON au.email = dp.email
WHERE p.user_id = au.id;

-- =========================================================
-- Step 3: Set industry_id on core.users (construction for all demo users)
-- =========================================================
UPDATE core.users u
SET industry_id = i.id
FROM core.industries i
JOIN auth.users au ON au.email IN (
  'clay@unicorn.love',
  'zach@unicorn.love',
  'ewongagent@gmail.com',
  'lexis.salah@eths.education.com',
  'bloxhambuilding@gmail.com',
  'brian.carter@wizard.construction',
  'marcus.rivera@example.test',
  'jake.hendricks@example.test',
  'carlos.gutierrez@example.test'
)
WHERE i.slug = 'construction'
  AND u.id = au.id;

-- =========================================================
-- Step 4: Set user_types + prerequisites_completed_at on core.preferences
-- =========================================================
WITH demo_prefs AS (
  SELECT * FROM (VALUES
    -- Admins: employer + worker
    ('clay@unicorn.love',             ARRAY['employer', 'worker']),
    ('zach@unicorn.love',             ARRAY['employer', 'worker']),
    -- Luke: worker
    ('bloxhambuilding@gmail.com',     ARRAY['worker']),
    -- Brian: employer
    ('brian.carter@wizard.construction', ARRAY['employer']),
    -- Workers: Marcus, Jake, Carlos
    ('ewongagent@gmail.com',          ARRAY['employer']),
    ('lexis.salah@eths.education.com', ARRAY['worker']),
    ('marcus.rivera@example.test',    ARRAY['worker']),
    ('jake.hendricks@example.test',   ARRAY['worker']),
    ('carlos.gutierrez@example.test', ARRAY['worker'])
  ) AS t(email, user_types)
)
UPDATE core.preferences pref
SET
  user_types = dp.user_types,
  prerequisites_completed_at = NOW(),
  -- Legal acceptances are part of the onboarding gate (the prerequisites
  -- check requires both timestamps). Without these a fresh `supa db reset`
  -- leaves demo users stuck on /onboarding. See scripts/audit/README.md.
  accepted_privacy_policy_at = NOW(),
  accepted_terms_of_service_at = NOW(),
  -- Read from core.legal_documents rather than hardcoded.
  --
  -- These were '1.0' while migration 342 publishes 'v1.0', and the check is a
  -- string equality (`acceptedVersion !== doc.version`). So every demo user
  -- has been legally stale since 342 landed — past /onboarding but bounced to
  -- /legal-update, which is why no seeded account could reach a protected
  -- route (#575). Deriving it means the next version bump cannot desync the
  -- seed again.
  privacy_policy_version = (
    SELECT version FROM core.legal_documents
    WHERE doc_type = 'privacy_policy' AND is_current LIMIT 1
  ),
  terms_of_service_version = (
    SELECT version FROM core.legal_documents
    WHERE doc_type = 'terms_of_service' AND is_current LIMIT 1
  )
FROM demo_prefs dp
JOIN auth.users au ON au.email = dp.email
WHERE pref.user_id = au.id;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. All demo users share password: password123
-- 2. New demo user IDs: 22222222-2222-2222-2222-2222222222XX
-- 3. This seed depends on: 001 (industries), 002 (existing users)
-- 4. The handle_new_user() trigger creates core.users/profile/preferences
--    for the 4 new auth.users entries automatically
-- 5. ON CONFLICT (id) makes auth inserts idempotent
-- 6. The UPDATE statements are also idempotent (safe to re-run)
-- =========================================================
