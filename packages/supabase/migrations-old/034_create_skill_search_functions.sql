-- =========================================================
-- 034_create_skill_search_functions.sql
-- Create functions for hierarchical skill search and retrieval
-- =========================================================

begin;

-- =========================================================
-- Function: Get skill with full hierarchical path
-- =========================================================

create or replace function public.get_skill_hierarchy(p_skill_id uuid)
returns table (
  skill_id uuid,
  skill_name text,
  parent_id uuid,
  csi_display text,
  depth int,
  hierarchy_path text,
  hierarchy_ids uuid[]
)
language plpgsql
stable
security definer
as $$
begin
  return query
  with recursive skill_tree as (
    -- Start with the target skill
    select 
      s.id as skill_id,
      s.name as skill_name,
      s.parent_id,
      s.csi_display,
      0 as depth,
      s.name as hierarchy_path,
      array[s.id] as hierarchy_ids
    from public.skills s
    where s.id = p_skill_id
    
    union all
    
    -- Recursively get parent skills
    select
      s.id as skill_id,
      s.name as skill_name,
      s.parent_id,
      s.csi_display,
      st.depth + 1 as depth,
      s.name || ' > ' || st.hierarchy_path as hierarchy_path,
      array_prepend(s.id, st.hierarchy_ids) as hierarchy_ids
    from public.skills s
    inner join skill_tree st on s.id = st.parent_id
  )
  select * from skill_tree
  order by depth desc
  limit 1;  -- Get the top-most result with full path
end;
$$;

comment on function public.get_skill_hierarchy is 
  'Get a skill with its full hierarchical path from root to the skill';

-- =========================================================
-- Function: Search skills with hierarchy by query and industry
-- =========================================================

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
  order by depth, hierarchy_path;
end;
$$;

comment on function public.search_skills_with_hierarchy is 
  'Search skills by query and industry, returning results with full hierarchical paths';

-- =========================================================
-- Function: Get user skills with implied parents
-- =========================================================

create or replace function public.get_user_skills_with_parents(p_user_id uuid)
returns table (
  skill_id uuid,
  skill_name text,
  csi_display text,
  proficiency smallint,
  years_experience int,
  source text,
  last_verified_at timestamptz,
  hierarchy_path text,
  hierarchy_ids uuid[],
  is_explicit boolean,  -- true if user added it, false if implied parent
  depth int
)
language plpgsql
stable
security definer
as $$
begin
  return query
  with recursive skill_tree as (
    -- Start with user's explicit skills
    select 
      s.id as skill_id,
      s.name as skill_name,
      s.csi_display,
      us.proficiency,
      0 as years_experience,
      us.source,
      us.last_verified_at,
      s.name as hierarchy_path,
      array[s.id] as hierarchy_ids,
      true as is_explicit,
      0 as depth,
      s.parent_id
    from public.user_skills us
    inner join public.skills s on s.id = us.skill_id
    where us.user_id = p_user_id
    
    union
    
    -- Recursively get parent skills (implied)
    select
      s.id as skill_id,
      s.name as skill_name,
      s.csi_display,
      null::smallint as proficiency,
      0 as years_experience,
      'implied'::text as source,
      null::timestamptz as last_verified_at,
      s.name || ' > ' || st.hierarchy_path as hierarchy_path,
      array_prepend(s.id, st.hierarchy_ids) as hierarchy_ids,
      false as is_explicit,
      st.depth + 1 as depth,
      s.parent_id
    from public.skills s
    inner join skill_tree st on s.id = st.parent_id
    where st.parent_id is not null  -- Only continue if there's a parent
  )
  select 
    st.skill_id,
    st.skill_name,
    st.csi_display,
    st.proficiency,
    st.years_experience,
    st.source,
    st.last_verified_at,
    st.hierarchy_path,
    st.hierarchy_ids,
    st.is_explicit,
    st.depth
  from skill_tree st
  order by st.depth desc, st.hierarchy_path;
end;
$$;

comment on function public.get_user_skills_with_parents is 
  'Get all user skills including implied parent skills based on hierarchy';

-- =========================================================
-- Function: Get skill details for display
-- =========================================================

create or replace function public.get_skill_details(p_skill_id uuid)
returns table (
  skill_id uuid,
  skill_name text,
  csi_display text,
  csi_code text[],
  parent_id uuid,
  industry_id uuid,
  industry_name text,
  hierarchy_path text,
  hierarchy_ids uuid[],
  active boolean,
  created_at timestamptz
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
    s.parent_id,
    s.industry_id,
    i.name as industry_name,
    h.hierarchy_path,
    h.hierarchy_ids,
    s.active,
    s.created_at
  from public.skills s
  left join public.industries i on i.id = s.industry_id
  left join lateral (
    select * from public.get_skill_hierarchy(s.id)
  ) h on true
  where s.id = p_skill_id;
end;
$$;

comment on function public.get_skill_details is 
  'Get detailed information about a skill including its hierarchy';

-- =========================================================
-- Grant permissions
-- =========================================================

grant execute on function public.get_skill_hierarchy to authenticated, anon;
grant execute on function public.search_skills_with_hierarchy to authenticated, anon;
grant execute on function public.get_user_skills_with_parents to authenticated;
grant execute on function public.get_skill_details to authenticated, anon;

commit;
