-- Migration: 276_forsured_risk_calculation_function.sql
-- Description: Risk calculation function for subcontractor compliance
-- REQ: Phase 5 - Risk Level Algorithm Implementation
-- Author: Claude
-- Date: 2024-12-23

BEGIN;

-- =============================================================================
-- RISK CALCULATION FUNCTION
-- =============================================================================
-- Calculates compliance risk score for a subcontractor on a project
-- Uses weighted scoring: Coverage (40%), Policy Status (25%), Issues (20%), History (15%)
--
-- Risk Levels:
--   LOW (90-100): Fully compliant
--   MEDIUM (70-89): Minor gaps
--   HIGH (50-69): Significant gaps
--   CRITICAL (0-49): Major violations
--
-- Override Rules:
--   - Policy expired >60 days → CRITICAL
--   - Critical issue open >14 days → CRITICAL
--   - Coverage <50% → HIGH minimum

CREATE OR REPLACE FUNCTION forsured.calculate_subcontractor_risk(
  p_subcontractor_id UUID,
  p_project_id UUID
) RETURNS TABLE (
  compliance_score INTEGER,
  risk_level TEXT,
  coverage_score INTEGER,
  policy_score INTEGER,
  issue_score INTEGER,
  history_score INTEGER,
  breakdown JSONB
) AS $$
DECLARE
  v_coverage_score INTEGER;
  v_policy_score INTEGER;
  v_issue_score INTEGER;
  v_history_score INTEGER;
  v_final_score INTEGER;
  v_risk_level TEXT;
  v_has_critical_override BOOLEAN := FALSE;
  v_breakdown JSONB;

  -- Requirement tracking
  v_total_requirements INTEGER := 0;
  v_met_requirements NUMERIC := 0;

  -- Policy tracking
  v_policy_penalty INTEGER := 0;
  v_any_expired_over_60 BOOLEAN := FALSE;

  -- Issue tracking (uses compliance_flags table)
  v_issue_penalty INTEGER := 0;
  v_info_penalty INTEGER := 0;
  v_warning_penalty INTEGER := 0;
  v_error_penalty INTEGER := 0;
  v_critical_count INTEGER := 0;
  v_any_critical_over_14_days BOOLEAN := FALSE;

  -- History tracking
  v_current_score INTEGER;
  v_score_90_days_ago INTEGER;
  v_trend_score INTEGER;
