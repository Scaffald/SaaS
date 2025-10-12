-- 013_fix_profiles_triggers.sql
-- Ensures the profile verification trigger is properly attached to the profiles table

begin;

-- Ensure the profile verification trigger is attached to the profiles table
-- This was missed because the profiles table was created after the profile_verifications migration
do $$
begin
  if to_regclass('public.profiles') is not null then
    drop trigger if exists trg_profile_verifications_profiles on public.profiles;
    create trigger trg_profile_verifications_profiles
      after update on public.profiles
      for each row
      execute function public.tg_profile_verifications_profiles();
  end if;
end
$$;

-- Also ensure the updated_at trigger is working for profiles table
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at trigger to profiles table if it doesn't exist
do $$
begin
  if to_regclass('public.profiles') is not null then
    drop trigger if exists trg_profiles_updated_at on public.profiles;
    create trigger trg_profiles_updated_at
      before update on public.profiles
      for each row
      execute function public.handle_updated_at();
  end if;
end
$$;

commit;
