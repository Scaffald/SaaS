-- =========================================================
-- 038_fix_skill_search_hierarchy_path.sql
-- Fix ambiguous column reference in search_skills_with_hierarchy function
-- =========================================================

begin;

-- Drop the existing function
drop function if exists public.search_skills_with_hierarchy(text, uuid, int);

-- Recreate the function with fixed ORDER BY clause
create or replace function public.search_skills_with_hierarchy(
  p_query text,
  p_industry_id uuid,
  p_limit int default 20
)
returns table (
  skill_id uuid,
  skill_name text,
  csi_display text,
  csi_code text[],
  parent_id uuid,
  hierarchy_path text,
  hierarchy_ids uuid[],
  depth int,
  active boolean
)
language plpgsql
stable
security definer
as $$
begin
  return query
  with recursive matching_skills as (
    -- Find skills matching the search query
    select 
      s.id,
      s.name,
      s.csi_display,
      s.csi_code,
      s.parent_id,
      s.active,
      -- Use trigram similarity for ranking
      similarity(s.name, p_query) as sim_score
    from public.skills s
    where 
      s.industry_id = p_industry_id
      and s.active = true
      and (
        s.name ilike '%' || p_query || '%'
        or similarity(s.name, p_query) > 0.3
      )
    order by 
      -- Prioritize exact matches, then similarity
      case when s.name ilike p_query || '%' then 0 else 1 end,
      sim_score desc,
      s.name
    limit p_limit
  ),
  skill_hierarchies as (
    -- Build hierarchy for each matching skill
    select 
      ms.id as base_skill_id,
      s.id as curr_skill_id,
      s.name as curr_skill_name,
      s.parent_id,
      0 as depth,
      s.name as hierarchy_path,
      array[s.id] as hierarchy_ids
    from matching_skills ms
    join public.skills s on s.id = ms.id
    
    union all
    
    -- Recursively get parent skills
    select
      sh.base_skill_id,
      s.id as curr_skill_id,
      s.name as curr_skill_name,
      s.parent_id,
      sh.depth + 1 as depth,
      s.name || ' > ' || sh.hierarchy_path as hierarchy_path,
      array_prepend(s.id, sh.hierarchy_ids) as hierarchy_ids
    from public.skills s
    inner join skill_hierarchies sh on s.id = sh.parent_id
  ),
  top_hierarchies as (
    -- Get the top-most hierarchy for each skill
    select distinct on (base_skill_id)
      base_skill_id,
      hierarchy_path,
      hierarchy_ids,
      depth
    from skill_hierarchies
    order by base_skill_id, depth desc
  )
  select 
    ms.id as skill_id,
    ms.name as skill_name,
    ms.csi_display,
    ms.csi_code,
    ms.parent_id,
    coalesce(th.hierarchy_path, ms.name) as hierarchy_path,
    coalesce(th.hierarchy_ids, array[ms.id]) as hierarchy_ids,
    coalesce(th.depth, 0) as depth,
    ms.active
  from matching_skills ms
  left join top_hierarchies th on th.base_skill_id = ms.id
  order by coalesce(th.depth, 0), coalesce(th.hierarchy_path, ms.name);
end;
$$;

comment on function public.search_skills_with_hierarchy is 
  'Search skills by query and industry, returning results with full hierarchical paths';

-- Grant permissions
grant execute on function public.search_skills_with_hierarchy to authenticated, anon;

commit;
