-- Migration: Seed test users for development/testing
-- Purpose: Create real Supabase auth users for test login buttons
-- These users can be logged in via signInWithPassword in development
--
-- WARNING: This migration is for LOCAL DEVELOPMENT ONLY.
-- Do NOT run this in production environments.
--
-- Test Users:
-- - test-gc@forsured.test (Manager/GC) - Password: ForsuredTest123!
-- - test-contractor@forsured.test (Contractor/Sub) - Password: ForsuredTest123!
-- - test-broker@forsured.test (Broker) - Password: ForsuredTest123!
-- - test-admin@forsured.test (Admin) - Password: ForsuredTest123!

-- Enable extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Define test user IDs (fixed UUIDs for consistency)
DO $$
DECLARE
  v_gc_user_id UUID := '10000000-0000-0000-0000-000000000001';
  v_contractor_user_id UUID := '10000000-0000-0000-0000-000000000002';
  v_broker_user_id UUID := '10000000-0000-0000-0000-000000000003';
  v_admin_user_id UUID := '10000000-0000-0000-0000-000000000004';
  v_password_hash TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Generate password hash using bcrypt (Supabase standard)
  -- Password: ForsuredTest123!
  v_password_hash := crypt('ForsuredTest123!', gen_salt('bf'));

  -- Insert test users into auth.users (if not exists)
  -- Using ON CONFLICT to avoid errors if users already exist

  -- GC / Manager user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token
  ) VALUES (
    v_gc_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test-gc@forsured.test',
    v_password_hash,
    v_now, -- Email already confirmed
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test GC User", "user_type": "manager"}',
    v_now,
    v_now,
    '',
    '',
    '', -- email_change
    '', -- email_change_token_new
    '', -- email_change_token_current
    '', -- phone_change
    ''  -- phone_change_token
  ) ON CONFLICT (id) DO NOTHING;

  -- Contractor / Subcontractor user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token
  ) VALUES (
    v_contractor_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test-contractor@forsured.test',
    v_password_hash,
    v_now,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test Contractor User", "user_type": "contractor"}',
    v_now,
    v_now,
    '',
    '',
    '', -- email_change
    '', -- email_change_token_new
    '', -- email_change_token_current
    '', -- phone_change
    ''  -- phone_change_token
  ) ON CONFLICT (id) DO NOTHING;

  -- Broker user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token
  ) VALUES (
    v_broker_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test-broker@forsured.test',
    v_password_hash,
    v_now,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test Broker User", "user_type": "broker"}',
    v_now,
    v_now,
    '',
    '',
    '', -- email_change
    '', -- email_change_token_new
    '', -- email_change_token_current
    '', -- phone_change
    ''  -- phone_change_token
  ) ON CONFLICT (id) DO NOTHING;

  -- Admin user
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    phone_change,
    phone_change_token
  ) VALUES (
    v_admin_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test-admin@forsured.test',
    v_password_hash,
    v_now,
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test Admin User", "user_type": "admin"}',
    v_now,
    v_now,
    '',
    '',
    '', -- email_change
    '', -- email_change_token_new
    '', -- email_change_token_current
    '', -- phone_change
    ''  -- phone_change_token
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert auth.identities entries (required for email/password auth)
  -- GC identity
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_gc_user_id,
    v_gc_user_id,
    v_gc_user_id::text,
    'email',
    jsonb_build_object('sub', v_gc_user_id::text, 'email', 'test-gc@forsured.test', 'email_verified', true, 'phone_verified', false),
    v_now,
    v_now,
    v_now
  ) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Contractor identity
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_contractor_user_id,
    v_contractor_user_id,
    v_contractor_user_id::text,
    'email',
    jsonb_build_object('sub', v_contractor_user_id::text, 'email', 'test-contractor@forsured.test', 'email_verified', true, 'phone_verified', false),
    v_now,
    v_now,
    v_now
  ) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Broker identity
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_broker_user_id,
    v_broker_user_id,
    v_broker_user_id::text,
    'email',
    jsonb_build_object('sub', v_broker_user_id::text, 'email', 'test-broker@forsured.test', 'email_verified', true, 'phone_verified', false),
    v_now,
    v_now,
    v_now
  ) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Admin identity
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    provider,
    identity_data,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_admin_user_id,
    v_admin_user_id,
    v_admin_user_id::text,
    'email',
    jsonb_build_object('sub', v_admin_user_id::text, 'email', 'test-admin@forsured.test', 'email_verified', true, 'phone_verified', false),
    v_now,
    v_now,
    v_now
  ) ON CONFLICT (provider_id, provider) DO NOTHING;

  -- Insert corresponding user profiles in forsured.user_profiles
  -- GC / Manager profile
  INSERT INTO forsured.user_profiles (
    id,
    scaffald_user_id,
    user_type,
    onboarding_completed,
    onboarding_step,
    onboarding_data,
    company_connected,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_gc_user_id,
    'manager',
    true, -- Onboarding completed so we can test dashboard
    5,
    '{}',
    false,
    v_now,
    v_now
  ) ON CONFLICT (scaffald_user_id) DO NOTHING;

  -- Contractor profile
  INSERT INTO forsured.user_profiles (
    id,
    scaffald_user_id,
    user_type,
    onboarding_completed,
    onboarding_step,
    onboarding_data,
    company_connected,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_contractor_user_id,
    'contractor',
    true,
    5,
    '{}',
    false,
    v_now,
    v_now
  ) ON CONFLICT (scaffald_user_id) DO NOTHING;

  -- Broker profile
  INSERT INTO forsured.user_profiles (
    id,
    scaffald_user_id,
    user_type,
    onboarding_completed,
    onboarding_step,
    onboarding_data,
    company_connected,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_broker_user_id,
    'broker',
    true,
    5,
    '{}',
    false,
    v_now,
    v_now
  ) ON CONFLICT (scaffald_user_id) DO NOTHING;

  -- Admin profile
  INSERT INTO forsured.user_profiles (
    id,
    scaffald_user_id,
    user_type,
    onboarding_completed,
    onboarding_step,
    onboarding_data,
    company_connected,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_admin_user_id,
    'admin',
    true,
    5,
    '{}',
    false,
    v_now,
    v_now
  ) ON CONFLICT (scaffald_user_id) DO NOTHING;

  RAISE NOTICE 'Test users seeded successfully:';
  RAISE NOTICE '  - test-gc@forsured.test (Manager) - Password: ForsuredTest123!';
  RAISE NOTICE '  - test-contractor@forsured.test (Contractor) - Password: ForsuredTest123!';
  RAISE NOTICE '  - test-broker@forsured.test (Broker) - Password: ForsuredTest123!';
  RAISE NOTICE '  - test-admin@forsured.test (Admin) - Password: ForsuredTest123!';
END $$;
