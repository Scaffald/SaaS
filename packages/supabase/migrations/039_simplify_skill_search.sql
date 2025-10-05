-- =========================================================
-- 039_simplify_skill_search.sql
-- Simplify skill search with cascading selection approach
-- =========================================================

begin;

-- =========================================================
-- Drop problematic function (if it still exists)
-- =========================================================

drop function if exists public.search_skills_with_hierarchy(text, uuid, int);

-- =========================================================
-- Function: Search parent (top-level) skills only
-- =========================================================

create or replace function public.search_parent_skills(
  p_query text,
  p_industry_id uuid,
  p_limit int default 20
)
returns table (
  skill_id uuid,
  skill_name text,
  csi_display text,
  csi_code text[],
  active boolean,
  child_count bigint
)
language plpgsql
stable
security definer
as $$
begin
  return query
  select 
    s.id as skill_id,
    s.name as skill_name,
    s.csi_display,
    s.csi_code,
    s.active,
    (
      select count(*)
      from public.skills children
      where children.parent_id = s.id
    ) as child_count
  from public.skills s
  where 
    s.industry_id = p_industry_id
    and s.parent_id is null  -- top level only
    and s.active = true
    and s.name ilike '%' || p_query || '%'
  order by 
    -- Prioritize exact matches
    case when s.name ilike p_query || '%' then 0 else 1 end,
    s.name
  limit p_limit;
end;
$$;

comment on function public.search_parent_skills is 
  'Search top-level (parent) skills by query and industry';

-- =========================================================
-- Function: Get all children of a skill (recursive)
-- =========================================================

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
  )
  select * from skill_tree
  where active = true
  order by depth, skill_name;
end;
$$;

comment on function public.get_skill_children is 
  'Get all descendants of a parent skill with hierarchy information';

-- =========================================================
-- Function: Get parent skill info
-- =========================================================

create or replace function public.get_parent_skill_info(
  p_skill_id uuid
)
returns table (
  skill_id uuid,
  skill_name text,
  csi_display text,
  csi_code text[],
  industry_id uuid,
  industry_name text,
  active boolean,
  child_count bigint
)
language plpgsql
stable
security definer
as $$
begin
  return query
  select 
    s.id as skill_id,
    s.name as skill_name,
    s.csi_display,
    s.csi_code,
    s.industry_id,
    i.name as industry_name,
    s.active,
    (
      select count(*)
      from public.skills children
      where children.parent_id = s.id
    ) as child_count
  from public.skills s
  left join public.industries i on i.id = s.industry_id
  where s.id = p_skill_id;
end;
$$;

comment on function public.get_parent_skill_info is 
  'Get detailed information about a parent skill';

-- =========================================================
-- Grant permissions
-- =========================================================

grant execute on function public.search_parent_skills to authenticated, anon;
grant execute on function public.get_skill_children to authenticated, anon;
grant execute on function public.get_parent_skill_info to authenticated, anon;

commit;
