-- =========================================================
-- 111_create_archetype_system.sql - Archetype System for IPIP Assessment
-- Creates archetypes, user_archetypes, ipip_share_tokens, and user_assessment_xp tables
-- =========================================================

BEGIN;

-- =========================================================
-- ARCHETYPES TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS core.archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  strengths TEXT[] NOT NULL,
  work_styles TEXT NOT NULL,
  team_dynamics TEXT NOT NULL,
  growth_areas TEXT[] NOT NULL,
  mapping_rules JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE core.archetypes IS 'Industry-neutral archetype definitions for personality assessment mapping';
COMMENT ON COLUMN core.archetypes.mapping_rules IS 'JSONB array of weighted conditions for archetype matching: [{domain, level, weight}, ...]';

-- =========================================================
-- USER ARCHETYPES TABLE (History Tracking)
-- =========================================================
CREATE TABLE IF NOT EXISTS core.user_archetypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype_id UUID NOT NULL REFERENCES core.archetypes(id) ON DELETE CASCADE,
  assessment_date TIMESTAMPTZ NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  domain_scores JSONB NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE core.user_archetypes IS 'Historical tracking of user archetype assignments from IPIP assessments';
COMMENT ON COLUMN core.user_archetypes.domain_scores IS 'JSONB object storing A, E, N, C, O domain scores: {A: {...}, E: {...}, ...}';
COMMENT ON COLUMN core.user_archetypes.is_primary IS 'True for the current/displayed archetype, false for historical records';

-- =========================================================
-- IPIP SHARE TOKENS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS core.ipip_share_tokens (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_revoked BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0
);

COMMENT ON TABLE core.ipip_share_tokens IS 'Shareable tokens for IPIP assessment results with privacy controls';
COMMENT ON COLUMN core.ipip_share_tokens.assessment_id IS 'References core.personality_assessments(id)';
COMMENT ON COLUMN core.ipip_share_tokens.expires_at IS 'Optional expiration timestamp (7-day default)';

-- =========================================================
-- USER ASSESSMENT XP TABLE (One-time XP Tracking)
-- =========================================================
CREATE TABLE IF NOT EXISTS core.user_assessment_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  xp_type TEXT NOT NULL,
  xp_amount INTEGER NOT NULL,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, assessment_type, xp_type)
);

COMMENT ON TABLE core.user_assessment_xp IS 'Tracks one-time XP awards to prevent duplicate awards (completion, view, retest, share)';
COMMENT ON COLUMN core.user_assessment_xp.assessment_type IS 'Type of assessment: ipip, luscher, etc.';
COMMENT ON COLUMN core.user_assessment_xp.xp_type IS 'Type of XP award: completion, view, retest, share';

-- =========================================================
-- UPDATE PERSONALITY_ASSESSMENTS TABLE
-- =========================================================
ALTER TABLE core.personality_assessments
  ADD COLUMN IF NOT EXISTS next_available_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS retest_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_domain TEXT;

COMMENT ON COLUMN core.personality_assessments.next_available_at IS 'Timestamp when user can retake IPIP assessment (30-day cooldown)';
COMMENT ON COLUMN core.personality_assessments.retest_count IS 'Number of times user has retaken IPIP assessment';
COMMENT ON COLUMN core.personality_assessments.current_domain IS 'Current domain being assessed: A, E, N, C, or O';

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_user_archetypes_user_id 
  ON core.user_archetypes(user_id);

CREATE INDEX IF NOT EXISTS idx_user_archetypes_primary 
  ON core.user_archetypes(user_id, is_primary) 
  WHERE is_primary = TRUE;

CREATE INDEX IF NOT EXISTS idx_share_tokens_token 
  ON core.ipip_share_tokens(token) 
  WHERE is_revoked = FALSE;

CREATE INDEX IF NOT EXISTS idx_user_assessment_xp_user_type 
  ON core.user_assessment_xp(user_id, assessment_type);

CREATE INDEX IF NOT EXISTS idx_personality_assessments_next_available 
  ON core.personality_assessments(user_id, next_available_at)
  WHERE next_available_at IS NOT NULL;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
ALTER TABLE core.archetypes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS archetypes_select_all ON core.archetypes;
CREATE POLICY archetypes_select_all
  ON core.archetypes
  FOR SELECT
  TO authenticated
  USING (true);

ALTER TABLE core.user_archetypes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_archetypes_select_own ON core.user_archetypes;
CREATE POLICY user_archetypes_select_own
  ON core.user_archetypes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_archetypes_insert_own ON core.user_archetypes;
CREATE POLICY user_archetypes_insert_own
  ON core.user_archetypes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE core.ipip_share_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS ipip_share_tokens_select_own ON core.ipip_share_tokens;
