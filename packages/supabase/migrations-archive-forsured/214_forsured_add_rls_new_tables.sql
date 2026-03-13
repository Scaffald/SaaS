-- Migration: Add RLS Policies for New Tables (REQ-289 Completion)
-- Description: Enables Row Level Security for coverage_requirements, coverage_requests, task_documents
-- Author: Claude (REQ-289, TASK-4, TASK-7, TASK-8)
-- Date: 2025-11-21

-- =============================================================================
-- Coverage Requirements Table RLS (REQ-289 TASK-4)
-- =============================================================================

-- Enable RLS
ALTER TABLE forsured.coverage_requirements ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view requirements in their organization
CREATE POLICY "Users can view own organization coverage requirements"
  ON forsured.coverage_requirements
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create requirements for their organization
CREATE POLICY "Users can create own organization coverage requirements"
  ON forsured.coverage_requirements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update requirements in their organization
CREATE POLICY "Users can update own organization coverage requirements"
  ON forsured.coverage_requirements
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Only admins can delete requirements
CREATE POLICY "Admins can delete coverage requirements"
  ON forsured.coverage_requirements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = forsured.coverage_requirements.organization_id
        AND r.name IN ('owner', 'admin')
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass for coverage_requirements"
  ON forsured.coverage_requirements
  FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- Coverage Requests Table RLS (REQ-289 TASK-8)
-- =============================================================================

-- Enable RLS
ALTER TABLE forsured.coverage_requests ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view requests in their organization
CREATE POLICY "Users can view own organization coverage requests"
  ON forsured.coverage_requests
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create requests for their organization
CREATE POLICY "Users can create own organization coverage requests"
  ON forsured.coverage_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update requests in their organization
CREATE POLICY "Users can update own organization coverage requests"
  ON forsured.coverage_requests
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Only admins can delete requests
CREATE POLICY "Admins can delete coverage requests"
  ON forsured.coverage_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = forsured.coverage_requests.organization_id
        AND r.name IN ('owner', 'admin')
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass for coverage_requests"
  ON forsured.coverage_requests
  FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- Task Documents Table RLS (REQ-289 TASK-7)
-- =============================================================================

-- Enable RLS
ALTER TABLE forsured.task_documents ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view task documents in their organization
CREATE POLICY "Users can view own organization task documents"
  ON forsured.task_documents
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: Users can create task documents for their organization
CREATE POLICY "Users can create own organization task documents"
  ON forsured.task_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update task documents in their organization
CREATE POLICY "Users can update own organization task documents"
  ON forsured.task_documents
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT scope_org_id
      FROM core.role_assignments
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete their own uploaded documents, admins can delete any
CREATE POLICY "Users can delete own task documents, admins can delete any"
  ON forsured.task_documents
  FOR DELETE
  TO authenticated
  USING (
    -- User uploaded this document
    uploaded_by = auth.uid()
    OR
    -- User is admin in organization
    EXISTS (
      SELECT 1
      FROM core.role_assignments ra
      JOIN core.roles r ON ra.role_id = r.id
      WHERE ra.user_id = auth.uid()
        AND ra.scope_org_id = forsured.task_documents.organization_id
        AND r.name IN ('owner', 'admin')
    )
  );

-- Service role bypass
CREATE POLICY "Service role bypass for task_documents"
  ON forsured.task_documents
  FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- Summary
-- =============================================================================
COMMENT ON POLICY "Users can view own organization coverage requirements" ON forsured.coverage_requirements IS
  'REQ-289: Users can view coverage requirements for their organization';
COMMENT ON POLICY "Users can view own organization coverage requests" ON forsured.coverage_requests IS
  'REQ-289: Users can view coverage requests for their organization';
COMMENT ON POLICY "Users can view own organization task documents" ON forsured.task_documents IS
  'REQ-289: Users can view task documents for their organization';
