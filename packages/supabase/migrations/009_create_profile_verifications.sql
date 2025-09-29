-- 010_profile_verifications.sql
-- Adds profile verification audit log, helper functions, and triggers
-- that keep verification state in sync with profile mutations.

begin;

-- Reusable subject type enum so we can key records to multiple tables.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'profile_verification_subject') then
    create type public.profile_verification_subject as enum ('profile', 'user', 'user_private', 'project');
  end if;
end
$$;

create table if not exists public.profile_verifications (
  id uuid primary key default gen_random_uuid(),
  subject_type public.profile_verification_subject not null,
  subject_id uuid not null,
  field text not null,
  verified_by uuid not null references public.users(id) on delete restrict,
  verified_at timestamptz not null default now(),
  source text,
  notes text,
  revoked_at timestamptz,
  constraint profile_verifications_field_not_empty check (length(btrim(field)) > 0)
);

create index if not exists profile_verifications_subject_idx
  on public.profile_verifications(subject_type, subject_id);

create index if not exists profile_verifications_active_idx
  on public.profile_verifications(subject_type, subject_id, field)
  where revoked_at is null;

create index if not exists profile_verifications_verified_by_idx
  on public.profile_verifications(verified_by, verified_at);

-- Helpers used by verification/revocation routines for cascading effects.
create or replace function public.apply_profile_verification_effects(
  p_subject_type public.profile_verification_subject,
  p_subject_id uuid,
  p_field text,
  p_verified_at timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regclass('public.user_skills') is not null then
    if p_subject_type = 'user' and p_field = 'skills.list' then
      update public.user_skills
      set source = 'verified',
          last_verified_at = p_verified_at
      where user_id = p_subject_id;
    end if;
  end if;
end;
$$;

create or replace function public.apply_profile_revocation_effects(
  p_subject_type public.profile_verification_subject,
  p_subject_id uuid,
  p_fields text[],
  p_revoked_at timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if to_regclass('public.user_skills') is not null then
    if p_subject_type = 'user' and array_position(p_fields, 'skills.list') is not null then
      update public.user_skills
      set source = 'self',
          last_verified_at = null
      where user_id = p_subject_id;
    end if;
  end if;
end;
$$;

-- Verification entry point used by admins/partners.
create or replace function public.verify_profile_field(
  p_actor_id uuid,
  p_subject_type public.profile_verification_subject,
  p_subject_id uuid,
  p_field text,
  p_source text default null,
  p_notes text default null,
  p_verified_at timestamptz default null
) returns public.profile_verifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_field text := lower(trim(both from p_field));
  v_verified_at timestamptz := coalesce(p_verified_at, now());
  v_source text := nullif(trim(both from p_source), '');
  v_notes text := nullif(trim(both from p_notes), '');
  v_subject_user uuid;
  v_has_permission boolean := false;
  v_row public.profile_verifications;
begin
  if p_actor_id is null then
    raise exception 'actor_id is required';
  end if;

  if v_field is null or v_field = '' then
    raise exception 'field must not be empty';
  end if;

  if p_subject_type in ('user', 'profile', 'user_private') then
    v_subject_user := p_subject_id;
  elsif p_subject_type = 'project' then
    if to_regclass('public.projects') is not null then
      select profile_id into v_subject_user from public.projects where id = p_subject_id;
    end if;
  end if;

  v_has_permission := public.user_has_role(p_actor_id, 'super_admin', null);

  if not v_has_permission and v_subject_user is not null then
    v_has_permission := exists (
      select 1
      from public.role_assignments ra
      where ra.user_id = v_subject_user
        and ra.scope_org_id is not null
        and public.user_has_role(p_actor_id, 'partner_admin', ra.scope_org_id)
    );
  end if;

  if not v_has_permission then
    raise exception 'insufficient privileges to verify %', v_field
      using errcode = '42501';
  end if;

  update public.profile_verifications
     set revoked_at = v_verified_at
   where subject_type = p_subject_type
     and subject_id = p_subject_id
     and field = v_field
     and revoked_at is null;

  insert into public.profile_verifications (
    subject_type, subject_id, field, verified_by, verified_at, source, notes, revoked_at
  )
  values (
    p_subject_type, p_subject_id, v_field, p_actor_id, v_verified_at, v_source, v_notes, null
  )
  returning * into v_row;

  perform public.apply_profile_verification_effects(p_subject_type, p_subject_id, v_field, v_verified_at);

  return v_row;
end;
$$;

-- Revocation routine, shared by RPCs and triggers.
create or replace function public.revoke_profile_field(
  p_actor_id uuid,
  p_subject_type public.profile_verification_subject,
  p_subject_id uuid,
  p_field text,
  p_notes text default null,
  p_revoked_at timestamptz default null
) returns setof public.profile_verifications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_field text := lower(trim(both from p_field));
  v_revoked_at timestamptz := coalesce(p_revoked_at, now());
  v_notes text := nullif(trim(both from p_notes), '');
  v_subject_user uuid;
  v_has_permission boolean := false;
  v_rows public.profile_verifications[];
  v_row public.profile_verifications;
begin
  if v_field is null or v_field = '' then
    raise exception 'field must not be empty';
  end if;

  if p_actor_id is null then
    raise exception 'actor_id is required';
  end if;

  if p_subject_type in ('user', 'profile', 'user_private') then
    v_subject_user := p_subject_id;
  elsif p_subject_type = 'project' then
    if to_regclass('public.projects') is not null then
      select profile_id into v_subject_user from public.projects where id = p_subject_id;
    end if;
  end if;

  v_has_permission := public.user_has_role(p_actor_id, 'super_admin', null);

  if not v_has_permission and v_subject_user is not null then
    v_has_permission := exists (
      select 1
      from public.role_assignments ra
      where ra.user_id = v_subject_user
        and ra.scope_org_id is not null
        and public.user_has_role(p_actor_id, 'partner_admin', ra.scope_org_id)
    );
  end if;

  if not v_has_permission then
    raise exception 'insufficient privileges to revoke %', v_field
      using errcode = '42501';
  end if;

  with updated as (
    update public.profile_verifications pv
       set revoked_at = v_revoked_at,
           notes = case
             when v_notes is null then pv.notes
             when pv.notes is null then v_notes
             else pv.notes || E'\n' || v_notes
           end
     where pv.subject_type = p_subject_type
       and pv.subject_id = p_subject_id
       and pv.field = v_field
       and pv.revoked_at is null
     returning pv.*
  )
  select array_agg(updated) into v_rows from updated;

  if v_rows is null then
    return;
  end if;

  perform public.apply_profile_revocation_effects(p_subject_type, p_subject_id, array[v_field], v_revoked_at);

  foreach v_row in array v_rows loop
    return next v_row;
  end loop;

  return;
end;
$$;

create or replace function public.profile_verifications_revoke_fields(
  p_subject_type public.profile_verification_subject,
  p_subject_id uuid,
  p_fields text[],
  p_notes text default null,
  p_revoked_at timestamptz default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notes text := nullif(trim(both from p_notes), '');
  v_fields text[];
  v_revoked_at timestamptz := coalesce(p_revoked_at, now());
begin
  if p_fields is null then
    return;
  end if;

  v_fields := array(
    select lower(trim(both from value))
    from unnest(p_fields) as value
    where value is not null and length(trim(both from value)) > 0
  );

  if v_fields is null or array_length(v_fields, 1) is null then
    return;
  end if;

  update public.profile_verifications pv
     set revoked_at = v_revoked_at,
         notes = case
           when v_notes is null then pv.notes
           when pv.notes is null then v_notes
           else pv.notes || E'\n' || v_notes
         end
   where pv.subject_type = p_subject_type
     and pv.subject_id = p_subject_id
     and pv.field = any (v_fields)
     and pv.revoked_at is null;

  if found then
    perform public.apply_profile_revocation_effects(p_subject_type, p_subject_id, v_fields, v_revoked_at);
  end if;
end;
$$;

-- Trigger helpers that automatically clear verification rows when data changes.
create or replace function public.tg_profile_verifications_users()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_fields text[] := array[]::text[];
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if coalesce(new.display_name, '') is distinct from coalesce(old.display_name, '') then
    v_fields := array_append(v_fields, 'basic.display_name');
  end if;

  if coalesce(new.headline, '') is distinct from coalesce(old.headline, '') then
    v_fields := array_append(v_fields, 'basic.headline');
  end if;

  if coalesce(new.bio, '') is distinct from coalesce(old.bio, '') then
    v_fields := array_append(v_fields, 'basic.bio');
  end if;

  if coalesce(new.avatar_url, '') is distinct from coalesce(old.avatar_url, '') then
    v_fields := array_append(v_fields, 'basic.avatar');
  end if;

  if coalesce(new.industry_id::text, '') is distinct from coalesce(old.industry_id::text, '') then
    v_fields := array_append(v_fields, 'basic.industry');
  end if;

  if new.years_of_experience is distinct from old.years_of_experience then
    v_fields := array_append(v_fields, 'basic.experience');
  end if;

  if coalesce(new.skills_summary::text, '') is distinct from coalesce(old.skills_summary::text, '') then
    v_fields := array_append(v_fields, 'skills.summary');
  end if;

  if coalesce(new.open_to_work, false) is distinct from coalesce(old.open_to_work, false) then
    v_fields := array_append(v_fields, 'availability.open_to_work');
  end if;

  if array_length(v_fields, 1) is not null then
    perform public.profile_verifications_revoke_fields(
      'user',
      new.id,
      v_fields,
      'automatic revocation after public.users update'
    );
  end if;

  return new;
end;
$$;

create or replace function public.tg_profile_verifications_user_private()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_fields text[] := array[]::text[];
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if coalesce(new.email, '') is distinct from coalesce(old.email, '') then
    v_fields := array_append(v_fields, 'contact.email');
  end if;

  if coalesce(new.phone, '') is distinct from coalesce(old.phone, '') then
    v_fields := array_append(v_fields, 'contact.phone');
  end if;

  if coalesce(new.address::text, '') is distinct from coalesce(old.address::text, '') then
    v_fields := array_append(v_fields, 'contact.address');
  end if;

  if new.geo is distinct from old.geo then
    v_fields := array_append(v_fields, 'contact.geo');
  end if;

  if coalesce(new.contact_prefs::text, '') is distinct from coalesce(old.contact_prefs::text, '') then
    v_fields := array_append(v_fields, 'contact.preferences');
  end if;

  if coalesce(new.veteran, false) is distinct from coalesce(old.veteran, false) then
    v_fields := array_append(v_fields, 'background.veteran_status');
  end if;

  if coalesce(new.us_resident, false) is distinct from coalesce(old.us_resident, false) then
    v_fields := array_append(v_fields, 'background.us_resident');
  end if;

  if coalesce(new.us_passport, false) is distinct from coalesce(old.us_passport, false) then
    v_fields := array_append(v_fields, 'background.us_passport');
  end if;

  if new.travel_mileage is distinct from old.travel_mileage then
    v_fields := array_append(v_fields, 'background.travel_mileage');
  end if;

  if coalesce(new.education_level, '') is distinct from coalesce(old.education_level, '') then
    v_fields := array_append(v_fields, 'background.education');
  end if;

  if new.hourly_rate_cents is distinct from old.hourly_rate_cents then
    v_fields := array_append(v_fields, 'compensation.hourly_rate');
  end if;

  if coalesce(new.location, '') is distinct from coalesce(old.location, '') then
    v_fields := array_append(v_fields, 'contact.location');
  end if;

  if coalesce(new.open_to_travel, false) is distinct from coalesce(old.open_to_travel, false) then
    v_fields := array_append(v_fields, 'availability.open_to_travel');
  end if;

  if coalesce(new.drivers_license_class, '') is distinct from coalesce(old.drivers_license_class, '') then
    v_fields := array_append(v_fields, 'credentials.drivers_license');
  end if;

  if coalesce(new.phone_os, '') is distinct from coalesce(old.phone_os, '') then
    v_fields := array_append(v_fields, 'contact.phone_os');
  end if;

  if coalesce(new.availability::text, '') is distinct from coalesce(old.availability::text, '') then
    v_fields := array_append(v_fields, 'availability.schedule');
  end if;

  if coalesce(new.certifications::text, '') is distinct from coalesce(old.certifications::text, '') then
    v_fields := array_append(v_fields, 'credentials.certifications');
  end if;

  if array_length(v_fields, 1) is not null then
    perform public.profile_verifications_revoke_fields(
      'user_private',
      new.user_id,
      v_fields,
      'automatic revocation after public.user_private update'
    );
  end if;

  return new;
end;
$$;

create or replace function public.tg_profile_verifications_profiles()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_fields text[] := array[]::text[];
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if coalesce(new.name, '') is distinct from coalesce(old.name, '') then
    v_fields := array_append(v_fields, 'basic.full_name');
  end if;

  if coalesce(new.about, '') is distinct from coalesce(old.about, '') then
    v_fields := array_append(v_fields, 'basic.about');
  end if;

  if coalesce(new.avatar_path, '') is distinct from coalesce(old.avatar_path, '') then
    v_fields := array_append(v_fields, 'basic.avatar');
  end if;

  if array_length(v_fields, 1) is not null then
    perform public.profile_verifications_revoke_fields(
      'profile',
      new.id,
      v_fields,
      'automatic revocation after public.profiles update'
    );
  end if;

  return new;
end;
$$;

create or replace function public.tg_profile_verifications_projects()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_fields text[] := array[]::text[];
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;

  if coalesce(new.name, '') is distinct from coalesce(old.name, '') then
    v_fields := array_append(v_fields, 'projects.name');
  end if;

  if coalesce(new.description, '') is distinct from coalesce(old.description, '') then
    v_fields := array_append(v_fields, 'projects.description');
  end if;

  if coalesce(new.project_type, '') is distinct from coalesce(old.project_type, '') then
    v_fields := array_append(v_fields, 'projects.type');
  end if;

  if coalesce(new.paid_project, false) is distinct from coalesce(old.paid_project, false) then
    v_fields := array_append(v_fields, 'projects.paid');
  end if;

  if coalesce(new.street, '') is distinct from coalesce(old.street, '') then
    v_fields := array_append(v_fields, 'projects.location');
  end if;

  if coalesce(new.us_zip_code, '') is distinct from coalesce(old.us_zip_code, '') then
    v_fields := array_append(v_fields, 'projects.zip');
  end if;

  if new.number_of_days is distinct from old.number_of_days then
    v_fields := array_append(v_fields, 'projects.duration');
  end if;

  if array_length(v_fields, 1) is not null then
    perform public.profile_verifications_revoke_fields(
      'project',
      new.id,
      v_fields,
      'automatic revocation after public.projects update'
    );
  end if;

  return new;
end;
$$;

create or replace function public.tg_profile_verifications_user_skills()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if tg_op = 'DELETE' then
    v_user_id := old.user_id;
  else
    v_user_id := new.user_id;
  end if;

  if v_user_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  perform public.profile_verifications_revoke_fields(
    'user',
    v_user_id,
    array['skills.list'],
    'automatic revocation after public.user_skills change'
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Attach triggers where the related tables exist.
do $$
begin
  if to_regclass('public.users') is not null then
    drop trigger if exists trg_profile_verifications_users on public.users;
    create trigger trg_profile_verifications_users
      after update on public.users
      for each row
      execute function public.tg_profile_verifications_users();
  end if;

  if to_regclass('public.user_private') is not null then
    drop trigger if exists trg_profile_verifications_user_private on public.user_private;
    create trigger trg_profile_verifications_user_private
      after update on public.user_private
      for each row
      execute function public.tg_profile_verifications_user_private();
  end if;

  if to_regclass('public.profiles') is not null then
    drop trigger if exists trg_profile_verifications_profiles on public.profiles;
    create trigger trg_profile_verifications_profiles
      after update on public.profiles
      for each row
      execute function public.tg_profile_verifications_profiles();
  end if;

  if to_regclass('public.projects') is not null then
    drop trigger if exists trg_profile_verifications_projects on public.projects;
    create trigger trg_profile_verifications_projects
      after update on public.projects
      for each row
      execute function public.tg_profile_verifications_projects();
  end if;

  if to_regclass('public.user_skills') is not null then
    drop trigger if exists trg_profile_verifications_user_skills on public.user_skills;
    create trigger trg_profile_verifications_user_skills
      after insert or update or delete on public.user_skills
      for each row
      execute function public.tg_profile_verifications_user_skills();
  end if;
end;
$$;

commit;
