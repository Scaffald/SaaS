-- =========================================================
-- 001_seed-users.sql - ForSured Test Users
-- Seeds auth.users and core.users for ForSured testing
-- Password for all users: ForsuredTest123!
-- =========================================================

BEGIN;

-- =========================================================
-- TEST USERS FOR FORSURED APPLICATION
-- =========================================================
-- ID Convention: 50000000-0000-0000-0000-0000000000XX
-- GC Users: 01-04, Contractors: 11-14, Brokers: 21-22, Admin: 31-32
-- =========================================================

INSERT INTO auth.users (
  instance_id,
  id,
  email,
  phone,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
SELECT
  '00000000-0000-0000-0000-000000000000'::uuid,
  users.id::uuid,
  users.email,
  NULLIF(users.phone, ''),
  public.crypt('ForsuredTest123!', public.gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  jsonb_build_object(
    'provider', 'email',
    'name', users.name,
    'first_name', users.first_name,
    'last_name', users.last_name,
    'location', users.location,
    'user_type', users.user_type
  ),
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
FROM (VALUES
  -- =========================================================
  -- GENERAL CONTRACTORS (GC Users)
  -- =========================================================
  ('50000000-0000-0000-0000-000000000001', 'gc-fresh@forsured-test.com', 'Fresh GC User', 'Fresh', 'GC', '+1 (555) 001-0001', 'New York, NY, United States', 'gc'),
  ('50000000-0000-0000-0000-000000000002', 'gc-onboarding@forsured-test.com', 'Onboarding GC User', 'Onboarding', 'GC', '+1 (555) 001-0002', 'Boston, MA, United States', 'gc'),
  ('50000000-0000-0000-0000-000000000003', 'gc-active@forsured-test.com', 'Active GC User', 'Active', 'GC', '+1 (555) 001-0003', 'Chicago, IL, United States', 'gc'),
  ('50000000-0000-0000-0000-000000000004', 'gc-multiproject@forsured-test.com', 'MultiProject GC User', 'MultiProject', 'GC', '+1 (555) 001-0004', 'Los Angeles, CA, United States', 'gc'),

  -- =========================================================
  -- CONTRACTORS / SUBCONTRACTORS
  -- =========================================================
  ('50000000-0000-0000-0000-000000000011', 'contractor-fresh@forsured-test.com', 'Fresh Contractor', 'Fresh', 'Contractor', '+1 (555) 002-0001', 'Phoenix, AZ, United States', 'contractor'),
  ('50000000-0000-0000-0000-000000000012', 'contractor-active@forsured-test.com', 'Active Contractor', 'Active', 'Contractor', '+1 (555) 002-0002', 'Houston, TX, United States', 'contractor'),
  ('50000000-0000-0000-0000-000000000013', 'contractor-noncompliant@forsured-test.com', 'NonCompliant Contractor', 'NonCompliant', 'Contractor', '+1 (555) 002-0003', 'San Antonio, TX, United States', 'contractor'),
  ('50000000-0000-0000-0000-000000000014', 'contractor-multiproject@forsured-test.com', 'MultiProject Contractor', 'MultiProject', 'Contractor', '+1 (555) 002-0004', 'Dallas, TX, United States', 'contractor'),

  -- =========================================================
  -- BROKERS
  -- =========================================================
  ('50000000-0000-0000-0000-000000000021', 'broker-fresh@forsured-test.com', 'Fresh Broker', 'Fresh', 'Broker', '+1 (555) 003-0001', 'San Diego, CA, United States', 'broker'),
  ('50000000-0000-0000-0000-000000000022', 'broker-active@forsured-test.com', 'Active Broker', 'Active', 'Broker', '+1 (555) 003-0002', 'San Jose, CA, United States', 'broker'),

  -- =========================================================
  -- ADMINS
  -- =========================================================
  ('50000000-0000-0000-0000-000000000031', 'admin@forsured-test.com', 'ForSured Admin', 'ForSured', 'Admin', '+1 (555) 004-0001', 'Austin, TX, United States', 'admin'),
  ('50000000-0000-0000-0000-000000000032', 'superadmin@forsured-test.com', 'ForSured SuperAdmin', 'ForSured', 'SuperAdmin', '+1 (555) 004-0002', 'Jacksonville, FL, United States', 'super_admin'),

  -- =========================================================
  -- SIMPLE TEST USERS (for Start.tsx quick login) - legacy @forsured.test
  -- =========================================================
  -- Note: These use 10000000 IDs to match existing users in database
  ('10000000-0000-0000-0000-000000000001', 'test-gc@forsured.test', 'Test GC User', 'Test', 'GC', '+1 (555) 005-0001', 'New York, NY, United States', 'gc'),
  ('10000000-0000-0000-0000-000000000002', 'test-contractor@forsured.test', 'Test Contractor User', 'Test', 'Contractor', '+1 (555) 005-0002', 'Houston, TX, United States', 'contractor'),
  ('10000000-0000-0000-0000-000000000003', 'test-broker@forsured.test', 'Test Broker User', 'Test', 'Broker', '+1 (555) 005-0003', 'San Jose, CA, United States', 'broker'),
  ('10000000-0000-0000-0000-000000000004', 'test-admin@forsured.test', 'Test Admin User', 'Test', 'Admin', '+1 (555) 005-0004', 'Austin, TX, United States', 'admin'),

  -- =========================================================
  -- MAGIC LINK TEST USERS (for Start.tsx quick login) - @example.com
  -- =========================================================
  ('10000000-0000-0000-0000-000000000010', 'manager@example.com', 'Test Manager', 'Test', 'Manager', '+1 (555) 006-0001', 'New York, NY, United States', 'gc'),
  ('10000000-0000-0000-0000-000000000011', 'contractor@example.com', 'Test Contractor', 'Test', 'Contractor', '+1 (555) 006-0002', 'Houston, TX, United States', 'contractor'),
  ('10000000-0000-0000-0000-000000000012', 'broker@example.com', 'Test Broker', 'Test', 'Broker', '+1 (555) 006-0003', 'San Jose, CA, United States', 'broker'),
  ('10000000-0000-0000-0000-000000000013', 'admin@example.com', 'Test Admin', 'Test', 'Admin', '+1 (555) 006-0004', 'Austin, TX, United States', 'admin')
) AS users(id, email, name, first_name, last_name, phone, location, user_type)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Note: core.users, core.profile, and core.preferences
-- are automatically created by the handle_new_user() trigger
-- =========================================================

-- =========================================================
-- CREATE FORSURED USER PROFILES
-- =========================================================
-- Quick-login test users need forsured.user_profiles so
-- ProtectedRoute allows access to dashboards.
-- user_type must match CHECK constraint: gc, contractor, broker, admin
-- =========================================================
INSERT INTO forsured.user_profiles (
  scaffald_user_id,
  user_type,
  onboarding_completed,
  onboarding_step
)
VALUES
  -- Legacy @forsured.test quick-login users
  ('10000000-0000-0000-0000-000000000001', 'gc', true, 5),
  ('10000000-0000-0000-0000-000000000002', 'contractor', true, 5),
  ('10000000-0000-0000-0000-000000000003', 'broker', true, 5),
  ('10000000-0000-0000-0000-000000000004', 'admin', true, 5),
  -- @example.com magic-link quick-login users
  ('10000000-0000-0000-0000-000000000010', 'gc', true, 5),
  ('10000000-0000-0000-0000-000000000011', 'contractor', true, 5),
  ('10000000-0000-0000-0000-000000000012', 'broker', true, 5),
  ('10000000-0000-0000-0000-000000000013', 'admin', true, 5)
ON CONFLICT (scaffald_user_id) DO NOTHING;

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. All users have password: ForsuredTest123!
-- 2. The handle_new_user() trigger automatically creates:
--    - core.users record (public profile with display_name)
--    - core.profile record (PII: first_name, last_name, location)
--    - core.preferences record (settings)
-- 3. User types in raw_user_meta_data.user_type:
--    - gc: General Contractor
--    - contractor: Subcontractor
--    - broker: Insurance Broker
--    - admin: ForSured Admin
--    - super_admin: ForSured Super Admin
-- 4. ON CONFLICT (id) makes this seed idempotent
-- =========================================================
