-- =========================================================
-- 041_req_91_team_management_relations.sql
-- Foreign key relationships for Team Management schema
-- =========================================================

BEGIN;

-- =========================================================
-- core.teams new foreign keys
-- =========================================================

ALTER TABLE core.teams
  ADD CONSTRAINT teams_default_role_id_fkey
  FOREIGN KEY (default_role_id) REFERENCES core.team_roles(id) ON DELETE SET NULL;

ALTER TABLE core.teams
  ADD CONSTRAINT teams_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.teams
  ADD CONSTRAINT teams_archived_by_fkey
  FOREIGN KEY (archived_by) REFERENCES core.users(id) ON DELETE SET NULL;

-- =========================================================
-- core.team_members foreign keys
-- =========================================================

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES core.team_roles(id) ON DELETE SET NULL;

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_added_by_fkey
  FOREIGN KEY (added_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_removed_by_fkey
  FOREIGN KEY (removed_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_invitation_id_fkey
  FOREIGN KEY (invitation_id) REFERENCES core.team_invitations(id) ON DELETE SET NULL;

-- =========================================================
-- core.team_roles foreign keys
-- =========================================================

ALTER TABLE core.team_roles
  ADD CONSTRAINT team_roles_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE core.team_roles
  ADD CONSTRAINT team_roles_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.team_roles
  ADD CONSTRAINT team_roles_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES core.users(id) ON DELETE SET NULL;

-- =========================================================
-- core.team_role_permissions foreign keys
-- =========================================================

ALTER TABLE core.team_role_permissions
  ADD CONSTRAINT team_role_permissions_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES core.team_roles(id) ON DELETE CASCADE;

ALTER TABLE core.team_role_permissions
  ADD CONSTRAINT team_role_permissions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.team_role_permissions
  ADD CONSTRAINT team_role_permissions_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES core.users(id) ON DELETE SET NULL;

-- =========================================================
-- core.team_invitations foreign keys
-- =========================================================

ALTER TABLE core.team_invitations
  ADD CONSTRAINT team_invitations_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES core.teams(id) ON DELETE CASCADE;

ALTER TABLE core.team_invitations
  ADD CONSTRAINT team_invitations_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE core.team_invitations
  ADD CONSTRAINT team_invitations_inviter_user_id_fkey
  FOREIGN KEY (inviter_user_id) REFERENCES core.users(id) ON DELETE CASCADE;

ALTER TABLE core.team_invitations
  ADD CONSTRAINT team_invitations_invitee_user_id_fkey
  FOREIGN KEY (invitee_user_id) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.team_invitations
  ADD CONSTRAINT team_invitations_role_id_fkey
  FOREIGN KEY (role_id) REFERENCES core.team_roles(id) ON DELETE SET NULL;

ALTER TABLE core.team_invitations
  ADD CONSTRAINT team_invitations_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.team_invitations
  ADD CONSTRAINT team_invitations_updated_by_fkey
  FOREIGN KEY (updated_by) REFERENCES core.users(id) ON DELETE SET NULL;

COMMIT;

