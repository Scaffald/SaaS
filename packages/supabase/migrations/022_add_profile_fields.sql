-- 022_add_profile_fields.sql
-- Add missing fields for profile functionality

BEGIN;

-- Add phone and about columns to user_private table
ALTER TABLE public.user_private 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS about text;

COMMIT;