CREATE POLICY ipip_share_tokens_select_own
  ON core.ipip_share_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS ipip_share_tokens_insert_own ON core.ipip_share_tokens;
CREATE POLICY ipip_share_tokens_insert_own
  ON core.ipip_share_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS ipip_share_tokens_update_own ON core.ipip_share_tokens;
CREATE POLICY ipip_share_tokens_update_own
  ON core.ipip_share_tokens
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
-- Public read for shared results (validated by token)
DROP POLICY IF EXISTS ipip_share_tokens_select_public ON core.ipip_share_tokens;
CREATE POLICY ipip_share_tokens_select_public
  ON core.ipip_share_tokens
  FOR SELECT
  TO anon, authenticated
  USING (is_revoked = FALSE AND (expires_at IS NULL OR expires_at > NOW()));

ALTER TABLE core.user_assessment_xp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS user_assessment_xp_select_own ON core.user_assessment_xp;
CREATE POLICY user_assessment_xp_select_own
  ON core.user_assessment_xp
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_assessment_xp_insert_own ON core.user_assessment_xp;
CREATE POLICY user_assessment_xp_insert_own
  ON core.user_assessment_xp
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- GRANTS
-- =========================================================
GRANT SELECT ON core.archetypes TO authenticated;
GRANT SELECT, INSERT ON core.user_archetypes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON core.ipip_share_tokens TO authenticated;
GRANT SELECT ON core.ipip_share_tokens TO anon;
GRANT SELECT, INSERT ON core.user_assessment_xp TO authenticated;

-- =========================================================
-- SEED DATA: 8 Industry-Neutral Archetypes
-- =========================================================

