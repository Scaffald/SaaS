-- ========================================================
-- Migration 404: Calendar scheduling, HRIS integrations, enhanced job matching
-- Supports Issues #87, #88, #96, #97, #106
-- ========================================================

BEGIN;

-- ========================================================
-- Calendar & Interview Scheduling (Issues #87, #88)
-- ========================================================

-- Calendar provider connections (Google Calendar, Outlook)
CREATE TABLE IF NOT EXISTS core.calendar_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  provider_account_id TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE (user_id, provider)
);

-- Availability windows for interview scheduling
CREATE TABLE IF NOT EXISTS core.interview_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CHECK (start_time < end_time)
);

-- Interview slots proposed by employers
CREATE TABLE IF NOT EXISTS core.interview_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  proposed_by UUID NOT NULL REFERENCES auth.users(id),
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  location_type TEXT NOT NULL DEFAULT 'video' CHECK (location_type IN ('video', 'phone', 'in_person')),
  location_details TEXT,
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'booked', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Self-scheduling bookings by candidates
CREATE TABLE IF NOT EXISTS core.interview_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id UUID NOT NULL REFERENCES core.interview_slots(id) ON DELETE CASCADE,
  application_id UUID NOT NULL,
  candidate_id UUID NOT NULL REFERENCES auth.users(id),
  booked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  reminder_sent_at TIMESTAMPTZ,
  calendar_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Self-scheduling links
CREATE TABLE IF NOT EXISTS core.scheduling_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL,
  max_bookings INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Triggers
DROP TRIGGER IF EXISTS trg_calendar_connections_updated ON core.calendar_connections;
CREATE TRIGGER trg_calendar_connections_updated
  BEFORE UPDATE ON core.calendar_connections
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_interview_availability_updated ON core.interview_availability;
CREATE TRIGGER trg_interview_availability_updated
  BEFORE UPDATE ON core.interview_availability
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_interview_slots_updated ON core.interview_slots;
CREATE TRIGGER trg_interview_slots_updated
  BEFORE UPDATE ON core.interview_slots
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_interview_bookings_updated ON core.interview_bookings;
CREATE TRIGGER trg_interview_bookings_updated
  BEFORE UPDATE ON core.interview_bookings
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user ON core.calendar_connections (user_id);
CREATE INDEX IF NOT EXISTS idx_interview_availability_user ON core.interview_availability (user_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_application ON core.interview_slots (application_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_org ON core.interview_slots (organization_id);
CREATE INDEX IF NOT EXISTS idx_interview_slots_status ON core.interview_slots (status);
CREATE INDEX IF NOT EXISTS idx_interview_bookings_slot ON core.interview_bookings (slot_id);
CREATE INDEX IF NOT EXISTS idx_interview_bookings_candidate ON core.interview_bookings (candidate_id);
CREATE INDEX IF NOT EXISTS idx_scheduling_links_token ON core.scheduling_links (token);
CREATE INDEX IF NOT EXISTS idx_scheduling_links_app ON core.scheduling_links (application_id);

-- RLS
ALTER TABLE core.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.interview_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.interview_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.interview_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.scheduling_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calendar_connections_user ON core.calendar_connections;
CREATE POLICY calendar_connections_user ON core.calendar_connections
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS interview_availability_user ON core.interview_availability;
CREATE POLICY interview_availability_user ON core.interview_availability
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS interview_slots_select ON core.interview_slots;
CREATE POLICY interview_slots_select ON core.interview_slots
  FOR SELECT USING (auth.uid() = proposed_by OR auth.uid() IN (
    SELECT candidate_id FROM core.interview_bookings WHERE slot_id = id
  ));

DROP POLICY IF EXISTS interview_slots_insert ON core.interview_slots;
CREATE POLICY interview_slots_insert ON core.interview_slots
  FOR INSERT WITH CHECK (auth.uid() = proposed_by);

DROP POLICY IF EXISTS interview_bookings_select ON core.interview_bookings;
CREATE POLICY interview_bookings_select ON core.interview_bookings
  FOR SELECT USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS interview_bookings_insert ON core.interview_bookings;
CREATE POLICY interview_bookings_insert ON core.interview_bookings
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

DROP POLICY IF EXISTS scheduling_links_select ON core.scheduling_links;
CREATE POLICY scheduling_links_select ON core.scheduling_links
  FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS scheduling_links_insert ON core.scheduling_links;
CREATE POLICY scheduling_links_insert ON core.scheduling_links
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- ========================================================
-- HRIS/Payroll Integrations (Issue #96)
-- ========================================================

-- HRIS provider connections
CREATE TABLE IF NOT EXISTS core.hris_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('adp', 'paychex', 'gusto', 'bamboohr', 'rippling')),
  display_name TEXT,
  api_key_encrypted TEXT,
  client_id TEXT,
  client_secret_encrypted TEXT,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('realtime', 'hourly', 'daily', 'weekly', 'manual')),
  field_mappings JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE (organization_id, provider)
);

