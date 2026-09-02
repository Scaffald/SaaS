-- =========================================================
-- 002b_seed-api-admin-test-user.sql - second API test user
-- Credentials: admin@example.com / adminpassword123
-- =========================================================
--
-- packages/supabase/tests/shared/setup.ts has always declared TEST_USERS.admin,
-- and nothing has ever created it. `select count(*) from auth.users where
-- email = 'admin@example.com'` returned 0, so the shared setup could not mint
-- its token, marked auth setup incomplete, and every suite depending on it
-- failed at startup — 101 "Auth setup is incomplete" plus 31 "Failed to get or
-- create auth token" in a single run, none of them about the code under test
-- (#478).
--
-- Deliberately an ordinary confirmed user, not an elevated one. The suites use
-- this identity as a *second distinct user* — office.test.ts literally guards
-- on `tokens.admin.token !== tokens.regular.token` — rather than for platform
-- privileges. If some test does need elevation it will now fail on
-- authorization, which is a true failure about the thing being tested, instead
-- of disappearing into a setup cascade.
--
-- Mirrors 002a_seed-api-test-user.sql, including the ON CONFLICT DO UPDATE so a
-- re-seed keeps the password in sync.

BEGIN;

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
  '00000000-0000-0000-0000-000000000011'::uuid,
  'admin@example.com',
  NULL,
  public.crypt('adminpassword123', public.gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "API Admin Test User", "first_name": "API", "last_name": "Admin"}'::jsonb,
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
-- 1. User id: 00000000-0000-0000-0000-000000000011 (002a uses ...010)
-- 2. Password: adminpassword123, matching TEST_USERS.admin in tests/shared/setup.ts
-- 3. Trigger handle_new_user creates core.users, core.profile, core.preferences
-- =========================================================
