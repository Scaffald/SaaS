-- =========================================================
-- Unicorn Organization Seed Data
-- Creates Unicorn organization owned by clay@unicorn.love
-- Includes 2-3 open jobs with proper geo coordinates
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

COMMIT;

