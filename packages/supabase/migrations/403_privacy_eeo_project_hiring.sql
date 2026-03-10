-- ========================================================
-- Migration 403: Privacy requests, EEO data, and project hiring
-- Supports Issues #94, #95, #99
-- ========================================================

BEGIN;

-- ========================================================
-- GDPR/CCPA Data Requests (Issue #94)
-- ========================================================

-- Privacy data requests table (extends existing account_deletions)
CREATE TABLE IF NOT EXISTS core.privacy_data_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('export', 'deletion', 'correction')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'denied', 'expired')),
  categories TEXT[] DEFAULT '{}',
  correction_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  deadline_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Auto-set 30-day deadline on insert
CREATE OR REPLACE FUNCTION core.set_privacy_request_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deadline_at IS NULL THEN
    NEW.deadline_at := NEW.created_at + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_privacy_request_deadline
  BEFORE INSERT ON core.privacy_data_requests
  FOR EACH ROW EXECUTE FUNCTION core.set_privacy_request_deadline();

-- Updated_at trigger
CREATE TRIGGER trg_privacy_request_updated
  BEFORE UPDATE ON core.privacy_data_requests
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Opt-out preferences table
CREATE TABLE IF NOT EXISTS core.privacy_opt_outs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('sale', 'sharing', 'targeted_advertising', 'sensitive_data')),
  opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  opted_out_at TIMESTAMPTZ,
  source TEXT NOT NULL DEFAULT 'user' CHECK (source IN ('user', 'gpc', 'default')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, category)
);

CREATE TRIGGER trg_opt_out_updated
  BEFORE UPDATE ON core.privacy_opt_outs
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON core.privacy_data_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON core.privacy_data_requests (status);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_deadline ON core.privacy_data_requests (deadline_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_privacy_opt_outs_user ON core.privacy_opt_outs (user_id);

-- RLS
ALTER TABLE core.privacy_data_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.privacy_opt_outs ENABLE ROW LEVEL SECURITY;

CREATE POLICY privacy_requests_select ON core.privacy_data_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY privacy_requests_insert ON core.privacy_data_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY privacy_opt_outs_select ON core.privacy_opt_outs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY privacy_opt_outs_upsert ON core.privacy_opt_outs
  FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- EEO/OFCCP Compliance Data (Issue #95)
-- ========================================================

-- EEO voluntary self-identification data
CREATE TABLE IF NOT EXISTS core.eeo_self_identification (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Protected class data (all optional, voluntary)
  ethnicity TEXT CHECK (ethnicity IN ('hispanic', 'white', 'black', 'asian', 'native_american', 'pacific_islander', 'two_or_more', 'declined')),
  gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'declined')),
  veteran_status TEXT CHECK (veteran_status IN ('protected_veteran', 'non_veteran', 'declined')),
  disability_status TEXT CHECK (disability_status IN ('yes', 'no', 'declined')),
  -- Audit trail
  collected_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  collection_method TEXT DEFAULT 'voluntary_form',
  -- Compliance metadata
  form_version TEXT DEFAULT '1.0',
  metadata JSONB DEFAULT '{}'
);

-- EEO report snapshots (generated reports)
CREATE TABLE IF NOT EXISTS core.eeo_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('eeo1', 'ofccp_applicant_flow', 'adverse_impact')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  generated_by UUID REFERENCES auth.users(id),
  report_data JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'submitted')),
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_eeo_self_id_application ON core.eeo_self_identification (application_id);
CREATE INDEX IF NOT EXISTS idx_eeo_self_id_user ON core.eeo_self_identification (user_id);
CREATE INDEX IF NOT EXISTS idx_eeo_reports_org ON core.eeo_reports (organization_id);
CREATE INDEX IF NOT EXISTS idx_eeo_reports_period ON core.eeo_reports (period_start, period_end);

-- RLS
ALTER TABLE core.eeo_self_identification ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.eeo_reports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own EEO data
CREATE POLICY eeo_self_id_select ON core.eeo_self_identification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY eeo_self_id_insert ON core.eeo_self_identification
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ========================================================
-- Project-Based Hiring (Issue #99)
-- ========================================================

-- Hiring projects table
CREATE TABLE IF NOT EXISTS core.hiring_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'hiring', 'active', 'completed', 'cancelled')),
  start_date DATE,
  end_date DATE,
  budget_cents BIGINT,
  budget_currency TEXT DEFAULT 'USD',
  total_positions INTEGER DEFAULT 0,
  filled_positions INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Project roles (positions to fill)
CREATE TABLE IF NOT EXISTS core.hiring_project_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES core.hiring_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  filled INTEGER NOT NULL DEFAULT 0,
  pay_rate_min_cents BIGINT,
  pay_rate_max_cents BIGINT,
  pay_rate_type TEXT DEFAULT 'hourly' CHECK (pay_rate_type IN ('hourly', 'salary', 'project')),
  required_skills TEXT[] DEFAULT '{}',
  required_certifications TEXT[] DEFAULT '{}',
  job_id UUID, -- Optional link to a job posting
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Project crew assignments
CREATE TABLE IF NOT EXISTS core.hiring_project_crew (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES core.hiring_projects(id) ON DELETE CASCADE,
  role_id UUID REFERENCES core.hiring_project_roles(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'terminated')),
  start_date DATE,
  end_date DATE,
  assigned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Updated_at triggers
CREATE TRIGGER trg_hiring_projects_updated
  BEFORE UPDATE ON core.hiring_projects
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_hiring_project_roles_updated
  BEFORE UPDATE ON core.hiring_project_roles
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hiring_projects_org ON core.hiring_projects (organization_id);
CREATE INDEX IF NOT EXISTS idx_hiring_projects_status ON core.hiring_projects (status);
CREATE INDEX IF NOT EXISTS idx_hiring_project_roles_project ON core.hiring_project_roles (project_id);
CREATE INDEX IF NOT EXISTS idx_hiring_project_crew_project ON core.hiring_project_crew (project_id);
CREATE INDEX IF NOT EXISTS idx_hiring_project_crew_user ON core.hiring_project_crew (user_id);

-- RLS
ALTER TABLE core.hiring_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.hiring_project_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.hiring_project_crew ENABLE ROW LEVEL SECURITY;

COMMIT;
