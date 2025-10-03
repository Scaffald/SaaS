-- =========================================================
-- 030_add_csi_skill_columns.sql
-- Adds CSI-specific columns to skills table for construction industry
-- CSI (Construction Specifications Institute) MasterFormat codes
-- =========================================================

begin;

-- =========================================================
-- Add CSI-specific columns to skills table
-- =========================================================

-- Add columns (nullable as only construction industry uses CSI)
alter table public.skills
  add column if not exists csi_code text[],           -- ['03','11','13','16']
  add column if not exists csi_code_key text,         -- '03-11-13-16' (unique key)
  add column if not exists csi_display text,          -- '03 11 13.16' (human readable)
  add column if not exists csi_depth smallint;        -- 1-4 (hierarchy level)

-- =========================================================
-- Add constraints
-- =========================================================

-- Unique constraint on csi_code_key
do $$ begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'skills_csi_code_key_unique'
  ) then
    alter table public.skills
      add constraint skills_csi_code_key_unique unique (csi_code_key);
  end if;
end $$;

-- Ensure CSI code array always has exactly 4 elements
do $$ begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'skills_csi_code_length'
  ) then
    alter table public.skills
      add constraint skills_csi_code_length 
      check (csi_code is null or array_length(csi_code, 1) = 4);
  end if;
end $$;

-- Ensure CSI depth is between 1 and 4
do $$ begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'skills_csi_depth_range'
  ) then
    alter table public.skills
      add constraint skills_csi_depth_range
      check (csi_depth is null or (csi_depth >= 1 and csi_depth <= 4));
  end if;
end $$;

-- =========================================================
-- Add indexes for better query performance
-- =========================================================

-- GIN index for array containment queries
create index if not exists skills_csi_code_gin_idx 
  on public.skills using gin(csi_code);

-- Index on csi_code_key for faster lookups
create index if not exists skills_csi_code_key_idx 
  on public.skills(csi_code_key) 
  where csi_code_key is not null;

-- Index on depth for hierarchy queries
create index if not exists skills_csi_depth_idx 
  on public.skills(csi_depth) 
  where csi_depth is not null;

-- =========================================================
-- Trigger to enforce CSI business rules
-- =========================================================

create or replace function public.check_csi_skill_rules()
returns trigger
language plpgsql
as $$
declare
  construction_industry_id uuid;
begin
  -- Only validate if CSI code is present
  if new.csi_code is not null then
    
    -- Get construction industry ID
    select id into construction_industry_id
    from public.industries
    where slug = 'construction';
    
    -- Ensure CSI skills are only for construction industry
    if new.industry_id is null or new.industry_id != construction_industry_id then
      raise exception 'CSI codes can only be used with the construction industry';
    end if;
    
    -- If parent exists, ensure it's also in construction industry
    if new.parent_id is not null then
      if new.industry_id is distinct from (
        select industry_id from public.skills where id = new.parent_id
      ) then
        raise exception 'CSI skill parent must be in the same industry';
      end if;
    end if;
    
    -- Auto-generate csi_code_key if not provided
    if new.csi_code_key is null then
      new.csi_code_key := array_to_string(new.csi_code, '-');
    end if;
    
    -- Auto-generate csi_display if not provided
    if new.csi_display is null then
      -- Format: "03 11 13.16" (spaces between first 3, dot before last)
      new.csi_display := new.csi_code[1] || ' ' || 
                        new.csi_code[2] || ' ' || 
                        new.csi_code[3] || '.' || 
                        new.csi_code[4];
    end if;
    
    -- Auto-calculate depth if not provided
    if new.csi_depth is null then
      -- Count non-zero segments
      new.csi_depth := (
        case when new.csi_code[4] != '00' then 4
             when new.csi_code[3] != '00' then 3
             when new.csi_code[2] != '00' then 2
             else 1
        end
      )::smallint;
    end if;
  end if;
  
  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists trg_check_csi_skill_rules on public.skills;

-- Create trigger
create trigger trg_check_csi_skill_rules
  before insert or update on public.skills
  for each row
  execute function public.check_csi_skill_rules();

-- =========================================================
-- Helper function to search CSI skills by code
-- =========================================================

create or replace function public.find_csi_skill_by_code(
  code_array text[]
)
returns uuid
language sql
stable
as $$
  select id
  from public.skills
  where csi_code = code_array
  limit 1;
$$;

comment on function public.find_csi_skill_by_code is 
  'Find a CSI skill by its 4-element code array';

commit;
