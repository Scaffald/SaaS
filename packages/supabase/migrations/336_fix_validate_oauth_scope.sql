-- =========================================================
-- SUPERSEDED BY 338_oauth_scope_real_authorization.sql (issue #428).
--
-- This migration was never applied to production — the deployed function still
-- carried migration 220's broken join, so /authorize 403'd on every request
-- rather than rubber-stamping. Do NOT apply this file on its own: the function
-- body below authorizes any scope with empty rbac_permissions, and every scope
-- in the catalog had exactly that, so running it alone reintroduces the
-- authorization bypass 338 closes. Replaying the chain in numeric order is
-- safe, because 338 lands afterwards.
-- =========================================================

-- =========================================================
-- 336_fix_validate_oauth_scope.sql
-- Repair core.validate_oauth_scope: the original (migration 220) joins
-- core.role_permissions and core.permissions, which never existed in this
-- schema (team management created team_role_permissions instead). Every call
-- errored with `relation "core.role_permissions" does not exist`, breaking the
-- OAuth /authorize scope check for all requests.
--
-- The oauth_scopes catalog currently carries empty rbac_permissions for every
-- scope, so the intended model is "any requested scope present in the catalog
-- is authorized." This rewrite drops the dead join and honours rbac_permissions
-- when a future migration populates it (a non-empty requirement yields no
-- authorization until a real permission source is wired up).
-- =========================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.validate_oauth_scope(
  p_user_id UUID,
  p_requested_scopes TEXT[]
)
RETURNS TEXT[] AS $$
DECLARE
  v_authorized_scopes TEXT[] := ARRAY[]::TEXT[];
  v_scope_record RECORD;
  v_scope_permissions TEXT[];
BEGIN
  -- p_user_id is retained for API/signature compatibility and future
  -- permission gating; there is no per-user permission table to query today.
  PERFORM p_user_id;

  FOR v_scope_record IN
    SELECT scope, rbac_permissions
    FROM core.oauth_scopes
    WHERE scope = ANY(p_requested_scopes)
  LOOP
    v_scope_permissions := v_scope_record.rbac_permissions;

    -- Scopes with no RBAC requirement are open to any authenticated user.
    -- Scopes that declare requirements stay unauthorized until a permission
    -- source exists (fail closed rather than erroring).
    IF v_scope_permissions IS NULL OR array_length(v_scope_permissions, 1) IS NULL THEN
      v_authorized_scopes := v_authorized_scopes || v_scope_record.scope;
    END IF;
  END LOOP;

  RETURN v_authorized_scopes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'core';

COMMENT ON FUNCTION core.validate_oauth_scope IS
  'Returns the subset of requested OAuth scopes the user may be granted. Scopes with empty rbac_permissions are open; scopes with requirements fail closed until a permission source is wired up.';

COMMIT;
