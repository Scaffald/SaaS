-- Migration: Add Missing DELETE Policy for compliance_issues Table (REQ-289 TASK-5 Completion)
-- Description: Adds admin-only DELETE policy to match pattern of other forsured tables
-- Author: Claude (REQ-289, TASK-5)
-- Date: 2025-11-21

-- =============================================================================
-- Compliance Issues DELETE Policy (REQ-289 TASK-5)
-- =============================================================================

-- DELETE: Only admins can delete compliance issues
CREATE POLICY "Admins can delete compliance issues"
  ON forsured.compliance_issues
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = forsured.compliance_issues.organization_id
        AND r.name IN ('owner', 'admin')
    )
  );

-- =============================================================================
-- Summary
-- =============================================================================
COMMENT ON POLICY "Admins can delete compliance issues" ON forsured.compliance_issues IS
  'REQ-289: Only admins can delete compliance issues within their organization';
