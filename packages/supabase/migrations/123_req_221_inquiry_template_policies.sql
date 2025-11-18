-- =========================================================
-- 123_req_221_inquiry_template_policies.sql
-- RLS policies and grants for inquiry templates
-- =========================================================

BEGIN;

ALTER TABLE core.inquiry_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inquiry_templates_select ON core.inquiry_templates;
CREATE POLICY inquiry_templates_select ON core.inquiry_templates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.organizations o
      WHERE o.id = organization_id
        AND (
          o.owner_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM core.role_assignments ra
            WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
          )
        )
    )
  );

DROP POLICY IF EXISTS inquiry_templates_insert ON core.inquiry_templates;
CREATE POLICY inquiry_templates_insert ON core.inquiry_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM core.organizations o
      WHERE o.id = organization_id
        AND (
          o.owner_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM core.role_assignments ra
            WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
          )
        )
    )
  );

DROP POLICY IF EXISTS inquiry_templates_update ON core.inquiry_templates;
CREATE POLICY inquiry_templates_update ON core.inquiry_templates
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM core.organizations o
      WHERE o.id = organization_id
        AND (
          o.owner_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM core.role_assignments ra
            WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
          )
        )
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM core.organizations o
      WHERE o.id = organization_id
        AND (
          o.owner_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM core.role_assignments ra
            WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
          )
        )
    )
  );

DROP POLICY IF EXISTS inquiry_templates_delete ON core.inquiry_templates;
CREATE POLICY inquiry_templates_delete ON core.inquiry_templates
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM core.organizations o
      WHERE o.id = organization_id
        AND (
          o.owner_user_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM core.role_assignments ra
            WHERE ra.user_id = auth.uid()
              AND ra.scope_org_id = o.id
          )
        )
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON core.inquiry_templates TO authenticated;
GRANT ALL ON core.inquiry_templates TO service_role;

COMMIT;

