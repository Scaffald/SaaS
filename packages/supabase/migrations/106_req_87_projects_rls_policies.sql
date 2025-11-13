-- =========================================================
-- 106_req_87_projects_rls_policies.sql
-- REQ-87: Row Level Security policies for projects, sites, addresses, and project_workers
-- =========================================================

BEGIN;

-- =========================================================
-- ENABLE RLS ON ALL TABLES
-- =========================================================

ALTER TABLE core.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.project_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.project_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.project_workers ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- PROJECTS POLICIES
-- =========================================================

-- SELECT policy based on location_visibility
DROP POLICY IF EXISTS projects_select_visibility ON core.projects;
CREATE POLICY projects_select_visibility ON core.projects
  FOR SELECT TO anon, authenticated
  USING (
    CASE 
      WHEN location_visibility = 'public' THEN true
      WHEN location_visibility = 'authenticated' THEN auth.uid() IS NOT NULL
      WHEN location_visibility = 'organization_only' THEN 
        EXISTS (
          SELECT 1 FROM core.role_assignments ra
          JOIN core.roles r ON r.id = ra.role_id
          WHERE ra.user_id = auth.uid()
            AND ra.scope_org_id = organization_id
        )
      WHEN location_visibility = 'private' THEN 
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM core.role_assignments ra
          JOIN core.roles r ON r.id = ra.role_id
          WHERE ra.user_id = auth.uid()
            AND (
              ra.scope_org_id = organization_id OR 
              (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
            )
        )
      ELSE false
    END
  );

-- INSERT policy: organization members can create projects
DROP POLICY IF EXISTS projects_insert ON core.projects;
CREATE POLICY projects_insert ON core.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND (
          ra.scope_org_id = organization_id OR
          (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
        )
    )
  );

-- UPDATE policy: project creators, org admins, and super admins can edit
DROP POLICY IF EXISTS projects_update ON core.projects;
CREATE POLICY projects_update ON core.projects
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND (
          ra.scope_org_id = organization_id OR
          (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
        )
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM core.role_assignments ra
      JOIN core.roles r ON r.id = ra.role_id
      WHERE ra.user_id = auth.uid()
        AND (
          ra.scope_org_id = organization_id OR
          (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
        )
    )
  );

-- =========================================================
-- SITES POLICIES
-- =========================================================

-- SELECT policy: authenticated users can view sites
DROP POLICY IF EXISTS sites_select ON core.sites;
CREATE POLICY sites_select ON core.sites
  FOR SELECT TO authenticated
  USING (true);

-- INSERT policy: authenticated users can create sites
DROP POLICY IF EXISTS sites_insert ON core.sites;
CREATE POLICY sites_insert ON core.sites
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE policy: authenticated users can update sites (privacy controlled at project level)
DROP POLICY IF EXISTS sites_update ON core.sites;
CREATE POLICY sites_update ON core.sites
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- ADDRESSES POLICIES
-- =========================================================

-- SELECT policy: authenticated users can view addresses
DROP POLICY IF EXISTS addresses_select ON core.addresses;
CREATE POLICY addresses_select ON core.addresses
  FOR SELECT TO authenticated
  USING (true);

-- INSERT policy: authenticated users can create addresses
DROP POLICY IF EXISTS addresses_insert ON core.addresses;
CREATE POLICY addresses_insert ON core.addresses
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- UPDATE policy: authenticated users can update addresses (privacy controlled at project level)
DROP POLICY IF EXISTS addresses_update ON core.addresses;
CREATE POLICY addresses_update ON core.addresses
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- PROJECT_SITES JUNCTION POLICIES
-- =========================================================

-- SELECT policy: follow project visibility
DROP POLICY IF EXISTS project_sites_select ON core.project_sites;
CREATE POLICY project_sites_select ON core.project_sites
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
    )
  );

-- INSERT policy: project editors can link sites
DROP POLICY IF EXISTS project_sites_insert ON core.project_sites;
CREATE POLICY project_sites_insert ON core.project_sites
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  );

