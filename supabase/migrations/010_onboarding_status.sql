-- 010_onboarding_status.sql
-- Track when a user dismisses the onboarding flow.

begin;

alter table public.user_private
  add column if not exists onboarding_skipped_at timestamptz;

commit;
