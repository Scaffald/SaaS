-- 348: make the role_assignments uniqueness constraint actually hold.
--
-- The table has carried
--
--   UNIQUE (role_id, user_id, scope_org_id, scope_team_id)
--
-- since it was created, and it has never once prevented a duplicate. In a
-- default UNIQUE constraint two NULLs are not equal to each other, so a row is
-- only ever compared against another row that has BOTH scope columns filled
-- in — and the table's own CHECK constraint guarantees that never happens:
--
--   CHECK ( (scope_org_id IS NULL AND scope_team_id IS NULL)      -- platform
--        OR (scope_org_id IS NOT NULL AND scope_team_id IS NULL)  -- org
--        OR (scope_org_id IS NULL AND scope_team_id IS NOT NULL) ) -- team
--
-- Every legal row has at least one NULL scope column, so every pair of rows
-- compares as distinct and the index waves all of them through. The constraint
-- is decoration.
--
-- Two consequences, both real:
--
--   1. Revoking a role by deleting "the" assignment leaves any duplicate
--      behind, and the user keeps the role. That is an authorization defect,
--      not just untidy data.
--   2. Any `.single()` read of role_assignments fails with PGRST116 once a
--      duplicate exists. This is how it surfaced: office-role-access.test.ts
--      went red against a local database holding 26 duplicated pairs.
--
-- Postgres 15 added NULLS NOT DISTINCT, which is exactly the semantics this
-- constraint always meant. The database is on 17.

BEGIN;

-- Collapse existing duplicates first, oldest row wins. `created_at` then `id`
-- so the choice is deterministic even for rows written in the same tick.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY role_id, user_id, scope_org_id, scope_team_id
      ORDER BY created_at, id
    ) AS rn
  FROM core.role_assignments
)
DELETE FROM core.role_assignments ra
USING ranked
WHERE ra.id = ranked.id
  AND ranked.rn > 1;

ALTER TABLE core.role_assignments
  DROP CONSTRAINT IF EXISTS role_assignments_role_id_user_id_scope_org_id_scope_team_id_key;

ALTER TABLE core.role_assignments
  ADD CONSTRAINT role_assignments_role_user_scope_key
  UNIQUE NULLS NOT DISTINCT (role_id, user_id, scope_org_id, scope_team_id);

COMMIT;
