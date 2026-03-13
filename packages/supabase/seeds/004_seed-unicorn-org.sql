-- =========================================================
-- Unicorn Organization Seed Data (Super-Admin / Employer Demo)
-- Creates Unicorn organization owned by clay@unicorn.love.
-- All @unicorn.love users are org members. Includes jobs,
-- construction projects, teams, work logs for full employer/PM demo.
-- =========================================================

BEGIN;

-- Get Clay's user ID and construction industry ID
WITH user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love'
),
industry_lookup AS (
  SELECT id FROM core.industries WHERE slug = 'construction'
)
-- Insert Unicorn organization
INSERT INTO core.organizations (
  owner_user_id,
  name,
  slug,
  industry_id,
  address,
  geo,
  website,
  description,
  visibility
)
SELECT 
  u.id,
  'Unicorn',
  'unicorn',
  i.id,
  jsonb_build_object(
    'street', '123 Main Street',
    'city', 'Clare',
    'state', 'MI',
    'postal', '48617',
    'country', 'USA'
  ),
  ST_SetSRID(ST_MakePoint(-84.7697, 43.8197), 4326)::geography,
  'https://unicorn.love',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Unicorn is a leading construction and technology company focused on building innovative solutions for the skilled trades industry.')
        )
      )
    )
  ),
  'public'
FROM user_lookup u
CROSS JOIN industry_lookup i
ON CONFLICT (slug) DO NOTHING;

-- Ensure organization-scoped role exists for org membership
INSERT INTO core.roles (scope, name, description)
VALUES ('organization', 'admin', 'Organization administrator with elevated privileges')
ON CONFLICT (name) DO NOTHING;

-- Ensure platform super_admin role exists (referenced by RLS in many places)
INSERT INTO core.roles (scope, name, description)
VALUES ('platform', 'super_admin', 'Platform super administrator')
ON CONFLICT (name) DO NOTHING;

-- Assign all @unicorn.love users as Unicorn org members (organization admin role)
INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT r.id, u.id, o.id, NULL
FROM core.roles r
CROSS JOIN auth.users u
CROSS JOIN core.organizations o
WHERE r.scope = 'organization' AND r.name = 'admin'
  AND o.slug = 'unicorn'
  AND u.email ILIKE '%@unicorn.love'
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

-- Assign platform super_admin to all @unicorn.love users
INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT r.id, u.id, NULL, NULL
FROM core.roles r
CROSS JOIN auth.users u
WHERE r.scope = 'platform' AND r.name = 'super_admin'
  AND u.email ILIKE '%@unicorn.love'
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

-- Insert jobs for Unicorn organization
-- Job 1: Senior Software Engineer
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'unicorn'
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love'
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Senior Software Engineer',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Join our engineering team to build innovative solutions for the skilled trades industry. Work on cutting-edge technology that connects workers with opportunities.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'hybrid',
  'Senior / Lead',
  'Clare, MI',
  jsonb_build_object(
    'street', '123 Main Street',
    'city', 'Clare',
    'state', 'MI',
    'zip', '48617',
    'country', 'USA',
    'latitude', 43.8197,
    'longitude', -84.7697
  ),
  ST_SetSRID(ST_MakePoint(-84.7697, 43.8197), 4326)::geography,
  12000000, -- $120,000
  16000000, -- $160,000
  'salary',
  NOW() - INTERVAL '5 days',
  NOW() + INTERVAL '60 days',
  'senior-software-engineer-unicorn'
FROM org_lookup o
CROSS JOIN user_lookup u
ON CONFLICT (slug) DO NOTHING;

-- Job 2: Construction Project Manager
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'unicorn'
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love'
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Construction Project Manager',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Lead construction projects from planning to completion. Manage budgets, timelines, and teams while ensuring quality and safety standards.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'on_site',
  'Mid Level / Intermediate',
  'Clare, MI',
  jsonb_build_object(
    'street', '123 Main Street',
    'city', 'Clare',
    'state', 'MI',
    'zip', '48617',
    'country', 'USA',
    'latitude', 43.8197,
    'longitude', -84.7697
  ),
  ST_SetSRID(ST_MakePoint(-84.7697, 43.8197), 4326)::geography,
  8000000, -- $80,000
  11000000, -- $110,000
  'salary',
  NOW() - INTERVAL '3 days',
  NOW() + INTERVAL '45 days',
  'construction-project-manager-unicorn'
