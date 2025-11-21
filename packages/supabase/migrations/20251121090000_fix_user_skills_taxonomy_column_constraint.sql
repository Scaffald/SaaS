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
-- We specifically look for constraints that ONLY check skill_taxonomy IN values (column-level)
-- and exclude table-level constraints that check multiple columns
DO $$
DECLARE
  constraint_name TEXT;
  constraint_def TEXT;
  skill_taxonomy_attnum SMALLINT;
  constraint_key_count INT;
BEGIN
  -- Get the attribute number for skill_taxonomy column
  SELECT attnum INTO skill_taxonomy_attnum
  FROM pg_attribute
  WHERE attrelid = 'core.user_skills'::regclass
    AND attname = 'skill_taxonomy';

  -- Find constraints that:
  -- 1. Are CHECK constraints
  -- 2. Reference ONLY the skill_taxonomy column (single column constraint = column-level)
  -- 3. Have a definition that matches the pattern of a column-level IN check
  FOR constraint_name, constraint_def, constraint_key_count IN
    SELECT 
      conname, 
      pg_get_constraintdef(oid),
      array_length(conkey, 1) as key_count
    FROM pg_constraint
    WHERE conrelid = 'core.user_skills'::regclass
      AND contype = 'c'
      AND skill_taxonomy_attnum = ANY(conkey)
      AND array_length(conkey, 1) = 1  -- Only single-column constraints (column-level)
      AND pg_get_constraintdef(oid) LIKE '%skill_taxonomy%IN%'
  LOOP
    -- Only drop if it's a simple IN check (column-level constraint)
    -- Exclude table-level constraints that check multiple conditions
    IF constraint_def ~ '^CHECK \(skill_taxonomy IN ' THEN
      BEGIN
        EXECUTE format('ALTER TABLE core.user_skills DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped column-level constraint: %', constraint_name;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Could not drop constraint %: %', constraint_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END $$;

-- Add new column-level CHECK constraint that includes 'soft_skills'
ALTER TABLE core.user_skills
  ADD CONSTRAINT user_skills_skill_taxonomy_check_column
  CHECK (skill_taxonomy IN ('csi', 'onet', 'soft_skills'));

-- Recreate the table-level constraint if it was accidentally dropped
-- This ensures the polymorphic relationship constraints are in place
ALTER TABLE core.user_skills
  DROP CONSTRAINT IF EXISTS user_skills_taxonomy_check;

ALTER TABLE core.user_skills
  ADD CONSTRAINT user_skills_taxonomy_check CHECK (
    (skill_taxonomy = 'csi' AND csi_skill_id IS NOT NULL AND onet_occupation_id IS NULL AND soft_skill_id IS NULL)
    OR (skill_taxonomy = 'onet' AND onet_occupation_id IS NOT NULL AND csi_skill_id IS NULL AND soft_skill_id IS NULL)
    OR (skill_taxonomy = 'soft_skills' AND soft_skill_id IS NOT NULL AND csi_skill_id IS NULL AND onet_occupation_id IS NULL)
  );

COMMIT;

