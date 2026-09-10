-- 352: grant service_role the eight core tables it cannot read.
--
-- `service_role` is the bypass-everything role, and edge-function code reaches
-- for the service client whenever it needs to read past RLS. These eight tables
-- are readable by `authenticated` (three also by `anon`) and not by
-- `service_role` at all, so that client gets a GRANT error — which fires before
-- RLS is even evaluated:
--
--   await createAdminClient().schema("core").from("soft_skills").select("*")
--   -> { code: "42501", message: "permission denied for table soft_skills" }
--
--   select c.relnamespace::regnamespace||'.'||c.relname
--   from pg_class c
--   where c.relkind='r'
--     and c.relnamespace::regnamespace::text in ('core','data','onet')
--     and has_table_privilege('authenticated', c.oid, 'SELECT')
--     and not has_table_privilege('service_role', c.oid, 'SELECT');
--
-- All eight have RLS enabled with policies already written, so this is the same
-- omission migrations 332 (api_keys) and 335 (scheduling) fixed: the policies
-- were authored, the table-level GRANTs beneath them were not. A policy cannot
-- widen access past an absent GRANT.
--
-- `core.soft_skills` is the clearest case — public reference data seeded by
-- migration 001, with a `soft_skills_public_read` policy for anon and
-- authenticated. There is no reason to withhold it from the service role. It is
-- also where this bit: GET /v1/profiles/:username resolves skill names from that
-- catalog, and had to read catalogs with the caller's client because the service
-- client could not (see `resolveSkillNames` in routes/profiles.ts, and #464).
--
-- This grants only service_role. anon and authenticated are left exactly as they
-- are, and every existing RLS policy still scopes their rows.

BEGIN;

GRANT ALL ON core.archetypes              TO service_role;
GRANT ALL ON core.assessment_sessions     TO service_role;
GRANT ALL ON core.ipip_share_tokens       TO service_role;
GRANT ALL ON core.personality_assessments TO service_role;
GRANT ALL ON core.portfolio_items         TO service_role;
GRANT ALL ON core.soft_skills             TO service_role;
GRANT ALL ON core.user_archetypes         TO service_role;
GRANT ALL ON core.user_assessment_xp      TO service_role;

COMMIT;
