-- =========================================================
-- 040_fix_get_skill_children_active.sql
-- Fix ambiguous 'active' column reference in get_skill_children function
-- =========================================================

begin;

-- Drop the existing function
drop function if exists public.get_skill_children(uuid);

-- Recreate the function with fixed column reference
create or replace function public.get_skill_children(
  p_parent_id uuid
)
returns table (
  skill_id uuid,
  skill_name text,
  csi_display text,
  csi_code text[],
  parent_id uuid,
  depth int,
  hierarchy_path text,
  active boolean,
  leaf_node boolean
)
language plpgsql
stable
security definer
as $$
begin
  return query
  with recursive skill_tree as (
    -- Start with direct children of parent
    select 
      s.id as skill_id,
      s.name as skill_name,
      s.csi_display,
      s.csi_code,
      s.parent_id,
      1 as depth,
      s.name as hierarchy_path,
      s.active,
      not exists (
        select 1 from public.skills children 
        where children.parent_id = s.id
      ) as leaf_node
    from public.skills s
    where s.parent_id = p_parent_id
      and s.active = true  -- Filter here at the source
    
    union all
    
    -- Recursively get children
    select
      s.id as skill_id,
      s.name as skill_name,
      s.csi_display,
      s.csi_code,
      s.parent_id,
      st.depth + 1 as depth,
      st.hierarchy_path || ' > ' || s.name as hierarchy_path,
      s.active,
      not exists (
        select 1 from public.skills children 
        where children.parent_id = s.id
      ) as leaf_node
    from public.skills s
    inner join skill_tree st on s.parent_id = st.skill_id
    where s.active = true  -- Filter here at the source
  )
  select 
    st.skill_id,
    st.skill_name,
    st.csi_display,
    st.csi_code,
    st.parent_id,
    st.depth,
    st.hierarchy_path,
    st.active,
    st.leaf_node
  from skill_tree st
  order by st.depth, st.skill_name;
end;
$$;

comment on function public.get_skill_children is 
  'Get all descendants of a parent skill with hierarchy information';

-- Grant permissions
grant execute on function public.get_skill_children to authenticated, anon;

commit;
