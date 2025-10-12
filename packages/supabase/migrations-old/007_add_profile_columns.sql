-- 004_onboarding_profile.sql
-- Adds preference columns required for the onboarding flow.

begin;

alter table public.user_private
  add column if not exists location text,
  add column if not exists open_to_travel boolean default false,
  add column if not exists drivers_license_class text,
  add column if not exists phone_os text,
  add column if not exists availability text[] default array[]::text[],
  add column if not exists certifications text[] default array[]::text[];

commit;
