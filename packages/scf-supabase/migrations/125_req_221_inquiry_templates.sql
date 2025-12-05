-- =========================================================
-- 122_req_221_inquiry_templates.sql
-- Schema objects for reusable inquiry templates
-- =========================================================

BEGIN;

CREATE TABLE IF NOT EXISTS core.inquiry_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description TEXT CHECK (char_length(description) <= 500),
  template_data JSONB NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_templates_organization
  ON core.inquiry_templates(organization_id);

CREATE INDEX IF NOT EXISTS idx_inquiry_templates_creator
  ON core.inquiry_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_inquiry_templates_is_default
  ON core.inquiry_templates(organization_id, is_default)
  WHERE is_default = TRUE;

CREATE INDEX IF NOT EXISTS idx_inquiry_templates_usage_count
  ON core.inquiry_templates(organization_id, usage_count DESC);

DROP TRIGGER IF EXISTS inquiry_templates_set_updated_at ON core.inquiry_templates;

CREATE TRIGGER inquiry_templates_set_updated_at
  BEFORE UPDATE ON core.inquiry_templates
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

COMMIT;

