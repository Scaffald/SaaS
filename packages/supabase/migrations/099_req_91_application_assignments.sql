-- ====================================================================================
-- 099_req_91_application_assignments.sql
-- Adds assignment tracking columns for applications to support team auto-assignment.
-- ====================================================================================

BEGIN;

ALTER TABLE core.applications
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES core.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES core.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS applications_assigned_to_idx
  ON core.applications(assigned_to);

CREATE INDEX IF NOT EXISTS applications_assigned_at_idx
  ON core.applications(assigned_at DESC);

COMMENT ON COLUMN core.applications.assigned_to IS
  'Current team member responsible for this application.';
COMMENT ON COLUMN core.applications.assigned_at IS
  'Timestamp when the application was assigned to the current team member.';
COMMENT ON COLUMN core.applications.assigned_by IS
  'User who performed the most recent assignment. NULL when assigned automatically.';

COMMIT;