-- HRIS sync logs
CREATE TABLE IF NOT EXISTS core.hris_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES core.hris_connections(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual')),
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  records_synced INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- HRIS employee mappings (maps Scaffald users to HRIS records)
CREATE TABLE IF NOT EXISTS core.hris_employee_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES core.hris_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_employee_id TEXT NOT NULL,
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error', 'excluded')),
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE (connection_id, user_id),
  UNIQUE (connection_id, external_employee_id)
);

-- Triggers
DROP TRIGGER IF EXISTS trg_hris_connections_updated ON core.hris_connections;
CREATE TRIGGER trg_hris_connections_updated
  BEFORE UPDATE ON core.hris_connections
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_hris_employee_mappings_updated ON core.hris_employee_mappings;
CREATE TRIGGER trg_hris_employee_mappings_updated
  BEFORE UPDATE ON core.hris_employee_mappings
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hris_connections_org ON core.hris_connections (organization_id);
CREATE INDEX IF NOT EXISTS idx_hris_sync_logs_connection ON core.hris_sync_logs (connection_id);
CREATE INDEX IF NOT EXISTS idx_hris_sync_logs_status ON core.hris_sync_logs (status);
CREATE INDEX IF NOT EXISTS idx_hris_employee_mappings_connection ON core.hris_employee_mappings (connection_id);
CREATE INDEX IF NOT EXISTS idx_hris_employee_mappings_user ON core.hris_employee_mappings (user_id);

-- RLS
ALTER TABLE core.hris_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.hris_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.hris_employee_mappings ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- Background Check Provider Configuration (Issue #97)
-- ========================================================

-- Provider configurations for the organization
CREATE TABLE IF NOT EXISTS core.background_check_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('checkr', 'sterling', 'accurate', 'hireright')),
  display_name TEXT,
  api_key_encrypted TEXT,
  webhook_secret_encrypted TEXT,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  supported_packages TEXT[] DEFAULT '{}',
  default_package TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE (organization_id, provider)
);

-- Background check webhook events
CREATE TABLE IF NOT EXISTS core.background_check_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES core.background_check_providers(id) ON DELETE CASCADE,
  check_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Triggers
DROP TRIGGER IF EXISTS trg_bg_check_providers_updated ON core.background_check_providers;
CREATE TRIGGER trg_bg_check_providers_updated
  BEFORE UPDATE ON core.background_check_providers
  FOR EACH ROW EXECUTE FUNCTION core.update_updated_at_column();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bg_check_providers_org ON core.background_check_providers (organization_id);
CREATE INDEX IF NOT EXISTS idx_bg_check_events_provider ON core.background_check_events (provider_id);
CREATE INDEX IF NOT EXISTS idx_bg_check_events_check ON core.background_check_events (check_id);
CREATE INDEX IF NOT EXISTS idx_bg_check_events_unprocessed ON core.background_check_events (processed) WHERE processed = FALSE;

