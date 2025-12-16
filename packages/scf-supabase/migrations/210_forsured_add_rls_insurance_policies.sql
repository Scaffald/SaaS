-- Migration: Add RLS Policies for Insurance Policy Tables (REQ-289)
-- Description: Enables Row Level Security for insurance_policies, policy_provisions, policy_endorsements
-- Author: Claude (REQ-289, TASK-1, TASK-2, TASK-3)
-- Date: 2025-11-21

-- =============================================================================
-- Insurance Policies Table RLS
-- =============================================================================

-- Enable RLS
ALTER TABLE forsured.insurance_policies ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view policies in their organization
CREATE POLICY "Users can view own organization policies"
  ON forsured.insurance_policies
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create policies for their organization
CREATE POLICY "Users can create own organization policies"
  ON forsured.insurance_policies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update policies in their organization
CREATE POLICY "Users can update own organization policies"
  ON forsured.insurance_policies
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Only admins can delete policies
CREATE POLICY "Admins can delete policies"
  ON forsured.insurance_policies
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = forsured.insurance_policies.organization_id
        AND r.name IN ('owner', 'admin')
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass for insurance_policies"
  ON forsured.insurance_policies
  FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- Policy Provisions Table RLS
-- =============================================================================

-- Enable RLS
ALTER TABLE forsured.policy_provisions ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view provisions in their organization
CREATE POLICY "Users can view own organization provisions"
  ON forsured.policy_provisions
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create provisions for their organization
CREATE POLICY "Users can create own organization provisions"
  ON forsured.policy_provisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update provisions in their organization
CREATE POLICY "Users can update own organization provisions"
  ON forsured.policy_provisions
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Only admins can delete provisions
CREATE POLICY "Admins can delete provisions"
  ON forsured.policy_provisions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = forsured.policy_provisions.organization_id
        AND r.name IN ('owner', 'admin')
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass for policy_provisions"
  ON forsured.policy_provisions
  FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- Policy Endorsements Table RLS
-- =============================================================================

-- Enable RLS
ALTER TABLE forsured.policy_endorsements ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view endorsements in their organization
CREATE POLICY "Users can view own organization endorsements"
  ON forsured.policy_endorsements
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create endorsements for their organization
CREATE POLICY "Users can create own organization endorsements"
  ON forsured.policy_endorsements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update endorsements in their organization
CREATE POLICY "Users can update own organization endorsements"
  ON forsured.policy_endorsements
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Only admins can delete endorsements
CREATE POLICY "Admins can delete endorsements"
  ON forsured.policy_endorsements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = forsured.policy_endorsements.organization_id
        AND r.name IN ('owner', 'admin')
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass for policy_endorsements"
  ON forsured.policy_endorsements
  FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- Summary
-- =============================================================================
COMMENT ON POLICY "Users can view own organization policies" ON forsured.insurance_policies IS
  'REQ-289: Users can view insurance policies for their organization';
COMMENT ON POLICY "Users can view own organization provisions" ON forsured.policy_provisions IS
  'REQ-289: Users can view policy provisions for their organization';
COMMENT ON POLICY "Users can view own organization endorsements" ON forsured.policy_endorsements IS
  'REQ-289: Users can view policy endorsements for their organization';
