-- Migration: Admin Referral Program Management
-- Description: Tables for platform admin to manage referral program settings, campaigns, and rewards

-- ============================================================================
-- REFERRAL PROGRAM SETTINGS
-- ============================================================================
-- Global settings for the referral program
CREATE TABLE IF NOT EXISTS forsured.referral_program_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Program status
  is_active BOOLEAN NOT NULL DEFAULT true,
  program_name TEXT NOT NULL DEFAULT 'Forsured Referral Program',
  program_description TEXT,
  
  -- Credit settings
  default_credit_amount DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  credit_currency TEXT NOT NULL DEFAULT 'USD',
  max_credits_per_user DECIMAL(10,2),
  credits_expiry_days INTEGER, -- NULL = never expires
  
  -- Relationship-based credit multipliers
  broker_relationship_multiplier DECIMAL(5,2) DEFAULT 1.0,
  manager_relationship_multiplier DECIMAL(5,2) DEFAULT 1.0,
  contractor_relationship_multiplier DECIMAL(5,2) DEFAULT 1.0,
  
  -- General referral credit settings
  general_referral_enabled BOOLEAN NOT NULL DEFAULT true,
  general_referral_credit_amount DECIMAL(10,2) DEFAULT 25.00,
  
  -- Requirements
  require_email_verification BOOLEAN NOT NULL DEFAULT true,
  require_company_setup BOOLEAN NOT NULL DEFAULT false,
  min_account_age_hours INTEGER DEFAULT 24, -- For credit eligibility
  
  -- Limits and fraud prevention
  max_invitations_per_day INTEGER DEFAULT 10,
  max_invitations_per_month INTEGER DEFAULT 50,
  duplicate_email_cooldown_days INTEGER DEFAULT 30,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES core.users(id)
);

-- Single row constraint - only one settings record
CREATE UNIQUE INDEX referral_program_settings_singleton ON forsured.referral_program_settings ((true));

-- Insert default settings
INSERT INTO forsured.referral_program_settings (is_active, program_name)
VALUES (true, 'Forsured Referral Program')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- REFERRAL CAMPAIGNS
-- ============================================================================
-- Time-limited or targeted referral campaigns
CREATE TABLE IF NOT EXISTS forsured.referral_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Campaign details
  name TEXT NOT NULL,
  description TEXT,
  campaign_code TEXT UNIQUE, -- Optional code for tracking
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  
  -- Timing
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  
  -- Credit overrides (NULL = use default settings)
  credit_amount DECIMAL(10,2),
  credit_multiplier DECIMAL(5,2),
  
  -- Targeting
  target_user_types TEXT[], -- ['broker', 'manager', 'subcontractor']
  target_relationship_types TEXT[], -- ['broker-manager', 'broker-contractor', 'manager-contractor']
  
  -- Limits
  max_total_credits DECIMAL(12,2),
  max_participants INTEGER,
  
  -- Tracking
  total_invitations INTEGER DEFAULT 0,
  total_connections INTEGER DEFAULT 0,
  total_credits_granted DECIMAL(12,2) DEFAULT 0.00,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES core.users(id),
  
  -- Validation
  CONSTRAINT valid_campaign_dates CHECK (ends_at IS NULL OR starts_at < ends_at)
);

CREATE INDEX idx_referral_campaigns_status ON forsured.referral_campaigns(status);
CREATE INDEX idx_referral_campaigns_dates ON forsured.referral_campaigns(starts_at, ends_at) WHERE status = 'active';

-- ============================================================================
-- REFERRAL REWARDS
-- ============================================================================
-- Track actual credit grants and rewards
CREATE TABLE IF NOT EXISTS forsured.referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who earned the reward
  user_id UUID NOT NULL REFERENCES core.users(id),
  organization_id UUID NOT NULL,
  
  -- What they earned
  credit_amount DECIMAL(10,2) NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('relationship_connection', 'general_referral', 'campaign_bonus', 'admin_grant')),
  
  -- Why they earned it
  source_invitation_id UUID REFERENCES forsured.relationship_invitations(id),
  source_referral_id UUID REFERENCES forsured.referrals(id),
  campaign_id UUID REFERENCES forsured.referral_campaigns(id),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'expired', 'cancelled')),
  
  -- Payment/usage tracking
  claimed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  used_amount DECIMAL(10,2) DEFAULT 0.00,
  
  -- Notes
  admin_notes TEXT,
  
  -- Audit fields
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by UUID REFERENCES core.users(id),
  approved_at TIMESTAMPTZ
);

