-- ====================================================================================
-- 047_req_91_team_analytics_policies.sql
-- Adds indexes, grants, and RLS policies for new analytics/workload tables.
-- ====================================================================================

BEGIN;

-- Indexes for analytics tables
CREATE INDEX IF NOT EXISTS team_activity_events_team_occurred_idx
  ON core.team_activity_events (team_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS team_activity_events_org_idx
  ON core.team_activity_events (organization_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS team_daily_metrics_team_date_idx
  ON core.team_daily_metrics (team_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS team_member_workloads_team_captured_idx
  ON core.team_member_workloads (team_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS team_member_workloads_member_captured_idx
  ON core.team_member_workloads (team_member_id, captured_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS job_team_assignments_job_team_unique
  ON core.job_team_assignments (job_id, team_id);

CREATE INDEX IF NOT EXISTS job_team_assignments_primary_idx
  ON core.job_team_assignments (job_id, is_primary DESC);

-- Enable and force RLS
ALTER TABLE core.team_activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_activity_events FORCE ROW LEVEL SECURITY;

ALTER TABLE core.team_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_daily_metrics FORCE ROW LEVEL SECURITY;

ALTER TABLE core.team_member_workloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.team_member_workloads FORCE ROW LEVEL SECURITY;

ALTER TABLE core.job_team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.job_team_assignments FORCE ROW LEVEL SECURITY;

-- team_activity_events policies
DROP POLICY IF EXISTS team_activity_events_select ON core.team_activity_events;
DROP POLICY IF EXISTS team_activity_events_mutate ON core.team_activity_events;

CREATE POLICY team_activity_events_select
  ON core.team_activity_events
  FOR SELECT
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.view'::core.team_permission)
    OR core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_activity_events_mutate
  ON core.team_activity_events
  FOR ALL
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR core.has_team_permission(team_id, 'invitation.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR core.has_team_permission(team_id, 'invitation.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- team_daily_metrics policies
DROP POLICY IF EXISTS team_daily_metrics_select ON core.team_daily_metrics;
DROP POLICY IF EXISTS team_daily_metrics_modify ON core.team_daily_metrics;

CREATE POLICY team_daily_metrics_select
  ON core.team_daily_metrics
  FOR SELECT
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'analytics.view'::core.team_permission)
    OR core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_daily_metrics_modify
  ON core.team_daily_metrics
  FOR ALL
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- team_member_workloads policies
DROP POLICY IF EXISTS team_member_workloads_select ON core.team_member_workloads;
DROP POLICY IF EXISTS team_member_workloads_modify ON core.team_member_workloads;

CREATE POLICY team_member_workloads_select
  ON core.team_member_workloads
  FOR SELECT
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'analytics.view'::core.team_permission)
    OR core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR team_member_id IN (
      SELECT tm.id
      FROM core.team_members tm
      WHERE tm.id = team_member_id
        AND tm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY team_member_workloads_modify
  ON core.team_member_workloads
  FOR ALL
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- job_team_assignments policies
DROP POLICY IF EXISTS job_team_assignments_read ON core.job_team_assignments;
DROP POLICY IF EXISTS job_team_assignments_write ON core.job_team_assignments;

CREATE POLICY job_team_assignments_read
  ON core.job_team_assignments
  FOR SELECT
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.view'::core.team_permission)
    OR core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

CREATE POLICY job_team_assignments_write
  ON core.job_team_assignments
  FOR ALL
  TO authenticated
  USING (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR core.has_team_permission(team_id, 'job.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    core.has_team_permission(team_id, 'team.manage'::core.team_permission)
    OR core.has_team_permission(team_id, 'job.manage'::core.team_permission)
    OR EXISTS (
      SELECT 1
      FROM core.teams t
      JOIN core.organizations o ON o.id = t.organization_id
      WHERE t.id = team_id
        AND o.owner_user_id = auth.uid()
    )
  );

-- Grants
GRANT SELECT ON core.team_activity_events TO authenticated;
GRANT SELECT ON core.team_daily_metrics TO authenticated;
GRANT SELECT ON core.team_member_workloads TO authenticated;
GRANT SELECT ON core.job_team_assignments TO authenticated;

GRANT ALL ON core.team_activity_events TO service_role;
GRANT ALL ON core.team_daily_metrics TO service_role;
GRANT ALL ON core.team_member_workloads TO service_role;
GRANT ALL ON core.job_team_assignments TO service_role;

COMMIT;


