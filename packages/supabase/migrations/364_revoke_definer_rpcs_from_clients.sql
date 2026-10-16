-- =========================================================
-- 364_revoke_definer_rpcs_from_clients.sql
--
-- Thirteen SECURITY DEFINER functions in exposed schemas could be called by
-- `anon` and `authenticated` through PostgREST (`/rest/v1/rpc/...`). They run
-- with their owner's rights and none checks the caller, so an anonymous
-- request could (#1143):
--
--   core.get_secret_value          read any Vault secret by id
--   core.rotate_stripe_secret      write a Vault secret
--   core.configure_stripe_server   point the Stripe FDW at that secret
--   core.refresh_stripe_schema     DROP SCHEMA stripe CASCADE and re-import
--   core.generate_oauth_token      mint token metadata for any app and user
--   core.revoke_oauth_app_tokens   revoke every token of any OAuth app
--   public.get_pending_webhook_deliveries   read webhook secrets and bodies
--   public.get_webhooks_for_event           read any org's webhook secrets
--   public.*_auth_session (4), public.get_encryption_key
--                                  the archived forsured session store and its
--                                  hardcoded key (dropped outright in #1150)
--
-- Measured on all three remotes and local before this migration:
--   has_function_privilege('anon', oid, 'execute') = true for every one.
--
-- Every live caller is the `api` function's service-role client
-- (`supabaseAdmin` / `getServiceClient()`), and pg_cron runs as `postgres`, so
-- nothing legitimate loses access. Revoking from `anon` alone would not be
-- enough: Postgres grants EXECUTE to PUBLIC when a function is created.
--
-- Test: packages/supabase/tests/routers/db-access-hardening-rest.test.ts
-- =========================================================

BEGIN;

DO $$
DECLARE
  fn regprocedure;
BEGIN
  FOREACH fn IN ARRAY ARRAY[
    'core.get_secret_value(uuid)',
    'core.rotate_stripe_secret(text,text)',
    'core.configure_stripe_server(uuid,text)',
    'core.refresh_stripe_schema()',
    'core.generate_oauth_token(uuid,uuid,text[])',
    'core.revoke_oauth_app_tokens(uuid)',
    'public.get_pending_webhook_deliveries()',
    'public.get_webhooks_for_event(uuid,text)',
    'public.create_auth_session(text,uuid,text,text,timestamptz,text,inet)',
    'public.get_auth_session(uuid)',
    'public.update_auth_session_tokens(uuid,text,text,timestamptz)',
    'public.delete_auth_session(uuid)',
    'public.get_encryption_key()'
  ]::regprocedure[]
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END
$$;

COMMIT;
