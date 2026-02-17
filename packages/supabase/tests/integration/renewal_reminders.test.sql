-- =========================================================
-- Integration Tests: Renewal Reminders
-- Tests forsured.send_renewal_reminders() cron function
-- and forsured.handle_policy_renewal_update() trigger
--
-- Run: PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f this_file.sql
-- Requires: migration 313_renewal_reminders.sql applied
-- =========================================================

\set ON_ERROR_STOP on
\set QUIET on

-- =========================================================
-- Helper: assert function
-- =========================================================
CREATE OR REPLACE FUNCTION pg_temp.assert(condition BOOLEAN, test_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF NOT condition THEN
    RAISE EXCEPTION 'FAIL: %', test_name;
  ELSE
    RAISE NOTICE 'PASS: %', test_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION pg_temp.assert_eq(actual ANYELEMENT, expected ANYELEMENT, test_name TEXT)
RETURNS VOID AS $$
BEGIN
  IF actual IS DISTINCT FROM expected THEN
    RAISE EXCEPTION 'FAIL: % — expected %, got %', test_name, expected, actual;
  ELSE
    RAISE NOTICE 'PASS: %', test_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- Setup: Create test data
-- =========================================================
BEGIN;

-- Create test org
INSERT INTO core.organizations (id, name, slug, renewal_reminder_enabled, renewal_reminder_intervals)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Test Client Org',
  'test-client-org-rr',
  true,
  '{30,60,90}'
) ON CONFLICT (id) DO UPDATE SET
  renewal_reminder_enabled = true,
  renewal_reminder_intervals = '{30,60,90}';

-- Create broker org
INSERT INTO core.organizations (id, name, slug)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000002',
  'Test Broker Org',
  'test-broker-org-rr'
) ON CONFLICT (id) DO NOTHING;

-- Create forsured.organizations entries (broker_clients FK references forsured.organizations)
INSERT INTO forsured.organizations (id, name)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'Test Client Org'),
  ('aaaaaaaa-0000-0000-0000-000000000002', 'Test Broker Org')
ON CONFLICT (id) DO NOTHING;

