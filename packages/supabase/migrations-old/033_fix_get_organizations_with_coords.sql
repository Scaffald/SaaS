-- =========================================================
-- 033_fix_get_organizations_with_coords.sql
-- Fix get_organizations_with_coords to accept optional JSON parameter
-- for PostgREST RPC compatibility
-- =========================================================

begin;

-- Drop the old function
drop function if exists public.get_organizations_with_coords();

-- Recreate with optional JSON parameter for PostgREST compatibility
create or replace function public.get_organizations_with_coords(params json default '{}'::json)
returns table (
  id uuid,
  name text,
  slug citext,
  longitude float8,
  latitude float8,
  address jsonb,
  employee_count_range text,
  industry_name text
)
language sql
security definer
set search_path = public
as $$
  select 
    o.id,
    o.name,
    o.slug,
    st_x(o.geo::geometry) as longitude,
    st_y(o.geo::geometry) as latitude,
    o.address,
    o.employee_count_range,
    i.name as industry_name
  from public.organizations o
  left join public.industries i on i.id = o.industry_id
  where o.visibility = 'public'
    and o.geo is not null
  limit 100;
$$;

-- Grant execute permission to authenticated and anon users
grant execute on function public.get_organizations_with_coords(json) to authenticated, anon;

commit;
