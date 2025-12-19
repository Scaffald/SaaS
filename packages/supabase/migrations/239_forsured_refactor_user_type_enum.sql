-- Migration: 239_forsured_refactor_user_type_enum.sql
-- REQ-4: Refactor user type enum from 'gc' to 'manager'
-- TASK-11: Update database enum values for generic terminology
--
-- Changes 'gc' to 'manager' in the user_profiles table to support
-- multi-industry terminology (General Contractor vs Property Manager)

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE forsured.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;

-- Step 2: Update existing 'gc' records to 'manager'
UPDATE forsured.user_profiles
SET user_type = 'manager'
WHERE user_type = 'gc';

-- Step 3: Add new CHECK constraint with updated values
-- Note: 'contractor' stays the same as it's already generic enough
ALTER TABLE forsured.user_profiles
ADD CONSTRAINT user_profiles_user_type_check
CHECK (user_type IN ('manager', 'contractor', 'broker', 'admin'));

-- Step 4: Update the seed data migration reference
-- (This is informational - the seed migration 238 references 'gc'/'contractor'
--  for user_set_type assignment, but those records are already migrated above)

COMMENT ON TABLE forsured.user_profiles IS
  'User profiles for Forsured. user_type: manager (was gc), contractor, broker, admin';