-- Create test users (using auth.users for FK)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_confirmed_at)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'client-user@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', now()),
  ('bbbbbbbb-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'broker-user@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', now()),
  ('bbbbbbbb-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'opted-out@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', now())
ON CONFLICT (id) DO NOTHING;

-- Create core.users entries
INSERT INTO core.users (id, display_name)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'Client User'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Broker User'),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Opted Out User')
ON CONFLICT (id) DO NOTHING;

-- Assign client user to client org
INSERT INTO core.role_assignments (user_id, role_id, scope_org_id)
VALUES ('bbbbbbbb-0000-0000-0000-000000000001', '98974aa1-0025-47c4-94e5-a29017130be0', 'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Assign opted-out user to client org
INSERT INTO core.role_assignments (user_id, role_id, scope_org_id)
VALUES ('bbbbbbbb-0000-0000-0000-000000000003', '98974aa1-0025-47c4-94e5-a29017130be0', 'aaaaaaaa-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Assign broker user to broker org
INSERT INTO core.role_assignments (user_id, role_id, scope_org_id)
VALUES ('bbbbbbbb-0000-0000-0000-000000000002', '98974aa1-0025-47c4-94e5-a29017130be0', 'aaaaaaaa-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- Link broker org to client org
INSERT INTO forsured.broker_clients (id, broker_org_id, client_org_id, company_name, contact_name, contact_email, client_type, status)
VALUES (
  'cccccccc-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Test Client Org',
  'Test Contact',
  'contact@test.com',
  'general_contractor',
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Set up opted-out user's notification preferences
INSERT INTO core.notification_preferences (user_id, global_enabled, type_overrides)
VALUES ('bbbbbbbb-0000-0000-0000-000000000003', true, '{"policy.renewal": "disabled"}')
ON CONFLICT (user_id) DO UPDATE SET type_overrides = '{"policy.renewal": "disabled"}';

COMMIT;

-- =========================================================
-- TEST 1: No matching policies — returns zero processed
-- =========================================================
DO $$
DECLARE
  result JSONB;
BEGIN
  -- No policies exist yet
  SELECT forsured.send_renewal_reminders() INTO result;

  PERFORM pg_temp.assert(result->>'success' = 'true', 'T1: returns success=true with no policies');
  PERFORM pg_temp.assert_eq((result->>'processed')::INTEGER, 0, 'T1: processed count is 0');
  PERFORM pg_temp.assert_eq((result->>'errors')::INTEGER, 0, 'T1: error count is 0');
END;
$$;

-- =========================================================
-- TEST 2: Policy expiring in exactly 30 days — sends reminders
-- =========================================================
BEGIN;

-- Create policy expiring in 30 days
INSERT INTO forsured.insurance_policies (id, organization_id, policy_number, policy_type, carrier_name, effective_date, expiration_date, status)
VALUES (
  'dddddddd-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'POL-TEST-001',
  'GL',
  'Test Carrier Inc',
  CURRENT_DATE - INTERVAL '335 days',
  CURRENT_DATE + 30,
  'active'
);

COMMIT;

DO $$
DECLARE
  result JSONB;
  reminder_count INTEGER;
  notification_count INTEGER;
  notif RECORD;
BEGIN
  SELECT forsured.send_renewal_reminders() INTO result;

  PERFORM pg_temp.assert(result->>'success' = 'true', 'T2: returns success=true');
  -- Should send to client user + broker user (opted-out user skipped)
  PERFORM pg_temp.assert((result->>'processed')::INTEGER = 2, 'T2: processed 2 reminders (client + broker)');

  -- Verify renewal_reminders rows
  SELECT COUNT(*) INTO reminder_count
  FROM forsured.renewal_reminders
  WHERE policy_id = 'dddddddd-0000-0000-0000-000000000001'
    AND interval_days = 30;
  PERFORM pg_temp.assert_eq(reminder_count, 2, 'T2: 2 renewal_reminder rows created');

  -- Verify notifications created
  SELECT COUNT(*) INTO notification_count
  FROM core.notifications
  WHERE (type::TEXT) = 'policy.renewal'
    AND body->>'policy_id' = 'dddddddd-0000-0000-0000-000000000001';
  PERFORM pg_temp.assert_eq(notification_count, 2, 'T2: 2 notifications created');

  -- Verify severity is critical for 30-day interval
  SELECT severity::TEXT INTO notif
  FROM core.notifications
  WHERE (type::TEXT) = 'policy.renewal'
    AND body->>'policy_id' = 'dddddddd-0000-0000-0000-000000000001'
  LIMIT 1;
  PERFORM pg_temp.assert_eq(notif.severity, 'critical', 'T2: severity is critical for 30-day');

  -- Verify client notification message
  SELECT * INTO notif
  FROM core.notifications
  WHERE (type::TEXT) = 'policy.renewal'
    AND user_id = 'bbbbbbbb-0000-0000-0000-000000000001';
  PERFORM pg_temp.assert(notif.message LIKE '%Your GL%', 'T2: client message says "Your" policy');
  PERFORM pg_temp.assert(notif.title LIKE '%Urgent%', 'T2: 30-day title contains "Urgent"');
  PERFORM pg_temp.assert(notif.cta_url = '/policies/dddddddd-0000-0000-0000-000000000001', 'T2: CTA URL is correct');

  -- Verify broker notification message
  SELECT * INTO notif
  FROM core.notifications
  WHERE (type::TEXT) = 'policy.renewal'
    AND user_id = 'bbbbbbbb-0000-0000-0000-000000000002';
  PERFORM pg_temp.assert(notif.message LIKE '%Your client Test Client Org%', 'T2: broker message says "Your client"');
END;
$$;

-- =========================================================
-- TEST 3: Dedup — running again doesn't create duplicates
-- =========================================================
DO $$
DECLARE
  result JSONB;
  reminder_count INTEGER;
BEGIN
  SELECT forsured.send_renewal_reminders() INTO result;

  PERFORM pg_temp.assert(result->>'success' = 'true', 'T3: dedup run returns success');
  PERFORM pg_temp.assert_eq((result->>'processed')::INTEGER, 0, 'T3: processed 0 (all already sent)');

  -- Verify still only 2 reminders exist
  SELECT COUNT(*) INTO reminder_count
  FROM forsured.renewal_reminders
  WHERE policy_id = 'dddddddd-0000-0000-0000-000000000001';
  PERFORM pg_temp.assert_eq(reminder_count, 2, 'T3: still only 2 reminder rows');
END;
$$;

-- =========================================================
-- TEST 4: Opted-out user doesn't receive reminders
-- =========================================================
DO $$
DECLARE
  notification_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO notification_count
  FROM core.notifications
  WHERE (type::TEXT) = 'policy.renewal'
    AND user_id = 'bbbbbbbb-0000-0000-0000-000000000003';
  PERFORM pg_temp.assert_eq(notification_count, 0, 'T4: opted-out user has 0 notifications');
END;
$$;

-- =========================================================
-- TEST 5: Org with reminders disabled — no notifications sent
-- =========================================================
BEGIN;

-- Create org with reminders disabled
INSERT INTO core.organizations (id, name, slug, renewal_reminder_enabled, renewal_reminder_intervals)
VALUES ('aaaaaaaa-0000-0000-0000-000000000003', 'Disabled Org', 'disabled-org-rr', false, '{30,60,90}')
ON CONFLICT (id) DO UPDATE SET renewal_reminder_enabled = false;

INSERT INTO forsured.organizations (id, name)
VALUES ('aaaaaaaa-0000-0000-0000-000000000003', 'Disabled Org')
ON CONFLICT (id) DO NOTHING;

-- Create user in disabled org
INSERT INTO auth.users (id, instance_id, email, encrypted_password, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_confirmed_at)
VALUES ('bbbbbbbb-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'disabled-org@test.com', crypt('password', gen_salt('bf')), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', now())
ON CONFLICT (id) DO NOTHING;
INSERT INTO core.users (id, display_name)
VALUES ('bbbbbbbb-0000-0000-0000-000000000004', 'Disabled Org User')
ON CONFLICT (id) DO NOTHING;
INSERT INTO core.role_assignments (user_id, role_id, scope_org_id)
VALUES ('bbbbbbbb-0000-0000-0000-000000000004', '98974aa1-0025-47c4-94e5-a29017130be0', 'aaaaaaaa-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- Create policy in disabled org
INSERT INTO forsured.insurance_policies (id, organization_id, policy_number, policy_type, carrier_name, effective_date, expiration_date, status)
VALUES (
  'dddddddd-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000003',
  'POL-DISABLED-001',
  'WC',
  'Disabled Carrier',
  CURRENT_DATE - INTERVAL '335 days',
  CURRENT_DATE + 30,
  'active'
);

COMMIT;

DO $$
DECLARE
  notification_count INTEGER;
  result JSONB;
BEGIN
  SELECT forsured.send_renewal_reminders() INTO result;

  SELECT COUNT(*) INTO notification_count
  FROM core.notifications
  WHERE (type::TEXT) = 'policy.renewal'
    AND user_id = 'bbbbbbbb-0000-0000-0000-000000000004';
  PERFORM pg_temp.assert_eq(notification_count, 0, 'T5: disabled org user gets 0 notifications');
END;
$$;

-- =========================================================
-- TEST 6: 60-day interval — severity is 'important'
-- =========================================================
BEGIN;

INSERT INTO forsured.insurance_policies (id, organization_id, policy_number, policy_type, carrier_name, effective_date, expiration_date, status)
VALUES (
  'dddddddd-0000-0000-0000-000000000003',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'POL-TEST-60',
  'Auto',
  'Auto Carrier',
  CURRENT_DATE - INTERVAL '305 days',
  CURRENT_DATE + 60,
  'active'
);

COMMIT;

DO $$
DECLARE
  result JSONB;
  notif RECORD;
BEGIN
  SELECT forsured.send_renewal_reminders() INTO result;
  PERFORM pg_temp.assert((result->>'processed')::INTEGER >= 2, 'T6: processed reminders for 60-day policy');

  SELECT severity::TEXT AS severity, title INTO notif
  FROM core.notifications
  WHERE (type::TEXT) = 'policy.renewal'
    AND body->>'policy_id' = 'dddddddd-0000-0000-0000-000000000003'
  LIMIT 1;
  PERFORM pg_temp.assert_eq(notif.severity, 'important', 'T6: severity is important for 60-day');
  PERFORM pg_temp.assert(notif.title LIKE '%renewal in 60 days%', 'T6: title mentions 60 days');
END;
$$;

-- =========================================================
-- TEST 7: 90-day interval — severity is 'info'
-- =========================================================
BEGIN;

INSERT INTO forsured.insurance_policies (id, organization_id, policy_number, policy_type, carrier_name, effective_date, expiration_date, status)
VALUES (
  'dddddddd-0000-0000-0000-000000000004',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'POL-TEST-90',
  'Umbrella',
  'Umbrella Carrier',
  CURRENT_DATE - INTERVAL '275 days',
  CURRENT_DATE + 90,
  'active'
);

COMMIT;

DO $$
DECLARE
  result JSONB;
  notif RECORD;
BEGIN
  SELECT forsured.send_renewal_reminders() INTO result;
  PERFORM pg_temp.assert((result->>'processed')::INTEGER >= 2, 'T7: processed reminders for 90-day policy');

  SELECT severity::TEXT AS severity, title INTO notif
  FROM core.notifications
  WHERE (type::TEXT) = 'policy.renewal'
    AND body->>'policy_id' = 'dddddddd-0000-0000-0000-000000000004'
  LIMIT 1;
  PERFORM pg_temp.assert_eq(notif.severity, 'info', 'T7: severity is info for 90-day');
  PERFORM pg_temp.assert(notif.title LIKE '%upcoming%', 'T7: title mentions upcoming');
END;
$$;

-- =========================================================
-- TEST 8: Trigger — expiration_date change dismisses reminders
-- =========================================================
DO $$
DECLARE
  active_count INTEGER;
  dismissed_count INTEGER;
  archived_count INTEGER;
BEGIN
  -- Verify we have active reminders for policy 001
  SELECT COUNT(*) INTO active_count
  FROM forsured.renewal_reminders
  WHERE policy_id = 'dddddddd-0000-0000-0000-000000000001'
    AND dismissed_at IS NULL;
  PERFORM pg_temp.assert(active_count > 0, 'T8: pre-condition: active reminders exist');

  -- Update expiration date (trigger should fire)
  UPDATE forsured.insurance_policies
  SET expiration_date = CURRENT_DATE + 365
  WHERE id = 'dddddddd-0000-0000-0000-000000000001';

  -- Check reminders are dismissed
  SELECT COUNT(*) INTO active_count
  FROM forsured.renewal_reminders
  WHERE policy_id = 'dddddddd-0000-0000-0000-000000000001'
    AND dismissed_at IS NULL;
  PERFORM pg_temp.assert_eq(active_count, 0, 'T8: all reminders dismissed after date change');

  SELECT COUNT(*) INTO dismissed_count
  FROM forsured.renewal_reminders
  WHERE policy_id = 'dddddddd-0000-0000-0000-000000000001'
    AND dismissed_at IS NOT NULL;
  PERFORM pg_temp.assert(dismissed_count > 0, 'T8: dismissed_at is set');

  -- Check notifications are archived
  SELECT COUNT(*) INTO archived_count
  FROM core.notifications
  WHERE id IN (
    SELECT notification_id FROM forsured.renewal_reminders
    WHERE policy_id = 'dddddddd-0000-0000-0000-000000000001'
  )
  AND archived_at IS NOT NULL;
  PERFORM pg_temp.assert(archived_count > 0, 'T8: notifications archived after date change');
END;
$$;

-- =========================================================
-- TEST 9: Trigger — status change to 'cancelled' dismisses reminders
-- =========================================================
DO $$
DECLARE
  active_count INTEGER;
  result JSONB;
BEGIN
  -- First, create new reminders for the 60-day policy
  -- (its reminders are still active from T6)
  SELECT COUNT(*) INTO active_count
  FROM forsured.renewal_reminders
  WHERE policy_id = 'dddddddd-0000-0000-0000-000000000003'
    AND dismissed_at IS NULL;
  PERFORM pg_temp.assert(active_count > 0, 'T9: pre-condition: active reminders for 60-day policy');

  -- Cancel the policy (trigger should fire)
  UPDATE forsured.insurance_policies
  SET status = 'cancelled'
  WHERE id = 'dddddddd-0000-0000-0000-000000000003';

  -- Check reminders are dismissed
  SELECT COUNT(*) INTO active_count
  FROM forsured.renewal_reminders
  WHERE policy_id = 'dddddddd-0000-0000-0000-000000000003'
    AND dismissed_at IS NULL;
  PERFORM pg_temp.assert_eq(active_count, 0, 'T9: all reminders dismissed after cancellation');
END;
$$;

-- =========================================================
-- TEST 10: Trigger — unrelated update does NOT dismiss reminders
-- =========================================================
DO $$
DECLARE
  active_count_before INTEGER;
  active_count_after INTEGER;
BEGIN
  -- 90-day policy still has active reminders
  SELECT COUNT(*) INTO active_count_before
  FROM forsured.renewal_reminders
  WHERE policy_id = 'dddddddd-0000-0000-0000-000000000004'
    AND dismissed_at IS NULL;
  PERFORM pg_temp.assert(active_count_before > 0, 'T10: pre-condition: active reminders for 90-day policy');

  -- Update an unrelated field
  UPDATE forsured.insurance_policies
  SET carrier_name = 'New Umbrella Carrier'
  WHERE id = 'dddddddd-0000-0000-0000-000000000004';

  -- Reminders should still be active
  SELECT COUNT(*) INTO active_count_after
  FROM forsured.renewal_reminders
  WHERE policy_id = 'dddddddd-0000-0000-0000-000000000004'
    AND dismissed_at IS NULL;
  PERFORM pg_temp.assert_eq(active_count_after, active_count_before, 'T10: reminders unchanged after unrelated update');
END;
$$;

-- =========================================================
-- TEST 11: Constraint validation — intervals must be 1-365
-- =========================================================
DO $$
BEGIN
  -- Try to set an invalid interval (0)
  BEGIN
    UPDATE core.organizations
    SET renewal_reminder_intervals = '{0,30,60}'
    WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
    PERFORM pg_temp.assert(false, 'T11a: should have thrown constraint violation');
  EXCEPTION WHEN check_violation THEN
    PERFORM pg_temp.assert(true, 'T11a: interval 0 rejected by constraint');
  END;

  -- Try to set an invalid interval (366)
  BEGIN
    UPDATE core.organizations
    SET renewal_reminder_intervals = '{30,60,366}'
    WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
    PERFORM pg_temp.assert(false, 'T11b: should have thrown constraint violation');
  EXCEPTION WHEN check_violation THEN
    PERFORM pg_temp.assert(true, 'T11b: interval 366 rejected by constraint');
  END;

  -- Try empty array
  BEGIN
    UPDATE core.organizations
    SET renewal_reminder_intervals = '{}'
    WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
    PERFORM pg_temp.assert(false, 'T11c: should have thrown constraint violation');
  EXCEPTION WHEN check_violation THEN
    PERFORM pg_temp.assert(true, 'T11c: empty array rejected by constraint');
  END;

  -- Valid intervals should work
  UPDATE core.organizations
  SET renewal_reminder_intervals = '{1,180,365}'
  WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
  PERFORM pg_temp.assert(true, 'T11d: valid intervals 1,180,365 accepted');

  -- Reset
  UPDATE core.organizations
  SET renewal_reminder_intervals = '{30,60,90}'
  WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001';
END;
$$;

-- =========================================================
-- Cleanup test data
-- =========================================================
BEGIN;

DELETE FROM forsured.renewal_reminders
WHERE organization_id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000003'
);

DELETE FROM core.notifications
WHERE user_id IN (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000003',
  'bbbbbbbb-0000-0000-0000-000000000004'
);

DELETE FROM forsured.insurance_policies
WHERE id IN (
  'dddddddd-0000-0000-0000-000000000001',
  'dddddddd-0000-0000-0000-000000000002',
  'dddddddd-0000-0000-0000-000000000003',
  'dddddddd-0000-0000-0000-000000000004'
);

DELETE FROM forsured.broker_clients WHERE id = 'cccccccc-0000-0000-0000-000000000001';
DELETE FROM core.notification_preferences WHERE user_id = 'bbbbbbbb-0000-0000-0000-000000000003';
DELETE FROM core.role_assignments WHERE user_id IN (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000003',
  'bbbbbbbb-0000-0000-0000-000000000004'
);
DELETE FROM core.users WHERE id IN (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000003',
  'bbbbbbbb-0000-0000-0000-000000000004'
);
DELETE FROM auth.users WHERE id IN (
  'bbbbbbbb-0000-0000-0000-000000000001',
  'bbbbbbbb-0000-0000-0000-000000000002',
  'bbbbbbbb-0000-0000-0000-000000000003',
  'bbbbbbbb-0000-0000-0000-000000000004'
);
DELETE FROM forsured.organizations WHERE id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000003'
);
DELETE FROM core.organizations WHERE id IN (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'aaaaaaaa-0000-0000-0000-000000000002',
  'aaaaaaaa-0000-0000-0000-000000000003'
);

COMMIT;

\echo ''
\echo '==========================================='
\echo '  All renewal reminder tests completed!'
\echo '==========================================='
