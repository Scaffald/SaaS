-- Migration: create_user_profiles.sql
CREATE TABLE forsured.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scaffald_user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('gc', 'contractor', 'broker', 'admin')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  onboarding_data JSONB DEFAULT '{}',
  company_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(scaffald_user_id)
);

-- RLS Policy
CREATE POLICY "Users can read own profile"
  ON forsured.user_profiles FOR SELECT
  USING (scaffald_user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON forsured.user_profiles FOR UPDATE
  USING (scaffald_user_id = auth.uid());

-- Indexes
CREATE INDEX idx_user_profiles_scaffald_user_id ON forsured.user_profiles(scaffald_user_id);
CREATE INDEX idx_user_profiles_user_type ON forsured.user_profiles(user_type);
