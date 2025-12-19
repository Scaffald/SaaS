-- =========================================================
-- 002_seed-organizations.sql - ForSured Test Organizations
-- Seeds core.organizations with fixed UUIDs for ForSured testing
-- =========================================================

BEGIN;

-- =========================================================
-- TEST ORGANIZATIONS FOR FORSURED APPLICATION
-- =========================================================
-- ID Convention: 60000000-0000-0000-0000-0000000000XX
-- GC Orgs: 01-03, Contractor Orgs: 11-13, Broker Orgs: 21
-- =========================================================

-- Get the construction industry ID
WITH industry_lookup AS (
  SELECT id FROM core.industries WHERE slug = 'construction' LIMIT 1
)
INSERT INTO core.organizations (
  id,
  owner_user_id,
  name,
  slug,
  industry_id,
  address,
  geo,
  website,
  description
)
SELECT
  orgs.id::uuid,
  orgs.owner_id::uuid,
  orgs.name,
  orgs.slug,
  il.id,
  orgs.address::jsonb,
  ST_SetSRID(ST_MakePoint(orgs.lon, orgs.lat), 4326)::geography,
  orgs.website,
  jsonb_build_object(
    'type', 'doc',
    'content', jsonb_build_array(
      jsonb_build_object(
        'type', 'paragraph',
        'content', jsonb_build_array(
          jsonb_build_object('type', 'text', 'text', orgs.description_text)
        )
      )
    )
  )
FROM industry_lookup il,
(VALUES
  -- =========================================================
  -- GC ORGANIZATIONS
  -- =========================================================
  (
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',  -- Active GC User
    'Acme Construction Group',
    'acme-construction-group',
    '{"street": "100 Construction Way", "city": "New York", "state": "NY", "postal": "10001", "country": "USA"}',
    40.7128,
    -74.0060,
    'https://acme-construction.test',
    'Leading general contractor specializing in commercial and industrial construction in the Northeast'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000002',  -- Onboarding GC User
    'BuildRight Contractors',
    'buildright-contractors',
    '{"street": "200 Builder Ave", "city": "Boston", "state": "MA", "postal": "02101", "country": "USA"}',
    42.3601,
    -71.0589,
    'https://buildright.test',
    'Commercial construction management and general contracting services in New England'
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '50000000-0000-0000-0000-000000000004',  -- MultiProject GC User
    'Pacific Coast Builders',
    'pacific-coast-builders',
    '{"street": "300 Ocean Blvd", "city": "Los Angeles", "state": "CA", "postal": "90001", "country": "USA"}',
    34.0522,
    -118.2437,
    'https://pacific-coast-builders.test',
    'Large-scale construction firm with projects across the Western United States'
  ),

  -- =========================================================
  -- CONTRACTOR ORGANIZATIONS
  -- =========================================================
  (
    '60000000-0000-0000-0000-000000000011',
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor
    'Elite Electrical Services',
    'elite-electrical-services',
    '{"street": "400 Spark St", "city": "Houston", "state": "TX", "postal": "77001", "country": "USA"}',
    29.7604,
    -95.3698,
    'https://elite-electrical.test',
    'Full-service electrical contractor for commercial and industrial projects'
  ),
  (
    '60000000-0000-0000-0000-000000000012',
    '50000000-0000-0000-0000-000000000013',  -- NonCompliant Contractor
    'Budget Plumbing Co',
    'budget-plumbing-co',
    '{"street": "500 Pipe Lane", "city": "San Antonio", "state": "TX", "postal": "78201", "country": "USA"}',
    29.4241,
    -98.4936,
    'https://budget-plumbing.test',
    'Residential and commercial plumbing services in Texas'
  ),
  (
    '60000000-0000-0000-0000-000000000013',
    '50000000-0000-0000-0000-000000000011',  -- Fresh Contractor
    'Phoenix HVAC Solutions',
    'phoenix-hvac-solutions',
    '{"street": "600 Cool Rd", "city": "Phoenix", "state": "AZ", "postal": "85001", "country": "USA"}',
    33.4484,
    -112.0740,
    'https://phoenix-hvac.test',
    'Commercial HVAC installation and maintenance services'
  ),

  -- =========================================================
  -- BROKER ORGANIZATIONS
  -- =========================================================
  (
    '60000000-0000-0000-0000-000000000021',
    '50000000-0000-0000-0000-000000000022',  -- Active Broker
    'Pinnacle Insurance Brokers',
    'pinnacle-insurance-brokers',
    '{"street": "700 Insurance Plaza", "city": "San Jose", "state": "CA", "postal": "95101", "country": "USA"}',
    37.3382,
    -121.8863,
    'https://pinnacle-insurance.test',
    'Specialized insurance brokerage for construction and contracting industry'
  )
) AS orgs(id, owner_id, name, slug, address, lat, lon, website, description_text)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- ASSIGN USERS TO ORGANIZATIONS VIA role_assignments
-- =========================================================

-- First get the role IDs we need
WITH roles AS (
  SELECT id, name FROM core.roles WHERE name IN ('owner', 'admin', 'member') AND scope = 'organization'
)
INSERT INTO core.role_assignments (role_id, user_id, scope_org_id, scope_team_id)
SELECT
  r.id,
  ra.user_id::uuid,
  ra.org_id::uuid,
  NULL
FROM roles r,
(VALUES
  -- GC Org 1 - Active GC is owner
  ('owner', '50000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000001'),
  ('member', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001'),

  -- GC Org 2 - Onboarding GC is owner
  ('owner', '50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002'),

  -- GC Org 3 - MultiProject GC is owner
  ('owner', '50000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000003'),

  -- Contractor Org 1 - Active Contractor is owner
  ('owner', '50000000-0000-0000-0000-000000000012', '60000000-0000-0000-0000-000000000011'),

  -- Contractor Org 2 - NonCompliant Contractor is owner
  ('owner', '50000000-0000-0000-0000-000000000013', '60000000-0000-0000-0000-000000000012'),

  -- Contractor Org 3 - Fresh Contractor is owner
  ('owner', '50000000-0000-0000-0000-000000000011', '60000000-0000-0000-0000-000000000013'),
  ('member', '50000000-0000-0000-0000-000000000014', '60000000-0000-0000-0000-000000000013'),

  -- Broker Org - Active Broker is owner
  ('owner', '50000000-0000-0000-0000-000000000022', '60000000-0000-0000-0000-000000000021'),
  ('member', '50000000-0000-0000-0000-000000000021', '60000000-0000-0000-0000-000000000021'),

  -- Admin has access to primary GC org
  ('admin', '50000000-0000-0000-0000-000000000031', '60000000-0000-0000-0000-000000000001')
) AS ra(role_name, user_id, org_id)
WHERE r.name = ra.role_name
ON CONFLICT (role_id, user_id, scope_org_id, scope_team_id) DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. Organizations are linked to their owner users via owner_user_id
-- 2. Role assignments create the user-org memberships needed for RLS
-- 3. All organizations use fixed UUIDs for deterministic testing
-- 4. Geographic data uses ST_SetSRID for proper PostGIS support
-- 5. ON CONFLICT clauses make this seed idempotent
-- =========================================================
