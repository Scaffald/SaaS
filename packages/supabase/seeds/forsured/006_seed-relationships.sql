-- =========================================================
-- 006_seed-relationships.sql - ForSured Broker-Client Relationships
-- Seeds forsured.relationship_invitations for broker connections
-- =========================================================

BEGIN;

-- =========================================================
-- BROKER-CLIENT RELATIONSHIP INVITATIONS
-- =========================================================
-- Creates connected relationships between the broker and clients
-- This enables the broker to see their clients on the /broker/clients page
--
-- Broker: Pinnacle Insurance Brokers (60000000-0000-0000-0000-000000000021)
-- GC Client: Acme Construction Group (60000000-0000-0000-0000-000000000001)
-- Contractor Client: Elite Electrical Services (60000000-0000-0000-0000-000000000011)
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
  -- Acme Construction Group is a client of Pinnacle Insurance Brokers
  -- =========================================================
  (
    '70000000-0000-0000-0000-000000000001',           -- Fixed ID for testing
    '60000000-0000-0000-0000-000000000021',           -- Broker org (Pinnacle Insurance)
    '50000000-0000-0000-0000-000000000022',           -- Broker user (Active Broker)
    'broker',
    'gc-active@forsured-test.com',                    -- GC user email
    'Active GC User',
    'Acme Construction Group',
    'manager',                                         -- GC = manager type
    'BKR-SEED-001',
    'email',
    'connected',                                       -- Already connected
    '60000000-0000-0000-0000-000000000001',           -- GC org (Acme Construction)
    '50000000-0000-0000-0000-000000000003',           -- GC user (Active GC)
    NOW() - INTERVAL '30 days',                       -- Invited 30 days ago
    NOW() - INTERVAL '28 days',                       -- Accepted 28 days ago
    NOW() - INTERVAL '28 days',                       -- Connected 28 days ago
    '{"source": "seed_data", "notes": "Test broker-GC relationship"}'::jsonb
  ),

  -- =========================================================
  -- Broker -> Subcontractor Connection
  -- Elite Electrical Services is a client of Pinnacle Insurance Brokers
  -- =========================================================
  (
    '70000000-0000-0000-0000-000000000002',           -- Fixed ID for testing
    '60000000-0000-0000-0000-000000000021',           -- Broker org (Pinnacle Insurance)
    '50000000-0000-0000-0000-000000000022',           -- Broker user (Active Broker)
    'broker',
    'contractor-active@forsured-test.com',            -- Contractor user email
    'Active Contractor',
    'Elite Electrical Services',
    'subcontractor',                                   -- Contractor = subcontractor type
    'BKR-SEED-002',
    'email',
    'connected',                                       -- Already connected
    '60000000-0000-0000-0000-000000000011',           -- Contractor org (Elite Electrical)
    '50000000-0000-0000-0000-000000000012',           -- Contractor user (Active Contractor)
    NOW() - INTERVAL '25 days',                       -- Invited 25 days ago
    NOW() - INTERVAL '24 days',                       -- Accepted 24 days ago
    NOW() - INTERVAL '24 days',                       -- Connected 24 days ago
    '{"source": "seed_data", "notes": "Test broker-contractor relationship"}'::jsonb
  ),

  -- =========================================================
  -- Pending Invitation: Broker -> Another GC
  -- BuildRight Contractors has a pending invitation
  -- =========================================================
  (
    '70000000-0000-0000-0000-000000000003',           -- Fixed ID for testing
    '60000000-0000-0000-0000-000000000021',           -- Broker org (Pinnacle Insurance)
    '50000000-0000-0000-0000-000000000022',           -- Broker user (Active Broker)
    'broker',
    'gc-onboarding@forsured-test.com',                -- Onboarding GC email
    'Onboarding GC User',
    'BuildRight Contractors',
    'manager',
    'BKR-SEED-003',
    'email',
    'pending',                                         -- Still pending
    NULL,                                              -- Not yet connected
    NULL,                                              -- Not yet connected
    NOW() - INTERVAL '5 days',                        -- Invited 5 days ago
    NULL,                                              -- Not accepted yet
    NULL,                                              -- Not connected yet
    '{"source": "seed_data", "notes": "Pending broker invitation to GC"}'::jsonb
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
-- 5. Fixed UUIDs (70000000-...) ensure idempotent seeding
-- =========================================================