BEGIN
  -- ==========================================================================
  -- COVERAGE SCORE CALCULATION (40% weight)
  -- ==========================================================================

  -- Get all requirements for this project
  SELECT COUNT(*) INTO v_total_requirements
  FROM forsured.requirements r
  WHERE r.project_id = p_project_id;

  -- If no requirements defined, default to 100
  IF v_total_requirements = 0 THEN
    v_coverage_score := 100;
  ELSE
    -- Check each requirement against subcontractor's policies
    SELECT COALESCE(SUM(
      CASE
        -- Fully met: coverage >= required
        WHEN p.coverage_amount >= r.minimum_amount THEN 1.0
        -- Partially met: coverage >= 80% of required
        WHEN p.coverage_amount >= r.minimum_amount * 0.8 THEN 0.5
        -- Not met
        ELSE 0.0
      END
    ), 0) INTO v_met_requirements
    FROM forsured.requirements r
    LEFT JOIN forsured.documents d ON d.subcontractor_id = p_subcontractor_id
      AND d.project_id = p_project_id
      AND d.status = 'approved'
    LEFT JOIN forsured.policies p ON p.document_id = d.id
      AND p.coverage_type = r.coverage_type
      AND p.end_date > NOW()
    WHERE r.project_id = p_project_id;

    v_coverage_score := ROUND((v_met_requirements / v_total_requirements) * 100)::INTEGER;
  END IF;

  -- ==========================================================================
  -- POLICY SCORE CALCULATION (25% weight)
  -- ==========================================================================

  -- Calculate penalties for each policy
  SELECT
    COALESCE(SUM(
      CASE
        WHEN p.end_date < NOW() - INTERVAL '60 days' THEN 60
        WHEN p.end_date < NOW() - INTERVAL '30 days' THEN 60
        WHEN p.end_date < NOW() THEN 40  -- Expired <30 days
        WHEN p.end_date < NOW() + INTERVAL '15 days' THEN 25
        WHEN p.end_date < NOW() + INTERVAL '30 days' THEN 15
        WHEN p.end_date < NOW() + INTERVAL '60 days' THEN 5
        ELSE 0
      END
    ), 0),
    COALESCE(BOOL_OR(p.end_date < NOW() - INTERVAL '60 days'), FALSE)
  INTO v_policy_penalty, v_any_expired_over_60
  FROM forsured.documents d
  JOIN forsured.policies p ON p.document_id = d.id
  WHERE d.subcontractor_id = p_subcontractor_id
    AND d.project_id = p_project_id;

  v_policy_score := GREATEST(0, 100 - v_policy_penalty);

  -- ==========================================================================
  -- ISSUE SCORE CALCULATION (20% weight)
  -- Uses compliance_flags table instead of compliance_issues
  -- ==========================================================================

  -- Count issues by severity from compliance_flags
  SELECT
    COALESCE(LEAST(COUNT(*) FILTER (WHERE cf.severity::TEXT = 'info') * 2, 10), 0),
    COALESCE(LEAST(COUNT(*) FILTER (WHERE cf.severity::TEXT = 'warning') * 5, 20), 0),
    COALESCE(LEAST(COUNT(*) FILTER (WHERE cf.severity::TEXT = 'error') * 15, 45), 0),
    COALESCE(COUNT(*) FILTER (WHERE cf.severity::TEXT = 'critical') * 30, 0),
    COALESCE(COUNT(*) FILTER (WHERE cf.severity::TEXT = 'critical'), 0)::INTEGER,
    COALESCE(BOOL_OR(cf.severity::TEXT = 'critical' AND cf.created_at < NOW() - INTERVAL '14 days'), FALSE)
  INTO v_info_penalty, v_warning_penalty, v_error_penalty, v_issue_penalty,
       v_critical_count, v_any_critical_over_14_days
  FROM forsured.compliance_flags cf
  WHERE cf.subcontractor_id = p_subcontractor_id
    AND cf.project_id = p_project_id
    AND cf.status::TEXT = 'active';

  v_issue_penalty := v_info_penalty + v_warning_penalty + v_error_penalty +
                     (v_critical_count * 30);  -- No cap for critical
  v_issue_score := GREATEST(0, 100 - v_issue_penalty);

  -- ==========================================================================
  -- HISTORY SCORE CALCULATION (15% weight)
  -- ==========================================================================

  -- Get current score from compliance_scores
  SELECT score INTO v_current_score
  FROM forsured.compliance_scores
  WHERE subcontractor_id = p_subcontractor_id
    AND project_id = p_project_id
  ORDER BY last_evaluated DESC NULLS LAST
  LIMIT 1;

  -- Get score from 90 days ago (or closest)
  SELECT score INTO v_score_90_days_ago
  FROM forsured.compliance_scores
  WHERE subcontractor_id = p_subcontractor_id
    AND project_id = p_project_id
    AND created_at <= NOW() - INTERVAL '85 days'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate trend score
  IF v_score_90_days_ago IS NULL THEN
    -- New subcontractor, no history
    v_trend_score := 70;
  ELSIF v_current_score IS NULL THEN
    v_trend_score := 70;
  ELSIF v_current_score > v_score_90_days_ago + 10 THEN
    -- Improving
    v_trend_score := 100;
  ELSIF v_current_score < v_score_90_days_ago - 10 THEN
    -- Declining
    v_trend_score := 50;
  ELSE
    -- Stable
    v_trend_score := 80;
  END IF;

  v_history_score := LEAST(100, v_trend_score);

  -- ==========================================================================
  -- FINAL SCORE CALCULATION
  -- ==========================================================================

  v_final_score := ROUND(
    v_coverage_score * 0.40 +
    v_policy_score * 0.25 +
    v_issue_score * 0.20 +
    v_history_score * 0.15
  )::INTEGER;

  -- ==========================================================================
  -- RISK LEVEL DETERMINATION
  -- ==========================================================================

  -- Check for critical overrides
  IF v_any_expired_over_60 OR v_any_critical_over_14_days THEN
    v_risk_level := 'critical';
    v_has_critical_override := TRUE;
  ELSIF v_coverage_score < 50 THEN
    -- Coverage below 50% forces at least HIGH
    v_risk_level := CASE
      WHEN v_final_score < 50 THEN 'critical'
      ELSE 'high'
    END;
  ELSE
    -- Normal threshold-based classification
    v_risk_level := CASE
      WHEN v_final_score >= 90 THEN 'low'
      WHEN v_final_score >= 70 THEN 'medium'
      WHEN v_final_score >= 50 THEN 'high'
      ELSE 'critical'
    END;
  END IF;

  -- ==========================================================================
  -- BUILD BREAKDOWN
  -- ==========================================================================

  v_breakdown := jsonb_build_object(
    'coverage', jsonb_build_object(
      'score', v_coverage_score,
      'weight', 0.40,
      'weighted', ROUND(v_coverage_score * 0.40),
      'met_requirements', v_met_requirements,
      'total_requirements', v_total_requirements
    ),
    'policy', jsonb_build_object(
      'score', v_policy_score,
      'weight', 0.25,
      'weighted', ROUND(v_policy_score * 0.25),
      'penalty', v_policy_penalty,
      'any_expired_over_60', v_any_expired_over_60
    ),
    'issues', jsonb_build_object(
      'score', v_issue_score,
      'weight', 0.20,
      'weighted', ROUND(v_issue_score * 0.20),
      'info_penalty', v_info_penalty,
      'warning_penalty', v_warning_penalty,
      'error_penalty', v_error_penalty,
      'critical_count', v_critical_count,
      'any_critical_over_14_days', v_any_critical_over_14_days
    ),
    'history', jsonb_build_object(
      'score', v_history_score,
      'weight', 0.15,
      'weighted', ROUND(v_history_score * 0.15),
      'current_score', v_current_score,
      'score_90_days_ago', v_score_90_days_ago,
      'trend', CASE
        WHEN v_score_90_days_ago IS NULL THEN 'new'
        WHEN v_current_score > v_score_90_days_ago + 10 THEN 'improving'
        WHEN v_current_score < v_score_90_days_ago - 10 THEN 'declining'
        ELSE 'stable'
      END
    ),
    'overrides', jsonb_build_object(
      'has_critical_override', v_has_critical_override,
      'expired_policy_override', v_any_expired_over_60,
      'critical_issue_override', v_any_critical_over_14_days,
      'low_coverage_override', v_coverage_score < 50
    )
  );

  -- ==========================================================================
  -- RETURN RESULTS
  -- ==========================================================================

  RETURN QUERY SELECT
    v_final_score,
    v_risk_level,
    v_coverage_score,
    v_policy_score,
    v_issue_score,
    v_history_score,
    v_breakdown;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION forsured.calculate_subcontractor_risk IS
