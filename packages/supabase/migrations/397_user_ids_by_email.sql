-- 397: user ids for a set of emails, for the invites API (#1393)
--
-- POST /v1/invites skips anyone who already has an account. Email lives in
-- auth.users, which PostgREST does not expose, and the Admin Auth API has no
-- lookup by email short of paging through every user. Same shape and limits
-- as core.user_emails (393): definer, empty search_path, at most 200 inputs,
-- service role only. Matching is case-insensitive; inputs are compared after
-- lower(btrim()).

BEGIN;

CREATE OR REPLACE FUNCTION core.user_ids_by_email(p_emails text[])
 RETURNS TABLE (email text, user_id uuid)
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = ''
AS $function$
  SELECT lower(u.email::text), u.id
  FROM auth.users u
  WHERE lower(u.email::text) = ANY (
    SELECT lower(btrim(e)) FROM unnest(p_emails[1:200]) AS e
  );
$function$;

COMMENT ON FUNCTION core.user_ids_by_email(text[]) IS
  'User ids for up to 200 emails (case-insensitive), from auth.users. Service role only (#1393).';

REVOKE ALL ON FUNCTION core.user_ids_by_email(text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION core.user_ids_by_email(text[]) TO service_role;

COMMIT;
