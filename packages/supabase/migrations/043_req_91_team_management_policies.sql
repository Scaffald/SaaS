-- =========================================================
-- 043_req_91_team_management_policies.sql
-- RLS policies and grants for Team Management schema
-- =========================================================

BEGIN;

-- Enable RLS on new tables
ALTER TABLE core.team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_invitations ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- core.team_roles policies
-- =========================================================

CREATE POLICY team_roles_read ON core.team_roles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY team_roles_insert ON core.team_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_roles_update ON core.team_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_roles_delete ON core.team_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- =========================================================
-- core.team_role_permissions policies
-- =========================================================

CREATE POLICY team_role_permissions_read ON core.team_role_permissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY team_role_permissions_write ON core.team_role_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.team_roles tr
      JOIN core.organizations o ON o.id = tr.organization_id
      WHERE tr.id = role_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM core.team_roles tr
      JOIN core.organizations o ON o.id = tr.organization_id
      WHERE tr.id = role_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- =========================================================
-- core.team_invitations policies
-- =========================================================

CREATE POLICY team_invitations_read ON core.team_invitations
  FOR SELECT TO authenticated
  USING (
    inviter_user_id = auth.uid()
    OR invitee_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_insert ON core.team_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    inviter_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_update ON core.team_invitations
  FOR UPDATE TO authenticated
  USING (
    inviter_user_id = auth.uid()
    OR invitee_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    inviter_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_delete ON core.team_invitations
  FOR DELETE TO authenticated
  USING (
    inviter_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- =========================================================
-- Grants for new tables
-- =========================================================

GRANT SELECT ON core.team_roles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.team_roles TO authenticated;
GRANT ALL ON core.team_roles TO service_role;

GRANT SELECT ON core.team_role_permissions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON core.team_role_permissions TO authenticated;
GRANT ALL ON core.team_role_permissions TO service_role;

GRANT SELECT ON core.team_invitations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON core.team_invitations TO authenticated;
GRANT ALL ON core.team_invitations TO service_role;

COMMIT;

