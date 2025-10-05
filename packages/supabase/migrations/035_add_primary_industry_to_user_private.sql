-- =========================================================
-- 035_add_primary_industry_to_user_private.sql
-- Add primary_industry_id column to user_private table
-- =========================================================

begin;

-- Add primary_industry_id column to user_private table
alter table public.user_private
  add column if not exists primary_industry_id uuid references public.industries(id) on delete set null;

-- Create index for better query performance
create index if not exists user_private_primary_industry_idx 
  on public.user_private(primary_industry_id);

-- Add comment
comment on column public.user_private.primary_industry_id is 
  'User''s primary industry selection for skill management';

commit;
