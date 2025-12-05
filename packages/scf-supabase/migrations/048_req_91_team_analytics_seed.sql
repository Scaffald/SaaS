-- ====================================================================================
-- 048_req_91_team_analytics_seed.sql
-- Seeds analytics tables, backfills legacy job assignments, and creates helper views.
-- ====================================================================================

BEGIN;

-- Backfill job_team_assignments from existing job columns (team_id or assigned_team_id)
DO $$
DECLARE
  v_has_assigned_team_id BOOLEAN;
  v_has_team_id BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'core'
      AND table_name = 'jobs'
      AND column_name = 'assigned_team_id'
  ) INTO v_has_assigned_team_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'core'
      AND table_name = 'jobs'
      AND column_name = 'team_id'
  ) INTO v_has_team_id;

  IF v_has_assigned_team_id OR v_has_team_id THEN
    EXECUTE format(
      $sql$
      WITH source_jobs AS (
        SELECT
          j.id AS job_id,
          %s AS team_id,
          j.organization_id,
          j.created_by_user_id
        FROM core.jobs j
        WHERE %s IS NOT NULL
      )
      INSERT INTO core.job_team_assignments (
        job_id,
        team_id,
        organization_id,
        assigned_by,
        is_primary,
        role_key,
        metadata
      )
      SELECT
        sj.job_id,
        sj.team_id,
        sj.organization_id,
        sj.created_by_user_id,
        TRUE,
        'owner',
        jsonb_build_object('source', 'backfill', 'migration', '048_req_91_team_analytics_seed')
      FROM source_jobs sj
      WHERE NOT EXISTS (
        SELECT 1
        FROM core.job_team_assignments jta
        WHERE jta.job_id = sj.job_id
          AND jta.team_id = sj.team_id
      );
      $sql$,
      CASE
        WHEN v_has_assigned_team_id AND v_has_team_id THEN 'COALESCE(j.team_id, j.assigned_team_id)'
        WHEN v_has_team_id THEN 'j.team_id'
        ELSE 'j.assigned_team_id'
      END,
      CASE
        WHEN v_has_assigned_team_id AND v_has_team_id THEN 'COALESCE(j.team_id, j.assigned_team_id)'
        WHEN v_has_team_id THEN 'j.team_id'
        ELSE 'j.assigned_team_id'
      END
    );
  END IF;
END;
$$;

-- Seed daily metrics for existing teams (current day baseline)
INSERT INTO core.team_daily_metrics (
  id,
  organization_id,
  team_id,
  metric_date,
  members_total,
  members_active,
  members_pending,
  jobs_active,
  applications_active,
  applications_reviewed,
  applications_escalated,
  pending_invitations,
  avg_time_to_first_review_seconds,
  median_time_to_first_review_seconds,
  workload_pressure_score,
  metadata
)
SELECT
  gen_random_uuid(),
  t.organization_id,
  t.id,
  CURRENT_DATE,
  (SELECT COUNT(*) FROM core.team_members tm WHERE tm.team_id = t.id AND tm.status IN ('active', 'pending')),
  (SELECT COUNT(*) FROM core.team_members tm WHERE tm.team_id = t.id AND tm.status = 'active'),
  (SELECT COUNT(*) FROM core.team_members tm WHERE tm.team_id = t.id AND tm.status = 'pending'),
  (SELECT COUNT(*) FROM core.jobs j WHERE j.organization_id = t.organization_id AND (j.team_id = t.id OR EXISTS (
    SELECT 1
    FROM core.job_team_assignments jta
    WHERE jta.job_id = j.id
      AND jta.team_id = t.id
  )) AND j.status IN ('open', 'active')),
  0,
  0,
  0,
  (SELECT COUNT(*) FROM core.team_invitations ti WHERE ti.team_id = t.id AND ti.status = 'pending'),
  NULL,
  NULL,
  NULL,
  jsonb_build_object('source', 'seed', 'migration', '048_req_91_team_analytics_seed')
FROM core.teams t
WHERE NOT EXISTS (
  SELECT 1
  FROM core.team_daily_metrics dm
  WHERE dm.team_id = t.id
    AND dm.metric_date = CURRENT_DATE
);

-- Seed member workload snapshots for each active team member
INSERT INTO core.team_member_workloads (
  id,
  organization_id,
  team_id,
  team_member_id,
  user_id,
  captured_at,
  pending_assignments,
  active_assignments,
  overdue_assignments,
  completed_reviews,
  weekly_capacity,
  availability_score,
  metadata
)
SELECT
  gen_random_uuid(),
  t.organization_id,
  tm.team_id,
  tm.id,
  tm.user_id,
  NOW(),
  0,
  0,
  0,
  0,
  NULL,
  NULL,
  jsonb_build_object('source', 'seed', 'migration', '048_req_91_team_analytics_seed')
FROM core.team_members tm
JOIN core.teams t ON t.id = tm.team_id
WHERE tm.status = 'active'
  AND NOT EXISTS (
    SELECT 1
    FROM core.team_member_workloads tw
    WHERE tw.team_member_id = tm.id
      AND tw.captured_at::date = CURRENT_DATE
  );

-- Update teams analytics refresh timestamp
UPDATE core.teams
SET analytics_last_refreshed_at = NOW()
WHERE analytics_last_refreshed_at IS NULL;

-- Helper views for latest metrics
DROP VIEW IF EXISTS core.v_team_daily_metrics_latest;
CREATE VIEW core.v_team_daily_metrics_latest AS
SELECT DISTINCT ON (team_id)
  id,
  organization_id,
  team_id,
  metric_date,
  members_total,
  members_active,
  members_pending,
  jobs_active,
  applications_active,
  applications_reviewed,
  applications_escalated,
  pending_invitations,
  avg_time_to_first_review_seconds,
  median_time_to_first_review_seconds,
  workload_pressure_score,
  metadata,
  created_at,
  updated_at
FROM core.team_daily_metrics
ORDER BY team_id, metric_date DESC, updated_at DESC;

COMMENT ON VIEW core.v_team_daily_metrics_latest IS
  'Latest per-team analytics snapshot to power dashboards without additional window functions.';

DROP VIEW IF EXISTS core.v_team_member_workloads_latest;
CREATE VIEW core.v_team_member_workloads_latest AS
SELECT DISTINCT ON (team_member_id)
  id,
  organization_id,
  team_id,
  team_member_id,
  user_id,
  captured_at,
  pending_assignments,
  active_assignments,
  overdue_assignments,
  completed_reviews,
  weekly_capacity,
  availability_score,
  metadata
FROM core.team_member_workloads
ORDER BY team_member_id, captured_at DESC, id DESC;

COMMENT ON VIEW core.v_team_member_workloads_latest IS
  'Latest workload snapshot per team member for automation heuristics.';

GRANT SELECT ON core.v_team_daily_metrics_latest TO authenticated;
GRANT SELECT ON core.v_team_member_workloads_latest TO authenticated;
GRANT ALL ON core.v_team_daily_metrics_latest TO service_role;
GRANT ALL ON core.v_team_member_workloads_latest TO service_role;

COMMIT;


