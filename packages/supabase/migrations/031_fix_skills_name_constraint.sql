-- =========================================================
-- 031_fix_skills_name_constraint.sql
-- Removes unique constraint on skills.name since skills can have
-- the same name across different industries or contexts.
-- For CSI skills, csi_code_key provides uniqueness.
-- =========================================================

begin;

-- Drop the unique constraint on name
alter table public.skills
  drop constraint if exists skills_name_key;

-- Add a composite unique constraint on (industry_id, name) instead
-- This allows the same skill name in different industries
-- For CSI skills, csi_code_key already provides uniqueness
do $$ begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'skills_industry_name_unique'
  ) then
    alter table public.skills
      add constraint skills_industry_name_unique 
      unique (industry_id, name);
  end if;
end $$;

commit;
