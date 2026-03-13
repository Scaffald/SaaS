-- ─────────────────────────────────────────────────────────────────────────────
-- 409: Fix create_skill_snapshot — flatten aggregates, UUID comparison
-- Replaces function from 408: category stats via grouped subquery (no nested
-- aggregates); review_count compares subject_id as UUID.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION core.create_skill_snapshot(
  p_user_id UUID,
  p_trigger_type TEXT,
  p_trigger_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_snapshot_id UUID;
  v_snapshot_data JSONB;
  v_previous_data JSONB;
  v_summary JSONB;
BEGIN
  -- Build snapshot_data from current user skill state.
  -- Categories: grouped subquery (category, average, count) then jsonb_object_agg
  -- to avoid nested aggregates. Overall average from separate scalar subquery.
  SELECT jsonb_build_object(
    'soft_skills', COALESCE((
      SELECT jsonb_build_object(
        'categories', COALESCE(
          (SELECT jsonb_object_agg(cat.category, jsonb_build_object('average', cat.average, 'count', cat.count))
           FROM (
             SELECT ss.category,
                    ROUND(AVG(us.proficiency_level)::numeric, 2) AS average,
                    COUNT(*)::int AS count
             FROM core.user_skills us
             JOIN core.soft_skills ss ON ss.id = us.soft_skill_id
             WHERE us.user_id = p_user_id
               AND us.skill_taxonomy = 'soft_skills'
             GROUP BY ss.category
           ) cat),
          '{}'::jsonb
        ),
        'overall_average', (
          SELECT ROUND(AVG(us.proficiency_level)::numeric, 2)
          FROM core.user_skills us
          WHERE us.user_id = p_user_id
            AND us.skill_taxonomy = 'soft_skills'
        )
      )
    ), '{}'::jsonb),
    'evidence_count', (
      SELECT COUNT(*) FROM core.skill_evidence WHERE user_id = p_user_id
    ),
    'review_count', (
      SELECT COUNT(*) FROM core.reviews
      WHERE subject_type = 'user' AND subject_id = p_user_id
    )
  ) INTO v_snapshot_data;

  -- Get previous snapshot for delta computation
  SELECT snapshot_data INTO v_previous_data
  FROM core.skill_snapshots
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Compute summary (deltas from previous)
  IF v_previous_data IS NOT NULL THEN
    v_summary := jsonb_build_object(
      'delta_overall',
        COALESCE((v_snapshot_data -> 'soft_skills' ->> 'overall_average')::numeric, 0) -
        COALESCE((v_previous_data -> 'soft_skills' ->> 'overall_average')::numeric, 0),
      'previous_overall',
        COALESCE((v_previous_data -> 'soft_skills' ->> 'overall_average')::numeric, 0)
    );
  END IF;

  INSERT INTO core.skill_snapshots (user_id, trigger_type, trigger_id, snapshot_data, summary)
  VALUES (p_user_id, p_trigger_type, p_trigger_id, v_snapshot_data, v_summary)
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$;

GRANT EXECUTE ON FUNCTION core.create_skill_snapshot(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION core.create_skill_snapshot(UUID, TEXT, UUID) TO service_role;
