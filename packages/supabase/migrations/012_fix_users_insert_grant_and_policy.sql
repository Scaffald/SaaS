-- =========================================================
-- 012_fix_users_insert_grant_and_policy.sql
-- Fix users table INSERT permission and RLS policy
-- upsert operations require both INSERT and UPDATE grants + policies
-- =========================================================

BEGIN;

-- Add INSERT grant for authenticated users on public.users table
-- This allows authenticated users to attempt INSERT operations (for upsert)
-- RLS policies will still enforce that users can only insert their own records
GRANT INSERT ON public.users TO authenticated;

-- Add INSERT policy for users table
-- Allow authenticated users to insert their own user record
CREATE POLICY users_own_insert ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

COMMIT;
