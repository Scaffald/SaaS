-- =========================================================
-- 007_seed-comprehensive-data.sql - Comprehensive Seed Data
-- Adds rich seed data for manager, contractor, and broker accounts
-- to make them look like active, production-ready accounts
-- =========================================================

BEGIN;

-- =========================================================
-- ADDITIONAL PROJECTS FOR MANAGER (gc-active)
-- =========================================================
-- ID Convention: 70000000-0000-0000-0000-0000000000XX
-- Adding projects 04-10 for more variety
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
  -- Additional active projects for gc-active
  (
    '70000000-0000-0000-0000-000000000004',
    'Corporate Headquarters Renovation',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC User
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '70000000-0000-0000-0000-000000000005',
    'Shopping Center Expansion - Phase 2',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC User
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '2 days'
  ),
  (
    '70000000-0000-0000-0000-000000000006',
    'Residential Complex - Building A',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC User
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- ADDITIONAL SUBCONTRACTORS FOR MANAGER
-- =========================================================
-- ID Convention: 71000000-0000-0000-0000-0000000000XX
-- Adding subcontractors 05-10
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
  -- Additional subcontractors for Acme Construction
  (
    '71000000-0000-0000-0000-000000000005',
    'James Taylor',
    'Taylor Masonry & Stonework',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "james@taylor-masonry.test", "phone": "+1 (555) 100-0005", "address": "500 Stone Ave, Philadelphia, PA"}',
    NOW() - INTERVAL '100 days'
  ),
  (
    '71000000-0000-0000-0000-000000000006',
    'Maria Rodriguez',
    'Rodriguez Flooring Specialists',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "maria@rodriguez-flooring.test", "phone": "+1 (555) 100-0006", "address": "600 Floor St, Miami, FL"}',
    NOW() - INTERVAL '80 days'
  ),
  (
    '71000000-0000-0000-0000-000000000007',
    'Robert Kim',
    'Kim Drywall & Insulation',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "robert@kim-drywall.test", "phone": "+1 (555) 100-0007", "address": "700 Wall Blvd, Seattle, WA"}',
    NOW() - INTERVAL '70 days'
  ),
  (
    '71000000-0000-0000-0000-000000000008',
    'Patricia White',
    'White Landscaping & Site Work',
    NULL,
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "patricia@white-landscaping.test", "phone": "+1 (555) 100-0008", "address": "800 Green Way, Portland, OR"}',
    NOW() - INTERVAL '60 days'
  ),
  -- Link contractor-active's organization as a subcontractor
  (
    '71000000-0000-0000-0000-000000000009',
    'Active Contractor',
    'Elite Electrical Services',
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical (contractor-active's org)
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '{"email": "contractor-active@forsured-test.com", "phone": "+1 (555) 002-0002", "address": "400 Spark St, Houston, TX"}',
    NOW() - INTERVAL '120 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- RELATIONSHIPS: Manager <-> Contractor
-- =========================================================
-- Link contractor-active's organization to manager's organization
-- =========================================================

INSERT INTO forsured.relationships (
  id,
  manager_org_id,
  subcontractor_org_id,
  status,
  relationship_health_score,
  projects_together_count,
  created_at,
  updated_at
)
VALUES
  -- Active relationship between Acme Construction and Elite Electrical
  (
    '80000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction (manager)
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical (contractor-active)
    'active',
    95,
    3,
    NOW() - INTERVAL '120 days',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- PROJECT-SUBCONTRACTOR LINKS
-- =========================================================
-- Link contractor-active to manager's projects
-- =========================================================

INSERT INTO forsured.project_subcontractors (
  project_id,
  subcontractor_id,
  organization_id,
  status,
  invited_at,
  joined_at,
  created_at,
  updated_at
)
VALUES
  -- Link contractor-active to Downtown Office Tower
  (
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical (contractor-active)
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    'active',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '84 days',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '84 days'
  ),
  -- Link contractor-active to Riverside Medical
  (
    '70000000-0000-0000-0000-000000000002',  -- Riverside Medical
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    'active',
    NOW() - INTERVAL '55 days',
    NOW() - INTERVAL '54 days',
    NOW() - INTERVAL '55 days',
    NOW() - INTERVAL '54 days'
  ),
  -- Link contractor-active to Corporate Headquarters
  (
    '70000000-0000-0000-0000-000000000004',  -- Corporate Headquarters
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    'active',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '39 days',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '39 days'
  )
ON CONFLICT (project_id, subcontractor_id) DO NOTHING;

-- =========================================================
-- ADDITIONAL TASKS FOR MANAGER
-- =========================================================
-- ID Convention: 75000000-0000-0000-0000-0000000000XX
-- Adding tasks 40-60 for variety
-- =========================================================

INSERT INTO forsured.tasks (
  id,
  project_id,
  subcontractor_id,
  organization_id,
  assigned_to_user_id,
  title,
  description,
  status,
  priority,
  due_date,
  created_at,
  completed_at,
  updated_at
)
VALUES
  -- Tasks for contractor-active on Downtown Office Tower
  (
    '75000000-0000-0000-0000-000000000040',
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical (contractor-active)
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC
    'Review and approve Elite Electrical COI',
    'Verify that Elite Electrical Services has current certificate of insurance with adequate coverage limits.',
    'completed',
    'high',
    NOW() - INTERVAL '80 days',
    NOW() - INTERVAL '82 days',
    NOW() - INTERVAL '80 days',
    NOW() - INTERVAL '80 days'
  ),
  (
    '75000000-0000-0000-0000-000000000041',
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC
    'Request additional insured endorsement from Elite Electrical',
    'Project requires additional insured endorsement on GL policy. Contact contractor to add.',
    'in_progress',
    'high',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '75 days',
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  -- Tasks for contractor-active on Riverside Medical
  (
    '75000000-0000-0000-0000-000000000042',
    '70000000-0000-0000-0000-000000000002',  -- Riverside Medical
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC
    'Verify umbrella policy coverage for Elite Electrical',
    'Medical facility project requires $10M umbrella coverage. Confirm Elite Electrical meets requirement.',
    'pending',
    'high',
    NOW() + INTERVAL '14 days',
    NOW() - INTERVAL '50 days',
    NULL,
    NOW() - INTERVAL '50 days'
  ),
  -- Tasks for contractor-active on Corporate Headquarters
  (
    '75000000-0000-0000-0000-000000000043',
    '70000000-0000-0000-0000-000000000004',  -- Corporate Headquarters
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC
    'Collect updated workers comp certificate from Elite Electrical',
    'Workers comp certificate expires in 30 days. Request renewal certificate.',
    'pending',
    'medium',
    NOW() + INTERVAL '25 days',
    NOW() - INTERVAL '35 days',
    NULL,
    NOW() - INTERVAL '35 days'
  ),
  -- Tasks for other subcontractors
  (
    '75000000-0000-0000-0000-000000000044',
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '71000000-0000-0000-0000-000000000005',  -- Taylor Masonry
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC
    'Review Taylor Masonry insurance documents',
    'New subcontractor added to project. Review all insurance documentation.',
    'in_progress',
    'medium',
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '10 days',
    NULL,
    NOW() - INTERVAL '1 day'
  ),
  (
    '75000000-0000-0000-0000-000000000045',
    '70000000-0000-0000-0000-000000000004',  -- Corporate Headquarters
    '71000000-0000-0000-0000-000000000006',  -- Rodriguez Flooring
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC
    'Approve Rodriguez Flooring COI',
    'Flooring contractor submitted COI. Review and approve if coverage meets requirements.',
    'pending',
    'medium',
    NOW() + INTERVAL '3 days',
    NOW() - INTERVAL '25 days',
    NULL,
    NOW() - INTERVAL '25 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- TASKS FOR CONTRACTOR (contractor-active)
-- =========================================================
-- Tasks assigned to contractor-active user
-- =========================================================

INSERT INTO forsured.tasks (
  id,
  project_id,
  subcontractor_id,
  organization_id,
  assigned_to_user_id,
  title,
  description,
  status,
  priority,
  due_date,
  created_at,
  completed_at,
  updated_at
)
VALUES
  -- Tasks assigned directly to contractor-active user
  (
    '75000000-0000-0000-0000-000000000050',
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical (contractor-active)
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical (contractor org)
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor user
    'Upload updated COI for Downtown Office Tower',
    'Your certificate of insurance needs to be updated for this project. Please upload the latest COI.',
    'pending',
    'high',
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '10 days',
    NULL,
    NOW() - INTERVAL '10 days'
  ),
  (
    '75000000-0000-0000-0000-000000000051',
    '70000000-0000-0000-0000-000000000002',  -- Riverside Medical
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor
    'Add additional insured endorsement',
    'Project requires additional insured endorsement on your GL policy. Please coordinate with your broker.',
    'in_progress',
    'high',
    NOW() + INTERVAL '10 days',
    NOW() - INTERVAL '45 days',
    NULL,
    NOW() - INTERVAL '3 days'
  ),
  (
    '75000000-0000-0000-0000-000000000052',
    '70000000-0000-0000-0000-000000000004',  -- Corporate Headquarters
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor
    'Renew workers compensation certificate',
    'Your workers comp certificate expires soon. Please renew and upload updated certificate.',
    'pending',
    'medium',
    NOW() + INTERVAL '20 days',
    NOW() - INTERVAL '30 days',
    NULL,
    NOW() - INTERVAL '30 days'
  ),
  (
    '75000000-0000-0000-0000-000000000053',
    NULL,  -- General task, not project-specific
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor
    'Complete safety training module',
    'Annual safety training is required. Please complete the online safety training module.',
    'completed',
    'medium',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
  ),
  (
    '75000000-0000-0000-0000-000000000054',
    NULL,  -- General task
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor
    'Update company profile information',
    'Please review and update your company profile information, including contact details and specialties.',
    'pending',
    'low',
    NOW() + INTERVAL '30 days',
    NOW() - INTERVAL '20 days',
    NULL,
    NOW() - INTERVAL '20 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- ADDITIONAL DOCUMENTS FOR CONTRACTOR
-- =========================================================
-- Documents uploaded by contractor-active
-- =========================================================

INSERT INTO forsured.documents (
  id,
  subcontractor_id,
  project_id,
  organization_id,
  uploader_id,
  file_name,
  file_url,
  file_size,
  file_type,
  upload_date,
  status,
  error_message,
  created_at,
  updated_at
)
VALUES
  -- Documents from contractor-active
  (
    '72000000-0000-0000-0000-000000000040',
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical org
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor user
    'elite_electrical_coi_2024.pdf',
    'https://storage.forsured.test/documents/72000000-0000-0000-0000-000000000040.pdf',
    312456,
    'application/pdf',
    NOW() - INTERVAL '75 days',
    'approved',
    NULL,
    NOW() - INTERVAL '75 days',
    NOW() - INTERVAL '73 days'
  ),
  (
    '72000000-0000-0000-0000-000000000041',
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '70000000-0000-0000-0000-000000000002',  -- Riverside Medical
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical org
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor
    'elite_electrical_wc_2024.pdf',
    'https://storage.forsured.test/documents/72000000-0000-0000-0000-000000000041.pdf',
    287654,
    'application/pdf',
    NOW() - INTERVAL '50 days',
    'approved',
    NULL,
    NOW() - INTERVAL '50 days',
    NOW() - INTERVAL '48 days'
  ),
  (
    '72000000-0000-0000-0000-000000000042',
    '71000000-0000-0000-0000-000000000009',  -- Elite Electrical
    '70000000-0000-0000-0000-000000000004',  -- Corporate Headquarters
    '60000000-0000-0000-0000-000000000011',  -- Elite Electrical org
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor
    'elite_electrical_umbrella_2024.pdf',
    'https://storage.forsured.test/documents/72000000-0000-0000-0000-000000000042.pdf',
    298765,
    'application/pdf',
    NOW() - INTERVAL '35 days',
    'pending',
    NULL,
    NOW() - INTERVAL '35 days',
    NOW() - INTERVAL '35 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- BROKER RELATIONSHIPS
-- =========================================================
-- Ensure broker-active is connected to both manager and contractor
-- =========================================================

-- Update existing relationship invitation to ensure it's connected
UPDATE forsured.relationship_invitations
SET
  status = 'connected',
  invitee_org_id = '60000000-0000-0000-0000-000000000001',  -- Acme Construction
  invitee_user_id = '50000000-0000-0000-0000-000000000003',  -- Active GC
  accepted_at = NOW() - INTERVAL '28 days',
  connected_at = NOW() - INTERVAL '28 days'
WHERE id = '70000000-0000-0000-0000-000000000001';

-- Update contractor relationship invitation
UPDATE forsured.relationship_invitations
SET
  status = 'connected',
  invitee_org_id = '60000000-0000-0000-0000-000000000011',  -- Elite Electrical
  invitee_user_id = '50000000-0000-0000-0000-000000000012',  -- Active Contractor
  accepted_at = NOW() - INTERVAL '24 days',
  connected_at = NOW() - INTERVAL '24 days'
WHERE id = '70000000-0000-0000-0000-000000000002';

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. This seed file adds comprehensive data for:
--    - Manager (gc-active@forsured-test.com): More projects, contractors, tasks
--    - Contractor (contractor-active@forsured-test.com): Linked to manager, has projects and tasks
--    - Broker (broker-active@forsured-test.com): Connected to both manager and contractor
-- 2. All three accounts are now interconnected and have realistic data
-- 3. Users can switch between accounts and see relationships from each perspective
-- =========================================================
