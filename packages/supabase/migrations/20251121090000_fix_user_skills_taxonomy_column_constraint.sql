-- =========================================================
-- 20251121090000_fix_user_skills_taxonomy_column_constraint.sql
-- Fix column-level CHECK constraint on skill_taxonomy to allow 'soft_skills'
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- Drop and recreate column-level CHECK constraint on skill_taxonomy
-- ---------------------------------------------------------

-- Drop any existing column-level CHECK constraints on skill_taxonomy
-- Try dropping by the exact name from the error message first
ALTER TABLE core.user_skills DROP CONSTRAINT IF EXISTS user_skills_skill_taxonomy_check;

-- Also find and drop any other column-level CHECK constraints on skill_taxonomy
-- Column-level constraints have auto-generated names, so we need to find them
DO $$
DECLARE
  constraint_name TEXT;
  constraint_def TEXT;
  skill_taxonomy_attnum SMALLINT;
BEGIN
  -- Get the attribute number for skill_taxonomy column
  SELECT attnum INTO skill_taxonomy_attnum
  FROM pg_attribute
  WHERE attrelid = 'core.user_skills'::regclass
    AND attname = 'skill_taxonomy';

  -- Find ALL constraints that reference skill_taxonomy column and check for IN clause
  FOR constraint_name, constraint_def IN
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'core.user_skills'::regclass
      AND contype = 'c'
      AND skill_taxonomy_attnum = ANY(conkey)
      AND (pg_get_constraintdef(oid) LIKE '%IN%' OR pg_get_constraintdef(oid) LIKE '%skill_taxonomy%')
  LOOP
    -- Drop any constraint that restricts skill_taxonomy values
    BEGIN
      EXECUTE format('ALTER TABLE core.user_skills DROP CONSTRAINT %I', constraint_name);
      RAISE NOTICE 'Dropped constraint: %', constraint_name;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not drop constraint %: %', constraint_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Add new column-level CHECK constraint that includes 'soft_skills'
ALTER TABLE core.user_skills
  ADD CONSTRAINT user_skills_skill_taxonomy_check_column
  CHECK (skill_taxonomy IN ('csi', 'onet', 'soft_skills'));

COMMIT;

