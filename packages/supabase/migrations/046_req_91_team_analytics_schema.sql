-- ====================================================================================
-- 046_req_91_team_analytics_schema.sql
-- Adds analytics, workload, and collaboration tables to support REQ-91.
-- ====================================================================================

BEGIN;

-- Create enum for activity events if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'team_activity_event_type'
      AND pg_type.typnamespace = 'core'::regnamespace
  ) THEN
    EXECUTE $ddl$
      CREATE TYPE core.team_activity_event_type AS ENUM (
        'team.created',
        'team.updated',
        'team.archived',
        'member.invited',
        'member.joined',
        'member.removed',
        'member.role_changed',
        'job.assigned',
        'job.unassigned',
        'application.assigned',
        'application.reassigned',
        'application.review_submitted',
        'workload.rebalanced'
      );
    $ddl$;
  END IF;
END;
$$;

-- Extend core.teams with workload/analytics configuration
ALTER TABLE core.teams
  ADD COLUMN IF NOT EXISTS workload_strategy TEXT NOT NULL DEFAULT 'manual'
    CHECK (workload_strategy IN ('manual', 'round_robin', 'load_balance')),
  ADD COLUMN IF NOT EXISTS workload_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS analytics_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS analytics_last_refreshed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS analytics_refresh_interval_minutes INTEGER NOT NULL DEFAULT 60
    CHECK (analytics_refresh_interval_minutes BETWEEN 5 AND 1440);

COMMENT ON COLUMN core.teams.workload_strategy IS
  'Controls automatic workload distribution strategy for the team.';
COMMENT ON COLUMN core.teams.workload_settings IS
  'JSONB configuration for workload balancing thresholds and limits.';
COMMENT ON COLUMN core.teams.analytics_metadata IS
  'Stores cached analytics settings such as pinned metrics and filters.';
COMMENT ON COLUMN core.teams.analytics_last_refreshed_at IS
  'Timestamp of the most recent analytics aggregation refresh.';
COMMENT ON COLUMN core.teams.analytics_refresh_interval_minutes IS
  'Desired cadence (in minutes) for refreshing analytics snapshots.';

-- Activity events table
CREATE TABLE IF NOT EXISTS core.team_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
  event_type core.team_activity_event_type NOT NULL,
  actor_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  subject_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  related_member_id UUID REFERENCES core.team_members(id) ON DELETE SET NULL,
  related_job_id UUID REFERENCES core.jobs(id) ON DELETE SET NULL,
  related_application_id UUID REFERENCES core.applications(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.team_activity_events IS
  'Time-ordered activity stream for team collaboration actions.';

-- Daily metrics rollups
CREATE TABLE IF NOT EXISTS core.team_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  members_total INTEGER NOT NULL DEFAULT 0 CHECK (members_total >= 0),
  members_active INTEGER NOT NULL DEFAULT 0 CHECK (members_active >= 0),
  members_pending INTEGER NOT NULL DEFAULT 0 CHECK (members_pending >= 0),
  jobs_active INTEGER NOT NULL DEFAULT 0 CHECK (jobs_active >= 0),
  applications_active INTEGER NOT NULL DEFAULT 0 CHECK (applications_active >= 0),
  applications_reviewed INTEGER NOT NULL DEFAULT 0 CHECK (applications_reviewed >= 0),
  applications_escalated INTEGER NOT NULL DEFAULT 0 CHECK (applications_escalated >= 0),
  pending_invitations INTEGER NOT NULL DEFAULT 0 CHECK (pending_invitations >= 0),
  avg_time_to_first_review_seconds INTEGER,
  median_time_to_first_review_seconds INTEGER,
  workload_pressure_score NUMERIC(5, 2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, metric_date)
);

COMMENT ON TABLE core.team_daily_metrics IS
  'Pre-computed daily metrics that power team analytics dashboards.';

-- Workload snapshots
CREATE TABLE IF NOT EXISTS core.team_member_workloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES core.team_members(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pending_assignments INTEGER NOT NULL DEFAULT 0 CHECK (pending_assignments >= 0),
  active_assignments INTEGER NOT NULL DEFAULT 0 CHECK (active_assignments >= 0),
  overdue_assignments INTEGER NOT NULL DEFAULT 0 CHECK (overdue_assignments >= 0),
  completed_reviews INTEGER NOT NULL DEFAULT 0 CHECK (completed_reviews >= 0),
  weekly_capacity INTEGER CHECK (weekly_capacity IS NULL OR weekly_capacity >= 0),
  availability_score NUMERIC(4, 2),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

COMMENT ON TABLE core.team_member_workloads IS
  'Snapshots of workload distribution used for automation and analytics.';

-- Collaboration mapping for multi-team job assignments
CREATE TABLE IF NOT EXISTS core.job_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES core.jobs(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES core.teams(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  role_key TEXT NOT NULL DEFAULT 'collaborator',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE core.job_team_assignments
  ADD CONSTRAINT job_team_assignments_role_key_chk
    CHECK (role_key ~ '^[a-z0-9_]+$');

COMMENT ON TABLE core.job_team_assignments IS
  'Intersection table that enables multiple teams to collaborate on a single job.';

-- Enforce updated_at semantics
CREATE TRIGGER set_updated_at_team_daily_metrics
  BEFORE UPDATE ON core.team_daily_metrics
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

-- Helper function to ensure a single primary assignment per job
CREATE OR REPLACE FUNCTION core.sync_primary_job_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_primary_id UUID;
BEGIN
  IF NEW.is_primary THEN
    UPDATE core.job_team_assignments
    SET is_primary = FALSE
    WHERE job_id = NEW.job_id
      AND id <> NEW.id;
  ELSE
    SELECT id
      INTO v_primary_id
      FROM core.job_team_assignments
      WHERE job_id = NEW.job_id
        AND is_primary = TRUE
      LIMIT 1;

    IF v_primary_id IS NULL THEN
      UPDATE core.job_team_assignments
      SET is_primary = TRUE
      WHERE id = NEW.id;
      NEW.is_primary := TRUE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_single_primary_job_assignment ON core.job_team_assignments;
CREATE TRIGGER ensure_single_primary_job_assignment
  AFTER INSERT OR UPDATE ON core.job_team_assignments
  FOR EACH ROW
  EXECUTE FUNCTION core.sync_primary_job_assignment();

COMMIT;


