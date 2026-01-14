-- =========================================================
-- 003_seed-projects.sql - ForSured Test Projects & Subcontractors
-- Seeds forsured.projects and forsured.subcontractors
-- =========================================================

BEGIN;

-- =========================================================
-- FORSURED PROJECTS
-- =========================================================
-- ID Convention: 70000000-0000-0000-0000-0000000000XX
-- Active: 01-03, NonCompliant: 11-12, Completed: 21
-- =========================================================

INSERT INTO forsured.projects (
  id,
  name,
  scaffald_project_id,
  organization_id,
  manager_id,
  created_at,
  updated_at
)
VALUES
  -- =========================================================
  -- ACTIVE PROJECTS (GC Org 1 - Acme Construction)
  -- =========================================================
  (
    '70000000-0000-0000-0000-000000000001',
    'Downtown Office Tower - Phase 1',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC User
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    'Riverside Medical Center Expansion',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC User
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '2 days'
  ),

  -- =========================================================
  -- LARGE PROJECT (GC Org 3 - Pacific Coast)
  -- =========================================================
  (
    '70000000-0000-0000-0000-000000000003',
    'West Coast Distribution Hub',
    NULL,
    '60000000-0000-0000-0000-000000000003',  -- Pacific Coast Builders
    '50000000-0000-0000-0000-000000000004',  -- MultiProject GC
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '3 days'
  ),

  -- =========================================================
  -- NON-COMPLIANT PROJECT (GC Org 1)
  -- =========================================================
  (
    '70000000-0000-0000-0000-000000000011',
    'Industrial Park Renovation',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC User
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '5 days'
  ),

  -- =========================================================
  -- WARNING PROJECT (GC Org 2)
  -- =========================================================
  (
    '70000000-0000-0000-0000-000000000012',
    'Tech Campus Building B',
    NULL,
    '60000000-0000-0000-0000-000000000002',  -- BuildRight Contractors
    '50000000-0000-0000-0000-000000000002',  -- Onboarding GC
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day'
  ),

  -- =========================================================
  -- COMPLETED PROJECT (GC Org 1)
  -- =========================================================
  (
    '70000000-0000-0000-0000-000000000021',
    'Municipal Water Treatment Facility',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC User
    NOW() - INTERVAL '365 days',
    NOW() - INTERVAL '30 days'
  ),

  -- =========================================================
  -- PROJECTS FOR TEST-GC USER (test-gc@forsured.test)
  -- Organization: 60000000-0000-0000-0000-000000000031
  -- Manager: 10000000-0000-0000-0000-000000000001
  -- =========================================================
  (
    '90000000-0000-0000-0000-000000000001',
    'Downtown Office Renovation',
    NULL,
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc@forsured.test
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    'Residential Complex - Phase 1',
    NULL,
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc@forsured.test
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '90000000-0000-0000-0000-000000000003',
    'Shopping Center Expansion',
    NULL,
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc@forsured.test
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- FORSURED SUBCONTRACTORS
-- =========================================================
-- ID Convention: 71000000-0000-0000-0000-0000000000XX
-- Compliant: 01-04, Warning: 11-12, NonCompliant: 21-22
-- =========================================================

INSERT INTO forsured.subcontractors (
  id,
  name,
  company,
  scaffald_company_id,
  organization_id,
  contact_info,
  created_at
)
VALUES
  -- =========================================================
  -- COMPLIANT SUBCONTRACTORS
  -- =========================================================
  (
    '71000000-0000-0000-0000-000000000001',
    'Mike Johnson',
    'Johnson Electrical Services',
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical (linked)
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "mike@johnson-electrical.test", "phone": "+1 (555) 100-0001", "address": "100 Electric Ave, Houston, TX"}',
    NOW() - INTERVAL '180 days'
  ),
  (
    '71000000-0000-0000-0000-000000000002',
    'Sarah Williams',
    'Williams Plumbing & Heating',
    NULL,  -- Not linked to Scaffald
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "sarah@williams-plumbing.test", "phone": "+1 (555) 100-0002", "address": "200 Pipe Rd, New York, NY"}',
    NOW() - INTERVAL '150 days'
  ),
  (
    '71000000-0000-0000-0000-000000000003',
    'David Chen',
    'Chen HVAC Solutions',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "david@chen-hvac.test", "phone": "+1 (555) 100-0003", "address": "300 Cool St, Boston, MA"}',
    NOW() - INTERVAL '120 days'
  ),
  (
    '71000000-0000-0000-0000-000000000004',
    'Jennifer Martinez',
    'Martinez Roofing Co',
    NULL,
    '60000000-0000-0000-0000-000000000003',  -- Pacific Coast Builders
    '{"email": "jennifer@martinez-roofing.test", "phone": "+1 (555) 100-0004", "address": "400 Roof Ln, Los Angeles, CA"}',
    NOW() - INTERVAL '90 days'
  ),

  -- =========================================================
  -- WARNING STATUS SUBCONTRACTORS (expiring coverage)
  -- =========================================================
  (
    '71000000-0000-0000-0000-000000000011',
    'Robert Brown',
    'Brown Concrete Works',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "robert@brown-concrete.test", "phone": "+1 (555) 100-0011", "address": "500 Cement Dr, Chicago, IL"}',
    NOW() - INTERVAL '200 days'
  ),
  (
    '71000000-0000-0000-0000-000000000012',
    'Lisa Anderson',
    'Anderson Steel Fabrication',
    NULL,
    '60000000-0000-0000-0000-000000000002',  -- BuildRight Contractors
    '{"email": "lisa@anderson-steel.test", "phone": "+1 (555) 100-0012", "address": "600 Steel Way, Boston, MA"}',
    NOW() - INTERVAL '160 days'
  ),

  -- =========================================================
  -- NON-COMPLIANT SUBCONTRACTORS
  -- =========================================================
  (
    '71000000-0000-0000-0000-000000000021',
    'Tom Wilson',
    'Wilson Demolition Services',
    '60000000-0000-0000-0000-000000000012',  -- Budget Plumbing (non-compliant org)
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "tom@wilson-demo.test", "phone": "+1 (555) 100-0021", "address": "700 Demo Blvd, Detroit, MI"}',
    NOW() - INTERVAL '300 days'
  ),
  (
    '71000000-0000-0000-0000-000000000022',
    'Amy Davis',
    'Davis Painting & Finishing',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "amy@davis-painting.test", "phone": "+1 (555) 100-0022", "address": "800 Paint St, Cleveland, OH"}',
    NOW() - INTERVAL '250 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- PROJECT REQUIREMENTS
