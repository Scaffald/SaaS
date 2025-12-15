-- =========================================================
-- 005_seed-tasks.sql - ForSured Test Tasks & Comments
-- Seeds forsured.tasks and forsured.comments
-- =========================================================

BEGIN;

-- =========================================================
-- FORSURED TASKS
-- =========================================================
-- ID Convention: 75000000-0000-0000-0000-0000000000XX
-- Pending: 01-02, InProgress: 11-12, Completed: 21-22
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
  created_at,
  completed_at,
  updated_at
)
VALUES
  -- =========================================================
  -- PENDING TASKS
  -- =========================================================
  (
    '75000000-0000-0000-0000-000000000001',
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '71000000-0000-0000-0000-000000000011',  -- Brown Concrete
    '60000000-0000-0000-0000-000000000001',  -- Acme Construction
    '50000000-0000-0000-0000-000000000003',  -- Active GC
    'Request updated COI for Brown Concrete',
    'GL policy expiring in 15 days. Contact subcontractor to obtain renewed certificate of insurance.',
    'pending',
    NOW() - INTERVAL '3 days',
    NULL,
    NOW() - INTERVAL '3 days'
  ),
  (
    '75000000-0000-0000-0000-000000000002',
    '70000000-0000-0000-0000-000000000002',  -- Riverside Medical
    '71000000-0000-0000-0000-000000000003',  -- Chen HVAC
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'Verify umbrella policy coverage limits',
    'Confirm that umbrella policy meets the $10M minimum requirement for medical facility projects.',
    'pending',
    NOW() - INTERVAL '5 days',
    NULL,
    NOW() - INTERVAL '5 days'
  ),

  -- =========================================================
  -- IN PROGRESS TASKS
  -- =========================================================
  (
    '75000000-0000-0000-0000-000000000011',
    '70000000-0000-0000-0000-000000000011',  -- Industrial Park (non-compliant)
    '71000000-0000-0000-0000-000000000021',  -- Wilson Demolition
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'Obtain compliant COI from Wilson Demolition',
    'Current policy is expired and coverage is insufficient. Request new COI with minimum $2M GL coverage.',
    'in_progress',
    NOW() - INTERVAL '14 days',
    NULL,
    NOW() - INTERVAL '1 day'
  ),
  (
    '75000000-0000-0000-0000-000000000012',
    '70000000-0000-0000-0000-000000000011',
    '71000000-0000-0000-0000-000000000022',  -- Davis Painting
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'Collect all required documentation from Davis Painting',
    'No documentation on file. Request GL, WC, and Auto liability certificates.',
    'in_progress',
    NOW() - INTERVAL '10 days',
    NULL,
    NOW() - INTERVAL '2 days'
  ),

  -- =========================================================
  -- COMPLETED TASKS
  -- =========================================================
  (
    '75000000-0000-0000-0000-000000000021',
    '70000000-0000-0000-0000-000000000001',  -- Downtown Office Tower
    '71000000-0000-0000-0000-000000000001',  -- Johnson Electrical
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'Review and approve Johnson Electrical COI',
    'Reviewed certificate of insurance. All coverage limits meet project requirements.',
    'completed',
    NOW() - INTERVAL '60 days',
    NOW() - INTERVAL '58 days',
    NOW() - INTERVAL '58 days'
  ),
  (
    '75000000-0000-0000-0000-000000000022',
    '70000000-0000-0000-0000-000000000001',
    '71000000-0000-0000-0000-000000000002',  -- Williams Plumbing
    '60000000-0000-0000-0000-000000000001',
    '50000000-0000-0000-0000-000000000003',
    'Add waiver of subrogation endorsement request',
    'Contacted Williams Plumbing to add waiver of subrogation to their GL policy.',
    'completed',
    NOW() - INTERVAL '45 days',
    NOW() - INTERVAL '40 days',
    NOW() - INTERVAL '40 days'
  ),

  -- =========================================================
  -- ADDITIONAL TASKS FOR DIFFERENT PROJECTS
  -- =========================================================
  (
    '75000000-0000-0000-0000-000000000031',
    '70000000-0000-0000-0000-000000000003',  -- West Coast Hub
    '71000000-0000-0000-0000-000000000004',  -- Martinez Roofing
    '60000000-0000-0000-0000-000000000003',  -- Pacific Coast
    '50000000-0000-0000-0000-000000000004',  -- MultiProject GC
    'Process Martinez Roofing COI submission',
    'New COI uploaded and currently processing. Review once extraction complete.',
    'pending',
    NOW() - INTERVAL '1 hour',
    NULL,
    NOW() - INTERVAL '1 hour'
  ),
  (
    '75000000-0000-0000-0000-000000000032',
    '70000000-0000-0000-0000-000000000012',  -- Tech Campus (warning)
    '71000000-0000-0000-0000-000000000012',  -- Anderson Steel
    '60000000-0000-0000-0000-000000000002',  -- BuildRight
    '50000000-0000-0000-0000-000000000002',  -- Onboarding GC
    'Request waiver of subrogation from Anderson Steel',
    'Project requirements include WOS endorsement. Contact subcontractor to add to policy.',
    'in_progress',
    NOW() - INTERVAL '7 days',
    NULL,
    NOW() - INTERVAL '2 days'
  )
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- FORSURED COMMENTS
-- =========================================================

