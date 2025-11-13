-- =========================================================
-- 105_req_87_projects_geographic_schema.sql
-- REQ-87: Construction Projects, Lot Location, & Property Address
-- Creates database schema for projects with geographic data
-- =========================================================

BEGIN;

-- =========================================================
-- CUSTOM TYPES (ENUMS)
-- =========================================================

-- Project status enum
CREATE TYPE core.project_status AS ENUM (
  'planning',
  'active',
  'completed',
  'on_hold'
);

-- Project location visibility enum
CREATE TYPE core.location_visibility AS ENUM (
  'public',
  'authenticated',
  'organization_only',
  'private'
);

-- Property type enum
CREATE TYPE core.property_type AS ENUM (
  'residential',
  'commercial',
  'industrial',
  'mixed_use',
  'other'
);

-- Project worker status enum
CREATE TYPE core.project_worker_status AS ENUM (
  'pending',
  'approved',
  'rejected'
);

-- =========================================================
-- CORE SCHEMA TABLES
-- =========================================================

-- Projects table
CREATE TABLE core.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,  -- FK to core.organizations(id) in relations
  name TEXT NOT NULL,
  description TEXT,
  status core.project_status NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  location_visibility core.location_visibility NOT NULL DEFAULT 'organization_only',
  location_visibility_override BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,  -- FK to auth.users(id) in relations
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE core.projects IS 'Construction projects with geographic location data';
COMMENT ON COLUMN core.projects.location_visibility IS 'Who can see project location: public, authenticated, organization_only, private';
COMMENT ON COLUMN core.projects.location_visibility_override IS 'Indicates if project overrides organization default visibility setting';

-- Sites table (Geographic Boundaries)
CREATE TABLE core.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_identifier TEXT,
  boundary GEOGRAPHY(POLYGON, 4326) NOT NULL,
  area_sqft NUMERIC,
  zoning_classification TEXT,
  jurisdiction TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE core.sites IS 'Geographic site boundaries using PostGIS polygons';
COMMENT ON COLUMN core.sites.boundary IS 'PostGIS polygon for site boundaries (WGS84)';
COMMENT ON COLUMN core.sites.site_identifier IS 'External site identifier or reference number';

-- Addresses table (Property Locations)
CREATE TABLE core.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID,  -- FK to core.sites(id) in relations
  address JSONB NOT NULL,
  geo GEOGRAPHY(POINT, 4326),
  property_type core.property_type,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE core.addresses IS 'Physical addresses of properties at sites';
COMMENT ON COLUMN core.addresses.address IS 'Structured address using addressSchema (street, city, state, zip, country, latitude, longitude)';
COMMENT ON COLUMN core.addresses.geo IS 'PostGIS point for precise location (WGS84)';

-- Project-Site Junction Table
CREATE TABLE core.project_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,  -- FK to core.projects(id) in relations
  site_id UUID NOT NULL,  -- FK to core.sites(id) in relations
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, site_id)
);

COMMENT ON TABLE core.project_sites IS 'Links projects to one or more sites (a project can span multiple geographic areas)';
COMMENT ON COLUMN core.project_sites.is_primary IS 'Indicates main project site';

-- Project-Address Junction Table
CREATE TABLE core.project_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,  -- FK to core.projects(id) in relations
  address_id UUID NOT NULL,  -- FK to core.addresses(id) in relations
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, address_id)
);

COMMENT ON TABLE core.project_addresses IS 'Links projects to one or more addresses';
COMMENT ON COLUMN core.project_addresses.is_primary IS 'Indicates main project address';

-- Project Workers Junction Table
CREATE TABLE core.project_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,  -- FK to core.projects(id) in relations
  user_id UUID NOT NULL,  -- FK to auth.users(id) in relations
  job_id UUID,  -- FK to core.jobs(id) in relations (optional)
  status core.project_worker_status NOT NULL DEFAULT 'pending',
  claimed_by_worker BOOLEAN DEFAULT false,
  assigned_by_manager BOOLEAN DEFAULT false,
  approved_by UUID,  -- FK to auth.users(id) in relations (optional)
  approved_at TIMESTAMPTZ,
  start_date DATE,
  end_date DATE,
  role_on_project TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id, job_id)
);

COMMENT ON TABLE core.project_workers IS 'Tracks which workers have worked on which projects with approval workflow';
COMMENT ON COLUMN core.project_workers.claimed_by_worker IS 'Worker claimed they worked on this';
COMMENT ON COLUMN core.project_workers.assigned_by_manager IS 'Manager assigned worker to project';

-- System Configuration Table
CREATE TABLE IF NOT EXISTS core.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE core.system_config IS 'System-wide configuration settings';
COMMENT ON COLUMN core.system_config.key IS 'Configuration key (e.g., site_overlap_threshold_percent)';
COMMENT ON COLUMN core.system_config.value IS 'Configuration value as JSONB';

