-- Migration: Generic Invitation System
-- Purpose: Create rule-based invitation system for all ForSured relationship types
-- Tables: invitation_rules, invitations (new), user_relationships
-- Note: Works alongside existing relationship_invitations and referrals tables

-- ============================================================================
-- Table: invitation_rules
-- Admin-managed rules that define what invitation types are available
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.invitation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Rule definition
  source_role TEXT NOT NULL,       -- 'broker', 'manager', 'contractor'
  target_role TEXT NOT NULL,       -- 'client', 'broker', 'contractor'
  relationship_type TEXT NOT NULL, -- 'one-to-one', 'one-to-many', 'one-to-many-via-project'

  -- Configuration
  name TEXT NOT NULL,              -- 'Invite Client', 'Invite Contractor'
  description TEXT,                -- Admin-facing description
  email_template_id TEXT,          -- SendGrid template ID
  requires_project BOOLEAN DEFAULT false,

  -- Constraints
  constraint_message TEXT,         -- "This client already has a broker"
  allow_referral_only BOOLEAN DEFAULT true, -- Can still track referral even if constraint fails

  -- Status
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint per role combination
  UNIQUE(source_role, target_role)
);

-- Create index for rule lookups
CREATE INDEX IF NOT EXISTS idx_invitation_rules_source_role
  ON core.invitation_rules(source_role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invitation_rules_target_role
  ON core.invitation_rules(target_role) WHERE is_active = true;

-- ============================================================================
-- Table: generic_invitations
-- Unified invitation table for all relationship types
-- Named generic_invitations to avoid conflict with existing tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.generic_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The invitation rule being used
  rule_id UUID REFERENCES core.invitation_rules(id) ON DELETE RESTRICT,

  -- Who is inviting
  inviter_id UUID REFERENCES core.users(id) ON DELETE CASCADE NOT NULL,
  inviter_organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,

  -- Who is being invited (may not exist yet)
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  invitee_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL, -- Set when user signs up/accepts

  -- Project context (for project-based invitations)
  project_id UUID, -- Optional project context for project-based invitations

  -- Referral tracking
  is_referral BOOLEAN DEFAULT true,  -- Track for referral credit
  referral_code TEXT UNIQUE,          -- Unique code for this invitation

  -- Personal message
  personal_message TEXT,              -- Custom message from inviter

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMPTZ,

  -- Constraint handling
  constraint_blocked BOOLEAN DEFAULT false, -- True if relationship constraint failed
  constraint_reason TEXT,                    -- Why it was blocked

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,

  -- Email tracking
  email_sent_at TIMESTAMPTZ,
  email_opened_at TIMESTAMPTZ,
  email_clicked_at TIMESTAMPTZ,

  -- Audit
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for invitation lookups
CREATE INDEX IF NOT EXISTS idx_generic_invitations_email
  ON core.generic_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_generic_invitations_code
  ON core.generic_invitations(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_generic_invitations_status
  ON core.generic_invitations(status);
CREATE INDEX IF NOT EXISTS idx_generic_invitations_inviter
  ON core.generic_invitations(inviter_id);
CREATE INDEX IF NOT EXISTS idx_generic_invitations_invitee
  ON core.generic_invitations(invitee_user_id) WHERE invitee_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_generic_invitations_project
  ON core.generic_invitations(project_id) WHERE project_id IS NOT NULL;

-- ============================================================================
-- Table: user_relationships
-- Generic table for relationships that aren't project-specific
-- ============================================================================

CREATE TABLE IF NOT EXISTS core.user_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationship definition
  source_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE NOT NULL,
  source_organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES core.users(id) ON DELETE CASCADE NOT NULL,
  target_organization_id UUID REFERENCES core.organizations(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,   -- 'broker_client', 'contractor_broker', 'manager_broker', etc.

  -- Source invitation
  invitation_id UUID REFERENCES core.generic_invitations(id) ON DELETE SET NULL,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'removed')),

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Enforce uniqueness per relationship type
  UNIQUE(source_user_id, target_user_id, relationship_type)
);

-- Indexes for relationship lookups
CREATE INDEX IF NOT EXISTS idx_user_relationships_source
  ON core.user_relationships(source_user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_target
  ON core.user_relationships(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_relationships_type
  ON core.user_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_user_relationships_status
  ON core.user_relationships(status) WHERE status = 'active';

-- ============================================================================
-- Seed: Default invitation rules
-- ============================================================================

INSERT INTO core.invitation_rules (source_role, target_role, relationship_type, name, description, constraint_message, requires_project) VALUES
  ('broker', 'client', 'one-to-one', 'Invite Client', 'Broker invites a client (GC/Manager)', 'This client already has a broker. You can still send a referral.', false),
  ('manager', 'broker', 'one-to-many', 'Invite Broker', 'Manager invites a broker for insurance services', NULL, false),
  ('manager', 'contractor', 'one-to-many-via-project', 'Invite Subcontractor', 'Manager invites a subcontractor to a project', NULL, true),
  ('contractor', 'broker', 'one-to-many', 'Invite Broker', 'Contractor invites a broker for insurance services', NULL, false)
ON CONFLICT (source_role, target_role) DO NOTHING;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Enable RLS
ALTER TABLE core.invitation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.generic_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_relationships ENABLE ROW LEVEL SECURITY;

-- invitation_rules: Viewable by authenticated users, editable by admins
CREATE POLICY "invitation_rules_select_authenticated" ON core.invitation_rules
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "invitation_rules_admin_all" ON core.invitation_rules
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- generic_invitations: Users can see invitations they sent or received
CREATE POLICY "generic_invitations_select_own" ON core.generic_invitations
  FOR SELECT TO authenticated
  USING (
    inviter_id = auth.uid() OR
    invitee_user_id = auth.uid() OR
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "generic_invitations_insert_own" ON core.generic_invitations
  FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "generic_invitations_update_own" ON core.generic_invitations
  FOR UPDATE TO authenticated
  USING (
    inviter_id = auth.uid() OR
    invitee_user_id = auth.uid() OR
    invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- user_relationships: Users can see relationships they're part of
CREATE POLICY "user_relationships_select_own" ON core.user_relationships
  FOR SELECT TO authenticated
  USING (source_user_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY "user_relationships_insert_authenticated" ON core.user_relationships
  FOR INSERT TO authenticated
  WITH CHECK (source_user_id = auth.uid());

CREATE POLICY "user_relationships_update_own" ON core.user_relationships
  FOR UPDATE TO authenticated
  USING (source_user_id = auth.uid() OR target_user_id = auth.uid());

-- ============================================================================
-- Triggers: Update timestamps
-- ============================================================================

-- Function for updated_at trigger
CREATE OR REPLACE FUNCTION core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_invitation_rules_updated_at
  BEFORE UPDATE ON core.invitation_rules
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

CREATE TRIGGER update_user_relationships_updated_at
  BEFORE UPDATE ON core.user_relationships
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE core.invitation_rules IS 'Admin-managed rules defining available invitation types';
COMMENT ON TABLE core.generic_invitations IS 'Unified invitation table for all relationship types';
COMMENT ON TABLE core.user_relationships IS 'Generic relationships between users (non-project-specific)';

COMMENT ON COLUMN core.invitation_rules.relationship_type IS 'one-to-one: single relationship allowed; one-to-many: multiple allowed; one-to-many-via-project: via project_subcontractors';
COMMENT ON COLUMN core.generic_invitations.constraint_blocked IS 'True if relationship could not be created due to constraints (e.g., client already has broker)';
COMMENT ON COLUMN core.generic_invitations.is_referral IS 'If true, track for referral credit (separate from relationship creation)';
