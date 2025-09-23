-- =========================================================
-- 006_create_org_workflow.sql
-- Adds organization metadata fields, membership views, and
-- helper functions to support the Create Organization flow.
-- =========================================================

begin;

-- ----------------------------------------------
-- Extend organization profile metadata
-- ----------------------------------------------
alter table public.organizations
  add column if not exists website_url text,
  add column if not exists employee_count_range text,
  add column if not exists annual_revenue_range text,
  add column if not exists description text;

-- ----------------------------------------------
-- Ensure role catalog supports organization RBAC
-- ----------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'roles_scope_name_key'
      and conrelid = 'public.roles'::regclass
  ) then
    alter table public.roles add constraint roles_scope_name_key unique (scope, name);
  end if;
end
$$;

insert into public.roles (scope, name, description)
values
  ('organization', 'admin', 'Full administrative access to manage organization settings and members.'),
  ('organization', 'manager', 'Manage teams, projects, and members within an organization.'),
  ('organization', 'member', 'Collaborate with the organization and access shared resources.')
on conflict (scope, name)
  do update set description = excluded.description;

create index if not exists role_assignments_scope_org_idx
  on public.role_assignments(scope_org_id);
create index if not exists role_assignments_user_idx
  on public.role_assignments(user_id);

alter table public.role_assignments enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'role_assignments'
      and policyname = 'role_assignments_select_visible'
  ) then
    create policy "role_assignments_select_visible"
      on public.role_assignments
      for select
      to authenticated
      using (
        user_id = auth.uid()
        or exists (
          select 1
          from public.role_assignments ra
          join public.roles r on r.id = ra.role_id
          where ra.user_id = auth.uid()
            and ra.scope_org_id = public.role_assignments.scope_org_id
            and r.scope = 'organization'
            and r.name in ('admin', 'manager')
        )
        or exists (
          select 1
          from public.organizations o
          where o.id = public.role_assignments.scope_org_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'role_assignments'
      and policyname = 'role_assignments_insert_admins'
  ) then
    create policy "role_assignments_insert_admins"
      on public.role_assignments
      for insert
      to authenticated
      with check (
        exists (
          select 1
          from public.role_assignments ra
          join public.roles r on r.id = ra.role_id
          where ra.user_id = auth.uid()
            and ra.scope_org_id = public.role_assignments.scope_org_id
            and r.scope = 'organization'
            and r.name = 'admin'
        )
        or exists (
          select 1
          from public.organizations o
          where o.id = public.role_assignments.scope_org_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'role_assignments'
      and policyname = 'role_assignments_delete_admins'
  ) then
    create policy "role_assignments_delete_admins"
      on public.role_assignments
      for delete
      to authenticated
      using (
        exists (
          select 1
          from public.role_assignments ra
          join public.roles r on r.id = ra.role_id
          where ra.user_id = auth.uid()
            and ra.scope_org_id = public.role_assignments.scope_org_id
            and r.scope = 'organization'
            and r.name = 'admin'
        )
        or exists (
          select 1
          from public.organizations o
          where o.id = public.role_assignments.scope_org_id
            and o.owner_user_id = auth.uid()
        )
      );
  end if;
end
$$;

-- ----------------------------------------------
-- Organization membership view for app queries
-- ----------------------------------------------
create or replace view public.v_organization_memberships as
select
  ra.id as assignment_id,
  ra.user_id,
  ra.scope_org_id as organization_id,
  o.name as organization_name,
  o.slug::text as organization_slug,
  o.website_url,
  o.employee_count_range,
  o.annual_revenue_range,
  o.description as organization_description,
  o.address,
  o.industry_id,
  o.owner_user_id,
  o.visibility,
  o.created_at as organization_created_at,
  o.updated_at as organization_updated_at,
  r.id as role_id,
  r.name as role_name,
  (r.name in ('admin', 'manager')) as is_admin,
  (o.owner_user_id = ra.user_id) as is_owner
from public.role_assignments ra
join public.roles r on r.id = ra.role_id
join public.organizations o on o.id = ra.scope_org_id
where r.scope = 'organization';

alter view public.v_organization_memberships set (security_barrier = on);

grant select on public.v_organization_memberships to authenticated;

-- ----------------------------------------------
-- Helper to create an organization + admin role
-- ----------------------------------------------
create or replace function public.create_organization(
  p_name text,
  p_slug text default null,
  p_website_url text default null,
  p_industry_id uuid default null,
  p_employee_count_range text default null,
  p_annual_revenue_range text default null,
  p_description text default null,
  p_address jsonb default null,
  p_visibility text default 'public'
) returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_base_slug text;
  v_slug text;
  v_suffix integer := 0;
  v_org public.organizations%rowtype;
  v_admin_role uuid;
  v_clean_address jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'Organization name is required';
  end if;

  if p_visibility is not null and p_visibility not in ('public', 'private') then
    raise exception 'Visibility must be public or private';
  end if;

  v_base_slug := lower(trim(p_slug));

  if v_base_slug is not null and v_base_slug <> '' then
    v_base_slug := regexp_replace(v_base_slug, '[^a-z0-9]+', '-', 'g');
    v_base_slug := regexp_replace(v_base_slug, '(^-|-$)', '', 'g');
  end if;

  v_base_slug := coalesce(
    nullif(v_base_slug, ''),
    lower(regexp_replace(trim(p_name), '[^a-z0-9]+', '-', 'g'))
  );

  if v_base_slug is null or v_base_slug = '' then
    v_base_slug := substr(md5(random()::text), 1, 8);
  end if;

  v_slug := v_base_slug;
  while exists (select 1 from public.organizations where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := format('%s-%s', v_base_slug, v_suffix);
  end loop;

  if p_address is not null then
    if coalesce(trim(p_address->>'street'), '') = ''
       and coalesce(trim(p_address->>'zipCode'), '') = '' then
      v_clean_address := null;
    else
      v_clean_address := jsonb_build_object(
        'street', trim(p_address->>'street'),
        'zipCode', trim(p_address->>'zipCode')
      );
    end if;
  end if;

  insert into public.organizations (
    owner_user_id,
    name,
    slug,
    industry_id,
    website_url,
    employee_count_range,
    annual_revenue_range,
    description,
    address,
    visibility
  )
  values (
    v_user_id,
    trim(p_name),
    v_slug,
    p_industry_id,
    nullif(trim(p_website_url), ''),
    nullif(trim(p_employee_count_range), ''),
    nullif(trim(p_annual_revenue_range), ''),
    nullif(trim(p_description), ''),
    coalesce(v_clean_address, null),
    coalesce(p_visibility, 'public')
  )
  returning * into v_org;

  select id
  into v_admin_role
  from public.roles
  where scope = 'organization'
    and name = 'admin'
  limit 1;

  if v_admin_role is null then
    raise exception 'Organization admin role is not configured';
  end if;

  insert into public.role_assignments (role_id, user_id, scope_org_id)
  values (v_admin_role, v_user_id, v_org.id)
  on conflict do nothing;

  return v_org;
end;
$$;

grant execute on function public.create_organization(
  text,
  text,
  text,
  uuid,
  text,
  text,
  text,
  jsonb,
  text
) to authenticated;

commit;
