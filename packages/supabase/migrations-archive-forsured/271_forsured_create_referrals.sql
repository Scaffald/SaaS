-- Migration: Create referrals and user_referral_codes tables
-- Purpose: Support general referral system with RFR- codes
-- Relationship invitations can trigger referral credits

-- Create referrals table
CREATE TABLE IF NOT EXISTS forsured.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referrer (who made the referral)
  referrer_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  referrer_org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  -- Referred party
  referred_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  referred_org_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL,
  referred_email TEXT NOT NULL,
  
  -- Referral code
  referral_code TEXT UNIQUE NOT NULL, -- RFR-XXXXXX format
  
  -- Source tracking
  referral_source TEXT, -- 'direct_referral', 'relationship_connection', 'relationship_broker_contractor', etc.
  source_relationship_id UUID REFERENCES forsured.relationship_invitations(id) ON DELETE SET NULL,
  
  -- Status and credit
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'credited', 'expired')),
  credit_amount DECIMAL(10,2) DEFAULT 0,
  credit_status TEXT DEFAULT 'pending' CHECK (credit_status IN ('pending', 'approved', 'paid', 'cancelled')),
  credit_granted_at TIMESTAMPTZ,
  
  -- Timestamps
  expires_at TIMESTAMPTZ,
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  credited_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_referral_codes table
CREATE TABLE IF NOT EXISTS forsured.user_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  
  referral_code TEXT UNIQUE NOT NULL, -- RFR-XXXXXX (generated per user)
  is_active BOOLEAN DEFAULT true,
  
  -- Stats
  total_referrals INTEGER DEFAULT 0,
  completed_referrals INTEGER DEFAULT 0,
  total_credit DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for referrals
CREATE INDEX idx_referrals_code ON forsured.referrals(referral_code);
CREATE INDEX idx_referrals_referrer ON forsured.referrals(referrer_user_id, status);
CREATE INDEX idx_referrals_referred_user ON forsured.referrals(referred_user_id) WHERE referred_user_id IS NOT NULL;
CREATE INDEX idx_referrals_email ON forsured.referrals(referred_email);
CREATE INDEX idx_referrals_source ON forsured.referrals(source_relationship_id) WHERE source_relationship_id IS NOT NULL;

-- Indexes for user_referral_codes
CREATE UNIQUE INDEX idx_user_referral_codes_user_active ON forsured.user_referral_codes(user_id) WHERE is_active = true;
CREATE INDEX idx_user_referral_codes_code ON forsured.user_referral_codes(referral_code);
CREATE INDEX idx_user_referral_codes_org ON forsured.user_referral_codes(org_id);

-- Add foreign key from relationship_invitations to referrals (now that referrals table exists)
ALTER TABLE forsured.relationship_invitations 
  ADD CONSTRAINT fk_relationship_invitations_referral_credit
  FOREIGN KEY (referral_credit_id) 
  REFERENCES forsured.referrals(id) 
  ON DELETE SET NULL;

-- RLS Policies for referrals
ALTER TABLE forsured.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer or referred)
CREATE POLICY "Users can view their own referrals"
  ON forsured.referrals
  FOR SELECT
  USING (
    referrer_user_id = auth.uid() OR
    referred_user_id = auth.uid() OR
    referrer_org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    ) OR
    referred_org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
  );

-- Users can create referrals for their own organization
CREATE POLICY "Users can create referrals"
  ON forsured.referrals
  FOR INSERT
  WITH CHECK (
    referrer_user_id = auth.uid() AND
    referrer_org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
  );

-- Users can update their own referrals
CREATE POLICY "Users can update their own referrals"
  ON forsured.referrals
  FOR UPDATE
  USING (
    referrer_user_id = auth.uid() OR
    referrer_org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for user_referral_codes
ALTER TABLE forsured.user_referral_codes ENABLE ROW LEVEL SECURITY;

-- Users can view their own referral codes
CREATE POLICY "Users can view their own referral codes"
  ON forsured.user_referral_codes
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
  );

-- Users can create their own referral codes
CREATE POLICY "Users can create their own referral codes"
  ON forsured.user_referral_codes
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
  );

-- Users can update their own referral codes
CREATE POLICY "Users can update their own referral codes"
  ON forsured.user_referral_codes
  FOR UPDATE
  USING (
    user_id = auth.uid() OR
    org_id IN (
      SELECT scope_org_id FROM core.role_assignments WHERE user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE forsured.referrals IS 'General referral system tracking referrals from users with RFR- codes or relationship connections';
COMMENT ON TABLE forsured.user_referral_codes IS 'User-level referral codes (RFR-XXXXXX) for general business referrals accessible from profile settings';

