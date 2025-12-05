-- =========================================================
-- 20251121072354_req_255_soft_skills_self_assessment.sql
-- Extend user_skills and jobs for soft skills self-assessment
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- Extend core.user_skills with soft skill tracking
-- ---------------------------------------------------------

ALTER TABLE core.user_skills
  ADD COLUMN IF NOT EXISTS soft_skill_id UUID REFERENCES core.soft_skills(id),
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS self_assessed_at TIMESTAMPTZ;

ALTER TABLE core.user_skills
  DROP CONSTRAINT IF EXISTS user_skills_taxonomy_check,
  ADD CONSTRAINT user_skills_taxonomy_check CHECK (
    (skill_taxonomy = 'csi' AND csi_skill_id IS NOT NULL AND onet_occupation_id IS NULL AND soft_skill_id IS NULL)
    OR (skill_taxonomy = 'onet' AND onet_occupation_id IS NOT NULL AND csi_skill_id IS NULL AND soft_skill_id IS NULL)
    OR (skill_taxonomy = 'soft_skills' AND soft_skill_id IS NOT NULL AND csi_skill_id IS NULL AND onet_occupation_id IS NULL)
  );

ALTER TABLE core.user_skills
  DROP CONSTRAINT IF EXISTS user_skills_soft_skill_check,
  ADD CONSTRAINT user_skills_soft_skill_check CHECK (
    (skill_taxonomy = 'soft_skills' AND soft_skill_id IS NOT NULL)
    OR (skill_taxonomy IN ('csi', 'onet') AND soft_skill_id IS NULL)
  );

ALTER TABLE core.user_skills
  DROP CONSTRAINT IF EXISTS user_skills_unique,
  ADD CONSTRAINT user_skills_unique UNIQUE (
    user_id,
    skill_taxonomy,
    csi_skill_id,
    onet_occupation_id,
    soft_skill_id,
    version
  );

CREATE INDEX IF NOT EXISTS idx_user_skills_soft_skills
  ON core.user_skills (user_id, soft_skill_id)
  WHERE skill_taxonomy = 'soft_skills';

-- ---------------------------------------------------------
-- Extend core.jobs with required soft skills definition
-- ---------------------------------------------------------

ALTER TABLE core.jobs
  ADD COLUMN IF NOT EXISTS required_soft_skills JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_jobs_required_soft_skills
  ON core.jobs
  USING gin (required_soft_skills);

COMMIT;


