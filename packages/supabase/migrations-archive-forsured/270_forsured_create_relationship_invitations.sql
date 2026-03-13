-- Migration: Create relationship_invitations table
-- Purpose: Support bidirectional relationship invitations between brokers, contractors, and managers
-- Codes: BKR-XXXXXX, CTR-XXXXXX, MGR-XXXXXX

CREATE TABLE IF NOT EXISTS forsured.relationship_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Inviter (who sent the invitation)
  inviter_org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  inviter_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  inviter_type TEXT NOT NULL CHECK (inviter_type IN ('broker', 'subcontractor', 'manager')),
  
  -- Invitee (who is being invited)
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  invitee_company TEXT,
  invitee_phone TEXT,
  invitee_type TEXT NOT NULL CHECK (invitee_type IN ('broker', 'subcontractor', 'manager')),
  
  -- Connection method
  relationship_code TEXT UNIQUE NOT NULL, -- BKR-XXX, CTR-XXX, MGR-XXX
  connection_method TEXT NOT NULL DEFAULT 'both' CHECK (connection_method IN ('email', 'code', 'both')),
  
  -- Relationship status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'connected', 'expired', 'declined')),
  
  -- Relationship connection (set when established)
  relationship_id UUID REFERENCES forsured.relationships(id) ON DELETE SET NULL,
  
  -- Matching (only set when connection is established)
  invitee_org_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL,
  invitee_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  
  -- Referral tracking (back-door to referral system)
  referral_credit_granted BOOLEAN DEFAULT false,
  referral_credit_id UUID, -- Will reference forsured.referrals(id) after that table is created
  
  -- Timestamps
  expires_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_relationship_invitations_code ON forsured.relationship_invitations(relationship_code);
CREATE INDEX idx_relationship_invitations_email ON forsured.relationship_invitations(invitee_email);
CREATE INDEX idx_relationship_invitations_inviter ON forsured.relationship_invitations(inviter_org_id, status);
CREATE INDEX idx_relationship_invitations_invitee_org ON forsured.relationship_invitations(invitee_org_id) WHERE invitee_org_id IS NOT NULL;
CREATE INDEX idx_relationship_invitations_status ON forsured.relationship_invitations(status, expires_at);

-- RLS Policies
ALTER TABLE forsured.relationship_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations they sent or received
CREATE POLICY "Users can view their own relationship invitations"
  ON forsured.relationship_invitations
  FOR SELECT
  USING (
    inviter_user_id = auth.uid() OR
    invitee_user_id = auth.uid() OR
    inviter_org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    ) OR
    invitee_org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
  );

-- Users can create invitations for their own organization
CREATE POLICY "Users can create relationship invitations"
  ON forsured.relationship_invitations
  FOR INSERT
  WITH CHECK (
    inviter_user_id = auth.uid() AND
    inviter_org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
  );

-- Users can update invitations they received
CREATE POLICY "Users can update received relationship invitations"
  ON forsured.relationship_invitations
  FOR UPDATE
  USING (
    invitee_user_id = auth.uid() OR
    invitee_org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
  );

-- Add comment
COMMENT ON TABLE forsured.relationship_invitations IS 'Bidirectional relationship invitations between brokers, contractors, and managers with relationship codes (BKR/CTR/MGR)';

