-- =========================================================
-- 040_req_91_team_management_schema.sql
-- Team Management schema expansion for REQ-91
-- =========================================================

BEGIN;

-- =========================================================
-- Extend core.teams with metadata and lifecycle management
-- =========================================================

ALTER TABLE core.teams
  ADD COLUMN description JSONB,
  ADD COLUMN purpose TEXT,
  ADD COLUMN visibility TEXT NOT NULL DEFAULT 'organization',
  ADD COLUMN default_role_id UUID,
  ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD COLUMN archived_by UUID,
  ADD COLUMN archived_reason TEXT,
  ADD COLUMN settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN updated_by UUID;

ALTER TABLE core.teams
  ADD CONSTRAINT teams_visibility_check
  CHECK (visibility IN ('organization', 'private'));

-- =========================================================
-- Expand core.team_members with role + status tracking
-- =========================================================

ALTER TABLE core.team_members
  ADD COLUMN role_id UUID,
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN joined_at TIMESTAMPTZ,
  ADD COLUMN invited_by UUID,
  ADD COLUMN added_by UUID,
  ADD COLUMN invitation_id UUID,
  ADD COLUMN updated_at TIMESTAMPTZ,
  ADD COLUMN removed_at TIMESTAMPTZ,
  ADD COLUMN removed_by UUID,
  ADD COLUMN notes TEXT,
  ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_status_check
  CHECK (status IN ('active', 'pending', 'removed'));

UPDATE core.team_members
SET
  status = 'active',
  joined_at = COALESCE(joined_at, created_at),
  updated_at = COALESCE(updated_at, created_at)
WHERE joined_at IS NULL
   OR updated_at IS NULL;

ALTER TABLE core.team_members
  ALTER COLUMN joined_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN joined_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET DEFAULT NOW();

-- =========================================================
-- Team roles and permissions
-- =========================================================

CREATE TABLE core.team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  updated_by UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT team_roles_key_unique UNIQUE (organization_id, key)
);

CREATE TABLE core.team_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL,
  permission TEXT NOT NULL,
  effect TEXT NOT NULL DEFAULT 'allow',
  created_by UUID,
  updated_by UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT team_role_permissions_effect_check CHECK (effect IN ('allow', 'deny')),
  CONSTRAINT team_role_permissions_unique UNIQUE (role_id, permission, effect)
);

-- =========================================================
-- Team invitations tracking
-- =========================================================

CREATE TABLE core.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  inviter_user_id UUID NOT NULL,
  invitee_user_id UUID,
  invitee_email CITEXT,
  role_id UUID,
  token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  message TEXT,
  expires_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  reminder_count INTEGER NOT NULL DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT team_invitations_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  CONSTRAINT team_invitations_contact_check CHECK (invitee_user_id IS NOT NULL OR invitee_email IS NOT NULL),
  CONSTRAINT team_invitations_token_unique UNIQUE (token)
);

COMMIT;
-- =========================================================
-- 040_req_91_team_management_schema.sql
-- Team Management schema expansion: roles, permissions, invitations
-- =========================================================

BEGIN;

-- ====================================================================================
-- Step 1: Ensure supporting ENUM types exist
-- ====================================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'team_permission'
      AND pg_type.typnamespace = 'core'::regnamespace
  ) THEN
    EXECUTE $enum$
      CREATE TYPE core.team_permission AS ENUM (
        'team.view',
        'team.manage',
        'team.settings',
        'team.invite',
        'team.remove_member',
        'team.assign_role',
        'job.manage',
        'application.review',
        'application.manage',
        'application.comment',
        'interview.schedule',
        'offer.manage',
        'analytics.view',
        'document.manage',
        'invitation.manage'
      )
    $enum$;
  ELSE
    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'team.view';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'team.view'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'team.manage';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'team.manage'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'team.settings';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'team.settings'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'team.invite';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'team.invite'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'team.remove_member';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'team.remove_member'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'team.assign_role';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'team.assign_role'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'job.manage';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'job.manage'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'application.review';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'application.review'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'application.manage';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'application.manage'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'application.comment';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'application.comment'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'interview.schedule';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'interview.schedule'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'offer.manage';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'offer.manage'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'analytics.view';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'analytics.view'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'document.manage';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'document.manage'$$;
    END IF;

    PERFORM 1
    FROM pg_enum
    WHERE enumtypid = 'core.team_permission'::regtype
      AND enumlabel = 'invitation.manage';
    IF NOT FOUND THEN
      EXECUTE $$ALTER TYPE core.team_permission ADD VALUE IF NOT EXISTS 'invitation.manage'$$;
    END IF;
  END IF;
