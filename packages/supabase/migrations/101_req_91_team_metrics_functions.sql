-- ====================================================================================
-- 101_req_91_team_metrics_functions.sql
-- Adds helper functions to refresh team analytics metrics and workload snapshots.
-- ====================================================================================

BEGIN;

CREATE OR REPLACE FUNCTION core.refresh_team_daily_metrics(
  p_team_id UUID,
  p_metric_date DATE DEFAULT CURRENT_DATE,
  p_capture_workloads BOOLEAN DEFAULT TRUE
)
RETURNS core.team_daily_metrics
LANGUAGE plpgsql
AS $$
DECLARE
  v_team RECORD;
  v_members_total INTEGER := 0;
  v_members_active INTEGER := 0;
  v_members_pending INTEGER := 0;
  v_jobs_active INTEGER := 0;
  v_applications_active INTEGER := 0;
  v_applications_reviewed INTEGER := 0;
  v_applications_escalated INTEGER := 0;
  v_avg_time_to_first_review_seconds INTEGER := NULL;
  v_median_time_to_first_review_seconds INTEGER := NULL;
  v_workload_pressure_score NUMERIC(5, 2) := NULL;
  v_pending_invitations INTEGER := 0;
  v_metrics core.team_daily_metrics%ROWTYPE;
BEGIN
  SELECT id, organization_id, is_archived
  INTO v_team
  FROM core.teams
  WHERE id = p_team_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Team % not found', p_team_id USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(v_team.is_archived, FALSE) THEN
    RETURN NULL;
  END IF;

  SELECT
    COUNT(*) FILTER (WHERE status IN ('active', 'pending')) AS members_total,
    COUNT(*) FILTER (WHERE status = 'active') AS members_active,
    COUNT(*) FILTER (WHERE status = 'pending') AS members_pending
  INTO
    v_members_total,
    v_members_active,
    v_members_pending
  FROM core.team_members
  WHERE team_id = p_team_id;

  SELECT COUNT(*)
  INTO v_pending_invitations
  FROM core.team_invitations
  WHERE team_id = p_team_id
    AND status = 'pending';

  WITH job_scope AS (
    SELECT j.id, j.status
    FROM core.jobs j
    WHERE (j.assigned_team_id = p_team_id
      OR EXISTS (
        SELECT 1
        FROM core.job_team_assignments jta
        WHERE jta.job_id = j.id
          AND jta.team_id = p_team_id
      ))
  )
  SELECT
    COUNT(*) FILTER (WHERE status IN ('open', 'active'))
  INTO v_jobs_active
  FROM job_scope;

  WITH job_scope AS (
    SELECT j.id
    FROM core.jobs j
    WHERE (j.assigned_team_id = p_team_id
      OR EXISTS (
        SELECT 1
        FROM core.job_team_assignments jta
        WHERE jta.job_id = j.id
          AND jta.team_id = p_team_id
      ))
  ),
  application_scope AS (
    SELECT a.id, a.status, a.created_at, a.assigned_to, a.assigned_at
    FROM core.applications a
    WHERE a.job_id IN (SELECT id FROM job_scope)
  )
  SELECT
    COUNT(*) FILTER (WHERE status IN ('pending', 'reviewing', 'interview', 'offer')) AS applications_active,
    COUNT(*) FILTER (WHERE status IN ('reviewing', 'interview', 'offer', 'hired', 'rejected')) AS applications_reviewed
  INTO
    v_applications_active,
    v_applications_reviewed
  FROM application_scope;

  SELECT
    COUNT(*)
  INTO v_applications_escalated
  FROM core.team_activity_events tae
  WHERE tae.team_id = p_team_id
    AND tae.event_type = 'application.escalated'
    AND tae.occurred_at::date = p_metric_date;

  WITH review_events AS (
    SELECT
      tae.related_application_id,
      MIN(tae.occurred_at) AS first_review_at
    FROM core.team_activity_events tae
    WHERE tae.team_id = p_team_id
      AND tae.event_type = 'application.review_submitted'
      AND tae.related_application_id IS NOT NULL
    GROUP BY tae.related_application_id
  ),
  review_durations AS (
    SELECT
      EXTRACT(EPOCH FROM (re.first_review_at - a.created_at))::BIGINT AS seconds,
      re.first_review_at::date AS occurred_date
    FROM review_events re
    JOIN core.applications a ON a.id = re.related_application_id
  )
  SELECT
    AVG(seconds)::INT,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY seconds)::INT
  INTO
    v_avg_time_to_first_review_seconds,
    v_median_time_to_first_review_seconds
  FROM review_durations
  WHERE occurred_date = p_metric_date;

  IF v_members_active > 0 THEN
    v_workload_pressure_score := ROUND(LEAST(999.99, v_applications_active::NUMERIC / v_members_active), 2);
  ELSE
    v_workload_pressure_score := NULL;
  END IF;

  INSERT INTO core.team_daily_metrics (
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
  VALUES (
    v_team.organization_id,
    p_team_id,
    p_metric_date,
    v_members_total,
    v_members_active,
    v_members_pending,
    v_jobs_active,
    v_applications_active,
    v_applications_reviewed,
    v_applications_escalated,
    v_pending_invitations,
    v_avg_time_to_first_review_seconds,
    v_median_time_to_first_review_seconds,
    v_workload_pressure_score,
    jsonb_build_object(
      'memberCounts',
      jsonb_build_object(
        'total', v_members_total,
        'active', v_members_active,
        'pending', v_members_pending
      ),
      'applicationCounts',
      jsonb_build_object(
        'active', v_applications_active,
        'reviewed', v_applications_reviewed,
        'escalated', v_applications_escalated
      ),
      'jobsActive',
      v_jobs_active,
      'pendingInvitations',
      v_pending_invitations
    )
  )
  ON CONFLICT (team_id, metric_date)
  DO UPDATE SET
    members_total = EXCLUDED.members_total,
    members_active = EXCLUDED.members_active,
    members_pending = EXCLUDED.members_pending,
    jobs_active = EXCLUDED.jobs_active,
    applications_active = EXCLUDED.applications_active,
    applications_reviewed = EXCLUDED.applications_reviewed,
    applications_escalated = EXCLUDED.applications_escalated,
    pending_invitations = EXCLUDED.pending_invitations,
    avg_time_to_first_review_seconds = EXCLUDED.avg_time_to_first_review_seconds,
    median_time_to_first_review_seconds = EXCLUDED.median_time_to_first_review_seconds,
    workload_pressure_score = EXCLUDED.workload_pressure_score,
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING * INTO v_metrics;

  UPDATE core.teams
  SET analytics_last_refreshed_at = NOW()
  WHERE id = p_team_id;

  IF p_capture_workloads THEN
    DELETE FROM core.team_member_workloads
    WHERE team_id = p_team_id
      AND captured_at::date = p_metric_date;

    WITH job_scope AS (
      SELECT j.id
      FROM core.jobs j
      WHERE (j.assigned_team_id = p_team_id
        OR EXISTS (
          SELECT 1
          FROM core.job_team_assignments jta
          WHERE jta.job_id = j.id
            AND jta.team_id = p_team_id
        ))
    ),
    application_scope AS (
      SELECT a.id, a.status, a.assigned_to, a.assigned_at
      FROM core.applications a
      WHERE a.job_id IN (SELECT id FROM job_scope)
    ),
    pending_counts AS (
      SELECT
        assigned_to,
        COUNT(*) AS pending_count
      FROM application_scope
      WHERE status = 'pending'
        AND assigned_to IS NOT NULL
      GROUP BY assigned_to
    ),
    active_counts AS (
      SELECT
        assigned_to,
        COUNT(*) AS active_count
      FROM application_scope
      WHERE status IN ('reviewing', 'interview', 'offer')
        AND assigned_to IS NOT NULL
      GROUP BY assigned_to
    ),
    overdue_counts AS (
      SELECT
        assigned_to,
        COUNT(*) AS overdue_count
      FROM application_scope
      WHERE status = 'pending'
        AND assigned_to IS NOT NULL
        AND assigned_at IS NOT NULL
        AND assigned_at < NOW() - INTERVAL '48 hours'
      GROUP BY assigned_to
    ),
    review_counts AS (
      SELECT
        actor_user_id,
        COUNT(*) AS review_count
      FROM core.team_activity_events
      WHERE team_id = p_team_id
        AND event_type = 'application.review_submitted'
        AND actor_user_id IS NOT NULL
        AND occurred_at::date = p_metric_date
      GROUP BY actor_user_id
    )
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
      v_team.organization_id,
      tm.team_id,
      tm.id,
      tm.user_id,
      NOW(),
      COALESCE(pc.pending_count, 0),
      COALESCE(ac.active_count, 0),
      COALESCE(oc.overdue_count, 0),
      COALESCE(rc.review_count, 0),
      NULL,
      CASE
        WHEN (COALESCE(pc.pending_count, 0) + COALESCE(ac.active_count, 0)) = 0 THEN NULL
        ELSE ROUND(GREATEST(0, LEAST(5, 5 - (COALESCE(pc.pending_count, 0) + COALESCE(ac.active_count, 0)) * 0.5)), 2)
      END,
      jsonb_build_object(
        'pendingAssignments', COALESCE(pc.pending_count, 0),
        'activeAssignments', COALESCE(ac.active_count, 0),
        'overdueAssignments', COALESCE(oc.overdue_count, 0),
        'completedReviews', COALESCE(rc.review_count, 0)
      )
    FROM core.team_members tm
    LEFT JOIN pending_counts pc ON pc.assigned_to = tm.user_id
    LEFT JOIN active_counts ac ON ac.assigned_to = tm.user_id
    LEFT JOIN overdue_counts oc ON oc.assigned_to = tm.user_id
    LEFT JOIN review_counts rc ON rc.actor_user_id = tm.user_id
    WHERE tm.team_id = p_team_id
      AND tm.status = 'active';
  END IF;

  RETURN v_metrics;
END;
$$;

CREATE OR REPLACE FUNCTION core.handle_team_activity_event_refresh()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM core.refresh_team_daily_metrics(NEW.team_id, NEW.occurred_at::date, TRUE);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refresh_team_metrics_after_event ON core.team_activity_events;
CREATE TRIGGER refresh_team_metrics_after_event
AFTER INSERT ON core.team_activity_events
FOR EACH ROW
EXECUTE FUNCTION core.handle_team_activity_event_refresh();

CREATE OR REPLACE FUNCTION core.refresh_all_team_metrics(p_metric_date DATE DEFAULT CURRENT_DATE)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER := 0;
  v_team RECORD;
BEGIN
  FOR v_team IN
    SELECT id
    FROM core.teams
    WHERE COALESCE(is_archived, FALSE) = FALSE
  LOOP
    PERFORM core.refresh_team_daily_metrics(v_team.id, p_metric_date, TRUE);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION core.refresh_team_daily_metrics(UUID, DATE, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION core.refresh_all_team_metrics(DATE) TO service_role;

COMMIT;