CREATE INDEX idx_referral_rewards_user ON forsured.referral_rewards(user_id);
CREATE INDEX idx_referral_rewards_status ON forsured.referral_rewards(status);
CREATE INDEX idx_referral_rewards_campaign ON forsured.referral_rewards(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_referral_rewards_expires ON forsured.referral_rewards(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- REFERRAL ANALYTICS
-- ============================================================================
-- Materialized view for admin dashboard analytics
CREATE MATERIALIZED VIEW IF NOT EXISTS forsured.referral_analytics AS
SELECT
  -- Time period
  date_trunc('day', created_at) as date,
  
  -- Invitation metrics
  COUNT(*) FILTER (WHERE created_at IS NOT NULL) as total_invitations,
  COUNT(*) FILTER (WHERE status = 'connected') as successful_connections,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_invitations,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_invitations,
  
  -- By type
  COUNT(*) FILTER (WHERE inviter_type = 'broker') as broker_invitations,
  COUNT(*) FILTER (WHERE inviter_type = 'manager') as manager_invitations,
  COUNT(*) FILTER (WHERE inviter_type = 'subcontractor') as contractor_invitations,
  
  -- Conversion rate
  ROUND(
    COUNT(*) FILTER (WHERE status = 'connected')::NUMERIC / 
    NULLIF(COUNT(*), 0) * 100,
    2
  ) as conversion_rate_percent,
  
  -- Credit metrics
  SUM(CASE WHEN referral_credit_granted THEN 1 ELSE 0 END) as credits_granted_count
  
FROM forsured.relationship_invitations
GROUP BY date_trunc('day', created_at)
ORDER BY date DESC;

CREATE UNIQUE INDEX idx_referral_analytics_date ON forsured.referral_analytics(date);

-- Refresh function for analytics
CREATE OR REPLACE FUNCTION refresh_referral_analytics()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY forsured.referral_analytics;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE forsured.referral_program_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.referral_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.referral_rewards ENABLE ROW LEVEL SECURITY;

-- Settings: Admin read/write only
CREATE POLICY referral_program_settings_admin_all
  ON forsured.referral_program_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

-- Campaigns: Admin read/write, users can read active campaigns
CREATE POLICY referral_campaigns_admin_all
  ON forsured.referral_campaigns
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY referral_campaigns_users_read
  ON forsured.referral_campaigns
  FOR SELECT
  TO authenticated
  USING (status = 'active' AND (starts_at IS NULL OR starts_at <= now()) AND (ends_at IS NULL OR ends_at >= now()));

-- Rewards: Admin full access, users can view their own
CREATE POLICY referral_rewards_admin_all
  ON forsured.referral_rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
      AND r.name = 'admin'
    )
  );

CREATE POLICY referral_rewards_users_own
  ON forsured.referral_rewards
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_referral_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_program_settings_updated_at
  BEFORE UPDATE ON forsured.referral_program_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_management_updated_at();

CREATE TRIGGER update_referral_campaigns_updated_at
  BEFORE UPDATE ON forsured.referral_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_management_updated_at();

CREATE TRIGGER update_referral_rewards_updated_at
  BEFORE UPDATE ON forsured.referral_rewards
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_management_updated_at();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get active program settings
CREATE OR REPLACE FUNCTION get_active_referral_settings()
RETURNS forsured.referral_program_settings
LANGUAGE sql
STABLE
AS $$
  SELECT * FROM forsured.referral_program_settings WHERE is_active = true LIMIT 1;
$$;

-- Check if user can send more invitations today
CREATE OR REPLACE FUNCTION can_send_invitation(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  settings forsured.referral_program_settings;
  today_count INTEGER;
BEGIN
  -- Get settings
  SELECT * INTO settings FROM get_active_referral_settings();
  
  IF settings IS NULL THEN
    RETURN false;
  END IF;
  
  -- Count today's invitations
  SELECT COUNT(*) INTO today_count
  FROM forsured.relationship_invitations
  WHERE inviter_user_id = user_uuid
  AND created_at >= CURRENT_DATE;
  
  -- Check against limit
  RETURN today_count < settings.max_invitations_per_day;
END;
$$;

-- Get total credits available for user
CREATE OR REPLACE FUNCTION get_user_available_credits(user_uuid UUID)
RETURNS DECIMAL(10,2)
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(SUM(credit_amount - used_amount), 0.00)
  FROM forsured.referral_rewards
  WHERE user_id = user_uuid
  AND status IN ('approved', 'paid')
  AND (expires_at IS NULL OR expires_at > now())
  AND credit_amount > used_amount;
$$;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE forsured.referral_program_settings IS 'Global settings for the referral program - admin managed';
COMMENT ON TABLE forsured.referral_campaigns IS 'Time-limited or targeted referral campaigns';
COMMENT ON TABLE forsured.referral_rewards IS 'Track actual credit grants and rewards to users';
COMMENT ON MATERIALIZED VIEW forsured.referral_analytics IS 'Aggregated analytics for admin dashboard';
COMMENT ON FUNCTION refresh_referral_analytics() IS 'Refresh the materialized analytics view';
COMMENT ON FUNCTION can_send_invitation(UUID) IS 'Check if user has remaining invitation quota for today';
COMMENT ON FUNCTION get_user_available_credits(UUID) IS 'Calculate total available credits for user';

