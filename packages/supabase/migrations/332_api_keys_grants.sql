-- 332_api_keys_grants.sql
-- core.api_keys has RLS enabled with policies for service_role (api_keys_service_role_all)
-- and org members (api_keys_{insert,update,delete}_org_member, api_keys_select_own_org),
-- but the table was missing the underlying table-level GRANTs for those roles. Every
-- access therefore failed with "permission denied for table api_keys" — a GRANT error
-- that fires before RLS is even evaluated. This broke API-key management (the edge
-- function uses service_role) and the REST api-key tests.
--
-- Grant the privileges the existing policies assume. RLS still scopes the rows.
--
-- core.api_key_usage has the same gap: migration 222 enabled RLS + policies
-- (api_key_usage_select_own_org, api_key_usage_service_role_all) but no grants.
-- The usage tracker inserts via service_role and GET /v1/api-keys/:id/usage reads
-- as an authenticated org member, so both 500'd on "permission denied" too.

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE ON core.api_keys TO authenticated;
GRANT ALL ON core.api_keys TO service_role;

GRANT SELECT ON core.api_key_usage TO authenticated;
GRANT ALL ON core.api_key_usage TO service_role;

COMMIT;
