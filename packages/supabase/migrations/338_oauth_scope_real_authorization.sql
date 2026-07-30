-- =========================================================
-- 338_oauth_scope_real_authorization.sql
--
-- Make core.validate_oauth_scope perform a real per-user authorization check,
-- and remove the "no declared requirement means open" hazard. Issue #428.
--
-- Background
-- ----------
-- Migration 220 joined core.role_permissions / core.permissions, tables that
-- never existed, so every /authorize call raised and the endpoint 403'd.
-- Migration 336 removed the dead join but authorized any scope whose
-- rbac_permissions array was empty — and every scope in the catalog had an
-- empty array, making it a rubber stamp.
--
-- Both failure modes share one root cause: the *absence* of a declared
-- requirement was treated as an answer. This migration makes absence mean
-- "not classified yet, therefore denied", which is the only safe default for
-- an authorization table. A scope is grantable only if it is explicitly
-- marked self-scoped, or it declares permissions the user actually holds.
--
-- Why not just enumerate scope names
-- ----------------------------------
-- There are two live, incompatible scope vocabularies:
--
--   migration 138  ->  resource:action   (documents:read, profile:write)      7 scopes
--   migration 224  ->  action:resource   (read:documents, write:profile,
--                                         plus openid/email/profile and
--                                         admin:*)                           31 scopes
--
-- Production currently holds 138's set; a database built from the full
-- migration chain ends on 224's set — and 224 begins with
-- `DELETE FROM core.oauth_scopes`, so the catalog can be replaced wholesale by
-- a replay. Any fix keyed only on scope names silently stops gating the moment
-- the other vocabulary is in place. Classifying BOTH vocabularies, with
-- unclassified scopes denied, is what survives that.
--
-- Scope semantics
-- ---------------
-- Self-scoped: exposes only the requesting user's own data (their profile,
-- resume, their own applications/messages/notifications). Any user is
-- inherently entitled to their own data, so an RBAC gate would be wrong here;
-- the gate is consent (requires_consent + core.oauth_user_consents).
--
-- Org-scoped: reaches data whose entitlement depends on the user's role.
-- Every document table is keyed on organization_id
-- (core.organization_documents and friends) — there is no user-owned document
-- table — so documents are org-scoped, not personal.
--
-- Note validate_oauth_scope CANNOT use auth.uid(): the edge function calls it
-- with the service role on behalf of an explicit p_user_id.
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- 1. Make "self-scoped" an explicit property rather than an inference.
-- ---------------------------------------------------------

ALTER TABLE core.oauth_scopes
  ADD COLUMN IF NOT EXISTS is_self_scoped BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN core.oauth_scopes.is_self_scoped IS
  'TRUE when the scope exposes only the requesting user''s own data, so any authenticated user may grant it and consent is the sole gate. FALSE (the default) means the scope must declare rbac_permissions to be grantable at all — an unclassified scope is denied.';

COMMENT ON COLUMN core.oauth_scopes.rbac_permissions IS
  'core.team_permission values the user must ALL hold — via an active team membership in any organization, or by owning an organization — before this scope may be granted. Ignored when is_self_scoped is TRUE. Empty AND not self-scoped means denied.';

-- ---------------------------------------------------------
-- 2. Classify both vocabularies.
--    Anything not named here stays denied by default.
-- ---------------------------------------------------------

-- Self-scoped: the user's own identity, profile, resume, and the records they
-- personally own. Applications are the user's own submissions; notifications
-- and messages are addressed to them.
UPDATE core.oauth_scopes SET is_self_scoped = TRUE, rbac_permissions = ARRAY[]::TEXT[]
WHERE scope IN (
  -- OIDC
  'openid', 'email', 'profile',
  -- 138 vocabulary
  'profile:read', 'profile:write',
  -- 224 vocabulary
  'read:profile', 'write:profile', 'read:resume',
  'read:applications', 'write:applications', 'delete:applications',
  'read:notifications', 'write:notifications',
  'read:messages', 'write:messages',
  'read:assessments', 'write:assessments'
);

-- Org-scoped, read: requires being able to see the organization at all.
UPDATE core.oauth_scopes SET is_self_scoped = FALSE, rbac_permissions = ARRAY['team.view']
WHERE scope IN (
  'documents:read', 'organizations:read',
  'read:documents', 'read:organizations', 'read:organization_members',
  'read:teams', 'read:jobs', 'read:job_applications'
);

-- Org-scoped, document mutation.
UPDATE core.oauth_scopes SET is_self_scoped = FALSE, rbac_permissions = ARRAY['document.manage']
WHERE scope IN ('documents:write', 'documents:delete', 'write:documents', 'delete:documents');