'Calculate compliance risk score and level for a subcontractor on a project.
Returns: compliance_score (0-100), risk_level (low/medium/high/critical),
component scores, and detailed breakdown.';

-- =============================================================================
-- BATCH CALCULATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.calculate_all_subcontractor_risks(
  p_project_id UUID
) RETURNS TABLE (
  subcontractor_id UUID,
  subcontractor_name TEXT,
  compliance_score INTEGER,
  risk_level TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ps.subcontractor_id,
    s.name,
    (forsured.calculate_subcontractor_risk(ps.subcontractor_id, p_project_id)).compliance_score,
    (forsured.calculate_subcontractor_risk(ps.subcontractor_id, p_project_id)).risk_level
  FROM forsured.project_subcontractors ps
  JOIN forsured.subcontractors s ON s.id = ps.subcontractor_id
  WHERE ps.project_id = p_project_id
    AND ps.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- UPDATE COMPLIANCE SCORES TABLE
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_compliance_score(
  p_subcontractor_id UUID,
  p_project_id UUID
) RETURNS VOID AS $$
DECLARE
  v_result RECORD;
  v_org_id UUID;
BEGIN
  -- Calculate risk
  SELECT * INTO v_result
  FROM forsured.calculate_subcontractor_risk(p_subcontractor_id, p_project_id);

  -- Get organization_id from project
  SELECT organization_id INTO v_org_id
  FROM forsured.projects WHERE id = p_project_id;

  -- Upsert compliance_scores
  INSERT INTO forsured.compliance_scores (
    project_id,
    subcontractor_id,
    organization_id,
    score,
    status,
    gaps,
    last_evaluated
  ) VALUES (
    p_project_id,
    p_subcontractor_id,
    v_org_id,
    v_result.compliance_score,
    v_result.risk_level,
    v_result.breakdown,
    NOW()
  )
  ON CONFLICT (project_id, subcontractor_id)
  DO UPDATE SET
    score = v_result.compliance_score,
    status = v_result.risk_level,
    gaps = v_result.breakdown,
    last_evaluated = NOW(),
    updated_at = NOW();

  -- Update subcontractor table with overall score and risk
  UPDATE forsured.subcontractors
  SET
    compliance_score = v_result.compliance_score,
    risk_level = v_result.risk_level,
    updated_at = NOW()
  WHERE id = p_subcontractor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT EXECUTE ON FUNCTION forsured.calculate_subcontractor_risk TO authenticated;
GRANT EXECUTE ON FUNCTION forsured.calculate_subcontractor_risk TO service_role;
GRANT EXECUTE ON FUNCTION forsured.calculate_all_subcontractor_risks TO authenticated;
GRANT EXECUTE ON FUNCTION forsured.calculate_all_subcontractor_risks TO service_role;
GRANT EXECUTE ON FUNCTION forsured.update_compliance_score TO authenticated;
GRANT EXECUTE ON FUNCTION forsured.update_compliance_score TO service_role;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
BEGIN
  -- Verify functions exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'calculate_subcontractor_risk' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'forsured')) THEN
    RAISE NOTICE '✅ Risk calculation function created successfully';
  ELSE
    RAISE EXCEPTION 'Risk calculation function was not created';
  END IF;
END $$;

COMMIT;
