-- =========================================================
-- 011_seed-real-org-structure.sql
-- Real Unicorn team structure for dogfooding our own product.
-- Adds: 7 new @unicorn.love users (alongside existing clay/marc/zach),
-- 4 new teams (Design/Frontend/Backend/Infra) layered alongside existing
-- (Engineering/Operations/Hiring), and 6 software "projects" stored as
-- rows in core.construction_projects (schema misnomer — to be renamed
-- core.projects with a `kind` discriminator in Phase 3).
--
-- Idempotent: all inserts use ON CONFLICT DO NOTHING.
-- Layered on top of 004_seed-unicorn-org.sql — does not delete or modify
-- existing teams/projects/work logs.
-- =========================================================

BEGIN;

-- =========================================================
-- 1. New users — auth.users (trigger auto-creates core.users)
-- Password: password123 (matches existing convention in 002_seed-users.sql)
-- =========================================================

-- Temporarily relax slug constraint while trigger sanitizes (matches 002 pattern)
ALTER TABLE core.users DROP CONSTRAINT IF EXISTS users_slug_format_check;

INSERT INTO auth.users (
  instance_id, id, email, phone, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  u.id::uuid,
  u.email,
  NULLIF(u.phone, ''),
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
  'authenticated', 'authenticated',
  NOW(), NOW(),
  '', '', '', ''
FROM (VALUES
  ('22222222-2222-2222-2222-222222222222', 'boris@unicorn.love',    'Boris Stanic',       'Boris',   'Stanic',     '', ''),
  ('22222222-2222-2222-2222-222222222223', 'dusan@unicorn.love',    'Dusan Zivanovic',    'Dusan',   'Zivanovic',  '', ''),
  ('22222222-2222-2222-2222-222222222224', 'michael@unicorn.love',  'Michael Calabrese',  'Michael', 'Calabrese',  '', ''),
  ('22222222-2222-2222-2222-222222222225', 'nemanja@unicorn.love',  'Nemanja Stanic',     'Nemanja', 'Stanic',     '', ''),
  ('22222222-2222-2222-2222-222222222226', 'nikola@unicorn.love',   'Nikola Mirjanic',    'Nikola',  'Mirjanic',   '', ''),
  ('22222222-2222-2222-2222-222222222227', 'robin@unicorn.love',    'Robin Hjelmeir',     'Robin',   'Hjelmeir',   '', ''),
  ('22222222-2222-2222-2222-222222222228', 'subbu@unicorn.love',    'Subbu Surendra',     'Subbu',   'Surendra',   '', '')
) AS u(id, email, name, first_name, last_name, phone, location)
ON CONFLICT (id) DO NOTHING;

-- Fix display names for existing super-admin rows from 002 where metadata was sparse
UPDATE core.users SET display_name = 'Marc Gigliotti'
WHERE id = '00000000-0000-0000-0000-000000000003'
  AND (display_name IS NULL OR display_name = 'Marc');

UPDATE core.profile SET first_name = 'Marc', last_name = 'Gigliotti'
WHERE user_id = '00000000-0000-0000-0000-000000000003'
  AND (last_name IS NULL OR last_name = '');

-- Sanitize slugs that the trigger produced (mirrors 002 logic)
WITH sanitized AS (
  SELECT
    id,
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(LOWER(COALESCE(username, display_name)), '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    ) AS sanitized_slug
  FROM core.users
  WHERE slug IS NOT NULL
    AND (slug !~ '^[a-z0-9-]+$' OR LENGTH(slug) < 3 OR LENGTH(slug) > 50)
)
UPDATE core.users u
SET slug = CASE
  WHEN s.sanitized_slug IS NULL THEN NULL
  WHEN LENGTH(s.sanitized_slug) < 3 THEN NULL
  WHEN LENGTH(s.sanitized_slug) > 50 THEN NULL
  ELSE s.sanitized_slug
END
FROM sanitized s
WHERE u.id = s.id;

WITH ranked AS (
  SELECT id, slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY created_at) AS rn
  FROM core.users
  WHERE slug IS NOT NULL AND slug ~ '^[a-z0-9-]+$'
)
UPDATE core.users u
SET slug = NULL
FROM ranked r
WHERE u.id = r.id AND r.rn > 1;

ALTER TABLE core.users
ADD CONSTRAINT users_slug_format_check
CHECK (slug IS NULL OR (LENGTH(slug) >= 3 AND LENGTH(slug) <= 50 AND slug ~ '^[a-z0-9-]+$'));

-- =========================================================
-- 2. Org + platform role assignments for new users
-- (Re-run the same logic as 004; idempotent via ON CONFLICT)
-- =========================================================
INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT r.id, u.id, o.id, NULL
FROM core.roles r
CROSS JOIN auth.users u
CROSS JOIN core.organizations o
WHERE r.scope = 'organization' AND r.name = 'admin'
  AND o.slug = 'unicorn'
  AND u.email ILIKE '%@unicorn.love'
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT r.id, u.id, NULL, NULL
FROM core.roles r
CROSS JOIN auth.users u
WHERE r.scope = 'platform' AND r.name = 'super_admin'
  AND u.email ILIKE '%@unicorn.love'
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

-- Office platform role (so new users can hit office endpoints just like 002 does)
INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT r.id, u.id, NULL, NULL
FROM core.roles r
CROSS JOIN auth.users u
WHERE r.name = 'office' AND r.scope = 'platform'
  AND u.email ILIKE '%@unicorn.love'
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

-- =========================================================
-- 3. Software "projects" (stored in core.construction_projects)
-- NOTE: schema misnomer — these are software projects, not construction.
-- Phase 3 work: rename to core.projects with a `kind` discriminator.
-- =========================================================
INSERT INTO core.construction_projects (
  id, organization_id, name, project_number, status, description, is_archived, archived
)
SELECT p.id, o.id, p.name, p.project_number, p.status, p.description, false, false
FROM core.organizations o
CROSS JOIN (VALUES
  ('e0000001-0000-4000-8000-000000000001'::uuid, 'Scaffald Platform',     'UNI-SP-001', 'active', 'Cross-cutting platform work (auth, SDK, infra glue)'),
  ('e0000002-0000-4000-8000-000000000002'::uuid, 'Scaffald UI Library',   'UNI-UI-002', 'active', 'packages/ui — shared component library'),
  ('e0000003-0000-4000-8000-000000000003'::uuid, 'Logs',                  'UNI-LG-003', 'active', 'Logs feature — the dogfood target itself'),
  ('e0000004-0000-4000-8000-000000000004'::uuid, 'Tasks & Punchlists',    'UNI-TP-004', 'active', 'Phase 3 PM primitives that will replace Linear for our own use'),
  ('e0000005-0000-4000-8000-000000000005'::uuid, 'Infrastructure',        'UNI-IF-005', 'active', 'Supabase, deploys, CI/CD, env config'),
  ('e0000006-0000-4000-8000-000000000006'::uuid, 'Mobile App',            'UNI-MO-006', 'active', 'apps/scaffald-app (Expo / React Native)')
) AS p(id, name, project_number, status, description)
WHERE o.slug = 'unicorn'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- 4. Teams (layered alongside existing Engineering/Operations/Hiring)
-- =========================================================
WITH member_role AS (
  SELECT id FROM core.team_roles WHERE key = 'member' AND organization_id IS NULL LIMIT 1
),
org AS (
  SELECT id, (SELECT id FROM member_role) AS role_id FROM core.organizations WHERE slug = 'unicorn' LIMIT 1
),
clay AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1
)
INSERT INTO core.teams (organization_id, name, slug, default_role_id, default_role_key, created_by)
SELECT org.id, t.name, t.slug, org.role_id, 'member', clay.id
FROM org
CROSS JOIN clay
CROSS JOIN (VALUES
  ('Design',   'unicorn-design'),
  ('Frontend', 'unicorn-frontend'),
  ('Backend',  'unicorn-backend'),
  ('Infra',    'unicorn-infra')
) AS t(name, slug)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- 5. Team memberships per real-world spec
--   Managers (team_admin role) in ALL 4 teams:
--     clay, boris, marc, zach, michael, subbu
--   Members of Design:    dusan
--   Members of Frontend:  nemanja, robin, nikola
--   Members of Backend:   nemanja, nikola
--   Members of Infra:     nemanja
-- =========================================================

