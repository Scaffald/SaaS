-- =========================================================
-- 009_add_experience_table.sql
-- Creates user_experience table in private schema with organization relationship
-- =========================================================

BEGIN;

-- =========================================================
-- TABLE: private.user_experience
-- =========================================================
CREATE TABLE private.user_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID,  -- Optional FK to public.organizations
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  employment_type TEXT,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE private.user_experience IS 'User work experience history (PII)';
COMMENT ON COLUMN private.user_experience.organization_id IS 'Optional link to verified organization in system';
COMMENT ON COLUMN private.user_experience.company_name IS 'Free-form company name (used when organization_id is null)';

-- =========================================================
-- FOREIGN KEYS
-- =========================================================
ALTER TABLE private.user_experience
  ADD CONSTRAINT fk_user_experience_user_id 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE private.user_experience
  ADD CONSTRAINT fk_user_experience_organization_id
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

-- =========================================================
-- INDEXES
-- =========================================================
CREATE INDEX idx_user_experience_user_id ON private.user_experience(user_id);
CREATE INDEX idx_user_experience_organization_id ON private.user_experience(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_user_experience_current ON private.user_experience(user_id, is_current) WHERE is_current = true;
CREATE INDEX idx_user_experience_dates ON private.user_experience(user_id, start_date DESC, end_date DESC);

-- =========================================================
-- RLS POLICIES
-- =========================================================
ALTER TABLE private.user_experience ENABLE ROW LEVEL SECURITY;

-- Users can view their own experience
CREATE POLICY user_experience_select_own ON private.user_experience
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own experience
CREATE POLICY user_experience_insert_own ON private.user_experience
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own experience
CREATE POLICY user_experience_update_own ON private.user_experience
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own experience
CREATE POLICY user_experience_delete_own ON private.user_experience
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =========================================================
-- GRANTS
-- =========================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON private.user_experience TO authenticated;
GRANT ALL ON private.user_experience TO service_role;

-- =========================================================
-- TRIGGERS
-- =========================================================
CREATE TRIGGER trg_user_experience_updated_at
  BEFORE UPDATE ON private.user_experience
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

COMMIT;