END;
$$;

-- ====================================================================================
-- Step 2: Extend core.teams metadata
-- ====================================================================================

ALTER TABLE core.teams
  ADD COLUMN IF NOT EXISTS description JSONB,
  ADD COLUMN IF NOT EXISTS purpose TEXT,
  ADD COLUMN IF NOT EXISTS parent_team_id UUID,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'organization'
    CHECK (visibility IN ('organization', 'private', 'public')),
  ADD COLUMN IF NOT EXISTS invitation_expiration_days INTEGER NOT NULL DEFAULT 7
    CHECK (invitation_expiration_days BETWEEN 1 AND 90),
  ADD COLUMN IF NOT EXISTS allow_self_join BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_assign_jobs BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS default_role_id UUID,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID,
  ADD COLUMN IF NOT EXISTS archived_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Ensure default visibility for existing rows
UPDATE core.teams
SET visibility = 'organization'
WHERE visibility IS NULL;

-- ====================================================================================
-- Step 3: Team Roles & Permissions tables
-- ====================================================================================

CREATE TABLE IF NOT EXISTS core.team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  level SMALLINT NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_system BOOLEAN NOT NULL DEFAULT TRUE,
  is_assignable BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL
);

CREATE TRIGGER set_updated_at_team_roles
  BEFORE UPDATE ON core.team_roles
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

CREATE TABLE IF NOT EXISTS core.team_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES core.team_roles(id) ON DELETE CASCADE,
  permission core.team_permission NOT NULL,
  is_allowed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_role_permissions_role_permission_idx
  ON core.team_role_permissions (role_id, permission);

-- ====================================================================================
-- Step 4: Team invitations table
-- ====================================================================================

CREATE TABLE IF NOT EXISTS core.team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  email CITEXT NOT NULL,
  invited_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  invited_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  role_id UUID NOT NULL REFERENCES core.team_roles(id) ON DELETE RESTRICT,
  token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  response_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > created_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_token_hash_idx
  ON core.team_invitations (token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS team_invitations_pending_email_unique
  ON core.team_invitations (team_id, LOWER(email))
  WHERE status = 'pending';

CREATE TRIGGER set_updated_at_team_invitations
  BEFORE UPDATE ON core.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- ====================================================================================
-- Step 5: Extend team members table
-- ====================================================================================

ALTER TABLE core.team_members
  ADD COLUMN IF NOT EXISTS role_id UUID,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'pending', 'invited', 'suspended', 'removed')),
  ADD COLUMN IF NOT EXISTS added_by UUID,
  ADD COLUMN IF NOT EXISTS invitation_id UUID,
  ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS removed_by UUID,
  ADD COLUMN IF NOT EXISTS removal_reason TEXT,
  ADD COLUMN IF NOT EXISTS permissions_override JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER set_updated_at_team_members
  BEFORE UPDATE ON core.team_members
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

UPDATE core.team_members
SET joined_at = COALESCE(joined_at, created_at)
WHERE joined_at IS NULL;

ALTER TABLE core.team_members
  ALTER COLUMN joined_at SET DEFAULT NOW();

ALTER TABLE core.team_members
  ALTER COLUMN joined_at SET NOT NULL;

-- ====================================================================================
-- Step 6: Seed default team roles & permissions, update references
-- ====================================================================================

DO $$
DECLARE
  v_admin_id UUID;
  v_lead_id UUID;
  v_recruiter_id UUID;
  v_reviewer_id UUID;
  v_member_id UUID;
  perm core.team_permission;
