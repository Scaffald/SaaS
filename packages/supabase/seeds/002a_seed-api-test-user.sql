-- =========================================================
-- 002a_seed-api-test-user.sql - API test user for automation
-- Used by scripts/test-api-local.ts and SDK integration tests.
-- Credentials: test@example.com / test123456
-- =========================================================

BEGIN;

-- API test user: test@example.com / test123456
-- Idempotent: ON CONFLICT DO NOTHING
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
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000010'::uuid,
  'test@example.com',
  NULL,
  public.crypt('test123456', public.gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "API Test User", "first_name": "API", "last_name": "Test"}'::jsonb,
  'authenticated',
  'authenticated',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = NOW();

COMMIT;

-- =========================================================
-- NOTES:
-- =========================================================
-- 1. User id: 00000000-0000-0000-0000-000000000010
-- 2. Password: test123456 (used by test-api-local.ts and SDK integration tests)
-- 3. Trigger handle_new_user creates core.users, core.profile, core.preferences
-- 4. ON CONFLICT updates password so re-seed or manual reset keeps credentials in sync
-- =========================================================
