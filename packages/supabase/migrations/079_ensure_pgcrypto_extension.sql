-- =========================================================
-- Ensure pgcrypto Extension is Enabled
-- Required for gen_salt() function used in seed data
-- =========================================================

-- Enable pgcrypto extension if not already enabled
create extension if not exists pgcrypto with schema extensions;

-- Verify the extension is available
do $$
begin
  if not exists (
    select 1 
    from pg_extension 
    where extname = 'pgcrypto'
  ) then
    raise exception 'pgcrypto extension could not be enabled';
  end if;
end $$;