FROM org_lookup o
CROSS JOIN user_lookup u
ON CONFLICT (slug) DO NOTHING;

-- Job 3: Full Stack Developer
WITH org_lookup AS (
  SELECT id FROM core.organizations WHERE slug = 'unicorn'
),
user_lookup AS (
  SELECT id FROM auth.users WHERE email = 'clay@unicorn.love'
)
INSERT INTO core.jobs (
  organization_id,
  created_by_user_id,
  title,
  description,
  status,
  employment_type,
  remote_option,
  position_level,
  location,
  address,
  geo,
  pay_range_min_cents,
  pay_range_max_cents,
  pay_range_type,
  posted_at,
  closes_at,
  slug
)
SELECT 
  o.id,
  u.id,
  'Full Stack Developer',
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', 'Build and maintain web and mobile applications. Work with modern technologies including React, TypeScript, and Node.js. Collaborate with cross-functional teams to deliver high-quality software.')
        )
      )
    )
  ),
  'open',
  'full_time',
  'remote',
  'Mid Level / Intermediate',
  'Remote - US',
  jsonb_build_object(
    'city', 'Clare',
    'state', 'MI',
    'country', 'USA',
    'latitude', 43.8197,
    'longitude', -84.7697
  ),
  ST_SetSRID(ST_MakePoint(-84.7697, 43.8197), 4326)::geography,
  9000000, -- $90,000
  13000000, -- $130,000
  'salary',
  NOW() - INTERVAL '7 days',
  NOW() + INTERVAL '90 days',
  'full-stack-developer-unicorn'
FROM org_lookup o
CROSS JOIN user_lookup u
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- Construction projects (for work logs)
-- =========================================================
INSERT INTO core.construction_projects (
  id,
  organization_id,
  name,
  project_number,
  status,
  description,
  is_archived,
  archived
)
SELECT o.id, o.id, p.name, p.project_number, p.status, p.description, false, false
FROM core.organizations o
CROSS JOIN (VALUES
  ('b0000001-0000-4000-8000-000000000001'::uuid, 'HQ Renovation', 'UNI-HQ-001', 'active', 'Main office renovation and expansion'),
  ('b0000002-0000-4000-8000-000000000002'::uuid, 'Warehouse Build', 'UNI-WH-002', 'active', 'New warehouse construction'),
  ('b0000003-0000-4000-8000-000000000003'::uuid, 'Office Fit-Out', 'UNI-OF-003', 'active', 'Interior fit-out for new tenant space')
) AS p(id, name, project_number, status, description)
WHERE o.slug = 'unicorn'
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Teams (use global member role for default_role_id)
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
  ('Engineering', 'unicorn-engineering'),
  ('Operations', 'unicorn-operations'),
  ('Hiring', 'unicorn-hiring')
) AS t(name, slug)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- Team members (assign @unicorn.love users to teams)
-- =========================================================
INSERT INTO core.team_members (team_id, user_id)
SELECT t.id, u.id
FROM core.teams t
CROSS JOIN auth.users u
WHERE t.slug IN ('unicorn-engineering', 'unicorn-operations', 'unicorn-hiring')
  AND u.email ILIKE '%@unicorn.love'
ON CONFLICT (team_id, user_id) DO NOTHING;

-- =========================================================
-- Work logs (8 entries across projects and users, mixed statuses)
-- =========================================================
-- time_entries format: [{"start": "09:00", "end": "17:00"}] => 8h (satisfies total_hours constraint)
INSERT INTO core.work_logs (
  id,
  user_id,
  project_id,
  entry_type,
  log_date,
  time_entries,
  work_description,
  tasks_completed,
  status,
  submitted_at,
  verified_by_user_id,
  verified_at,
  visibility
)
SELECT wl.id, u.id, wl.project_id, 'daily', wl.log_date,
  '[{"start": "09:00", "end": "17:00"}]'::jsonb,
  wl.work_description,
  wl.tasks_completed,
  wl.status,
  wl.submitted_at,
  wl.verified_by_user_id,
  wl.verified_at,
  'private'
