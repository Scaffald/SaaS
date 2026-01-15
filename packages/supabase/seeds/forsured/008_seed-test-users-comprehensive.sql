-- =========================================================
-- 008_seed-test-users-comprehensive.sql - Comprehensive Seed Data for Test Users
-- Seeds complete data for test-gc, test-contractor, and test-broker users
-- These are the users accessible via "/" page quick login buttons
-- =========================================================

BEGIN;

-- =========================================================
-- TEST USER IDS REFERENCE
-- =========================================================
-- IMPORTANT: Migration 256 creates these organizations, so we MUST use those IDs
-- test-gc@forsured.test:
--   User ID: 10000000-0000-0000-0000-000000000001
--   Org ID: 20000000-0000-0000-0000-000000000001 (MRC Construction Co.)
--
-- test-contractor@forsured.test:
--   User ID: 10000000-0000-0000-0000-000000000002
--   Org ID: 20000000-0000-0000-0000-000000000002 (Test Contractor LLC)
--
-- test-broker@forsured.test:
--   User ID: 10000000-0000-0000-0000-000000000003
--   Org ID: 20000000-0000-0000-0000-000000000003 (Test Insurance Broker)
-- =========================================================

-- =========================================================
-- SUBCONTRACTORS FOR TEST-GC
-- =========================================================
-- Add subcontractors that test-gc can manage
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
  -- Subcontractors for Test Construction Company (test-gc)
  (
    '91000000-0000-0000-0000-000000000001',
    'John Smith',
    'Smith Electrical Services',
    NULL,
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '{"email": "john@smith-electrical.test", "phone": "+1 (555) 200-0001", "address": "100 Electric Ave, New York, NY"}',
    NOW() - INTERVAL '80 days'
  ),
  (
    '91000000-0000-0000-0000-000000000002',
    'Sarah Johnson',
    'Johnson Plumbing Co',
    NULL,
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '{"email": "sarah@johnson-plumbing.test", "phone": "+1 (555) 200-0002", "address": "200 Pipe St, New York, NY"}',
    NOW() - INTERVAL '70 days'
  ),
  (
    '91000000-0000-0000-0000-000000000003',
    'Mike Davis',
    'Davis HVAC Solutions',
    NULL,
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '{"email": "mike@davis-hvac.test", "phone": "+1 (555) 200-0003", "address": "300 Air Way, New York, NY"}',
    NOW() - INTERVAL '60 days'
  ),
  -- Link test-contractor as a subcontractor to test-gc
  (
    '91000000-0000-0000-0000-000000000004',
    'Test Contractor User',
    'Test Contractor Services',
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '{"email": "test-contractor@forsured.test", "phone": "+1 (555) 005-0002", "address": "200 Contractor Ave, Houston, TX"}',
    NOW() - INTERVAL '50 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- PROJECT-SUBCONTRACTOR LINKS FOR TEST-GC
-- =========================================================
-- Link subcontractors to test-gc's projects
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
  -- Downtown Office Renovation - link multiple subcontractors
  (
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '91000000-0000-0000-0000-000000000001',  -- Smith Electrical
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    'active',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '84 days',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '84 days'
  ),
  (
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '91000000-0000-0000-0000-000000000002',  -- Johnson Plumbing
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    'active',
    NOW() - INTERVAL '80 days',
    NOW() - INTERVAL '79 days',
    NOW() - INTERVAL '80 days',
    NOW() - INTERVAL '79 days'
  ),
  (
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '91000000-0000-0000-0000-000000000004',  -- Test Contractor
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    'active',
    NOW() - INTERVAL '75 days',
    NOW() - INTERVAL '74 days',
    NOW() - INTERVAL '75 days',
    NOW() - INTERVAL '74 days'
  ),
  -- Residential Complex - link subcontractors
  (
    '90000000-0000-0000-0000-000000000002',  -- Residential Complex
    '91000000-0000-0000-0000-000000000001',  -- Smith Electrical
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    'active',
    NOW() - INTERVAL '55 days',
    NOW() - INTERVAL '54 days',
    NOW() - INTERVAL '55 days',
    NOW() - INTERVAL '54 days'
  ),
  (
    '90000000-0000-0000-0000-000000000002',  -- Residential Complex
    '91000000-0000-0000-0000-000000000003',  -- Davis HVAC
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    'active',
    NOW() - INTERVAL '50 days',
    NOW() - INTERVAL '49 days',
    NOW() - INTERVAL '50 days',
    NOW() - INTERVAL '49 days'
  ),
  -- Shopping Center Expansion - link subcontractors
  (
    '90000000-0000-0000-0000-000000000003',  -- Shopping Center Expansion
    '91000000-0000-0000-0000-000000000002',  -- Johnson Plumbing
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    'active',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '24 days',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '24 days'
  ),
  (
    '90000000-0000-0000-0000-000000000003',  -- Shopping Center Expansion
    '91000000-0000-0000-0000-000000000004',  -- Test Contractor
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    'active',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '19 days',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '19 days'
  )
ON CONFLICT (project_id, subcontractor_id) DO NOTHING;

-- =========================================================
-- DOCUMENTS FOR TEST-GC PROJECTS
-- =========================================================
-- Add documents for test-gc's projects
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
  -- Documents for Downtown Office Renovation
  (
    '92000000-0000-0000-0000-000000000001',
    '91000000-0000-0000-0000-000000000001',  -- Smith Electrical
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'smith_electrical_coi_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000001.pdf',
    245678,
    'application/pdf',
    NOW() - INTERVAL '70 days',
    'approved',
    NULL,
    NOW() - INTERVAL '70 days',
    NOW() - INTERVAL '68 days'
  ),
  (
    '92000000-0000-0000-0000-000000000002',
    '91000000-0000-0000-0000-000000000002',  -- Johnson Plumbing
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'johnson_plumbing_coi_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000002.pdf',
    312456,
    'application/pdf',
    NOW() - INTERVAL '65 days',
    'approved',
    NULL,
    NOW() - INTERVAL '65 days',
    NOW() - INTERVAL '63 days'
  ),
  -- Documents for Residential Complex
  (
    '92000000-0000-0000-0000-000000000011',
    '91000000-0000-0000-0000-000000000001',  -- Smith Electrical
    '90000000-0000-0000-0000-000000000002',  -- Residential Complex
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'smith_electrical_wc_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000011.pdf',
    287654,
    'application/pdf',
    NOW() - INTERVAL '45 days',
    'approved',
    NULL,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '43 days'
  ),
  (
    '92000000-0000-0000-0000-000000000012',
    '91000000-0000-0000-0000-000000000003',  -- Davis HVAC
    '90000000-0000-0000-0000-000000000002',  -- Residential Complex
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'davis_hvac_coi_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000012.pdf',
    298765,
    'application/pdf',
    NOW() - INTERVAL '40 days',
    'pending',
    NULL,
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '40 days'
  ),
  -- Documents for Shopping Center Expansion
  (
    '92000000-0000-0000-0000-000000000021',
    '91000000-0000-0000-0000-000000000002',  -- Johnson Plumbing
    '90000000-0000-0000-0000-000000000003',  -- Shopping Center Expansion
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'johnson_plumbing_auto_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000021.pdf',
    234567,
    'application/pdf',
    NOW() - INTERVAL '20 days',
    'approved',
    NULL,
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '18 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- TASKS FOR TEST-GC
-- =========================================================
-- Add tasks for test-gc to manage
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
  -- Tasks for Downtown Office Renovation
  (
    '95000000-0000-0000-0000-000000000001',
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '91000000-0000-0000-0000-000000000001',  -- Smith Electrical
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'Review Smith Electrical COI',
    'Verify that Smith Electrical Services has current certificate of insurance with adequate coverage limits.',
    'completed',
    'high',
    NOW() - INTERVAL '65 days',
    NOW() - INTERVAL '67 days',
    NOW() - INTERVAL '65 days',
    NOW() - INTERVAL '65 days'
  ),
  (
    '95000000-0000-0000-0000-000000000002',
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '91000000-0000-0000-0000-000000000002',  -- Johnson Plumbing
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'Request additional insured endorsement from Johnson Plumbing',
    'Project requires additional insured endorsement on GL policy. Contact contractor to add.',
    'in_progress',
    'high',
    NOW() + INTERVAL '7 days',
    NOW() - INTERVAL '60 days',
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  (
    '95000000-0000-0000-0000-000000000003',
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '91000000-0000-0000-0000-000000000004',  -- Test Contractor
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'Verify Test Contractor insurance coverage',
    'New subcontractor added. Review all insurance documentation.',
    'pending',
    'medium',
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '10 days',
    NULL,
    NOW() - INTERVAL '10 days'
  ),
  -- Tasks for Residential Complex
  (
    '95000000-0000-0000-0000-000000000011',
    '90000000-0000-0000-0000-000000000002',  -- Residential Complex
    '91000000-0000-0000-0000-000000000001',  -- Smith Electrical
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'Approve Smith Electrical workers comp certificate',
    'Workers comp certificate submitted. Review and approve if coverage meets requirements.',
    'pending',
    'medium',
    NOW() + INTERVAL '3 days',
    NOW() - INTERVAL '40 days',
    NULL,
    NOW() - INTERVAL '40 days'
  ),
  (
    '95000000-0000-0000-0000-000000000012',
    '90000000-0000-0000-0000-000000000002',  -- Residential Complex
    '91000000-0000-0000-0000-000000000003',  -- Davis HVAC
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'Review Davis HVAC COI',
    'HVAC contractor submitted COI. Review coverage limits and endorsements.',
    'in_progress',
    'high',
    NOW() + INTERVAL '10 days',
    NOW() - INTERVAL '35 days',
    NULL,
    NOW() - INTERVAL '3 days'
  ),
  -- Tasks for Shopping Center Expansion
  (
    '95000000-0000-0000-0000-000000000021',
    '90000000-0000-0000-0000-000000000003',  -- Shopping Center Expansion
    '91000000-0000-0000-0000-000000000002',  -- Johnson Plumbing
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc
    'Collect updated auto liability certificate',
    'Auto liability certificate expires in 30 days. Request renewal certificate.',
    'pending',
    'medium',
    NOW() + INTERVAL '25 days',
    NOW() - INTERVAL '15 days',
    NULL,
    NOW() - INTERVAL '15 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- PROJECTS FOR TEST-CONTRACTOR
-- =========================================================
-- test-contractor needs projects from multiple managers
-- Link test-contractor to test-gc's projects AND other manager projects
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
  -- Link test-contractor to test-gc's projects (already added above, but ensure it exists)
  -- Also link to other manager projects for variety
  (
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower (Acme Construction)
    '71000000-0000-0000-0000-000000000001',  -- Johnson Electrical (or create new link)
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    'active',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '84 days',
    NOW() - INTERVAL '85 days',
    NOW() - INTERVAL '84 days'
  )
ON CONFLICT (project_id, subcontractor_id) DO NOTHING;

-- Create a subcontractor record linking test-contractor org to other managers
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
  -- Link test-contractor org to Acme Construction (another manager)
  (
    '91000000-0000-0000-0000-000000000005',
    'Test Contractor User',
    'Test Contractor Services',
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction (another manager)
    '{"email": "test-contractor@forsured.test", "phone": "+1 (555) 005-0002", "address": "200 Contractor Ave, Houston, TX"}',
    NOW() - INTERVAL '100 days'
  ),
  -- Link test-contractor org to BuildRight Contractors (another manager)
  (
    '91000000-0000-0000-0000-000000000006',
    'Test Contractor User',
    'Test Contractor Services',
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '60000000-0000-0000-0000-000000000002',  -- BuildRight Contractors (another manager)
    '{"email": "test-contractor@forsured.test", "phone": "+1 (555) 005-0002", "address": "200 Contractor Ave, Houston, TX"}',
    NOW() - INTERVAL '90 days'
  )
ON CONFLICT (id) DO NOTHING;

-- Link test-contractor to projects from other managers
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
  -- Link to Acme Construction project
  (
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower (Acme)
    '91000000-0000-0000-0000-000000000005',  -- Test Contractor (linked to Acme)
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    'active',
    NOW() - INTERVAL '80 days',
    NOW() - INTERVAL '79 days',
    NOW() - INTERVAL '80 days',
    NOW() - INTERVAL '79 days'
  ),
  -- Link to BuildRight Contractors project
  (
    '70000000-0000-0000-0000-000000000012',  -- Tech Campus Building B (BuildRight)
    '91000000-0000-0000-0000-000000000006',  -- Test Contractor (linked to BuildRight)
    '60000000-0000-0000-0000-000000000002',  -- BuildRight Contractors
    'active',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '24 days',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '24 days'
  )
ON CONFLICT (project_id, subcontractor_id) DO NOTHING;

-- =========================================================
-- TASKS FOR TEST-CONTRACTOR
-- =========================================================
-- Add tasks assigned to test-contractor user
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
  -- Tasks for test-contractor on test-gc's projects
  (
    '95000000-0000-0000-0000-000000000031',
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation (test-gc)
    '91000000-0000-0000-0000-000000000004',  -- Test Contractor
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '10000000-0000-0000-0000-000000000002',  -- test-contractor user
    'Upload updated COI for Downtown Office Renovation',
    'Your certificate of insurance needs to be updated for this project. Please upload the latest COI.',
    'pending',
    'high',
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '10 days',
    NULL,
    NOW() - INTERVAL '10 days'
  ),
  (
    '95000000-0000-0000-0000-000000000032',
    '90000000-0000-0000-0000-000000000003',  -- Shopping Center Expansion (test-gc)
    '91000000-0000-0000-0000-000000000004',  -- Test Contractor
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '10000000-0000-0000-0000-000000000002',  -- test-contractor user
    'Add additional insured endorsement',
    'Project requires additional insured endorsement on your GL policy. Please coordinate with your broker.',
    'in_progress',
    'high',
    NOW() + INTERVAL '10 days',
    NOW() - INTERVAL '15 days',
    NULL,
    NOW() - INTERVAL '3 days'
  ),
  -- Tasks for test-contractor on other manager's projects
  (
    '95000000-0000-0000-0000-000000000033',
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower (Acme)
    '91000000-0000-0000-0000-000000000005',  -- Test Contractor (linked to Acme)
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '10000000-0000-0000-0000-000000000002',  -- test-contractor user
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
    '95000000-0000-0000-0000-000000000034',
    '70000000-0000-0000-0000-000000000012',  -- Tech Campus Building B (BuildRight)
    '91000000-0000-0000-0000-000000000006',  -- Test Contractor (linked to BuildRight)
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '10000000-0000-0000-0000-000000000002',  -- test-contractor user
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
    '95000000-0000-0000-0000-000000000035',
    NULL,  -- General task, not project-specific
    '91000000-0000-0000-0000-000000000004',  -- Test Contractor
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '10000000-0000-0000-0000-000000000002',  -- test-contractor user
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
-- DOCUMENTS FOR TEST-CONTRACTOR
-- =========================================================
-- Add documents uploaded by test-contractor
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
  -- Documents from test-contractor for test-gc's projects
  (
    '92000000-0000-0000-0000-000000000031',
    '91000000-0000-0000-0000-000000000004',  -- Test Contractor
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '10000000-0000-0000-0000-000000000002',  -- test-contractor user
    'test_contractor_coi_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000031.pdf',
    312456,
    'application/pdf',
    NOW() - INTERVAL '70 days',
    'approved',
    NULL,
    NOW() - INTERVAL '70 days',
    NOW() - INTERVAL '68 days'
  ),
  (
    '92000000-0000-0000-0000-000000000032',
    '91000000-0000-0000-0000-000000000004',  -- Test Contractor
    '90000000-0000-0000-0000-000000000003',  -- Shopping Center Expansion
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '10000000-0000-0000-0000-000000000002',  -- test-contractor user
    'test_contractor_wc_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000032.pdf',
    287654,
    'application/pdf',
    NOW() - INTERVAL '15 days',
    'approved',
    NULL,
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '13 days'
  ),
  -- Documents from test-contractor for other manager's projects
  (
    '92000000-0000-0000-0000-000000000033',
    '91000000-0000-0000-0000-000000000005',  -- Test Contractor (linked to Acme)
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower (Acme)
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services org
    '10000000-0000-0000-0000-000000000002',  -- test-contractor user
    'test_contractor_auto_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000033.pdf',
    298765,
    'application/pdf',
    NOW() - INTERVAL '25 days',
    'pending',
    NULL,
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- BROKER-CLIENT RELATIONSHIPS FOR TEST-BROKER
-- =========================================================
-- Ensure test-broker is connected to test-gc and test-contractor
-- (This should already be in migration 296, but ensure it exists)
-- =========================================================

-- The relationships are already seeded in migration 296_seed_broker_clients.sql
-- But let's ensure they're properly set up here as well

INSERT INTO forsured.relationship_invitations (
  id,
  inviter_org_id,
  inviter_user_id,
  inviter_type,
  invitee_email,
  invitee_name,
  invitee_company,
  invitee_type,
  relationship_code,
  connection_method,
  status,
  invitee_org_id,
  invitee_user_id,
  invited_at,
  accepted_at,
  connected_at,
  metadata
)
VALUES
  -- test-broker -> test-gc connection (ensure it exists, migration 296 may have different IDs)
  -- Note: Migration 296 uses 20000000-... org IDs, but seed files use 60000000-...
  -- We'll use the seed file IDs (60000000-...) to be consistent
  (
    '80000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000003',  -- Test Insurance Brokers
    '10000000-0000-0000-0000-000000000003',  -- test-broker user
    'broker',
    'test-gc@forsured.test',
    'Test GC User',
    'Test Construction Company',
    'manager',
    'BKR-TEST-004',
    'email',
    'connected',
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000001',  -- test-gc user
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days',
    '{"source": "seed_data", "notes": "Test broker-GC relationship"}'::jsonb
  ),
  -- test-broker -> test-contractor connection (ensure it exists)
  (
    '80000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000003',  -- Test Insurance Brokers
    '10000000-0000-0000-0000-000000000003',  -- test-broker user
    'broker',
    'test-contractor@forsured.test',
    'Test Contractor User',
    'Test Contractor Services',
    'subcontractor',
    'BKR-TEST-005',
    'email',
    'connected',
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services
    '10000000-0000-0000-0000-000000000002',  -- test-contractor user
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '24 days',
    NOW() - INTERVAL '24 days',
    '{"source": "seed_data", "notes": "Test broker-contractor relationship"}'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  status = 'connected',
  invitee_org_id = EXCLUDED.invitee_org_id,
  invitee_user_id = EXCLUDED.invitee_user_id,
  accepted_at = EXCLUDED.accepted_at,
  connected_at = EXCLUDED.connected_at;

-- =========================================================
-- DOCUMENTS FOR TEST-BROKER CLIENTS
-- =========================================================
-- Add documents that test-broker can see for their clients
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
  -- Documents for test-gc (test-broker's client)
  (
    '92000000-0000-0000-0000-000000000041',
    NULL,  -- Organization-level document
    NULL,  -- Not project-specific
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company (test-gc's org)
    '10000000-0000-0000-0000-000000000003',  -- test-broker user
    'test_construction_company_policy_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000041.pdf',
    456789,
    'application/pdf',
    NOW() - INTERVAL '60 days',
    'approved',
    NULL,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '58 days'
  ),
  -- Documents for test-contractor (test-broker's client)
  (
    '92000000-0000-0000-0000-000000000042',
    NULL,  -- Organization-level document
    NULL,  -- Not project-specific
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services (test-contractor's org)
    '10000000-0000-0000-0000-000000000003',  -- test-broker user
    'test_contractor_services_policy_2024.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000042.pdf',
    423456,
    'application/pdf',
    NOW() - INTERVAL '50 days',
    'approved',
    NULL,
    NOW() - INTERVAL '50 days',
    NOW() - INTERVAL '48 days'
  ),
  -- Project-specific document for test-gc's project
  (
    '92000000-0000-0000-0000-000000000043',
    NULL,
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation (test-gc's project)
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000003',  -- test-broker user
    'downtown_office_renovation_umbrella_policy.pdf',
    'https://storage.forsured.test/documents/92000000-0000-0000-0000-000000000043.pdf',
    389012,
    'application/pdf',
    NOW() - INTERVAL '40 days',
    'approved',
    NULL,
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '38 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- TASKS FOR TEST-BROKER
-- =========================================================
-- Add tasks that test-broker needs to manage for clients
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
  -- Tasks for test-broker managing test-gc's insurance
  (
    '95000000-0000-0000-0000-000000000041',
    NULL,  -- Organization-level task
    NULL,
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company (test-gc's org)
    '10000000-0000-0000-0000-000000000003',  -- test-broker user
    'Renew Test Construction Company GL policy',
    'General liability policy expires in 45 days. Contact insurance carrier to initiate renewal process.',
    'pending',
    'high',
    NOW() + INTERVAL '40 days',
    NOW() - INTERVAL '20 days',
    NULL,
    NOW() - INTERVAL '20 days'
  ),
  (
    '95000000-0000-0000-0000-000000000042',
    '90000000-0000-0000-0000-000000000001',  -- Downtown Office Renovation
    NULL,
    '20000000-0000-0000-0000-000000000001',  -- Test Construction Company
    '10000000-0000-0000-0000-000000000003',  -- test-broker user
    'Update umbrella policy for Downtown Office Renovation',
    'Project requires $5M umbrella coverage. Verify current policy meets requirement.',
    'in_progress',
    'high',
    NOW() + INTERVAL '15 days',
    NOW() - INTERVAL '35 days',
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  -- Tasks for test-broker managing test-contractor's insurance
  (
    '95000000-0000-0000-0000-000000000043',
    NULL,  -- Organization-level task
    NULL,
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services (test-contractor's org)
    '10000000-0000-0000-0000-000000000003',  -- test-broker user
    'Review Test Contractor Services workers comp renewal',
    'Workers compensation policy expires in 60 days. Review renewal terms and pricing.',
    'pending',
    'medium',
    NOW() + INTERVAL '55 days',
    NOW() - INTERVAL '25 days',
    NULL,
    NOW() - INTERVAL '25 days'
  ),
  (
    '95000000-0000-0000-0000-000000000044',
    NULL,  -- Organization-level task
    NULL,
    '20000000-0000-0000-0000-000000000002',  -- Test Contractor Services
    '10000000-0000-0000-0000-000000000003',  -- test-broker user
    'Submit additional insured request for Test Contractor',
    'Multiple projects require additional insured endorsements. Coordinate with carrier to add all required parties.',
    'completed',
    'high',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. This seed file ensures comprehensive data for test users:
--    - test-gc: Has 3 projects, 4 subcontractors, broker connection, documents, tasks
--    - test-contractor: Has broker, 2+ managers, multiple projects, tasks, documents
--    - test-broker: Has 2 clients (test-gc and test-contractor), documents, tasks
-- 2. All relationships are interconnected for realistic testing
-- 3. Projects have requirements, documents, and tasks
-- 4. Fixed UUIDs ensure idempotent seeding
-- =========================================================