INSERT INTO forsured.comments (
  id,
  entity_type,
  entity_id,
  user_id,
  organization_id,
  content,
  created_at,
  updated_at,
  edited_at
)
VALUES
  -- Comments on tasks
  (
    gen_random_uuid(),
    'task',
    '75000000-0000-0000-0000-000000000001',  -- Brown Concrete COI task
    '50000000-0000-0000-0000-000000000003',  -- Active GC
    '60000000-0000-0000-0000-000000000001',
    'Called subcontractor office. They confirmed renewal is in process and should have new COI by end of week.',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days',
    NULL
  ),
  (
    gen_random_uuid(),
    'task',
    '75000000-0000-0000-0000-000000000011',  -- Wilson Demo COI task
    '50000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000001',
    'Sent formal request letter to Wilson Demolition. Waiting for response.',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    NULL
  ),
  (
    gen_random_uuid(),
    'task',
    '75000000-0000-0000-0000-000000000011',
    '50000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000001',
    'Follow-up call made. Subcontractor is switching insurance carriers which is causing delay.',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NULL
  ),

  -- Comments on projects
  (
    gen_random_uuid(),
    'project',
    '70000000-0000-0000-0000-000000000011',  -- Industrial Park
    '50000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000001',
    'Project compliance is critical. Two subcontractors are significantly non-compliant. May need to consider alternatives if not resolved within 30 days.',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days',
    NULL
  ),

  -- Comments on documents
  (
    gen_random_uuid(),
    'document',
    '72000000-0000-0000-0000-000000000021',  -- Wilson Demo rejected doc
    '50000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000001',
    'Document rejected due to insufficient coverage. Minimum $2M GL required for this project.',
    NOW() - INTERVAL '88 days',
    NOW() - INTERVAL '88 days',
    NULL
  ),

  -- Comments on subcontractors
  (
    gen_random_uuid(),
    'subcontractor',
    '71000000-0000-0000-0000-000000000001',  -- Johnson Electrical
    '50000000-0000-0000-0000-000000000003',
    '60000000-0000-0000-0000-000000000001',
    'Excellent compliance history. Always provides documentation on time.',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    NULL
  )
ON CONFLICT DO NOTHING;

-- =========================================================
-- STATUS HISTORY (audit trail)
-- =========================================================

INSERT INTO forsured.status_history (
  entity_type,
  entity_id,
  organization_id,
  old_status,
  new_status,
  changed_by,
  change_reason,
  created_at
)
VALUES
  -- Task status changes
  (
    'task',
    '75000000-0000-0000-0000-000000000021',  -- Completed task
    '60000000-0000-0000-0000-000000000001',
    'pending',
    'in_progress',
    '50000000-0000-0000-0000-000000000003',
    'Started review process',
    NOW() - INTERVAL '59 days'
  ),
  (
    'task',
    '75000000-0000-0000-0000-000000000021',
    '60000000-0000-0000-0000-000000000001',
    'in_progress',
    'completed',
    '50000000-0000-0000-0000-000000000003',
    'All coverage requirements verified and approved',
    NOW() - INTERVAL '58 days'
  ),
  (
    'task',
    '75000000-0000-0000-0000-000000000011',
    '60000000-0000-0000-0000-000000000001',
    'pending',
    'in_progress',
    '50000000-0000-0000-0000-000000000003',
    'Initiated outreach to subcontractor',
    NOW() - INTERVAL '10 days'
  ),

  -- Document status changes
  (
    'document',
    '72000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'pending',
    'processing',
    NULL,
    'Automated extraction started',
    NOW() - INTERVAL '59 days'
  ),
  (
    'document',
    '72000000-0000-0000-0000-000000000001',
    '60000000-0000-0000-0000-000000000001',
    'processing',
    'approved',
    '50000000-0000-0000-0000-000000000003',
    'Manual review completed - all requirements met',
    NOW() - INTERVAL '58 days'
  ),
  (
    'document',
    '72000000-0000-0000-0000-000000000021',
    '60000000-0000-0000-0000-000000000001',
    'pending',
    'rejected',
    '50000000-0000-0000-0000-000000000003',
    'Coverage amount insufficient',
    NOW() - INTERVAL '88 days'
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. Tasks track compliance work items for each project/subcontractor
-- 2. Comments provide threaded discussion on various entities
-- 3. Status history maintains audit trail of all status changes
-- 4. Various task statuses: pending, in_progress, completed, cancelled
-- 5. All IDs are fixed for deterministic testing
-- =========================================================
