-- Migration: create_settings_tables.sql

-- User settings table (extends user_profiles)
CREATE TABLE forsured.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,
  notification_preferences JSONB DEFAULT '{}',
  ui_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- GC-specific settings
CREATE TABLE forsured.gc_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  default_insurance_requirements JSONB DEFAULT '{}',
  require_additional_insured BOOLEAN DEFAULT TRUE,
  require_waiver_of_subrogation BOOLEAN DEFAULT TRUE,
  auto_send_reminders BOOLEAN DEFAULT TRUE,
  reminder_days_before INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Contractor-specific settings
CREATE TABLE forsured.contractor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  auto_share_documents BOOLEAN DEFAULT TRUE,
  insurance_agent_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Broker-specific settings
CREATE TABLE forsured.broker_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broker_id UUID NOT NULL REFERENCES forsured.user_profiles(id) ON DELETE CASCADE,
  agency_info JSONB DEFAULT '{}',
  auto_assign_clients BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(broker_id)
);