-- Insert default overlap threshold
INSERT INTO core.system_config (key, value, description)
VALUES ('site_overlap_threshold_percent', '2.0'::jsonb, 'Percentage threshold for site overlap notifications')
ON CONFLICT (key) DO NOTHING;

-- =========================================================
-- ALTER EXISTING TABLES
-- =========================================================

-- Add default project location visibility to organizations
ALTER TABLE core.organizations 
ADD COLUMN IF NOT EXISTS default_project_location_visibility core.location_visibility 
DEFAULT 'organization_only';

COMMENT ON COLUMN core.organizations.default_project_location_visibility IS 'Default location visibility for projects in this organization';

-- =========================================================
-- INDEXES
-- =========================================================

-- Spatial indexes (GIST for geographic queries)
CREATE INDEX IF NOT EXISTS sites_boundary_idx 
ON core.sites USING GIST(boundary);

CREATE INDEX IF NOT EXISTS addresses_geo_idx 
ON core.addresses USING GIST(geo);

-- Foreign key indexes
CREATE INDEX IF NOT EXISTS projects_org_idx 
ON core.projects(organization_id);

CREATE INDEX IF NOT EXISTS projects_creator_idx 
ON core.projects(created_by);

CREATE INDEX IF NOT EXISTS addresses_site_idx 
ON core.addresses(site_id);

CREATE INDEX IF NOT EXISTS project_sites_project_idx 
ON core.project_sites(project_id);

CREATE INDEX IF NOT EXISTS project_sites_site_idx 
ON core.project_sites(site_id);

CREATE INDEX IF NOT EXISTS project_addresses_project_idx 
ON core.project_addresses(project_id);

CREATE INDEX IF NOT EXISTS project_addresses_address_idx 
ON core.project_addresses(address_id);

CREATE INDEX IF NOT EXISTS project_workers_project_idx 
ON core.project_workers(project_id);

CREATE INDEX IF NOT EXISTS project_workers_user_idx 
ON core.project_workers(user_id);

CREATE INDEX IF NOT EXISTS project_workers_status_idx 
ON core.project_workers(status);

-- Lookup indexes
CREATE INDEX IF NOT EXISTS sites_identifier_idx 
ON core.sites(site_identifier) 
WHERE site_identifier IS NOT NULL;

-- =========================================================
-- VALIDATION FUNCTIONS
-- =========================================================