BEGIN
  INSERT INTO core.team_roles (key, name, description, level, is_default, is_system)
  VALUES
    ('team_admin', 'Team Admin', 'Full control over team configuration, jobs, and members', 100, FALSE, TRUE)
  ON CONFLICT (key) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        level = EXCLUDED.level,
        is_system = TRUE
  RETURNING id INTO v_admin_id;

  INSERT INTO core.team_roles (key, name, description, level, is_default, is_system)
  VALUES
    ('team_lead', 'Team Lead', 'Manages day-to-day hiring workflows and team membership', 80, FALSE, TRUE)
  ON CONFLICT (key) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        level = EXCLUDED.level,
        is_system = TRUE
  RETURNING id INTO v_lead_id;

  INSERT INTO core.team_roles (key, name, description, level, is_default, is_system)
  VALUES
    ('recruiter', 'Recruiter', 'Owns candidate pipeline and communication', 60, FALSE, TRUE)
  ON CONFLICT (key) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        level = EXCLUDED.level,
        is_system = TRUE
  RETURNING id INTO v_recruiter_id;

  INSERT INTO core.team_roles (key, name, description, level, is_default, is_system)
  VALUES
    ('reviewer', 'Reviewer', 'Provides structured feedback on candidates', 40, FALSE, TRUE)
  ON CONFLICT (key) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        level = EXCLUDED.level,
        is_system = TRUE
  RETURNING id INTO v_reviewer_id;

  INSERT INTO core.team_roles (key, name, description, level, is_default, is_system)
  VALUES
    ('member', 'Member', 'Basic visibility with ability to collaborate', 20, TRUE, TRUE)
  ON CONFLICT (key) DO UPDATE
    SET name = EXCLUDED.name,
        description = EXCLUDED.description,
        level = EXCLUDED.level,
        is_system = TRUE,
        is_default = TRUE
  RETURNING id INTO v_member_id;

  -- Ensure member is the only default role
  UPDATE core.team_roles
  SET is_default = (key = 'member');

  -- Clear existing permission mappings when reseeding
  DELETE FROM core.team_role_permissions
  WHERE role_id IN (v_admin_id, v_lead_id, v_recruiter_id, v_reviewer_id, v_member_id);

  -- Helper procedure to insert permissions
  FOREACH perm IN ARRAY ARRAY[
    'team.view'::core.team_permission,
    'team.manage'::core.team_permission,
    'team.settings'::core.team_permission,
    'team.invite'::core.team_permission,
    'team.remove_member'::core.team_permission,
    'team.assign_role'::core.team_permission,
    'job.manage'::core.team_permission,
    'application.review'::core.team_permission,
    'application.manage'::core.team_permission,
    'application.comment'::core.team_permission,
    'interview.schedule'::core.team_permission,
    'offer.manage'::core.team_permission,
    'analytics.view'::core.team_permission,
    'document.manage'::core.team_permission,
    'invitation.manage'::core.team_permission
  ] LOOP
    INSERT INTO core.team_role_permissions (role_id, permission, is_allowed)
    VALUES (v_admin_id, perm, TRUE)
    ON CONFLICT (role_id, permission)
    DO UPDATE SET is_allowed = EXCLUDED.is_allowed;
  END LOOP;

  FOREACH perm IN ARRAY ARRAY[
    'team.view'::core.team_permission,
    'team.settings'::core.team_permission,
    'team.invite'::core.team_permission,
    'team.remove_member'::core.team_permission,
    'team.assign_role'::core.team_permission,
    'job.manage'::core.team_permission,
    'application.review'::core.team_permission,
    'application.manage'::core.team_permission,
    'application.comment'::core.team_permission,
    'interview.schedule'::core.team_permission,
    'analytics.view'::core.team_permission,
    'invitation.manage'::core.team_permission
  ] LOOP
    INSERT INTO core.team_role_permissions (role_id, permission, is_allowed)
    VALUES (v_lead_id, perm, TRUE)
    ON CONFLICT (role_id, permission)
    DO UPDATE SET is_allowed = EXCLUDED.is_allowed;
  END LOOP;

  FOREACH perm IN ARRAY ARRAY[
    'team.view'::core.team_permission,
    'job.manage'::core.team_permission,
    'application.review'::core.team_permission,
    'application.manage'::core.team_permission,
    'application.comment'::core.team_permission,
    'interview.schedule'::core.team_permission
  ] LOOP
    INSERT INTO core.team_role_permissions (role_id, permission, is_allowed)
    VALUES (v_recruiter_id, perm, TRUE)
    ON CONFLICT (role_id, permission)
    DO UPDATE SET is_allowed = EXCLUDED.is_allowed;
  END LOOP;

  FOREACH perm IN ARRAY ARRAY[
    'team.view'::core.team_permission,
    'application.review'::core.team_permission,
    'application.comment'::core.team_permission
  ] LOOP
    INSERT INTO core.team_role_permissions (role_id, permission, is_allowed)
    VALUES (v_reviewer_id, perm, TRUE)
    ON CONFLICT (role_id, permission)
    DO UPDATE SET is_allowed = EXCLUDED.is_allowed;
  END LOOP;

  FOREACH perm IN ARRAY ARRAY[
    'team.view'::core.team_permission,
    'application.comment'::core.team_permission
  ] LOOP
    INSERT INTO core.team_role_permissions (role_id, permission, is_allowed)
    VALUES (v_member_id, perm, TRUE)
    ON CONFLICT (role_id, permission)
    DO UPDATE SET is_allowed = EXCLUDED.is_allowed;
  END LOOP;

  -- Backfill teams & members with default role
  UPDATE core.teams
  SET default_role_id = v_member_id
  WHERE default_role_id IS NULL;

  UPDATE core.team_members
  SET role_id = COALESCE(role_id, v_member_id),
      status = COALESCE(status, 'active');
