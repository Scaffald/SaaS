-- =========================================================
-- 008_remove_education_fields.sql
-- Remove unused fields from user_education table
-- =========================================================

BEGIN;

-- Remove GPA, honors, and activities columns from user_education
-- Note: is_verified was never actually in the database schema
ALTER TABLE private.user_education 
  DROP COLUMN IF EXISTS gpa,
  DROP COLUMN IF EXISTS honors,
  DROP COLUMN IF EXISTS activities;

COMMIT;
