-- ====================================================================================
-- 100_req_91_application_assignment_history.sql
-- Tracks manual and automatic application assignment history for teams.
-- ====================================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS core.application_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES core.applications(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES core.users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL DEFAULT 'manual',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE core.application_assignment_history IS
  'Historical record of application assignments for auditing and analytics.';

CREATE INDEX IF NOT EXISTS application_assignment_history_application_idx
  ON core.application_assignment_history(application_id);

CREATE INDEX IF NOT EXISTS application_assignment_history_team_idx
  ON core.application_assignment_history(team_id);

CREATE INDEX IF NOT EXISTS application_assignment_history_assigned_to_idx
  ON core.application_assignment_history(assigned_to);

COMMIT;