FROM (VALUES
  ('c0000001-0000-4000-8000-000000000001'::uuid, 'b0000001-0000-4000-8000-000000000001'::uuid, (CURRENT_DATE - 20), 'Demolition and framing prep for north wing.', ARRAY['Remove drywall', 'Frame new partition']::text[], 'draft', NULL, NULL, NULL),
  ('c0000002-0000-4000-8000-000000000002'::uuid, 'b0000001-0000-4000-8000-000000000001'::uuid, (CURRENT_DATE - 18), 'Electrical rough-in and panel work.', ARRAY['Run conduit', 'Install panel']::text[], 'pending_verification', (NOW() - INTERVAL '1 day'), NULL, NULL),
  ('c0000003-0000-4000-8000-000000000003'::uuid, 'b0000002-0000-4000-8000-000000000002'::uuid, (CURRENT_DATE - 15), 'Foundation inspection and slab prep.', ARRAY['Site inspection', 'Formwork check']::text[], 'verified', (NOW() - INTERVAL '3 days'), (SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1), (NOW() - INTERVAL '2 days')),
  ('c0000004-0000-4000-8000-000000000004'::uuid, 'b0000002-0000-4000-8000-000000000002'::uuid, (CURRENT_DATE - 12), 'Steel erection and welding.', ARRAY['Erect columns', 'Weld connections']::text[], 'verified', (NOW() - INTERVAL '2 days'), (SELECT id FROM auth.users WHERE email = 'clay@unicorn.love' LIMIT 1), (NOW() - INTERVAL '1 day')),
  ('c0000005-0000-4000-8000-000000000005'::uuid, 'b0000003-0000-4000-8000-000000000003'::uuid, (CURRENT_DATE - 10), 'Drywall and taping.', ARRAY['Hang drywall', 'First coat']::text[], 'draft', NULL, NULL, NULL),
  ('c0000006-0000-4000-8000-000000000006'::uuid, 'b0000003-0000-4000-8000-000000000003'::uuid, (CURRENT_DATE - 7), 'Paint and trim installation.', ARRAY['Prime walls', 'Install baseboard']::text[], 'pending_verification', (NOW() - INTERVAL '5 hours'), NULL, NULL),
  ('c0000007-0000-4000-8000-000000000007'::uuid, 'b0000001-0000-4000-8000-000000000001'::uuid, (CURRENT_DATE - 5), 'Final punch list and cleanup.', ARRAY['Punch list', 'Site cleanup']::text[], 'verified', (NOW() - INTERVAL '1 day'), (SELECT id FROM auth.users WHERE email = 'zach@unicorn.love' LIMIT 1), (NOW() - INTERVAL '12 hours')),
  ('c0000008-0000-4000-8000-000000000008'::uuid, 'b0000002-0000-4000-8000-000000000002'::uuid, (CURRENT_DATE - 2), 'HVAC and plumbing rough-in.', ARRAY['Ductwork', 'Pipe runs']::text[], 'verified', (NOW() - INTERVAL '12 hours'), (SELECT id FROM auth.users WHERE email = 'zach@unicorn.love' LIMIT 1), (NOW() - INTERVAL '6 hours'))
) AS wl(id, project_id, log_date, work_description, tasks_completed, status, submitted_at, verified_by_user_id, verified_at)
CROSS JOIN LATERAL (SELECT id FROM auth.users WHERE email ILIKE '%@unicorn.love' ORDER BY email LIMIT 1 OFFSET (ABS(hashtext(wl.id::text)) % 4)) u
ON CONFLICT (id) DO NOTHING;

-- Fix work logs: assign user_id per row (LATERAL may not match 1:1). Use explicit user mapping.
-- Delete the insert above and do a simpler one with explicit user emails per row.
-- Actually the LATERAL subquery is wrong - we need one user per work log row. Let me use a simpler approach: hardcode user by row.
DELETE FROM core.work_logs WHERE id IN (
  'c0000001-0000-4000-8000-000000000001', 'c0000002-0000-4000-8000-000000000002',
  'c0000003-0000-4000-8000-000000000003', 'c0000004-0000-4000-8000-000000000004',
  'c0000005-0000-4000-8000-000000000005', 'c0000006-0000-4000-8000-000000000006',
  'c0000007-0000-4000-8000-000000000007', 'c0000008-0000-4000-8000-000000000008'
);

