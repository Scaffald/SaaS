-- 015_update_signup_requirements.sql
-- Adds required PII columns for onboarding metadata and updates the handle_new_user trigger
-- to hydrate the related tables with registration details.

begin;

-- Ensure new PII columns exist for storing registration names.
alter table public.user_private
  add column if not exists first_name text,
  add column if not exists last_name text;

-- Refresh the private profile view with the additional columns.
-- Drop the view first to avoid column name conflicts
drop view if exists public.v_user_private cascade;
create view public.v_user_private as
select
  u.id,
  up.email,
  up.phone,
  up.first_name,
  up.last_name,
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

alter view public.v_user_private set (security_barrier = on);

grant select on public.v_user_private to authenticated;

-- Update the trigger function that seeds profile tables when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  fallback_slug text;
  first_name text;
  last_name text;
  full_name text;
  phone text;
  industry_uuid uuid;
begin
  fallback_slug := substr(md5(random()::text), 1, 12);

  first_name := nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), '');
  last_name := nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), '');
  phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');

  -- Build a full name fallback chain.
  full_name := coalesce(
    nullif(trim(concat_ws(' ', first_name, last_name)), ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    fallback_slug
  );

  -- Safely cast the industry identifier if provided.
  begin
    industry_uuid := nullif(new.raw_user_meta_data->>'industry_id', '')::uuid;
  exception when others then
    industry_uuid := null;
  end;

  insert into public.users (id, username, slug, display_name, industry_id, created_at, updated_at)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), fallback_slug),
    coalesce(nullif(split_part(new.email, '@', 1), ''), fallback_slug),
    full_name,
    industry_uuid,
    now(),
    now()
  )
  on conflict (id) do update
    set
      display_name = excluded.display_name,
      industry_id = excluded.industry_id,
      updated_at = now();

  insert into public.profiles (id, name, created_at, updated_at)
  values (
    new.id,
    full_name,
    now(),
    now()
  )
  on conflict (id) do update
    set
      name = excluded.name,
      updated_at = now();

  insert into public.user_private (user_id, email, phone, first_name, last_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    phone,
    first_name,
    last_name,
    now(),
    now()
  )
  on conflict (user_id) do update
    set
      email = excluded.email,
      phone = excluded.phone,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      updated_at = now();

  return new;
end;
$$;

commit;
