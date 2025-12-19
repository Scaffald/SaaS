-- Migration: create_broker_invitations.sql
CREATE TABLE forsured.broker_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),                          -- Optional: restrict to specific email
  created_by UUID REFERENCES forsured.user_profiles(id),
  used_by UUID REFERENCES forsured.user_profiles(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 1,
  use_count INTEGER DEFAULT 0,
  notes TEXT,                                   -- Admin notes about this invitation
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generate unique invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS VARCHAR(20) AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
CREATE POLICY "Admins can manage broker invitations"
  ON forsured.broker_invitations
  FOR ALL
  USING (
    (SELECT user_type FROM forsured.user_profiles WHERE scaffald_user_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Authenticated users can read broker invitations"
    ON forsured.broker_invitations
    FOR SELECT
    USING (
        auth.role() = 'authenticated'
    );

-- Index for fast code lookups
CREATE INDEX idx_broker_invitations_code ON forsured.broker_invitations(code);
CREATE INDEX idx_broker_invitations_email ON forsured.broker_invitations(email);
