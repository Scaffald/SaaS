-- =========================================================
-- 393: core.user_emails — one query for a page of users' emails (#1337)
-- =========================================================
-- _shared/user-emails.ts resolved emails with one Admin Auth API call per
-- user, all in parallel. GET /office/users asks for 50 users a page, so each
-- page fanned out into 50 requests through Kong to GoTrue. Locally that
-- exhausted Kong's 512 worker connections ("worker_connections are not
-- enough, reusing connections"): Kong reset connections, and *other* requests
-- in flight failed — their auth checks answered 401, their queries 500. It is
-- what made the shared edge runtime look "degraded" until restarted.
--
-- Email lives in auth.users, which PostgREST does not expose. This helper
-- reads it as its owner for a bounded list of ids. It is for the service role
-- only: emails are not something a signed-in user may look up by id.
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.user_emails(p_user_ids uuid[])
 RETURNS TABLE (user_id uuid, email text)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT u.id, u.email::text
  FROM auth.users u
  WHERE u.id = ANY (p_user_ids[1:200]);
$function$;

COMMENT ON FUNCTION core.user_emails(uuid[]) IS
  'Emails for up to 200 user ids, from auth.users. Service role only (#1337).';

REVOKE ALL ON FUNCTION core.user_emails(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION core.user_emails(uuid[]) TO service_role;

COMMIT;
