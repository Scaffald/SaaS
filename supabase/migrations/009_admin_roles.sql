-- 009_admin_roles.sql
-- Adds platform super admins and organization-scoped partner admins,
-- helper role-checking function, and updates RLS policies for admin access.

begin;

-- Ensure core administrative roles exist.
insert into public.roles (scope, name, description)
select 'platform', 'super_admin', 'Platform-wide administrator with unrestricted access'
where not exists (
  select 1 from public.roles r where r.name = 'super_admin'
);

insert into public.roles (scope, name, description)
select 'organization', 'partner_admin', 'Partner administrator scoped to an organization'
where not exists (
  select 1 from public.roles r where r.name = 'partner_admin'
);

-- Helper function for policy checks.
create or replace function public.user_has_role(
  p_user_id uuid,
  p_role_name text,
  p_org_id uuid default null
) returns boolean
language sql stable
set search_path = public
as $$
  select exists (
    select 1
    from public.role_assignments ra
    join public.roles r on r.id = ra.role_id
    where ra.user_id = p_user_id
      and r.name = p_role_name
      and (
        r.scope = 'platform'
        or (
          r.scope = 'organization'
          and (
            (p_org_id is null and ra.scope_org_id is null)
            or ra.scope_org_id = p_org_id
          )
        )
        or (
          r.scope = 'team'
          and (
            (p_org_id is null and ra.scope_team_id is null)
            or ra.scope_team_id = p_org_id
          )
        )
      )
  );
$$;

-- Refresh views to align with updated policies and new columns.
drop view if exists public.v_user_search cascade;
drop view if exists public.v_user_private cascade;
create or replace view public.v_user_search as
select
  u.id,
  u.slug,
  u.username,
  u.display_name,
  u.headline,
  u.bio,
  u.industry_id,
  u.avatar_url,
  u.avatar_media_id,
  u.open_to_work,
  u.years_of_experience,
  u.skills_summary,
  u.created_at,
  u.updated_at
from public.users u;

create view public.v_user_private as
select
  u.id,
  up.email,
  up.phone,
  up.address,
  up.geo,
  up.contact_prefs,
  up.veteran,
  up.us_resident,
  up.us_passport,
  up.travel_mileage,
  up.education_level,
  up.hourly_rate_cents,
  up.location,
  up.open_to_travel,
  up.drivers_license_class,
  up.phone_os,
  up.availability,
  up.certifications,
  up.created_at,
  up.updated_at
from public.users u
join public.user_private up on up.user_id = u.id;

alter view public.v_user_search set (security_barrier = on);
alter view public.v_user_private set (security_barrier = on);

grant select on public.v_user_search to anon, authenticated;
grant select on public.v_user_private to authenticated;

-- Updated policies for public.users so admins can manage resumes.
drop policy if exists "user can update own resume" on public.users;
create policy "users and admins update resume"
  on public.users for update
  to authenticated
  using (
    auth.uid() = public.users.id
    or public.user_has_role(auth.uid(), 'super_admin', null)
    or exists (
      select 1
      from (
        select nullif(current_setting('app.org_id', true), '')::uuid as org_id
      ) ctx
      where ctx.org_id is not null
        and public.user_has_role(auth.uid(), 'partner_admin', ctx.org_id)
        and public.has_active_subscription(ctx.org_id)
        and exists (
          select 1
          from public.role_assignments target_ra
          where target_ra.user_id = public.users.id
            and target_ra.scope_org_id = ctx.org_id
        )
    )
  )
  with check (
    auth.uid() = public.users.id
    or public.user_has_role(auth.uid(), 'super_admin', null)
    or exists (
      select 1
      from (
        select nullif(current_setting('app.org_id', true), '')::uuid as org_id
      ) ctx
      where ctx.org_id is not null
        and public.user_has_role(auth.uid(), 'partner_admin', ctx.org_id)
        and public.has_active_subscription(ctx.org_id)
        and exists (
          select 1
          from public.role_assignments target_ra
          where target_ra.user_id = public.users.id
            and target_ra.scope_org_id = ctx.org_id
        )
    )
  );

-- Updated policies for public.user_private to include admin access.
drop policy if exists "org with active sub can see PII" on public.user_private;
create policy "admins can view member PII"
  on public.user_private for select
  to authenticated
  using (
    public.user_has_role(auth.uid(), 'super_admin', null)
    or exists (
      select 1
      from (
        select nullif(current_setting('app.org_id', true), '')::uuid as org_id
      ) ctx
      where ctx.org_id is not null
        and public.user_has_role(auth.uid(), 'partner_admin', ctx.org_id)
        and public.has_active_subscription(ctx.org_id)
        and exists (
          select 1
          from public.role_assignments target_ra
          where target_ra.user_id = public.user_private.user_id
            and target_ra.scope_org_id = ctx.org_id
        )
    )
  );

create policy "admins manage member PII"
  on public.user_private for update
  to authenticated
  using (
    public.user_has_role(auth.uid(), 'super_admin', null)
    or exists (
      select 1
      from (
        select nullif(current_setting('app.org_id', true), '')::uuid as org_id
      ) ctx
      where ctx.org_id is not null
        and public.user_has_role(auth.uid(), 'partner_admin', ctx.org_id)
        and public.has_active_subscription(ctx.org_id)
        and exists (
          select 1
          from public.role_assignments target_ra
          where target_ra.user_id = public.user_private.user_id
            and target_ra.scope_org_id = ctx.org_id
        )
    )
  )
  with check (
    public.user_has_role(auth.uid(), 'super_admin', null)
    or exists (
      select 1
      from (
        select nullif(current_setting('app.org_id', true), '')::uuid as org_id
      ) ctx
      where ctx.org_id is not null
        and public.user_has_role(auth.uid(), 'partner_admin', ctx.org_id)
        and public.has_active_subscription(ctx.org_id)
        and exists (
          select 1
          from public.role_assignments target_ra
          where target_ra.user_id = public.user_private.user_id
            and target_ra.scope_org_id = ctx.org_id
        )
    )
  );

create policy "admins insert member PII"
  on public.user_private for insert
  to authenticated
  with check (
    public.user_has_role(auth.uid(), 'super_admin', null)
    or exists (
      select 1
      from (
        select nullif(current_setting('app.org_id', true), '')::uuid as org_id
      ) ctx
      where ctx.org_id is not null
        and public.user_has_role(auth.uid(), 'partner_admin', ctx.org_id)
        and public.has_active_subscription(ctx.org_id)
        and exists (
          select 1
          from public.role_assignments target_ra
          where target_ra.user_id = public.user_private.user_id
            and target_ra.scope_org_id = ctx.org_id
        )
    )
  );

commit;
