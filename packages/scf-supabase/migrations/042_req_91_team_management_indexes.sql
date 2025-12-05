-- =========================================================
-- 042_req_91_team_management_indexes.sql
-- Indexes and unique constraints for Team Management schema
-- =========================================================

BEGIN;

-- Team roles & permissions indexes
CREATE INDEX IF NOT EXISTS team_roles_organization_id_idx
  ON core.team_roles (organization_id);

CREATE INDEX IF NOT EXISTS team_role_permissions_role_id_idx
  ON core.team_role_permissions (role_id);

-- Team members helper indexes
CREATE INDEX IF NOT EXISTS team_members_team_status_idx
  ON core.team_members (team_id, status);

CREATE INDEX IF NOT EXISTS team_members_user_idx
  ON core.team_members (user_id);

-- Team invitations helper indexes
CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_unique_invited_user
  ON core.team_invitations (team_id, invited_user_id)
  WHERE invited_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_unique_email
  ON core.team_invitations (team_id, LOWER(email))
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS team_invitations_team_status_idx
  ON core.team_invitations (team_id, status);

CREATE INDEX IF NOT EXISTS team_invitations_token_hash_idx
  ON core.team_invitations (token_hash);

COMMIT;

