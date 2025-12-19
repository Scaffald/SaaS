-- Migration: Create Coverage Requests Table (REQ-273)
-- Description: Enable coverage request workflow between subs and brokers
-- Author: Claude (REQ-273, TASK-1)
-- Date: 2025-11-21

-- =============================================================================
-- Coverage Requests Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.coverage_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES core.projects(id) ON DELETE SET NULL,
    requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    broker_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    coverage_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    quote_amount DECIMAL(12,2),
    quote_details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_coverage_requests_status CHECK (
        status IN ('pending', 'quoted', 'approved', 'rejected', 'cancelled')
    ),
    CONSTRAINT chk_coverage_requests_quote_amount CHECK (
        quote_amount IS NULL OR quote_amount >= 0
    )
);

-- Index for querying by organization
CREATE INDEX IF NOT EXISTS idx_coverage_requests_organization_id
    ON forsured.coverage_requests(organization_id);

-- Index for querying by project
CREATE INDEX IF NOT EXISTS idx_coverage_requests_project_id
    ON forsured.coverage_requests(project_id);

-- Index for querying by broker
CREATE INDEX IF NOT EXISTS idx_coverage_requests_broker_id
    ON forsured.coverage_requests(broker_id);

-- Index for querying by requester
CREATE INDEX IF NOT EXISTS idx_coverage_requests_requester_id
    ON forsured.coverage_requests(requester_id);

-- Index for querying by status
CREATE INDEX IF NOT EXISTS idx_coverage_requests_status
    ON forsured.coverage_requests(status);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_coverage_requests_updated_at
    BEFORE UPDATE ON forsured.coverage_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE forsured.coverage_requests IS
    'REQ-273: Coverage request workflow between subcontractors and brokers';
COMMENT ON COLUMN forsured.coverage_requests.organization_id IS
    'Organization that owns this coverage request';
COMMENT ON COLUMN forsured.coverage_requests.project_id IS
    'Optional project this coverage request is associated with';
COMMENT ON COLUMN forsured.coverage_requests.requester_id IS
    'User who requested the coverage (typically a subcontractor)';
COMMENT ON COLUMN forsured.coverage_requests.broker_id IS
    'Broker assigned to provide quote (can be null initially)';
COMMENT ON COLUMN forsured.coverage_requests.coverage_type IS
    'Type of coverage being requested (GL, WC, Auto, etc.)';
COMMENT ON COLUMN forsured.coverage_requests.status IS
    'Status: pending, quoted, approved, rejected, cancelled';
COMMENT ON COLUMN forsured.coverage_requests.quote_amount IS
    'Quote amount provided by broker in USD';
COMMENT ON COLUMN forsured.coverage_requests.quote_details IS
    'Additional quote details and documentation in JSON format';