-- UPDATE/DELETE policy: project editors can manage site links
DROP POLICY IF EXISTS project_sites_update ON core.project_sites;
CREATE POLICY project_sites_update ON core.project_sites
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS project_sites_delete ON core.project_sites;
CREATE POLICY project_sites_delete ON core.project_sites
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  );

-- =========================================================
-- PROJECT_ADDRESSES JUNCTION POLICIES
-- =========================================================

-- SELECT policy: follow project visibility
DROP POLICY IF EXISTS project_addresses_select ON core.project_addresses;
CREATE POLICY project_addresses_select ON core.project_addresses
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
    )
  );

-- INSERT policy: project editors can link addresses
DROP POLICY IF EXISTS project_addresses_insert ON core.project_addresses;
CREATE POLICY project_addresses_insert ON core.project_addresses
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  );

-- UPDATE/DELETE policy: project editors can manage address links
DROP POLICY IF EXISTS project_addresses_update ON core.project_addresses;
CREATE POLICY project_addresses_update ON core.project_addresses
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  );

DROP POLICY IF EXISTS project_addresses_delete ON core.project_addresses;
CREATE POLICY project_addresses_delete ON core.project_addresses
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  );

-- =========================================================
-- PROJECT_WORKERS POLICIES
-- =========================================================

-- SELECT policy: workers can view their own associations, managers can view all for their projects
DROP POLICY IF EXISTS project_workers_select ON core.project_workers;
CREATE POLICY project_workers_select ON core.project_workers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin') AND r.scope = 'platform')
              )
          )
        )
    )
  );

-- INSERT policy: workers can claim work, managers can assign workers
DROP POLICY IF EXISTS project_workers_insert ON core.project_workers;
CREATE POLICY project_workers_insert ON core.project_workers
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Worker claiming their own work
    (user_id = auth.uid() AND claimed_by_worker = true AND status = 'pending') OR
    -- Manager assigning worker
    (
      assigned_by_manager = true AND
      EXISTS (
        SELECT 1 FROM core.projects p
        WHERE p.id = project_id
          AND (
            p.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM core.role_assignments ra
              JOIN core.roles r ON r.id = ra.role_id
              WHERE ra.user_id = auth.uid()
                AND (
                  ra.scope_org_id = p.organization_id OR
                  (r.name IN ('admin', 'super_admin', 'project_manager') AND 
                   (r.scope = 'platform' OR ra.scope_org_id = p.organization_id))
                )
            )
          )
      )
    )
  );

-- UPDATE policy: managers can approve/reject worker claims
DROP POLICY IF EXISTS project_workers_update ON core.project_workers;
CREATE POLICY project_workers_update ON core.project_workers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin', 'project_manager') AND 
                 (r.scope = 'platform' OR ra.scope_org_id = p.organization_id))
              )
          )
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM core.projects p
      WHERE p.id = project_id
        AND (
          p.created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.user_id = auth.uid()
              AND (
                ra.scope_org_id = p.organization_id OR
                (r.name IN ('admin', 'super_admin', 'project_manager') AND 
                 (r.scope = 'platform' OR ra.scope_org_id = p.organization_id))
              )
          )
        )
    )
  );

-- =========================================================
-- GRANTS
-- =========================================================

-- Projects grants
GRANT SELECT ON core.projects TO anon, authenticated;
GRANT INSERT, UPDATE ON core.projects TO authenticated;
GRANT ALL ON core.projects TO service_role;

-- Sites grants
GRANT SELECT, INSERT, UPDATE ON core.sites TO authenticated;
GRANT ALL ON core.sites TO service_role;

-- Addresses grants
GRANT SELECT, INSERT, UPDATE ON core.addresses TO authenticated;
GRANT ALL ON core.addresses TO service_role;

-- Project-Sites junction grants
GRANT SELECT ON core.project_sites TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON core.project_sites TO authenticated;
GRANT ALL ON core.project_sites TO service_role;

-- Project-Addresses junction grants
GRANT SELECT ON core.project_addresses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON core.project_addresses TO authenticated;
GRANT ALL ON core.project_addresses TO service_role;

-- Project-Workers grants
GRANT SELECT, INSERT, UPDATE ON core.project_workers TO authenticated;
GRANT ALL ON core.project_workers TO service_role;

COMMIT;