-- =========================================================
-- ID Convention: 74000000-0000-0000-0000-0000000000XX
-- =========================================================

INSERT INTO forsured.requirements (
  id,
  project_id,
  organization_id,
  coverage_type,
  minimum_amount,
  endorsements_required,
  created_at,
  updated_at
)
VALUES
  -- Downtown Office Tower requirements
  (
    '74000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    'general_liability',
    2000000.00,
    ARRAY['additional_insured', 'waiver_of_subrogation'],
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),
  (
    '74000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'workers_comp',
    1000000.00,
    ARRAY[]::TEXT[],
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),

  -- Riverside Medical Center requirements
  (
    '74000000-0000-0000-0000-000000000011',
    '70000000-0000-0000-0000-000000000002',  -- Riverside Medical
    '60000000-0000-0000-0000-000000000001',
    'general_liability',
    5000000.00,
    ARRAY['additional_insured', 'waiver_of_subrogation', 'primary_non_contributory'],
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),
  (
    '74000000-0000-0000-0000-000000000012',
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    'workers_comp',
    1000000.00,
    ARRAY[]::TEXT[],
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),
  (
    '74000000-0000-0000-0000-000000000013',
    '70000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    'umbrella',
    10000000.00,
    ARRAY[]::TEXT[],
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),

  -- West Coast Distribution Hub requirements
  (
    '74000000-0000-0000-0000-000000000021',
    '70000000-0000-0000-0000-000000000003',  -- West Coast Hub
    '60000000-0000-0000-0000-000000000003',
    'general_liability',
    3000000.00,
    ARRAY['additional_insured'],
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '120 days'
  ),
  (
    '74000000-0000-0000-0000-000000000022',
    '70000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000003',
    'auto',
    1000000.00,
    ARRAY[]::TEXT[],
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '120 days'
  ),

  -- =========================================================
  -- PROJECT REQUIREMENTS FOR TEST-GC PROJECTS
  -- =========================================================
  -- Downtown Office Renovation requirements
  (
    '94000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    'general_liability',
    2000000.00,
    ARRAY['additional_insured', 'waiver_of_subrogation'],
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),
  (
    '94000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    'workers_comp',
    1000000.00,
    ARRAY[]::TEXT[],
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),
  -- Residential Complex requirements
  (
    '94000000-0000-0000-0000-000000000011',
    '90000000-0000-0000-0000-000000000002',  -- Residential Complex
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    'general_liability',
    3000000.00,
    ARRAY['additional_insured'],
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),
  (
    '94000000-0000-0000-0000-000000000012',
    '90000000-0000-0000-0000-000000000002',  -- Residential Complex
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    'workers_comp',
    1000000.00,
    ARRAY[]::TEXT[],
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),
  -- Shopping Center Expansion requirements
  (
    '94000000-0000-0000-0000-000000000021',
    '90000000-0000-0000-0000-000000000003',  -- Shopping Center Expansion
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    'general_liability',
    5000000.00,
    ARRAY['additional_insured', 'waiver_of_subrogation'],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    '94000000-0000-0000-0000-000000000022',
    '90000000-0000-0000-0000-000000000003',  -- Shopping Center Expansion
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    'auto',
    1000000.00,
    ARRAY[]::TEXT[],
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- PROJECT PARTICIPANTS
-- =========================================================

INSERT INTO forsured.project_participants (
  project_id,
  user_id,
  organization_id,
  role,
  invited_by,
  created_at,
  updated_at
)
VALUES
  -- Downtown Office Tower participants
  (
    '70000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',  -- Active GC (manager)
    '60000000-0000-0000-0000-000000000001',
    'manager',
    NULL,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),
  (
    '70000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000001',  -- Fresh GC (viewer)
    '60000000-0000-0000-0000-000000000001',
    'viewer',
    '50000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '85 days'
  ),

  -- Riverside Medical participants
  (
    '70000000-0000-0000-0000-000000000002',
    '50000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000001',
    'owner',
    NULL,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),

  -- =========================================================
  -- PROJECT PARTICIPANTS FOR TEST-GC PROJECTS
  -- =========================================================
  -- Downtown Office Renovation participants
  (
    '90000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',  -- test-gc@forsured.test
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    'manager',
    NULL,
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '90 days'
  ),
  -- Residential Complex participants
  (
    '90000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000001',  -- test-gc@forsured.test
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    'manager',
    NULL,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '60 days'
  ),
  -- Shopping Center Expansion participants
  (
    '90000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000001',  -- test-gc@forsured.test
    '60000000-0000-0000-0000-000000000031',  -- Test Construction Company
    'manager',
    NULL,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  )
ON CONFLICT (project_id, user_id) DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. Projects are linked to organizations (GC orgs)
-- 2. Subcontractors can optionally link to Scaffald companies
-- 3. Requirements define coverage needs for each project
-- 4. Project participants track who has access to each project
-- 5. All IDs are fixed for deterministic testing
-- =========================================================
