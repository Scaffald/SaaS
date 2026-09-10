-- 353: give the ten functions created after migration 308 an explicit search_path.
--
-- `308_function_search_path.sql` set a search_path on every owned function in
-- core/data/community/onet/public (Supabase advisor #172). Ten functions have
-- none, because migrations 314-325 created them *after* 308 ran, so they were
-- never covered — not by 308's original form and not by the version #442 fixed.
--
--   select n.nspname||'.'||p.proname
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname in ('core','data','community','onet','public')
--     and p.prokind = 'f'
--     and p.proowner = (select oid from pg_roles where rolname = current_user)
--     and not exists (
--       select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%'
--     );
--   -- 10 rows
--
-- Nine are trigger functions and one is core.tasks_handle_completion, so the
-- practical risk today is low. It is still worth closing: a function without an
-- explicit search_path resolves unqualified names against whatever the caller's
-- search_path happens to be, which is the shape of a search-path attack on any
-- function that later becomes SECURITY DEFINER.
--
-- Written as explicit ALTERs against real signatures rather than another
-- positional DO-sweep. A sweep is inherently one-shot — it covers what exists
-- when it runs and nothing after — which is exactly how these ten drifted out
-- of compliance silently in the first place. The durable half of the fix is not
-- here: it is scripts/check-function-search-path.mjs, which fails the build when
-- a migration adds a function without one.
--
-- Same value 308 uses: the function's own schema, then public, then extensions.

BEGIN;

ALTER FUNCTION community.get_skill_ancestors(p_skill_id uuid)
  SET search_path = community, public, extensions;

ALTER FUNCTION community.gift_karma(p_giver_id uuid, p_receiver_id uuid, p_amount integer, p_message text)
  SET search_path = community, public, extensions;

ALTER FUNCTION community.search_skill_taxonomy(p_query text, p_community_id uuid, p_limit integer)
  SET search_path = community, public, extensions;

ALTER FUNCTION community.set_updated_at()
  SET search_path = community, public, extensions;

ALTER FUNCTION community.update_community_member_count()
  SET search_path = community, public, extensions;

ALTER FUNCTION community.update_post_comment_count()
  SET search_path = community, public, extensions;

ALTER FUNCTION community.update_post_rating_stats()
  SET search_path = community, public, extensions;

ALTER FUNCTION community.update_scaffold_score(p_user_id uuid, p_delta integer, p_action community.reputation_action, p_reason text, p_source_type text, p_source_id uuid)
  SET search_path = community, public, extensions;

ALTER FUNCTION community.update_upvote_count()
  SET search_path = community, public, extensions;

ALTER FUNCTION core.tasks_handle_completion()
  SET search_path = core, public, extensions;

COMMIT;