INSERT INTO core.work_logs (
  id,
  user_id,
  project_id,
  entry_type,
  log_date,
  time_entries,
  work_description,
  tasks_completed,
  status,
  submitted_at,
  verified_by_user_id,
  verified_at,
  visibility
)
SELECT wl.id, u.id, wl.project_id, 'daily', wl.log_date,
  '[{"start": "09:00", "end": "17:00"}]'::jsonb,
  wl.work_description,
  wl.tasks_completed,
  wl.status,
  wl.submitted_at,
  verifier.id,
  wl.verified_at,
  'private'
FROM (VALUES
  ('c0000001-0000-4000-8000-000000000001'::uuid, 'b0000001-0000-4000-8000-000000000001'::uuid, (CURRENT_DATE - 20), 'Demolition and framing prep for north wing.', ARRAY['Remove drywall', 'Frame new partition']::text[], 'draft', NULL::timestamptz, NULL::timestamptz, 'clay@unicorn.love', NULL::timestamptz),
  ('c0000002-0000-4000-8000-000000000002'::uuid, 'b0000001-0000-4000-8000-000000000001'::uuid, (CURRENT_DATE - 18), 'Electrical rough-in and panel work.', ARRAY['Run conduit', 'Install panel']::text[], 'pending_verification', (NOW() - INTERVAL '1 day'), NULL::timestamptz, 'zach@unicorn.love', NULL::timestamptz),
  ('c0000003-0000-4000-8000-000000000003'::uuid, 'b0000002-0000-4000-8000-000000000002'::uuid, (CURRENT_DATE - 15), 'Foundation inspection and slab prep.', ARRAY['Site inspection', 'Formwork check']::text[], 'verified', (NOW() - INTERVAL '3 days'), (NOW() - INTERVAL '2 days'), 'marc@unicorn.love', 'clay@unicorn.love'),
  ('c0000004-0000-4000-8000-000000000004'::uuid, 'b0000002-0000-4000-8000-000000000002'::uuid, (CURRENT_DATE - 12), 'Steel erection and welding.', ARRAY['Erect columns', 'Weld connections']::text[], 'verified', (NOW() - INTERVAL '2 days'), (NOW() - INTERVAL '1 day'), 'clay@unicorn.love', 'zach@unicorn.love'),
  ('c0000005-0000-4000-8000-000000000005'::uuid, 'b0000003-0000-4000-8000-000000000003'::uuid, (CURRENT_DATE - 10), 'Drywall and taping.', ARRAY['Hang drywall', 'First coat']::text[], 'draft', NULL::timestamptz, NULL::timestamptz, 'test@unicorn.love', NULL::timestamptz),
  ('c0000006-0000-4000-8000-000000000006'::uuid, 'b0000003-0000-4000-8000-000000000003'::uuid, (CURRENT_DATE - 7), 'Paint and trim installation.', ARRAY['Prime walls', 'Install baseboard']::text[], 'pending_verification', (NOW() - INTERVAL '5 hours'), NULL::timestamptz, 'zach@unicorn.love', NULL::timestamptz),
  ('c0000007-0000-4000-8000-000000000007'::uuid, 'b0000001-0000-4000-8000-000000000001'::uuid, (CURRENT_DATE - 5), 'Final punch list and cleanup.', ARRAY['Punch list', 'Site cleanup']::text[], 'verified', (NOW() - INTERVAL '1 day'), (NOW() - INTERVAL '12 hours'), 'marc@unicorn.love', 'zach@unicorn.love'),
  ('c0000008-0000-4000-8000-000000000008'::uuid, 'b0000002-0000-4000-8000-000000000002'::uuid, (CURRENT_DATE - 2), 'HVAC and plumbing rough-in.', ARRAY['Ductwork', 'Pipe runs']::text[], 'verified', (NOW() - INTERVAL '12 hours'), (NOW() - INTERVAL '6 hours'), 'clay@unicorn.love', 'zach@unicorn.love')
) AS wl(id, project_id, log_date, work_description, tasks_completed, status, submitted_at, verified_at, user_email, verifier_email)
JOIN auth.users u ON u.email = wl.user_email
LEFT JOIN auth.users verifier ON verifier.email = wl.verifier_email
ON CONFLICT (id) DO NOTHING;

COMMIT;