-- Org-scoped, job mutation.
UPDATE core.oauth_scopes SET is_self_scoped = FALSE, rbac_permissions = ARRAY['job.manage']
WHERE scope IN ('write:jobs');

-- Org-scoped, organization/team settings.
UPDATE core.oauth_scopes SET is_self_scoped = FALSE, rbac_permissions = ARRAY['team.settings']
WHERE scope IN ('organizations:write', 'write:organizations', 'write:teams');

-- Administrative scopes grant cross-cutting reach; require the highest team
-- permission. These exist only in the 224 vocabulary and were previously
-- rubber-stamped along with everything else.
UPDATE core.oauth_scopes SET is_self_scoped = FALSE, rbac_permissions = ARRAY['team.manage']
WHERE scope LIKE 'admin:%';

-- ---------------------------------------------------------
-- 3. Resolve a user's effective org-wide permissions.
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION core.user_has_any_team_permission(
  p_user_id UUID,
  p_permission core.team_permission
)
RETURNS BOOLEAN AS $$
  SELECT
    -- Active membership of any team whose role grants the permission.
    EXISTS (
      SELECT 1
      FROM core.team_members tm
      JOIN core.team_role_permissions trp
        ON trp.role_id = tm.role_id
       AND trp.permission = p_permission
       AND trp.is_allowed = TRUE
      WHERE tm.user_id = p_user_id
        AND tm.status = 'active'
    )
    -- Or ownership of any organization. Mirrors the owner bypass already in
    -- core.has_team_permission, where an owner is implicitly permitted
    -- everything within their own organization.
    OR EXISTS (
      SELECT 1
      FROM core.organizations o
      WHERE o.owner_user_id = p_user_id
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'core';

COMMENT ON FUNCTION core.user_has_any_team_permission IS
  'True if the user holds the given team permission through an active team membership in any organization, or owns an organization. Deliberately org-wide: an OAuth grant is not scoped to one team, so the question is whether the user holds the permission anywhere. Takes an explicit user id rather than auth.uid() because callers run as the service role.';

-- ---------------------------------------------------------
-- 4. Enforce it.
-- ---------------------------------------------------------

CREATE OR REPLACE FUNCTION core.validate_oauth_scope(
  p_user_id UUID,
  p_requested_scopes TEXT[]
)
RETURNS TEXT[] AS $$
DECLARE
  v_authorized_scopes TEXT[] := ARRAY[]::TEXT[];
  v_scope_record RECORD;
  v_required TEXT;
  v_ok BOOLEAN;
BEGIN
  IF p_user_id IS NULL OR p_requested_scopes IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  FOR v_scope_record IN
    SELECT scope, is_self_scoped, rbac_permissions
    FROM core.oauth_scopes
    WHERE scope = ANY(p_requested_scopes)
  LOOP
    IF v_scope_record.is_self_scoped THEN
      -- Only the user's own data; consent is the gate.
      v_authorized_scopes := v_authorized_scopes || v_scope_record.scope;
      CONTINUE;
    END IF;

    -- Not self-scoped and nothing declared: unclassified, so denied. This is
    -- the branch that used to authorize everything.
    IF v_scope_record.rbac_permissions IS NULL
       OR array_length(v_scope_record.rbac_permissions, 1) IS NULL THEN
      CONTINUE;
    END IF;

    -- Every declared permission must be held, so that adding a requirement to
    -- a scope can only ever narrow it.
    v_ok := TRUE;
    FOREACH v_required IN ARRAY v_scope_record.rbac_permissions
    LOOP
      IF NOT core.user_has_any_team_permission(
        p_user_id, v_required::core.team_permission
      ) THEN
        v_ok := FALSE;
        EXIT;
      END IF;
    END LOOP;

    IF v_ok THEN
      v_authorized_scopes := v_authorized_scopes || v_scope_record.scope;
    END IF;
  END LOOP;

  -- Scopes absent from the catalog are never authorized. The caller treats an
  -- empty result as 403 and only ever persists this subset, never the
  -- originally requested list.
  RETURN v_authorized_scopes;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'core';

COMMENT ON FUNCTION core.validate_oauth_scope IS
  'Returns the subset of requested OAuth scopes the user may grant. Self-scoped scopes are allowed for any user (consent is the gate); org-scoped scopes require every declared core.team_permission, held via an active team membership or organization ownership. Scopes that are neither self-scoped nor carry requirements, and scopes absent from the catalog, are denied.';

COMMIT;
