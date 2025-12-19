-- Migration: 237_forsured_user_set_types.sql
-- REQ-4: Multi-Industry User Set Type System with Configurable Lexicon
--
-- Creates tables for managing user set types (industry verticals) and their
-- configurable lexicon for UI labels. Enables the platform to support multiple
-- industries (Construction, Property Management, etc.) with industry-appropriate terminology.

-- Create user_set_types table
CREATE TABLE forsured.user_set_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  manager_label_singular TEXT NOT NULL,
  manager_label_plural TEXT NOT NULL,
  contractor_label_singular TEXT NOT NULL,
  contractor_label_plural TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  lexicon JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraints
  CONSTRAINT user_set_types_name_unique UNIQUE (name),
  CONSTRAINT user_set_types_slug_unique UNIQUE (slug),

  -- Slug format validation: lowercase, alphanumeric, hyphens only
  CONSTRAINT user_set_types_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

-- Create user_set_type_lexicon table for granular lexicon entries
CREATE TABLE forsured.user_set_type_lexicon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_set_type_id UUID NOT NULL REFERENCES forsured.user_set_types(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint on (user_set_type_id, key)
  CONSTRAINT user_set_type_lexicon_unique UNIQUE (user_set_type_id, key)
);

-- Add user_set_type_id to user_profiles table
ALTER TABLE forsured.user_profiles
ADD COLUMN user_set_type_id UUID REFERENCES forsured.user_set_types(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX idx_user_set_types_name ON forsured.user_set_types(name);
CREATE INDEX idx_user_set_types_slug ON forsured.user_set_types(slug);
CREATE INDEX idx_user_set_types_is_active ON forsured.user_set_types(is_active);

CREATE INDEX idx_user_set_type_lexicon_type_id ON forsured.user_set_type_lexicon(user_set_type_id);
CREATE INDEX idx_user_set_type_lexicon_category ON forsured.user_set_type_lexicon(category);

CREATE INDEX idx_user_profiles_user_set_type_id ON forsured.user_profiles(user_set_type_id);

-- Enable RLS
ALTER TABLE forsured.user_set_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.user_set_type_lexicon ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_set_types

-- Public can read active user set types (for signup flow)
CREATE POLICY "Anyone can read active user set types"
  ON forsured.user_set_types FOR SELECT
  USING (is_active = TRUE);

-- Admins can manage all user set types
CREATE POLICY "Admins can read all user set types"
  ON forsured.user_set_types FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles up
      WHERE up.scaffald_user_id = auth.uid()
      AND up.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert user set types"
  ON forsured.user_set_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles up
      WHERE up.scaffald_user_id = auth.uid()
      AND up.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update user set types"
  ON forsured.user_set_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles up
      WHERE up.scaffald_user_id = auth.uid()
      AND up.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete user set types"
  ON forsured.user_set_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles up
      WHERE up.scaffald_user_id = auth.uid()
      AND up.user_type = 'admin'
    )
  );

-- RLS Policies for user_set_type_lexicon

-- Anyone can read lexicon entries (needed for UI rendering)
CREATE POLICY "Anyone can read user set type lexicon"
  ON forsured.user_set_type_lexicon FOR SELECT
  USING (TRUE);

-- Admins can manage lexicon entries
CREATE POLICY "Admins can insert lexicon entries"
  ON forsured.user_set_type_lexicon FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles up
      WHERE up.scaffald_user_id = auth.uid()
      AND up.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update lexicon entries"
  ON forsured.user_set_type_lexicon FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles up
      WHERE up.scaffald_user_id = auth.uid()
      AND up.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can delete lexicon entries"
  ON forsured.user_set_type_lexicon FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM forsured.user_profiles up
      WHERE up.scaffald_user_id = auth.uid()
      AND up.user_type = 'admin'
    )
  );

-- Create trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION forsured.update_user_set_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_set_types_updated_at
  BEFORE UPDATE ON forsured.user_set_types
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_user_set_types_updated_at();

CREATE TRIGGER user_set_type_lexicon_updated_at
  BEFORE UPDATE ON forsured.user_set_type_lexicon
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_user_set_types_updated_at();

-- Grant access to anon and authenticated roles
GRANT SELECT ON forsured.user_set_types TO anon, authenticated;
GRANT SELECT ON forsured.user_set_type_lexicon TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON forsured.user_set_types TO authenticated;
GRANT INSERT, UPDATE, DELETE ON forsured.user_set_type_lexicon TO authenticated;

COMMENT ON TABLE forsured.user_set_types IS 'Stores user set types (industry verticals) with their role labels and lexicon configuration';
COMMENT ON TABLE forsured.user_set_type_lexicon IS 'Stores individual lexicon entries for each user set type, organized by category';
COMMENT ON COLUMN forsured.user_profiles.user_set_type_id IS 'References the user set type selected during signup (null for brokers/admins)';
