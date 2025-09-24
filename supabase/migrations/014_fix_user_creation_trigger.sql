-- 014_fix_user_creation_trigger.sql
-- Updates the handle_new_user function to also create a profile record

begin;

-- Update the handle_new_user function to create both users and profiles records
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  fallback_slug text;
begin
  fallback_slug := substr(md5(random()::text), 1, 12);
  
  -- Create users record
  insert into public.users (id, username, slug, display_name, created_at, updated_at)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), fallback_slug),
    coalesce(nullif(split_part(new.email, '@', 1), ''), fallback_slug),
    coalesce(new.raw_user_meta_data->>'name', fallback_slug),
    now(),
    now()
  )
  on conflict (id) do nothing;
  
  -- Create profiles record
  insert into public.profiles (id, name, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', fallback_slug),
    now(),
    now()
  )
  on conflict (id) do nothing;
  
  return new;
end;
$$;

commit;
