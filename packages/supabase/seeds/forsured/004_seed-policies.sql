-- =========================================================
-- 004_seed-policies.sql - ForSured Test Documents, Policies, Compliance
-- Seeds forsured.documents, forsured.policies, forsured.endorsements,
-- forsured.compliance_scores
-- =========================================================

BEGIN;

-- =========================================================
-- FORSURED DOCUMENTS
-- =========================================================
-- ID Convention: 72000000-0000-0000-0000-0000000000XX
-- Approved: 01-03, Pending: 11, Rejected: 21, Processing: 31
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
  -- =========================================================
  -- APPROVED DOCUMENTS
  -- =========================================================
  (
    '72000000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000001',  -- Johnson Electrical
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000012',  -- Active Contractor
    'johnson_electrical_coi_2024.pdf',
    'https://storage.forsured.test/documents/72000000-0000-0000-0000-000000000001.pdf',
    245678,
    'application/pdf',
    NOW() - INTERVAL '60 days',
    'approved',
    NULL,
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '58 days'
  ),
  (
    '72000000-0000-0000-0000-000000000002',
    '71000000-0000-0000-0000-000000000002',  -- Williams Plumbing
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',  -- Active GC
    'williams_plumbing_coi_2024.pdf',
    'https://storage.forsured.test/documents/72000000-0000-0000-0000-000000000002.pdf',
    312456,
    'application/pdf',
    NOW() - INTERVAL '45 days',
    'approved',
    NULL,
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '43 days'
  ),
  (
    '72000000-0000-0000-0000-000000000003',
    '71000000-0000-0000-0000-000000000003',  -- Chen HVAC
    '70000000-0000-0000-0000-000000000002',  -- Riverside Medical
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'chen_hvac_coi_2024.pdf',
    'https://storage.forsured.test/documents/72000000-0000-0000-0000-000000000003.pdf',
    287654,
    'application/pdf',
    NOW() - INTERVAL '30 days',
    'approved',
    NULL,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '28 days'
  ),

  -- =========================================================
  -- PENDING DOCUMENT
  -- =========================================================
  (
    '72000000-0000-0000-0000-000000000011',
    '71000000-0000-0000-0000-000000000011',  -- Brown Concrete (warning)
    '70000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'brown_concrete_coi_renewal.pdf',
    'https://storage.forsured.test/documents/72000000-0000-0000-0000-000000000011.pdf',
    198234,
    'application/pdf',
    NOW() - INTERVAL '2 days',
    'pending',
    NULL,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
  ),

  -- =========================================================
  -- REJECTED DOCUMENT
  -- =========================================================
  (
    '72000000-0000-0000-0000-000000000021',
    '71000000-0000-0000-0000-000000000021',  -- Wilson Demolition (non-compliant)
    '70000000-0000-0000-0000-000000000011',  -- Industrial Park (non-compliant project)
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000013',  -- NonCompliant Contractor
    'wilson_demo_expired_coi.pdf',
    'https://storage.forsured.test/documents/72000000-0000-0000-0000-000000000021.pdf',
    156789,
    'application/pdf',
    NOW() - INTERVAL '90 days',
    'rejected',
    'Coverage amount does not meet minimum requirements ($1M required, $500K provided)',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '88 days'
  ),

  -- =========================================================
  -- PROCESSING DOCUMENT
  -- =========================================================
  (
    '72000000-0000-0000-0000-000000000031',
    '71000000-0000-0000-0000-000000000004',  -- Martinez Roofing
    '70000000-0000-0000-0000-000000000003',  -- West Coast Hub
    '60000000-0000-0000-0000-000000000003',  -- Pacific Coast
    '50000000-0000-0000-0000-000000000004',  -- MultiProject GC
    'martinez_roofing_coi_2024.pdf',
    'https://storage.forsured.test/documents/72000000-0000-0000-0000-000000000031.pdf',
    234567,
    'application/pdf',
    NOW() - INTERVAL '1 hour',
    'processing',
    NULL,
    NOW() - INTERVAL '1 hour',
    NOW() - INTERVAL '1 hour'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- FORSURED POLICIES
-- =========================================================
-- ID Convention: 73000000-0000-0000-0000-0000000000XX
-- GL Active: 01-02, GL Expiring: 03, GL Expired: 04
-- WC: 11-12, Umbrella: 21, Auto: 31
-- =========================================================

INSERT INTO forsured.policies (
  id,
  document_id,
  organization_id,
  policy_number,
  carrier,
  coverage_type,
  coverage_amount,
  aggregate_limit,
  per_occurrence_limit,
  start_date,
  end_date,
  certificate_holder,
  created_at,
  updated_at
)
VALUES
  -- =========================================================
  -- GENERAL LIABILITY - ACTIVE
  -- =========================================================
  (
    '73000000-0000-0000-0000-000000000001',
    '72000000-0000-0000-0000-000000000001',  -- Johnson Electrical doc
    '60000000-0000-0000-0000-000000000001',
    'GL-2024-JE-001234',
    'Travelers Insurance',
    'general_liability',
    2000000.00,
    4000000.00,
    2000000.00,
    (NOW() - INTERVAL '6 months')::date,
    (NOW() + INTERVAL '6 months')::date,
    'Acme Construction Group',
    NOW() - INTERVAL '58 days',
    NOW() - INTERVAL '58 days'
  ),
  (
    '73000000-0000-0000-0000-000000000002',
    '72000000-0000-0000-0000-000000000002',  -- Williams Plumbing doc
    '60000000-0000-0000-0000-000000000001',
    'GL-2024-WP-005678',
    'Liberty Mutual',
    'general_liability',
    2000000.00,
    4000000.00,
    2000000.00,
    (NOW() - INTERVAL '4 months')::date,
    (NOW() + INTERVAL '8 months')::date,
    'Acme Construction Group',
    NOW() - INTERVAL '43 days',
    NOW() - INTERVAL '43 days'
  ),

  -- =========================================================
  -- GENERAL LIABILITY - EXPIRING SOON (within 30 days)
  -- =========================================================
  (
    '73000000-0000-0000-0000-000000000003',
    '72000000-0000-0000-0000-000000000011',  -- Brown Concrete pending doc
    '60000000-0000-0000-0000-000000000001',
    'GL-2023-BC-009012',
    'Hartford Insurance',
    'general_liability',
    1500000.00,
    3000000.00,
    1500000.00,
    (NOW() - INTERVAL '11 months')::date,
    (NOW() + INTERVAL '15 days')::date,  -- Expiring in 15 days
    'Acme Construction Group',
    NOW() - INTERVAL '335 days',
    NOW() - INTERVAL '2 days'
  ),

  -- =========================================================
  -- GENERAL LIABILITY - EXPIRED
  -- =========================================================
  (
    '73000000-0000-0000-0000-000000000004',
    '72000000-0000-0000-0000-000000000021',  -- Wilson Demo rejected doc
    '60000000-0000-0000-0000-000000000001',
    'GL-2023-WD-003456',
    'CNA Insurance',
    'general_liability',
    500000.00,  -- Below minimum
    1000000.00,
    500000.00,
    (NOW() - INTERVAL '18 months')::date,
    (NOW() - INTERVAL '6 months')::date,  -- Expired 6 months ago
    'Acme Construction Group',
    NOW() - INTERVAL '540 days',
    NOW() - INTERVAL '88 days'
  ),

  -- =========================================================
  -- WORKERS COMP
  -- =========================================================
  (
    '73000000-0000-0000-0000-000000000011',
    '72000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'WC-2024-JE-007890',
    'State Fund',
    'workers_comp',
    1000000.00,
    1000000.00,
    1000000.00,
    (NOW() - INTERVAL '6 months')::date,
    (NOW() + INTERVAL '6 months')::date,
    'Acme Construction Group',
    NOW() - INTERVAL '58 days',
    NOW() - INTERVAL '58 days'
  ),

  -- =========================================================
  -- UMBRELLA (Chen HVAC - Riverside Medical)
  -- =========================================================
  (
    '73000000-0000-0000-0000-000000000021',
    '72000000-0000-0000-0000-000000000003',  -- Chen HVAC doc
    '60000000-0000-0000-0000-000000000001',
    'UMB-2024-CH-002345',
    'Chubb Insurance',
    'umbrella',
    10000000.00,
    10000000.00,
    10000000.00,
    (NOW() - INTERVAL '3 months')::date,
    (NOW() + INTERVAL '9 months')::date,
    'Acme Construction Group',
    NOW() - INTERVAL '28 days',
    NOW() - INTERVAL '28 days'
  ),

  -- =========================================================
  -- AUTO
  -- =========================================================
  (
    '73000000-0000-0000-0000-000000000031',
    '72000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    'AUTO-2024-WP-006789',
    'Progressive Commercial',
    'auto',
    1000000.00,
    NULL,
    1000000.00,
    (NOW() - INTERVAL '4 months')::date,
    (NOW() + INTERVAL '8 months')::date,
    'Acme Construction Group',
    NOW() - INTERVAL '43 days',
    NOW() - INTERVAL '43 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- FORSURED ENDORSEMENTS
-- =========================================================

INSERT INTO forsured.endorsements (
  id,
  policy_id,
  organization_id,
  type,
  details,
  created_at
)
VALUES
  -- Johnson Electrical GL endorsements
  (
    gen_random_uuid(),
    '73000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'additional_insured',
    '{"entity_name": "Acme Construction Group", "project": "Downtown Office Tower"}',
    NOW() - INTERVAL '58 days'
  ),
  (
    gen_random_uuid(),
    '73000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'waiver_of_subrogation',
    '{"applies_to": "Acme Construction Group and all project owners"}',
    NOW() - INTERVAL '58 days'
  ),

  -- Williams Plumbing GL endorsements
  (
    gen_random_uuid(),
    '73000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    'additional_insured',
    '{"entity_name": "Acme Construction Group"}',
    NOW() - INTERVAL '43 days'
  ),
  (
    gen_random_uuid(),
    '73000000-0000-0000-0000-000000000002',
    '60000000-0000-0000-0000-000000000001',
    'primary_non_contributory',
    '{"notes": "Policy is primary and non-contributory"}',
    NOW() - INTERVAL '43 days'
  ),

  -- Chen HVAC umbrella endorsement
  (
    gen_random_uuid(),
    '73000000-0000-0000-0000-000000000021',
    '60000000-0000-0000-0000-000000000001',
    'additional_insured',
    '{"entity_name": "Acme Construction Group", "project": "Riverside Medical Center"}',
    NOW() - INTERVAL '28 days'
  )
ON CONFLICT DO NOTHING;

-- =========================================================
-- FORSURED COMPLIANCE SCORES
-- =========================================================
-- ID Convention: 76000000-0000-0000-0000-0000000000XX
-- Compliant: 01-02, Warning: 11-12, Critical: 21-22
-- =========================================================

INSERT INTO forsured.compliance_scores (
  id,
  project_id,
  subcontractor_id,
  organization_id,
  score,
  status,
  gaps,
  last_evaluated,
  created_at,
  updated_at
)
VALUES
  -- =========================================================
  -- COMPLIANT SCORES (Downtown Office Tower)
  -- =========================================================
  (
    '76000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '71000000-0000-0000-0000-000000000001',  -- Johnson Electrical
    '60000000-0000-0000-0000-000000000001',
    100,
    'compliant',
    '[]'::jsonb,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '76000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000002',  -- Williams Plumbing
    '60000000-0000-0000-0000-000000000001',
    95,
    'compliant',
    '[{"type": "minor", "description": "30-day notice of cancellation not included"}]'::jsonb,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '1 day'
  ),

  -- =========================================================
  -- WARNING SCORES (expiring coverage)
  -- =========================================================
  (
    '76000000-0000-0000-0000-000000000011',
    '70000000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000011',  -- Brown Concrete
    '60000000-0000-0000-0000-000000000001',
    75,
    'warning',
    '[{"type": "expiring", "description": "GL policy expires in 15 days"}, {"type": "coverage", "description": "Coverage amount below recommended ($1.5M vs $2M required)"}]'::jsonb,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '76000000-0000-0000-0000-000000000012',
    '70000000-0000-0000-0000-000000000012',  -- Tech Campus (warning project)
    '71000000-0000-0000-0000-000000000012',  -- Anderson Steel
    '60000000-0000-0000-0000-000000000002',  -- BuildRight
    60,
    'warning',
    '[{"type": "missing", "description": "Waiver of subrogation not provided"}, {"type": "expiring", "description": "WC policy expires in 45 days"}]'::jsonb,
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '2 days'
  ),

  -- =========================================================
  -- CRITICAL SCORES (Industrial Park - non-compliant project)
  -- =========================================================
  (
    '76000000-0000-0000-0000-000000000021',
    '70000000-0000-0000-0000-000000000011',  -- Industrial Park (non-compliant)
    '71000000-0000-0000-0000-000000000021',  -- Wilson Demolition
    '60000000-0000-0000-0000-000000000001',
    40,
    'critical',
    '[{"type": "expired", "description": "GL policy expired 6 months ago"}, {"type": "coverage", "description": "Coverage amount insufficient ($500K vs $2M required)"}, {"type": "missing", "description": "No workers comp documentation"}]'::jsonb,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    '76000000-0000-0000-0000-000000000022',
    '70000000-0000-0000-0000-000000000011',
    '71000000-0000-0000-0000-000000000022',  -- Davis Painting
    '60000000-0000-0000-0000-000000000001',
    20,
    'critical',
    '[{"type": "missing", "description": "No COI on file"}, {"type": "missing", "description": "No workers comp documentation"}, {"type": "missing", "description": "No auto liability documentation"}]'::jsonb,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '100 days',
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. Documents have various statuses: approved, pending, rejected, processing
-- 2. Policies are linked to documents and have coverage details
-- 3. Endorsements add special coverage terms to policies
-- 4. Compliance scores summarize subcontractor compliance per project
-- 5. Gaps array in compliance_scores shows specific issues
-- 6. All IDs are fixed for deterministic testing
-- =========================================================