-- RLS
ALTER TABLE core.background_check_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.background_check_events ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- Enhanced Job Matching (Issue #106)
-- ========================================================

-- Job match scores (cached multi-dimensional scoring)
CREATE TABLE IF NOT EXISTS core.job_match_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL,
  -- Multi-dimensional scoring
  skills_score NUMERIC(5,2) DEFAULT 0,
  riasec_score NUMERIC(5,2) DEFAULT 0,
  work_values_score NUMERIC(5,2) DEFAULT 0,
  abilities_score NUMERIC(5,2) DEFAULT 0,
  experience_score NUMERIC(5,2) DEFAULT 0,
  total_score NUMERIC(5,2) DEFAULT 0,
  -- Match breakdown for UI display
  match_breakdown JSONB DEFAULT '{}',
  match_reasons TEXT[] DEFAULT '{}',
  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  algorithm_version TEXT DEFAULT '2.0',
  metadata JSONB DEFAULT '{}'
);

-- Job O*NET occupation mapping (for smart job posting)
CREATE TABLE IF NOT EXISTS core.job_occupation_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL,
  onet_code TEXT NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 1.0,
  mapped_by TEXT DEFAULT 'manual' CHECK (mapped_by IN ('manual', 'auto', 'ai')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (job_id, onet_code)
);

-- Enhanced calculate_application_score with multi-dimensional matching
CREATE OR REPLACE FUNCTION core.calculate_multi_match_score(
  p_user_id UUID,
  p_job_id UUID
)
RETURNS TABLE (
  total_score NUMERIC,
  skills_score NUMERIC,
  riasec_score NUMERIC,
  work_values_score NUMERIC,
  abilities_score NUMERIC,
  experience_score NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_skills NUMERIC := 0;
  v_riasec NUMERIC := 0;
  v_work_values NUMERIC := 0;
  v_abilities NUMERIC := 0;
  v_experience NUMERIC := 0;
BEGIN
  -- Skills match (30 points max)
  SELECT LEAST(30, COUNT(*) * 5) INTO v_skills
  FROM core.user_skills us
  WHERE us.user_id = p_user_id
  AND us.skill_id IN (
    SELECT unnest(required_skills) FROM core.jobs WHERE id = p_job_id
  );

  -- RIASEC match (15 points max) - compare user profile to job occupation
  -- Placeholder: would compare user RIASEC code with O*NET occupation RIASEC
  v_riasec := 10; -- Default mid score

  -- Work values match (10 points max)
  -- Placeholder: would compare user work values with job requirements
  v_work_values := 7;

  -- Abilities match (15 points max)
  -- Placeholder: would compare user abilities with O*NET requirements
  v_abilities := 10;

  -- Experience match (30 points max)
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM core.experiences e
      WHERE e.user_id = p_user_id
      AND e.end_date IS NULL
    ) THEN 20
    ELSE 10
  END INTO v_experience;

  total_score := v_skills + v_riasec + v_work_values + v_abilities + v_experience;
  skills_score := v_skills;
  riasec_score := v_riasec;
  work_values_score := v_work_values;
  abilities_score := v_abilities;
  experience_score := v_experience;

  RETURN NEXT;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_match_scores_user ON core.job_match_scores (user_id);
CREATE INDEX IF NOT EXISTS idx_job_match_scores_job ON core.job_match_scores (job_id);
CREATE INDEX IF NOT EXISTS idx_job_match_scores_total ON core.job_match_scores (total_score DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_match_scores_unique ON core.job_match_scores (user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_job_occupation_mappings_job ON core.job_occupation_mappings (job_id);
CREATE INDEX IF NOT EXISTS idx_job_occupation_mappings_onet ON core.job_occupation_mappings (onet_code);

-- RLS
ALTER TABLE core.job_match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.job_occupation_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_match_scores_select ON core.job_match_scores;
CREATE POLICY job_match_scores_select ON core.job_match_scores
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS job_occupation_mappings_select ON core.job_occupation_mappings;
CREATE POLICY job_occupation_mappings_select ON core.job_occupation_mappings
  FOR SELECT USING (TRUE);

COMMIT;
