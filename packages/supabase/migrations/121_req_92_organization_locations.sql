-- =========================================================
-- 121_req_92_organization_locations.sql
-- REQ-92: Dedicated organization locations table + APIs foundation
-- =========================================================

BEGIN;

-- =========================================================
-- Location type enum
-- =========================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'organization_location_type'
      AND typnamespace = 'core'::regnamespace
  ) THEN
    CREATE TYPE core.organization_location_type AS ENUM (
      'headquarters',
      'branch',
      'job_site',
      'remote',
      'other'
    );
  END IF;
END
$$;

-- ========================================================
-- Locations table
-- ========================================================
CREATE TABLE IF NOT EXISTS core.organization_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location_type core.organization_location_type NOT NULL DEFAULT 'other',
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES core.users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES core.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE core.organization_locations
  IS 'Normalized locations for organizations (HQ, branches, job sites, etc).';
COMMENT ON COLUMN core.organization_locations.address
  IS 'Structured address payload (street, city, region, postal_code, country).';

CREATE INDEX IF NOT EXISTS organization_locations_org_idx
  ON core.organization_locations(organization_id, is_active);
CREATE INDEX IF NOT EXISTS organization_locations_lat_lng_idx
  ON core.organization_locations(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

DROP TRIGGER IF EXISTS organization_locations_set_updated_at ON core.organization_locations;
CREATE TRIGGER organization_locations_set_updated_at
  BEFORE UPDATE ON core.organization_locations
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

-- ========================================================
-- Backfill helper column on organizations (locations JSONB store)
-- ========================================================
ALTER TABLE core.organizations
  ADD COLUMN IF NOT EXISTS locations JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ========================================================
-- Row Level Security
-- ========================================================
ALTER TABLE core.organization_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_locations_select ON core.organization_locations;
CREATE POLICY organization_locations_select ON core.organization_locations
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_locations_insert ON core.organization_locations;
CREATE POLICY organization_locations_insert ON core.organization_locations
  FOR INSERT TO authenticated
  WITH CHECK (
    core.is_org_member(organization_id)
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS organization_locations_update ON core.organization_locations;
CREATE POLICY organization_locations_update ON core.organization_locations
  FOR UPDATE TO authenticated
  USING (core.is_org_member(organization_id))
  WITH CHECK (core.is_org_member(organization_id));

DROP POLICY IF EXISTS organization_locations_delete ON core.organization_locations;
CREATE POLICY organization_locations_delete ON core.organization_locations
  FOR DELETE TO authenticated
  USING (core.is_org_member(organization_id));

-- ========================================================
-- Grants
-- ========================================================
GRANT ALL ON TABLE core.organization_locations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.organization_locations TO authenticated;
GRANT USAGE ON TYPE core.organization_location_type TO authenticated, service_role;

COMMIT;

