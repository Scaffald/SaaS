-- =========================================================
-- 029_add_org_coords_function.sql
-- Add helper function to get organizations with coordinates
-- extracted from PostGIS geography type
-- =========================================================

begin;

-- Create function to get organizations with extracted coordinates
create or replace function public.get_organizations_with_coords()
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
grant execute on function public.get_organizations_with_coords() to authenticated, anon;

commit;