-- Validate address containment in site
CREATE OR REPLACE FUNCTION core.validate_address_in_site(
  p_address_id UUID,
  p_site_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = core
AS $$
DECLARE
  v_contained BOOLEAN;
BEGIN
  SELECT ST_Contains(
    s.boundary::geometry,
    a.geo::geometry
  ) INTO v_contained
  FROM core.sites s
  CROSS JOIN core.addresses a
  WHERE s.id = p_site_id
    AND a.id = p_address_id
    AND a.geo IS NOT NULL;
  
  RETURN COALESCE(v_contained, false);
END;
$$;

COMMENT ON FUNCTION core.validate_address_in_site IS 'Validates that an address point is contained within a site boundary';

-- Check site overlaps
CREATE OR REPLACE FUNCTION core.check_site_overlaps(
  p_site_id UUID,
  p_boundary GEOGRAPHY
)
RETURNS TABLE(
  overlapping_site_id UUID,
  overlap_percent NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = core
AS $$
DECLARE
  v_threshold NUMERIC;
BEGIN
  -- Get threshold from config (default 2.0)
  SELECT COALESCE(
    (value::text)::numeric,
    2.0
  ) INTO v_threshold
  FROM core.system_config
  WHERE key = 'site_overlap_threshold_percent';
  
  RETURN QUERY
  SELECT 
    s.id,
    ROUND(
      (ST_Area(ST_Intersection(p_boundary::geometry, s.boundary::geometry)) / 
       NULLIF(ST_Area(p_boundary::geometry), 0) * 100)::numeric,
      2
    ) as overlap_percent
  FROM core.sites s
  WHERE s.id != COALESCE(p_site_id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND ST_Overlaps(p_boundary::geometry, s.boundary::geometry)
    AND ST_Area(ST_Intersection(p_boundary::geometry, s.boundary::geometry)) / 
        NULLIF(ST_Area(p_boundary::geometry), 0) * 100 > v_threshold;
END;
$$;

COMMENT ON FUNCTION core.check_site_overlaps IS 'Checks for site overlaps exceeding configured threshold percentage';

-- Trigger function for overlap notifications
CREATE OR REPLACE FUNCTION core.notify_site_overlap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core
AS $$
DECLARE
  v_overlap RECORD;
  v_threshold NUMERIC;
  v_site_name TEXT;
  v_overlapping_site_name TEXT;
BEGIN
  -- Get threshold from config
  SELECT COALESCE(
    (value::text)::numeric,
    2.0
  ) INTO v_threshold
  FROM core.system_config
  WHERE key = 'site_overlap_threshold_percent';
  
  -- Get site identifier for notification
  SELECT COALESCE(site_identifier, id::text) INTO v_site_name
  FROM core.sites
  WHERE id = NEW.id;
  
  -- Check for overlaps
  FOR v_overlap IN 
    SELECT * FROM core.check_site_overlaps(NEW.id, NEW.boundary)
  LOOP
    -- Get overlapping site identifier
    SELECT COALESCE(site_identifier, id::text) INTO v_overlapping_site_name
    FROM core.sites
    WHERE id = v_overlap.overlapping_site_id;
    
    -- Create notification for admins
    INSERT INTO core.notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      severity,
      body
    )
    SELECT 
      u.id,
      'warning'::core.notification_type,
      'Site Overlap Detected',
      format('Site %s overlaps with site %s by %s%%. Please request survey data or site verification from project owners.',
        v_site_name, v_overlapping_site_name, v_overlap.overlap_percent),
      jsonb_build_object(
        'site_id', NEW.id,
        'overlapping_site_id', v_overlap.overlapping_site_id,
        'overlap_percent', v_overlap.overlap_percent,
        'threshold', v_threshold,
        'notification_type', 'site_overlap'
      ),
      'important'::core.notification_severity,
      jsonb_build_object(
        'preview', format('Site %s overlaps with site %s by %s%%', v_site_name, v_overlapping_site_name, v_overlap.overlap_percent),
        'site_id', NEW.id,
        'overlapping_site_id', v_overlap.overlapping_site_id
      )
    FROM core.users u
    JOIN core.role_assignments ra ON ra.user_id = u.id
    JOIN core.roles r ON r.id = ra.role_id
    WHERE r.name IN ('admin', 'super_admin')
      AND r.scope = 'platform';
  END LOOP;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION core.notify_site_overlap IS 'Creates admin notifications when site overlaps exceed threshold';

-- Create trigger for overlap notifications
DROP TRIGGER IF EXISTS trg_site_overlap_check ON core.sites;
CREATE TRIGGER trg_site_overlap_check
  AFTER INSERT OR UPDATE OF boundary ON core.sites
  FOR EACH ROW
  EXECUTE FUNCTION core.notify_site_overlap();

-- =========================================================
-- FOREIGN KEY RELATIONSHIPS
-- =========================================================

-- Projects foreign keys
ALTER TABLE core.projects
  ADD CONSTRAINT projects_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES core.organizations(id) ON DELETE CASCADE;

ALTER TABLE core.projects
  ADD CONSTRAINT projects_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;

-- Addresses foreign keys
ALTER TABLE core.addresses
  ADD CONSTRAINT addresses_site_id_fkey 
  FOREIGN KEY (site_id) REFERENCES core.sites(id) ON DELETE SET NULL;

-- Project-Site junction foreign keys
ALTER TABLE core.project_sites
  ADD CONSTRAINT project_sites_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES core.projects(id) ON DELETE CASCADE;

ALTER TABLE core.project_sites
  ADD CONSTRAINT project_sites_site_id_fkey 
  FOREIGN KEY (site_id) REFERENCES core.sites(id) ON DELETE CASCADE;

-- Project-Address junction foreign keys
ALTER TABLE core.project_addresses
  ADD CONSTRAINT project_addresses_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES core.projects(id) ON DELETE CASCADE;

ALTER TABLE core.project_addresses
  ADD CONSTRAINT project_addresses_address_id_fkey 
  FOREIGN KEY (address_id) REFERENCES core.addresses(id) ON DELETE CASCADE;

-- Project Workers foreign keys
ALTER TABLE core.project_workers
  ADD CONSTRAINT project_workers_project_id_fkey 
  FOREIGN KEY (project_id) REFERENCES core.projects(id) ON DELETE CASCADE;

ALTER TABLE core.project_workers
  ADD CONSTRAINT project_workers_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE core.project_workers
  ADD CONSTRAINT project_workers_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES core.jobs(id) ON DELETE SET NULL;

ALTER TABLE core.project_workers
  ADD CONSTRAINT project_workers_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =========================================================
-- UPDATED_AT TRIGGERS
-- =========================================================

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON core.projects
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_sites_updated_at
  BEFORE UPDATE ON core.sites
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_addresses_updated_at
  BEFORE UPDATE ON core.addresses
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

CREATE TRIGGER trg_project_workers_updated_at
  BEFORE UPDATE ON core.project_workers
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();

COMMIT;

