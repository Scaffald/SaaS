-- 333_api_keys_key_prefix_check.sql
-- The POST /v1/api-keys handler stores key_prefix as "sk_<env>_<4 chars>"
-- (e.g. sk_test_a1b2) so the masked-display logic in the list/get/update handlers
-- (`${key.key_prefix}...`) shows a useful hint. But api_keys_key_prefix_check only
-- permitted exactly 'sk_test' / 'sk_live', so every key creation failed with a
-- check_violation (SQLSTATE 23514) → 500. API-key creation was broken in all envs.
--
-- Relax the constraint to the sk_(test|live)_ format the code actually produces.
-- key_prefix is display-only (lookups use key_hash), so this is safe.

BEGIN;

ALTER TABLE core.api_keys DROP CONSTRAINT IF EXISTS api_keys_key_prefix_check;
ALTER TABLE core.api_keys
  ADD CONSTRAINT api_keys_key_prefix_check CHECK (key_prefix ~ '^sk_(test|live)(_|$)');

COMMIT;