END;
$$;

ALTER TABLE core.team_members
  ALTER COLUMN role_id SET NOT NULL;

ALTER TABLE core.teams
  ALTER COLUMN default_role_id SET NOT NULL;

-- ====================================================================================
-- Step 7: Foreign keys & indexes
-- ====================================================================================

ALTER TABLE core.teams
  ADD CONSTRAINT teams_default_role_id_fkey
    FOREIGN KEY (default_role_id) REFERENCES core.team_roles(id) ON DELETE RESTRICT;

ALTER TABLE core.teams
  ADD CONSTRAINT teams_parent_team_id_fkey
    FOREIGN KEY (parent_team_id) REFERENCES core.teams(id) ON DELETE SET NULL;

ALTER TABLE core.teams
  ADD CONSTRAINT teams_archived_by_fkey
    FOREIGN KEY (archived_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.teams
  ADD CONSTRAINT teams_updated_by_fkey
    FOREIGN KEY (updated_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_role_id_fkey
    FOREIGN KEY (role_id) REFERENCES core.team_roles(id) ON DELETE RESTRICT;

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_added_by_fkey
    FOREIGN KEY (added_by) REFERENCES core.users(id) ON DELETE SET NULL;

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_invitation_id_fkey
    FOREIGN KEY (invitation_id) REFERENCES core.team_invitations(id) ON DELETE SET NULL;

ALTER TABLE core.team_members
  ADD CONSTRAINT team_members_removed_by_fkey
    FOREIGN KEY (removed_by) REFERENCES core.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS teams_parent_team_idx
  ON core.teams (parent_team_id);

CREATE INDEX IF NOT EXISTS team_roles_organization_idx
  ON core.team_roles (organization_id);

CREATE INDEX IF NOT EXISTS team_members_team_role_idx
  ON core.team_members (team_id, role_id);

CREATE INDEX IF NOT EXISTS team_members_user_status_idx
  ON core.team_members (user_id, status);

CREATE INDEX IF NOT EXISTS team_members_joined_at_idx
  ON core.team_members (team_id, joined_at DESC);

CREATE INDEX IF NOT EXISTS team_invitations_team_status_idx
  ON core.team_invitations (team_id, status);

CREATE INDEX IF NOT EXISTS team_invitations_invited_user_idx
  ON core.team_invitations (invited_user_id);

CREATE INDEX IF NOT EXISTS team_invitations_org_idx
  ON core.team_invitations (organization_id);

-- ====================================================================================
-- Step 8: Permission helper functions
-- ====================================================================================

CREATE OR REPLACE FUNCTION core.has_team_permission(
  target_team_id UUID,
  required_permission core.team_permission
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = core
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM core.team_members tm
      JOIN core.team_role_permissions trp
        ON trp.role_id = tm.role_id
       AND trp.permission = required_permission
       AND trp.is_allowed = TRUE
      WHERE tm.team_id = target_team_id
        AND tm.user_id = auth.uid()
        AND tm.status = 'active'
    )
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = target_team_id
        AND o.owner_user_id = auth.uid()
    );
$$;

COMMENT ON FUNCTION core.has_team_permission(UUID, core.team_permission) IS
  'Checks whether the current user has a given permission within the supplied team.';

CREATE OR REPLACE FUNCTION core.is_team_admin(target_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = core
AS $$
  SELECT core.has_team_permission(target_team_id, 'team.manage'::core.team_permission);
$$;

COMMENT ON FUNCTION core.is_team_admin(UUID) IS
  'Determines whether the current user has team.manage permission on the provided team.';

-- ====================================================================================
-- Step 9: RLS policy updates
-- ====================================================================================

ALTER TABLE core.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_invitations FORCE ROW LEVEL SECURITY;

ALTER TABLE core.team_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_roles FORCE ROW LEVEL SECURITY;

ALTER TABLE core.team_role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_role_permissions FORCE ROW LEVEL SECURITY;

ALTER TABLE core.team_members FORCE ROW LEVEL SECURITY;

-- Teams policies
DROP POLICY IF EXISTS teams_read ON core.teams;
DROP POLICY IF EXISTS teams_insert ON core.teams;
DROP POLICY IF EXISTS teams_update ON core.teams;
DROP POLICY IF EXISTS teams_delete ON core.teams;

CREATE POLICY teams_read
  ON core.teams
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY teams_insert
  ON core.teams
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY teams_update
  ON core.teams
  FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR core.has_team_permission(id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR core.has_team_permission(id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.organizations o
      WHERE o.id = organization_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- Team members policies
DROP POLICY IF EXISTS team_members_read ON core.team_members;
DROP POLICY IF EXISTS team_members_self_add ON core.team_members;
DROP POLICY IF EXISTS team_members_manage ON core.team_members;

CREATE POLICY team_members_read
  ON core.team_members
  FOR SELECT
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.view'::core.team_permission)
    OR user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_members_insert
  ON core.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR core.has_team_permission(team_id, 'team.invite'::core.team_permission)
    OR core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_members_update
  ON core.team_members
  FOR UPDATE
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_members_delete
  ON core.team_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR core.has_team_permission(team_id, 'team.remove_member'::core.team_permission)
    OR core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- Team invitations policies
DROP POLICY IF EXISTS team_invitations_select ON core.team_invitations;
DROP POLICY IF EXISTS team_invitations_insert ON core.team_invitations;
DROP POLICY IF EXISTS team_invitations_update ON core.team_invitations;
DROP POLICY IF EXISTS team_invitations_delete ON core.team_invitations;

CREATE POLICY team_invitations_select
  ON core.team_invitations
  FOR SELECT
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.invite'::core.team_permission)
    OR core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR invited_by = auth.uid()
    OR invited_user_id = auth.uid()
    OR responded_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_insert
  ON core.team_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    core.has_team_permission(team_id, 'team.invite'::core.team_permission)
    OR core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_update
  ON core.team_invitations
  FOR UPDATE
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR core.has_team_permission(team_id, 'invitation.manage'::core.team_permission)
    OR invited_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR core.has_team_permission(team_id, 'invitation.manage'::core.team_permission)
    OR invited_user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_invitations_delete
  ON core.team_invitations
  FOR DELETE
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR core.has_team_permission(team_id, 'invitation.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- Team roles and permissions policies
DROP POLICY IF EXISTS team_roles_select ON core.team_roles;
DROP POLICY IF EXISTS team_roles_modify ON core.team_roles;

CREATE POLICY team_roles_select
  ON core.team_roles
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY team_roles_modify
  ON core.team_roles
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS team_role_permissions_select ON core.team_role_permissions;
DROP POLICY IF EXISTS team_role_permissions_modify ON core.team_role_permissions;

CREATE POLICY team_role_permissions_select
  ON core.team_role_permissions
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY team_role_permissions_modify
  ON core.team_role_permissions
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ====================================================================================
-- Step 10: Grants
-- ====================================================================================

GRANT SELECT ON core.team_roles TO authenticated, anon;
GRANT ALL ON core.team_roles TO service_role;

GRANT SELECT ON core.team_role_permissions TO authenticated, anon;
GRANT ALL ON core.team_role_permissions TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON core.team_invitations TO authenticated;
GRANT ALL ON core.team_invitations TO service_role;

COMMIT;