-- 1. Builder
INSERT INTO core.archetypes (name, description, strengths, work_styles, team_dynamics, growth_areas, mapping_rules)
VALUES (
  'Builder',
  'High reliability, structured approach, methodical execution. Builders turn plans into tangible outcomes with precision and consistency.',
  ARRAY['Reliability', 'Precision', 'Methodical approach', 'Quality-focused', 'Perseverance'],
  'Prefers structured environments with clear processes. Excels at following blueprints and maintaining standards. Works best with defined timelines and measurable outcomes.',
  'Provides stability and consistency to teams. Often the steady hand that ensures quality. Works well with visionaries who need reliable execution.',
  ARRAY['Flexibility in ambiguous situations', 'Embracing experimentation', 'Adapting to rapid change'],
  '[
    {"domain": "C", "level": "high", "weight": 1.0},
    {"domain": "O", "level": "neutral", "weight": 0.5}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 2. Maker
INSERT INTO core.archetypes (name, description, strengths, work_styles, team_dynamics, growth_areas, mapping_rules)
VALUES (
  'Maker',
  'High creativity combined with conscientiousness. Makers experiment and iterate, creating new solutions through hands-on prototyping.',
  ARRAY['Creativity', 'Practicality', 'Experimentation', 'Adaptability', 'Resourcefulness'],
  'Thrives in experimental environments. Enjoys hands-on work and iterative problem-solving. Comfortable with uncertainty and rapid prototyping.',
  'Brings innovation and fresh perspectives. Often the one who finds creative solutions. Works well with builders who can refine their prototypes.',
  ARRAY['Following established processes', 'Long-term planning', 'Managing multiple priorities'],
  '[
    {"domain": "C", "level": "high", "weight": 0.8},
    {"domain": "O", "level": "high", "weight": 0.8},
    {"domain": "E", "level": "low", "weight": 0.6}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 3. Operator
INSERT INTO core.archetypes (name, description, strengths, work_styles, team_dynamics, growth_areas, mapping_rules)
VALUES (
  'Operator',
  'High conscientiousness with elevated neuroticism. Operators excel in risk-aware roles, maintaining systems and preventing problems.',
  ARRAY['Vigilance', 'Risk awareness', 'System maintenance', 'Reliability', 'Attention to detail'],
  'Thrives in roles requiring careful monitoring and risk management. Prefers structured processes with clear safety protocols. Works best in stable environments.',
  'Provides critical oversight and risk management. Often the safety net for teams. Works well with innovators who need grounding.',
  ARRAY['Embracing change', 'Taking calculated risks', 'Reducing excessive worry'],
  '[
    {"domain": "C", "level": "high", "weight": 1.0},
    {"domain": "N", "level": "high", "weight": 0.7},
    {"domain": "O", "level": "low", "weight": 0.5}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 4. Designer
INSERT INTO core.archetypes (name, description, strengths, work_styles, team_dynamics, growth_areas, mapping_rules)
VALUES (
  'Designer',
  'High openness with balanced extraversion. Designers shape beauty, harmony, and usability, balancing aesthetics with function.',
  ARRAY['Aesthetic sensitivity', 'Creative problem-solving', 'Attention to detail', 'Empathy', 'Visual thinking'],
  'Prefers creative environments with freedom to explore. Enjoys collaborative design processes. Works best with clear user needs and creative constraints.',
  'Brings aesthetic vision and user-centered thinking. Often bridges technical and creative teams. Works well with builders who can execute their designs.',
  ARRAY['Technical implementation details', 'Following strict specifications', 'Working in highly structured environments'],
  '[
    {"domain": "O", "level": "high", "weight": 1.0},
    {"domain": "E", "level": "neutral", "weight": 0.5}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 5. Connector
INSERT INTO core.archetypes (name, description, strengths, work_styles, team_dynamics, growth_areas, mapping_rules)
VALUES (
  'Connector',
  'High extraversion and agreeableness. Connectors build networks, harmony, and collaboration through relationships and communication.',
  ARRAY['Social intelligence', 'Empathy', 'Collaboration', 'Communication', 'Team building'],
  'Thrives in people-focused roles. Enjoys facilitating communication and building relationships. Works best in collaborative, team-oriented environments.',
  'Essential for team cohesion and communication. Often the glue that holds teams together. Works well with all archetypes by facilitating connections.',
  ARRAY['Working independently for extended periods', 'Focusing on technical details', 'Managing conflict directly'],
  '[
    {"domain": "E", "level": "high", "weight": 1.0},
    {"domain": "A", "level": "high", "weight": 0.8}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 6. Analyst
INSERT INTO core.archetypes (name, description, strengths, work_styles, team_dynamics, growth_areas, mapping_rules)
VALUES (
  'Analyst',
  'Low extraversion with high openness and conscientiousness. Analysts seek truth, structure, and systems understanding through observation and measurement.',
  ARRAY['Critical thinking', 'Pattern recognition', 'Precision', 'Systems thinking', 'Methodical analysis'],
  'Prefers independent work with time for deep analysis. Enjoys data-driven environments. Works best with clear objectives and access to information.',
  'Provides analytical depth and objective insights. Often the fact-checker and systems thinker. Works well with connectors who can communicate their findings.',
  ARRAY['Social collaboration', 'Presenting to groups', 'Working in ambiguous situations'],
  '[
    {"domain": "E", "level": "low", "weight": 0.8},
    {"domain": "O", "level": "high", "weight": 0.8},
    {"domain": "C", "level": "high", "weight": 0.7}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 7. Navigator
INSERT INTO core.archetypes (name, description, strengths, work_styles, team_dynamics, growth_areas, mapping_rules)
VALUES (
  'Navigator',
  'High extraversion and openness with low neuroticism. Navigators provide direction and decision-making under uncertainty with strategic reasoning.',
  ARRAY['Decisiveness', 'Strategic thinking', 'Risk tolerance', 'Adaptability', 'Leadership'],
  'Thrives in dynamic, uncertain environments. Enjoys making decisions and leading through ambiguity. Works best with autonomy and clear objectives.',
  'Provides direction and confidence in uncertain situations. Often the decision-maker and strategic guide. Works well with operators who provide risk awareness.',
  ARRAY['Following detailed instructions', 'Working in highly structured environments', 'Avoiding risk entirely'],
  '[
    {"domain": "E", "level": "high", "weight": 1.0},
    {"domain": "O", "level": "high", "weight": 0.8},
    {"domain": "N", "level": "low", "weight": 0.6}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- 8. Innovator
INSERT INTO core.archetypes (name, description, strengths, work_styles, team_dynamics, growth_areas, mapping_rules)
VALUES (
  'Innovator',
  'High openness and extraversion with low conscientiousness. Innovators imagine what doesn''t yet exist, creating bold new ideas and solutions.',
  ARRAY['Creativity', 'Boldness', 'Future-oriented thinking', 'Ideation', 'Vision'],
  'Thrives in creative, fast-moving environments. Enjoys ideation and exploring new possibilities. Works best with freedom and minimal constraints.',
  'Brings bold ideas and future vision. Often the catalyst for change. Works well with builders who can execute their visions.',
  ARRAY['Following established processes', 'Attention to detail', 'Long-term maintenance'],
  '[
    {"domain": "O", "level": "high", "weight": 1.0},
    {"domain": "E", "level": "high", "weight": 0.8},
    {"domain": "C", "level": "low", "weight": 0.5}
  ]'::jsonb
)
ON CONFLICT (name) DO NOTHING;

COMMIT;

