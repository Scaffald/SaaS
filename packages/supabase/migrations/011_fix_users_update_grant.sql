-- =========================================================
-- 011_fix_users_update_grant.sql - Fix users table UPDATE permission
-- Add missing UPDATE grant for authenticated users on public.users
-- =========================================================

BEGIN;

-- Add UPDATE grant for authenticated users on public.users table
-- This allows authenticated users to attempt UPDATE operations
-- RLS policies will still enforce that users can only update their own records
GRANT UPDATE ON public.users TO authenticated;

COMMIT;