-- 5a. Managers → all 4 teams (team_admin role)
INSERT INTO core.team_members (team_id, user_id, role_id)
SELECT t.id, u.id, tr.id
FROM core.teams t
CROSS JOIN auth.users u
CROSS JOIN core.team_roles tr
WHERE t.slug IN ('unicorn-design', 'unicorn-frontend', 'unicorn-backend', 'unicorn-infra')
  AND u.email IN (
    'clay@unicorn.love',
    'boris@unicorn.love',
    'marc@unicorn.love',
    'zach@unicorn.love',
    'michael@unicorn.love',
    'subbu@unicorn.love'
  )
  AND tr.key = 'team_admin' AND tr.organization_id IS NULL
ON CONFLICT (team_id, user_id) DO NOTHING;

-- 5b. Members per team (member role)
INSERT INTO core.team_members (team_id, user_id, role_id)
SELECT t.id, u.id, t.default_role_id
FROM core.teams t
JOIN (VALUES
  ('unicorn-design',   'dusan@unicorn.love'),
  ('unicorn-frontend', 'nemanja@unicorn.love'),
  ('unicorn-frontend', 'robin@unicorn.love'),
  ('unicorn-frontend', 'nikola@unicorn.love'),
  ('unicorn-backend',  'nemanja@unicorn.love'),
  ('unicorn-backend',  'nikola@unicorn.love'),
  ('unicorn-infra',    'nemanja@unicorn.love')
) AS m(team_slug, user_email) ON m.team_slug = t.slug
JOIN auth.users u ON u.email = m.user_email
ON CONFLICT (team_id, user_id) DO NOTHING;

COMMIT;

-- =========================================================
-- POST-SEED NOTES
-- =========================================================
-- All passwords: password123
-- New @unicorn.love users get org admin + platform super_admin + office roles.
-- Existing teams (Engineering, Operations, Hiring) and projects (HQ/WH/OF)
-- remain untouched. Existing work logs in 004 remain attached to construction
-- projects (b0000001..b0000003); new logs from `scripts/dogfood-log.ts` should
-- attach to the software projects (d0000001..d0000006).
-- =========================================================
