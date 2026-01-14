-- =========================================================
-- 296_seed_broker_clients.sql
-- Seeds broker-client relationships for test data
-- =========================================================

BEGIN;

-- =========================================================
-- BROKER-CLIENT RELATIONSHIP INVITATIONS
-- =========================================================
-- Creates connected relationships between the test broker and clients
-- This enables the broker to see their clients on the /broker/clients page
--
-- Test Users (from existing seed data):
-- Broker: test-broker@forsured.test (10000000-0000-0000-0000-000000000003)
--   Org: Test Insurance Broker (20000000-0000-0000-0000-000000000003)
-- GC: test-gc@forsured.test (10000000-0000-0000-0000-000000000001)
--   Org: MRC Construction Co. (20000000-0000-0000-0000-000000000001)
-- Contractor: test-contractor@forsured.test (10000000-0000-0000-0000-000000000002)
--   Org: Test Contractor LLC (20000000-0000-0000-0000-000000000002)
-- =========================================================

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
  -- =========================================================
  -- Broker -> Manager (GC) Connection
  -- MRC Construction Co. is a client of Test Insurance Broker
  -- =========================================================
  (
    '80000000-0000-0000-0000-000000000001',           -- Fixed ID for testing
    '20000000-0000-0000-0000-000000000003',           -- Broker org (Test Insurance Broker)
    '10000000-0000-0000-0000-000000000003',           -- Broker user (test-broker)
    'broker',
    'test-gc@forsured.test',                          -- GC user email
    'Test GC User',
    'MRC Construction Co.',
    'manager',                                         -- GC = manager type
    'BKR-TEST-001',
    'email',
    'connected',                                       -- Already connected
    '20000000-0000-0000-0000-000000000001',           -- GC org (MRC Construction)
    '10000000-0000-0000-0000-000000000001',           -- GC user (test-gc)
    NOW() - INTERVAL '30 days',                       -- Invited 30 days ago
    NOW() - INTERVAL '28 days',                       -- Accepted 28 days ago
    NOW() - INTERVAL '28 days',                       -- Connected 28 days ago
    '{"source": "migration_seed", "notes": "Test broker-GC relationship"}'::jsonb
  ),

  -- =========================================================
  -- Broker -> Subcontractor Connection
  -- Test Contractor LLC is a client of Test Insurance Broker
  -- =========================================================
  (
    '80000000-0000-0000-0000-000000000002',           -- Fixed ID for testing
    '20000000-0000-0000-0000-000000000003',           -- Broker org (Test Insurance Broker)
    '10000000-0000-0000-0000-000000000003',           -- Broker user (test-broker)
    'broker',
    'test-contractor@forsured.test',                  -- Contractor user email
    'Test Contractor User',
    'Test Contractor LLC',
    'subcontractor',                                   -- Contractor = subcontractor type
    'BKR-TEST-002',
    'email',
    'connected',                                       -- Already connected
    '20000000-0000-0000-0000-000000000002',           -- Contractor org (Test Contractor LLC)
    '10000000-0000-0000-0000-000000000002',           -- Contractor user (test-contractor)
    NOW() - INTERVAL '25 days',                       -- Invited 25 days ago
    NOW() - INTERVAL '24 days',                       -- Accepted 24 days ago
    NOW() - INTERVAL '24 days',                       -- Connected 24 days ago
    '{"source": "migration_seed", "notes": "Test broker-contractor relationship"}'::jsonb
  ),

  -- =========================================================
  -- Pending Invitation: Broker -> Potential Client
  -- A pending invitation to demonstrate the invitation flow
  -- =========================================================
  (
    '80000000-0000-0000-0000-000000000003',           -- Fixed ID for testing
    '20000000-0000-0000-0000-000000000003',           -- Broker org (Test Insurance Broker)
    '10000000-0000-0000-0000-000000000003',           -- Broker user (test-broker)
    'broker',
    'potential-client@example.com',                   -- Potential client email
    'Potential Client',
    'Potential Construction Inc.',
    'manager',
    'BKR-TEST-003',
    'email',
    'pending',                                         -- Still pending
    NULL,                                              -- Not yet connected
    NULL,                                              -- Not yet connected
    NOW() - INTERVAL '5 days',                        -- Invited 5 days ago
    NULL,                                              -- Not accepted yet
    NULL,                                              -- Not connected yet
    '{"source": "migration_seed", "notes": "Pending broker invitation"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. Connected relationships allow brokers to see clients on /broker/clients
-- 2. The 'manager' type maps to General Contractor (GC) in the UI
-- 3. The 'subcontractor' type maps to Contractor in the UI
-- 4. Pending invitations demonstrate the invitation flow
-- 5. Fixed UUIDs (80000000-...) ensure idempotent seeding
-- 6. Uses existing test user/org IDs (10000000-... and 20000000-...)
-- =========================================================
