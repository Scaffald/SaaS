-- =========================================================
-- Review Enhancements Migration
-- Add missing tables for comprehensive review data
-- =========================================================

BEGIN;

-- =========================================================
-- SOFT SKILLS CATALOG
-- =========================================================

CREATE TABLE IF NOT EXISTS public.soft_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('reliability', 'collaboration', 'professionalism', 'technical')),
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for category lookups
CREATE INDEX IF NOT EXISTS idx_soft_skills_category ON public.soft_skills(category) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_soft_skills_active ON public.soft_skills(is_active);

-- =========================================================
-- REVIEW CATEGORY RATINGS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.review_category_ratings (
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('skills', 'reliability', 'collaboration', 'professionalism', 'technical')),
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (review_id, category)
);

-- Add index for querying by review
CREATE INDEX IF NOT EXISTS idx_review_category_ratings_review_id ON public.review_category_ratings(review_id);

-- =========================================================
-- SOFT SKILL VOTES (Strengths & Improvements)
-- =========================================================

CREATE TABLE IF NOT EXISTS public.review_soft_skill_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.soft_skills(id) ON DELETE CASCADE,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  is_strength BOOLEAN NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (review_id, skill_id, is_strength)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_review_soft_skill_votes_review_id ON public.review_soft_skill_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_review_soft_skill_votes_skill_id ON public.review_soft_skill_votes(skill_id);
CREATE INDEX IF NOT EXISTS idx_review_soft_skill_votes_is_strength ON public.review_soft_skill_votes(is_strength);

-- =========================================================
-- SEED SOFT SKILLS DATA
-- =========================================================

-- Reliability Skills
INSERT INTO public.soft_skills (name, slug, category, description, order_index) VALUES
  ('Deadline Management', 'deadline-management', 'reliability', 'Consistently meets deadlines and commitments', 1),
  ('Prioritization', 'prioritization', 'reliability', 'Effectively prioritizes tasks and responsibilities', 2),
  ('Time Management', 'time-management', 'reliability', 'Manages time efficiently and effectively', 3),
  ('Task Delegation', 'task-delegation', 'reliability', 'Delegates tasks appropriately when needed', 4),
  ('Accountability', 'accountability', 'reliability', 'Takes responsibility for work and outcomes', 5),
  ('Consistency', 'consistency', 'reliability', 'Delivers consistent quality of work', 6)
ON CONFLICT (slug) DO NOTHING;

-- Collaboration Skills
INSERT INTO public.soft_skills (name, slug, category, description, order_index) VALUES
  ('Communication', 'communication', 'collaboration', 'Communicates clearly and effectively', 1),
  ('Teamwork', 'teamwork', 'collaboration', 'Works well with others in team settings', 2),
  ('Active Listening', 'active-listening', 'collaboration', 'Listens attentively and responds thoughtfully', 3),
  ('Conflict Resolution', 'conflict-resolution', 'collaboration', 'Resolves disagreements constructively', 4),
  ('Empathy', 'empathy', 'collaboration', 'Shows understanding and consideration for others', 5),
  ('Cooperation', 'cooperation', 'collaboration', 'Cooperates willingly with team members', 6),
  ('Feedback Reception', 'feedback-reception', 'collaboration', 'Accepts and acts on feedback constructively', 7)
ON CONFLICT (slug) DO NOTHING;

-- Professionalism Skills
INSERT INTO public.soft_skills (name, slug, category, description, order_index) VALUES
  ('Work Ethic', 'work-ethic', 'professionalism', 'Demonstrates strong dedication to work', 1),
  ('Adaptability', 'adaptability', 'professionalism', 'Adapts well to changing circumstances', 2),
  ('Problem Solving', 'problem-solving', 'professionalism', 'Effectively solves problems', 3),
  ('Initiative', 'initiative', 'professionalism', 'Takes initiative without being asked', 4),
  ('Professionalism', 'professionalism', 'professionalism', 'Maintains professional demeanor and standards', 5),
  ('Attention to Detail', 'attention-to-detail', 'professionalism', 'Pays close attention to details', 6)
ON CONFLICT (slug) DO NOTHING;

-- Technical Skills
INSERT INTO public.soft_skills (name, slug, category, description, order_index) VALUES
  ('Technical Knowledge', 'technical-knowledge', 'technical', 'Demonstrates strong technical expertise', 1),
  ('Learning Ability', 'learning-ability', 'technical', 'Quickly learns new skills and technologies', 2),
  ('Innovation', 'innovation', 'technical', 'Brings innovative ideas and solutions', 3),
  ('Best Practices', 'best-practices', 'technical', 'Follows industry best practices', 4),
  ('Code Quality', 'code-quality', 'technical', 'Writes clean, maintainable code', 5),
  ('Documentation', 'documentation', 'technical', 'Creates clear and helpful documentation', 6)
ON CONFLICT (slug) DO NOTHING;

-- =========================================================
-- GRANTS
-- =========================================================

-- Grant access to authenticated users for reading
GRANT SELECT ON public.soft_skills TO authenticated, anon;
GRANT SELECT ON public.review_category_ratings TO authenticated, anon;
GRANT SELECT ON public.review_soft_skill_votes TO authenticated, anon;

-- Grant full access to service role
GRANT ALL ON public.soft_skills TO service_role;
GRANT ALL ON public.review_category_ratings TO service_role;
GRANT ALL ON public.review_soft_skill_votes TO service_role;

-- Grant write access for review authors
GRANT INSERT, UPDATE, DELETE ON public.review_category_ratings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.review_soft_skill_votes TO authenticated;

COMMIT;
