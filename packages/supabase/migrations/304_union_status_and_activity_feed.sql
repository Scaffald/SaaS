-- Migration: Union-Aware Hiring (#98) and Multi-Recruiter Activity Feed (#86)

-- ============================================================================
-- Issue #98: Union-Aware Hiring
-- ============================================================================

-- Add union status fields to applications
ALTER TABLE core.applications
  ADD COLUMN IF NOT EXISTS union_status JSONB DEFAULT NULL;

COMMENT ON COLUMN core.applications.union_status IS 'Union membership info: {is_union_member, union_name, local_number, membership_id, journeyman_status, prevailing_wage_eligible}';

-- Add union-aware fields to jobs for union/non-union job postings
ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS requires_union_membership BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS prevailing_wage_job BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS union_local_preference TEXT DEFAULT NULL;

COMMENT ON COLUMN core.jobs.requires_union_membership IS 'Whether this job requires union membership';
COMMENT ON COLUMN core.jobs.prevailing_wage_job IS 'Whether this is a prevailing wage (Davis-Bacon) job';
COMMENT ON COLUMN core.jobs.union_local_preference IS 'Preferred union local for this job posting';

-- Index for filtering applications by union status
CREATE INDEX IF NOT EXISTS idx_applications_union_member
  ON core.applications ((union_status->>'is_union_member'))
  WHERE union_status IS NOT NULL;

-- Index for filtering union jobs
CREATE INDEX IF NOT EXISTS idx_jobs_union_requirements
  ON core.jobs (requires_union_membership)
  WHERE requires_union_membership = TRUE;

-- ============================================================================
-- Issue #86: Multi-Recruiter Activity Feed
-- ============================================================================

-- Create application_activity table for audit trail
CREATE TABLE IF NOT EXISTS core.application_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES core.applications(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  actor_user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE core.application_activity IS 'Audit trail for all application-level events (status changes, notes, messages, assignments)';

-- Indexes for querying activity feed
CREATE INDEX IF NOT EXISTS idx_application_activity_app_id
  ON core.application_activity (application_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_activity_org_id
  ON core.application_activity (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_application_activity_actor
  ON core.application_activity (actor_user_id, created_at DESC);

-- RLS policies for application_activity
ALTER TABLE core.application_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view activity for applications in their org" ON core.application_activity;
CREATE POLICY "Users can view activity for applications in their org"
  ON core.application_activity FOR SELECT
  USING (
    organization_id IN (
      SELECT t.organization_id FROM core.team_members tm
      JOIN core.teams t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert activity for applications in their org" ON core.application_activity;
CREATE POLICY "Users can insert activity for applications in their org"
  ON core.application_activity FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT t.organization_id FROM core.team_members tm
      JOIN core.teams t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
    )
  );

-- Service role bypass
DROP POLICY IF EXISTS "Service role full access to application_activity" ON core.application_activity;
CREATE POLICY "Service role full access to application_activity"
  ON core.application_activity FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT ON core.application_activity TO authenticated;
GRANT ALL ON core.application_activity TO service_role;

-- Add assigned_to column for multi-recruiter assignment tracking
ALTER TABLE core.applications
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) DEFAULT NULL;

COMMENT ON COLUMN core.applications.assigned_to IS 'Currently assigned recruiter for this application';

CREATE INDEX IF NOT EXISTS idx_applications_assigned_to
  ON core.applications (assigned_to)
  WHERE assigned_to IS NOT NULL;
