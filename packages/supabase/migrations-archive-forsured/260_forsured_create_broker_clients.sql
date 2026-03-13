-- Migration: 260_forsured_create_broker_clients.sql
-- Description: Create broker_clients table for broker-client relationships
-- REQ: Schema alignment with original design for dashboard functionality
-- Author: Claude
-- Date: 2024-12-23

BEGIN;

-- =============================================================================
-- BROKER CLIENTS TABLE
-- =============================================================================
-- Stores broker-client relationships with compliance tracking.
-- Enables dashboard queries that were previously failing due to missing table.
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.broker_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Broker organization (from Scaffald)
  broker_org_id UUID NOT NULL,
  CONSTRAINT fk_broker_clients_broker_org
    FOREIGN KEY (broker_org_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Client organization (from Scaffald)
  client_org_id UUID NOT NULL,
  CONSTRAINT fk_broker_clients_client_org
    FOREIGN KEY (client_org_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  -- Client details (denormalized for query performance)
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,

  -- Classification
  client_type TEXT NOT NULL CHECK (client_type IN (
    'general_contractor', 'subcontractor', 'owner', 'developer'
  )),
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN (
    'low', 'medium', 'high', 'critical'
  )),

  -- Compliance
  compliance_score INTEGER CHECK (compliance_score IS NULL OR (compliance_score >= 0 AND compliance_score <= 100)),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

  -- Activity tracking
  last_activity_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Soft delete
  deleted_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint
  CONSTRAINT unique_broker_client UNIQUE (broker_org_id, client_org_id)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_broker_clients_broker ON forsured.broker_clients(broker_org_id);
CREATE INDEX IF NOT EXISTS idx_broker_clients_client ON forsured.broker_clients(client_org_id);
CREATE INDEX IF NOT EXISTS idx_broker_clients_status ON forsured.broker_clients(status);
CREATE INDEX IF NOT EXISTS idx_broker_clients_risk ON forsured.broker_clients(risk_level);
CREATE INDEX IF NOT EXISTS idx_broker_clients_deleted ON forsured.broker_clients(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_broker_clients_compliance ON forsured.broker_clients(compliance_score);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE forsured.broker_clients ENABLE ROW LEVEL SECURITY;

-- Users can view broker_clients for their organization
CREATE POLICY "Users can view broker_clients in their org"
  ON forsured.broker_clients
  FOR SELECT
  TO authenticated
  USING (
    broker_org_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Users can insert broker_clients for their organization
CREATE POLICY "Users can create broker_clients in their org"
  ON forsured.broker_clients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    broker_org_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Users can update broker_clients for their organization
CREATE POLICY "Users can update broker_clients in their org"
  ON forsured.broker_clients
  FOR UPDATE
  TO authenticated
  USING (
    broker_org_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Users can delete broker_clients for their organization
CREATE POLICY "Users can delete broker_clients in their org"
  ON forsured.broker_clients
  FOR DELETE
  TO authenticated
  USING (
    broker_org_id IN (
      SELECT scope_org_id FROM core.role_assignments
      WHERE user_id = auth.uid()
      AND scope_org_id IS NOT NULL
    )
  );

-- Service role bypass
CREATE POLICY "Service role has full access to broker_clients"
  ON forsured.broker_clients
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- GRANTS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.broker_clients TO authenticated;
GRANT ALL ON forsured.broker_clients TO service_role;

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_broker_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_broker_clients_updated_at ON forsured.broker_clients;

CREATE TRIGGER trg_broker_clients_updated_at
  BEFORE UPDATE ON forsured.broker_clients
  FOR EACH ROW
  EXECUTE FUNCTION forsured.update_broker_clients_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE forsured.broker_clients IS 'Broker-client relationships with compliance tracking';
COMMENT ON COLUMN forsured.broker_clients.broker_org_id IS 'Organization ID of the broker';
COMMENT ON COLUMN forsured.broker_clients.client_org_id IS 'Organization ID of the client';
COMMENT ON COLUMN forsured.broker_clients.company_name IS 'Denormalized client company name for query performance';
COMMENT ON COLUMN forsured.broker_clients.client_type IS 'Type of client: general_contractor, subcontractor, owner, developer';
COMMENT ON COLUMN forsured.broker_clients.risk_level IS 'Calculated risk level: low, medium, high, critical';
COMMENT ON COLUMN forsured.broker_clients.compliance_score IS 'Overall compliance score from 0-100';
COMMENT ON COLUMN forsured.broker_clients.deleted_at IS 'Soft delete timestamp';

COMMIT;
