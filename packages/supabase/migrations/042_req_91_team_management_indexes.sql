-- =========================================================
-- 042_req_91_team_management_indexes.sql
-- Indexes and unique constraints for Team Management schema
-- =========================================================

BEGIN;

-- Team roles & permissions indexes
CREATE INDEX team_roles_organization_id_idx
  ON core.team_roles (organization_id);

CREATE INDEX team_role_permissions_role_id_idx
  ON core.team_role_permissions (role_id);

-- Team members helper indexes
CREATE INDEX team_members_team_status_idx
  ON core.team_members (team_id, status);

CREATE INDEX team_members_user_idx
  ON core.team_members (user_id);

-- Team invitations helper indexes
CREATE UNIQUE INDEX team_invitations_unique_invitee_user
  ON core.team_invitations (team_id, invitee_user_id)
  WHERE invitee_user_id IS NOT NULL;

CREATE UNIQUE INDEX team_invitations_unique_invitee_email
  ON core.team_invitations (team_id, invitee_email)
  WHERE invitee_email IS NOT NULL;

CREATE INDEX team_invitations_team_status_idx
  ON core.team_invitations (team_id, status);

CREATE INDEX team_invitations_token_idx
  ON core.team_invitations (token);

COMMIT;

