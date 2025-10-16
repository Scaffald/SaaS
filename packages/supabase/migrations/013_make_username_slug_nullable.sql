-- =========================================================
-- 013_make_username_slug_nullable.sql
-- Make username and slug nullable on users table
-- Users are created by handle_new_user trigger, but making nullable
-- provides flexibility and prevents INSERT errors if needed
-- =========================================================

BEGIN;

-- Remove NOT NULL constraint from username
ALTER TABLE public.users 
  ALTER COLUMN username DROP NOT NULL;

-- Remove NOT NULL constraint from slug
ALTER TABLE public.users 
  ALTER COLUMN slug DROP NOT NULL;

-- Note: UNIQUE constraints remain in place to ensure no duplicates

COMMIT;
