-- =========================================================
-- 011_personality_assessment.sql - Personality Assessment System
-- Creates personality_assessments table, policies, indexes, and triggers
-- =========================================================

BEGIN;
-- =========================================================
-- PERSONALITY ASSESSMENTS TABLE
-- =========================================================
CREATE TABLE core.personality_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,  -- FK to core.users(id) - added in relations section
  
  -- Progress tracking
  current_step TEXT CHECK (current_step IN ('luscher1', 'cooldown', 'ipip', 'luscher2', 'acute', 'completed')),
  completion_score INTEGER DEFAULT 0 CHECK (completion_score >= 0 AND completion_score <= 100), -- 0-100 percentage
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  cooldown_end_time TIMESTAMPTZ, -- When cooldown period ends (60 seconds after luscher1 completion)
  
  -- Luscher Test 1 (8 color choices)
  luscher1_choices INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  luscher1_completed_at TIMESTAMPTZ,
  
  -- IPIP Test (120 questions)
  ipip_answers JSONB DEFAULT '[]'::jsonb, -- Array of {id, domain, facet, score}
  ipip_current_index INTEGER DEFAULT 0,
  ipip_language TEXT DEFAULT 'en',
  ipip_completed_at TIMESTAMPTZ,
  ipip_scores JSONB, -- Computed scores
  
  -- Luscher Test 2 (8 color choices)
  luscher2_choices INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  luscher2_completed_at TIMESTAMPTZ,
  luscher2_results TEXT, -- Raw luscher-test library output
  
  -- AI-generated report
  ai_report TEXT, -- OpenAI-generated report from luscher results
  ai_report_generated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one assessment per user (can be changed if multiple assessments needed)
  UNIQUE(user_id)
);
COMMENT ON TABLE core.personality_assessments IS 'User personality assessments including Luscher color tests and IPIP 120-question personality test';
COMMENT ON COLUMN core.personality_assessments.completion_score IS 'Percentage completion (0-100) calculated from completed steps';
COMMENT ON COLUMN core.personality_assessments.current_step IS 'Current step in assessment: luscher1, ipip, luscher2, acute, or completed';
COMMENT ON COLUMN core.personality_assessments.ipip_answers IS 'Array of IPIP answers: [{id, domain, facet, score}, ...]';
COMMENT ON COLUMN core.personality_assessments.ipip_scores IS 'Computed IPIP scores by domain and facet';
COMMENT ON COLUMN core.personality_assessments.luscher2_results IS 'Raw output from luscher-test library';
COMMENT ON COLUMN core.personality_assessments.ai_report IS 'OpenAI-generated personality report based on luscher results';
-- =========================================================
-- FOREIGN KEY RELATIONSHIPS
-- =========================================================
ALTER TABLE core.personality_assessments
  ADD CONSTRAINT personality_assessments_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES core.users(id) ON DELETE CASCADE;
-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE core.personality_assessments ENABLE ROW LEVEL SECURITY;
-- Users can view their own assessments
CREATE POLICY personality_assessments_select_own
  ON core.personality_assessments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
-- Users can insert their own assessments
CREATE POLICY personality_assessments_insert_own
  ON core.personality_assessments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
-- Users can update their own assessments
CREATE POLICY personality_assessments_update_own
  ON core.personality_assessments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Users can delete their own assessments
CREATE POLICY personality_assessments_delete_own
  ON core.personality_assessments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
-- =========================================================
-- INDEXES
-- =========================================================
-- User lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_personality_assessments_user_id 
  ON core.personality_assessments(user_id);
-- Completion score for filtering
CREATE INDEX IF NOT EXISTS idx_personality_assessments_completion_score 
  ON core.personality_assessments(completion_score)
  WHERE completion_score < 100;
-- Current step for filtering
CREATE INDEX IF NOT EXISTS idx_personality_assessments_current_step 
  ON core.personality_assessments(current_step);
-- Completion status lookup
CREATE INDEX IF NOT EXISTS idx_personality_assessments_completed_at 
  ON core.personality_assessments(user_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;
-- =========================================================
-- TRIGGERS
-- =========================================================
-- Auto-update updated_at timestamp
CREATE TRIGGER personality_assessments_set_updated_at
  BEFORE UPDATE ON core.personality_assessments
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();
-- Auto-update last_updated_at on any change
CREATE OR REPLACE FUNCTION core.update_personality_assessment_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER personality_assessments_set_last_updated_at
  BEFORE UPDATE ON core.personality_assessments
  FOR EACH ROW
  EXECUTE FUNCTION core.update_personality_assessment_last_updated();
-- =========================================================
-- GRANTS
-- =========================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON core.personality_assessments TO authenticated;
COMMIT;
