-- =========================================================
-- 375_drop_forsured_leftovers.sql
--
-- The forsured app was split out on 2026-03-13 (21a8dc12d); its migrations
-- live in migrations-archive-forsured/. What it left behind (#1150):
--
--   schema forsured        prod only: 11 tables, 6 functions with a mutable
--                          search_path (all 6 function_search_path_mutable
--                          lints), 1 duplicate index, 1 unindexed FK. 3 rows
--                          in total, all system/config — exported verbatim to
--                          #1150 before this ran.
--   public.auth_sessions   0 rows on every project
--   public.create_auth_session, get_auth_session, update_auth_session_tokens,
--   delete_auth_session, cleanup_expired_auth_sessions, is_vault_available,
--   get_encryption_key (returns a hardcoded key)
--                          only callers: _shared/auth/session.ts, used only by
--                          the auth-* edge functions, removed in the same PR and
--                          undeployed from dev (#1233); never deployed to prod.
--
-- Checked on prod before writing this: nothing outside `forsured` depends on
-- it (pg_depend, foreign keys, triggers, policies, function bodies, cron) —
-- only its own TOAST tables. CASCADE therefore stays inside the schema.
-- IF EXISTS throughout: the schema exists only on prod.
-- =========================================================

BEGIN;

DROP SCHEMA IF EXISTS forsured CASCADE;

DROP FUNCTION IF EXISTS public.create_auth_session(text, uuid, text, text, timestamptz, text, inet);
DROP FUNCTION IF EXISTS public.get_auth_session(uuid);
DROP FUNCTION IF EXISTS public.update_auth_session_tokens(uuid, text, text, timestamptz);
DROP FUNCTION IF EXISTS public.delete_auth_session(uuid);
DROP FUNCTION IF EXISTS public.cleanup_expired_auth_sessions();
DROP FUNCTION IF EXISTS public.get_encryption_key();
DROP FUNCTION IF EXISTS public.is_vault_available();

DROP TABLE IF EXISTS public.auth_sessions;

COMMIT;
