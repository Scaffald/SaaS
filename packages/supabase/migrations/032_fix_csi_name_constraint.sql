-- =========================================================
-- 032_fix_csi_name_constraint.sql
-- Removes the unique constraint on (industry_id, name) since
-- CSI skills can have duplicate names at different hierarchy levels.
-- The csi_code_key provides uniqueness for CSI skills.
-- =========================================================

begin;

-- Drop the composite unique constraint
alter table public.skills
  drop constraint if exists skills_industry_name_unique;

-- For CSI skills, csi_code_key already provides uniqueness
-- For non-CSI skills, we'll rely on application logic to prevent duplicates
-- or add a partial unique index if needed in the future

commit;
