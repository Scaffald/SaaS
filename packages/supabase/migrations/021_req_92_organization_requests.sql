-- =========================================================
-- 021_req_92_organization_requests.sql
-- Establishes moderated organization creation requests for dashboard users
-- =========================================================

BEGIN;

-- =========================================================
-- Create status enum for organization requests
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'organization_request_status'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.organization_request_status AS ENUM (
      'pending',
      'approved',
      'rejected'
    );
  END IF;
END
$$;

COMMENT ON TYPE core.organization_request_status
  IS 'Moderation status for organization creation requests submitted by dashboard users';

-- =========================================================
-- Create organization requests table
-- =========================================================
CREATE TABLE IF NOT EXISTS core.organization_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  website TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status core.organization_request_status NOT NULL DEFAULT 'pending',
  created_by_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
  reviewed_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  organization_id UUID REFERENCES core.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE core.organization_requests
  IS 'User-submitted organization creation requests pending office moderation';
COMMENT ON COLUMN core.organization_requests.metadata
  IS 'Arbitrary JSON payload for additional form fields (address, contact, etc.)';
COMMENT ON COLUMN core.organization_requests.notes
  IS 'Optional notes from the requester describing the organization';

-- =========================================================
-- Constraints & indexes
-- =========================================================
ALTER TABLE core.organization_requests
  ADD CONSTRAINT organization_requests_slug_format_check
  CHECK (
    LENGTH(slug) BETWEEN 3 AND 120
    AND slug ~ '^[a-z0-9-]+$'
  );

CREATE UNIQUE INDEX IF NOT EXISTS organization_requests_slug_unique_idx
  ON core.organization_requests(slug);

CREATE INDEX IF NOT EXISTS organization_requests_status_idx
  ON core.organization_requests(status);

CREATE INDEX IF NOT EXISTS organization_requests_created_by_idx
  ON core.organization_requests(created_by_user_id, created_at DESC);

-- =========================================================
-- Updated at trigger
-- =========================================================
CREATE TRIGGER organization_requests_set_updated_at
  BEFORE UPDATE ON core.organization_requests
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- =========================================================
-- Row Level Security
-- =========================================================
ALTER TABLE core.organization_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY organization_requests_select_own
  ON core.organization_requests
  FOR SELECT
  TO authenticated
  USING (created_by_user_id = auth.uid());

CREATE POLICY organization_requests_insert_own
  ON core.organization_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by_user_id = auth.uid());

-- =========================================================
-- Grants
-- =========================================================
GRANT ALL ON TABLE core.organization_requests TO service_role;
GRANT SELECT, INSERT ON TABLE core.organization_requests TO authenticated;

GRANT USAGE ON TYPE core.organization_request_status TO service_role;
GRANT USAGE ON TYPE core.organization_request_status TO authenticated;

COMMIT;

