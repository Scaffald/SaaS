-- Migration: Create Remaining Tables for REQ-212
-- Description: Creates remaining tables for relationships, acknowledgements, bids, etc.
-- Author: Claude (REQ-212)
-- Date: 2025-11-14

-- =============================================================================
-- Relationships Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    manager_org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    subcontractor_org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    relationship_health_score INTEGER,
    projects_together_count INTEGER DEFAULT 0,
    total_contract_value DECIMAL(15, 2),
    last_project_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_relationships_status CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    CONSTRAINT uq_relationships_orgs UNIQUE (manager_org_id, subcontractor_org_id)
);

-- Indexes for relationships
CREATE INDEX idx_forsured_relationships_manager ON forsured.relationships(manager_org_id);
CREATE INDEX idx_forsured_relationships_subcontractor ON forsured.relationships(subcontractor_org_id);
CREATE INDEX idx_forsured_relationships_status ON forsured.relationships(status);

-- RLS for relationships
ALTER TABLE forsured.relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relationships in their organization" ON forsured.relationships
    FOR SELECT TO authenticated
    USING (
        manager_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        OR subcontractor_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
    );

CREATE POLICY "Managers can create relationships" ON forsured.relationships
    FOR INSERT TO authenticated
    WITH CHECK (
        manager_org_id IN (
            SELECT organization_id FROM core.role_assignments
            WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
        )
    );

CREATE POLICY "Managers can update relationships" ON forsured.relationships
    FOR UPDATE TO authenticated
    USING (
        manager_org_id IN (
            SELECT organization_id FROM core.role_assignments
            WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
        )
    );

CREATE POLICY "Service role bypass" ON forsured.relationships
    TO service_role
    USING (true);

-- =============================================================================
-- Broker Acknowledgements Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.broker_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontractor_org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    broker_org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES forsured.projects(id) ON DELETE CASCADE,
    manager_org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    subcontractor_company_name TEXT NOT NULL,
    broker_agency_name TEXT NOT NULL,
    broker_contact_name TEXT NOT NULL,
    broker_email TEXT NOT NULL,
    broker_phone TEXT,
    gc_project_name TEXT NOT NULL,
    date_issued DATE NOT NULL,
    date_due DATE NOT NULL,
    date_submitted DATE,
    date_reviewed DATE,
    status TEXT NOT NULL DEFAULT 'draft',
    compliance_status TEXT,
    compliance_score INTEGER,
    missing_endorsements TEXT[],
    manager_notes TEXT,
    requires_pollution_liability BOOLEAN DEFAULT false,
    requires_professional_liability BOOLEAN DEFAULT false,
    involves_hazardous_materials BOOLEAN DEFAULT false,
    involves_trenching BOOLEAN DEFAULT false,
    involves_residential_work BOOLEAN DEFAULT false,
    created_by_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    submitted_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
    reviewed_by_user_id UUID REFERENCES core.users(id) ON DELETE SET NULL,
    coverage_items JSONB,
    signatures JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_broker_acks_status CHECK (status IN ('draft', 'pending', 'under_review', 'approved', 'rejected', 'revision_requested')),
    CONSTRAINT chk_broker_acks_compliance_status CHECK (compliance_status IN ('compliant', 'warning', 'critical', 'non_compliant', 'partial'))
);

-- Indexes for broker_acknowledgements
CREATE INDEX idx_forsured_broker_acks_subcontractor ON forsured.broker_acknowledgements(subcontractor_org_id);
CREATE INDEX idx_forsured_broker_acks_broker ON forsured.broker_acknowledgements(broker_org_id);
CREATE INDEX idx_forsured_broker_acks_project ON forsured.broker_acknowledgements(project_id);
CREATE INDEX idx_forsured_broker_acks_manager ON forsured.broker_acknowledgements(manager_org_id);
CREATE INDEX idx_forsured_broker_acks_status ON forsured.broker_acknowledgements(status);

-- RLS for broker_acknowledgements
ALTER TABLE forsured.broker_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view acknowledgements in their organization" ON forsured.broker_acknowledgements
    FOR SELECT TO authenticated
    USING (
        subcontractor_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        OR broker_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        OR manager_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create acknowledgements" ON forsured.broker_acknowledgements
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by_user_id = auth.uid()
        AND (
            broker_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
            OR manager_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update acknowledgements" ON forsured.broker_acknowledgements
    FOR UPDATE TO authenticated
    USING (
        broker_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        OR manager_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
    );

CREATE POLICY "Service role bypass" ON forsured.broker_acknowledgements
    TO service_role
    USING (true);

-- =============================================================================
-- Manager Acknowledgements Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.manager_acknowledgements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version TEXT NOT NULL,
    project_id UUID REFERENCES forsured.projects(id) ON DELETE CASCADE,
    gc_company_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    broker_company_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    effective_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    jurisdiction TEXT NOT NULL,
    attestations JSONB NOT NULL,
    licensing JSONB NOT NULL,
    eo_policy JSONB NOT NULL,
    responsibilities TEXT[],
    limits_liability JSONB NOT NULL,
    signers JSONB NOT NULL,
    links JSONB,
    audit_log JSONB,
    pdf_artifacts JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_manager_acks_status CHECK (status IN ('DRAFT', 'SENT', 'VIEWED', 'SIGNED', 'DECLINED', 'EXPIRED'))
);

-- Indexes for manager_acknowledgements
CREATE INDEX idx_forsured_manager_acks_project ON forsured.manager_acknowledgements(project_id);
CREATE INDEX idx_forsured_manager_acks_gc ON forsured.manager_acknowledgements(gc_company_id);
CREATE INDEX idx_forsured_manager_acks_broker ON forsured.manager_acknowledgements(broker_company_id);
CREATE INDEX idx_forsured_manager_acks_status ON forsured.manager_acknowledgements(status);

-- RLS for manager_acknowledgements
ALTER TABLE forsured.manager_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view manager acknowledgements in their organization" ON forsured.manager_acknowledgements
    FOR SELECT TO authenticated
    USING (
        gc_company_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        OR broker_company_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
    );

CREATE POLICY "Managers can create acknowledgements" ON forsured.manager_acknowledgements
    FOR INSERT TO authenticated
    WITH CHECK (
        gc_company_id IN (
            SELECT organization_id FROM core.role_assignments
            WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
        )
    );

CREATE POLICY "Managers can update acknowledgements" ON forsured.manager_acknowledgements
    FOR UPDATE TO authenticated
    USING (
        gc_company_id IN (
            SELECT organization_id FROM core.role_assignments
            WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
        )
    );

CREATE POLICY "Service role bypass" ON forsured.manager_acknowledgements
    TO service_role
    USING (true);

-- =============================================================================
-- Bids Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES forsured.projects(id) ON DELETE CASCADE,
    subcontractor_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    bid_amount DECIMAL(15, 2) NOT NULL,
    scope_of_work TEXT NOT NULL,
    proposed_timeline JSONB NOT NULL,
    documents JSONB,
    submitted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft',
    compliance_score INTEGER,
    coverage_gaps JSONB,
    risk_assessment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_bids_status CHECK (status IN ('draft', 'submitted', 'under_review', 'awarded', 'rejected'))
);

-- Indexes for bids
CREATE INDEX idx_forsured_bids_project ON forsured.bids(project_id);
CREATE INDEX idx_forsured_bids_subcontractor ON forsured.bids(subcontractor_id);
CREATE INDEX idx_forsured_bids_status ON forsured.bids(status);

-- RLS for bids
ALTER TABLE forsured.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bids for their projects" ON forsured.bids
    FOR SELECT TO authenticated
    USING (
        subcontractor_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        OR project_id IN (
            SELECT id FROM forsured.projects
            WHERE organization_id IN (
                SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Subcontractors can create bids" ON forsured.bids
    FOR INSERT TO authenticated
    WITH CHECK (
        subcontractor_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
    );

CREATE POLICY "Subcontractors can update own bids" ON forsured.bids
    FOR UPDATE TO authenticated
    USING (
        subcontractor_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
    );

CREATE POLICY "Service role bypass" ON forsured.bids
    TO service_role
    USING (true);

-- =============================================================================
-- Approvals Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    requested_by UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date TIMESTAMPTZ,
    priority TEXT NOT NULL DEFAULT 'normal',
    status TEXT NOT NULL DEFAULT 'pending',
    related_items JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_approvals_type CHECK (type IN ('endorsement_review', 'waiver_request', 'policy_renewal', 'document_verification', 'bid_approval', 'coverage_gap', 'user_invite')),
    CONSTRAINT chk_approvals_priority CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
    CONSTRAINT chk_approvals_status CHECK (status IN ('pending', 'approved', 'rejected', 'expired'))
);

-- Indexes for approvals
CREATE INDEX idx_forsured_approvals_organization ON forsured.approvals(organization_id);
CREATE INDEX idx_forsured_approvals_requested_by ON forsured.approvals(requested_by);
CREATE INDEX idx_forsured_approvals_status ON forsured.approvals(status);
CREATE INDEX idx_forsured_approvals_type ON forsured.approvals(type);

-- RLS for approvals
ALTER TABLE forsured.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view approvals in their organization" ON forsured.approvals
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create approvals" ON forsured.approvals
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        AND requested_by = auth.uid()
    );

CREATE POLICY "Managers can update approvals" ON forsured.approvals
    FOR UPDATE TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments
        WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
    ));

CREATE POLICY "Service role bypass" ON forsured.approvals
    TO service_role
    USING (true);

-- =============================================================================
-- AI Extractions Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.ai_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    policy_number TEXT,
    carrier TEXT,
    coverage_amounts JSONB,
    effective_date DATE,
    expiry_date DATE,
    named_insureds TEXT[],
    confidence INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_ai_extractions_confidence CHECK (confidence >= 0 AND confidence <= 100)
);

-- Indexes for ai_extractions
CREATE INDEX idx_forsured_ai_extractions_document ON forsured.ai_extractions(document_id);
CREATE INDEX idx_forsured_ai_extractions_organization ON forsured.ai_extractions(organization_id);

-- RLS for ai_extractions
ALTER TABLE forsured.ai_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI extractions in their organization" ON forsured.ai_extractions
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "System can create AI extractions" ON forsured.ai_extractions
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role bypass" ON forsured.ai_extractions
    TO service_role
    USING (true);

-- =============================================================================
-- Broker Delegations Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.broker_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    broker_org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    client_org_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    granted_by_user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    permissions TEXT[] NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for broker_delegations
CREATE INDEX idx_forsured_broker_delegations_broker ON forsured.broker_delegations(broker_org_id);
CREATE INDEX idx_forsured_broker_delegations_client ON forsured.broker_delegations(client_org_id);
CREATE INDEX idx_forsured_broker_delegations_granted_by ON forsured.broker_delegations(granted_by_user_id);

-- RLS for broker_delegations
ALTER TABLE forsured.broker_delegations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view delegations for their organization" ON forsured.broker_delegations
    FOR SELECT TO authenticated
    USING (
        broker_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        OR client_org_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
    );

CREATE POLICY "Managers can create delegations" ON forsured.broker_delegations
    FOR INSERT TO authenticated
    WITH CHECK (
        client_org_id IN (
            SELECT organization_id FROM core.role_assignments
            WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
        )
        AND granted_by_user_id = auth.uid()
    );

CREATE POLICY "Managers can update delegations" ON forsured.broker_delegations
    FOR UPDATE TO authenticated
    USING (
        client_org_id IN (
            SELECT organization_id FROM core.role_assignments
            WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
        )
    );

CREATE POLICY "Service role bypass" ON forsured.broker_delegations
    TO service_role
    USING (true);

-- =============================================================================
-- Document Versions Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_url TEXT,
    uploaded_by UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_document_versions_doc_version UNIQUE (document_id, version_number)
);

-- Indexes for document_versions
CREATE INDEX idx_forsured_document_versions_document ON forsured.document_versions(document_id);
CREATE INDEX idx_forsured_document_versions_organization ON forsured.document_versions(organization_id);
CREATE INDEX idx_forsured_document_versions_uploaded_by ON forsured.document_versions(uploaded_by);

-- RLS for document_versions
ALTER TABLE forsured.document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view document versions in their organization" ON forsured.document_versions
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create document versions" ON forsured.document_versions
    FOR INSERT TO authenticated
    WITH CHECK (
        organization_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Service role bypass" ON forsured.document_versions
    TO service_role
    USING (true);

-- =============================================================================
-- Compliance Issues Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.compliance_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subcontractor_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES forsured.projects(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_date TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    related_document_id UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_compliance_issues_type CHECK (type IN ('coverage_gap', 'missing_document', 'expired_policy', 'failed_verification', 'missing_endorsement')),
    CONSTRAINT chk_compliance_issues_severity CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    CONSTRAINT chk_compliance_issues_status CHECK (status IN ('open', 'in_progress', 'resolved'))
);

-- Indexes for compliance_issues
CREATE INDEX idx_forsured_compliance_issues_subcontractor ON forsured.compliance_issues(subcontractor_id);
CREATE INDEX idx_forsured_compliance_issues_project ON forsured.compliance_issues(project_id);
CREATE INDEX idx_forsured_compliance_issues_organization ON forsured.compliance_issues(organization_id);
CREATE INDEX idx_forsured_compliance_issues_status ON forsured.compliance_issues(status);
CREATE INDEX idx_forsured_compliance_issues_severity ON forsured.compliance_issues(severity);

-- RLS for compliance_issues
ALTER TABLE forsured.compliance_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view compliance issues in their organization" ON forsured.compliance_issues
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can create compliance issues" ON forsured.compliance_issues
    FOR INSERT TO authenticated
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can update compliance issues" ON forsured.compliance_issues
    FOR UPDATE TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

CREATE POLICY "Service role bypass" ON forsured.compliance_issues
    TO service_role
    USING (true);

-- =============================================================================
-- Integration Connections Table
-- =============================================================================
CREATE TABLE IF NOT EXISTS forsured.integration_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    integration_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'idle',
    auth_method TEXT NOT NULL,
    credentials JSONB,
    sync_settings JSONB NOT NULL,
    last_sync TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_integration_connections_status CHECK (status IN ('idle', 'connecting', 'connected', 'error')),
    CONSTRAINT chk_integration_connections_auth_method CHECK (auth_method IN ('api_key', 'oauth', 'username_password'))
);

-- Indexes for integration_connections
CREATE INDEX idx_forsured_integration_connections_integration ON forsured.integration_connections(integration_id);
CREATE INDEX idx_forsured_integration_connections_user ON forsured.integration_connections(user_id);
CREATE INDEX idx_forsured_integration_connections_organization ON forsured.integration_connections(organization_id);
CREATE INDEX idx_forsured_integration_connections_status ON forsured.integration_connections(status);

-- RLS for integration_connections
ALTER TABLE forsured.integration_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own integration connections" ON forsured.integration_connections
    FOR SELECT TO authenticated
    USING (
        user_id = auth.uid()
        OR organization_id IN (
            SELECT organization_id FROM core.role_assignments
            WHERE user_id = auth.uid() AND role_type IN ('owner', 'admin')
        )
    );

CREATE POLICY "Users can create own integration connections" ON forsured.integration_connections
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND organization_id IN (SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can update own integration connections" ON forsured.integration_connections
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Service role bypass" ON forsured.integration_connections
    TO service_role
    USING (true);

-- =============================================================================
-- Auto-update timestamps
-- =============================================================================
-- Apply update triggers to all new tables
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON forsured.relationships
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_broker_acknowledgements_updated_at BEFORE UPDATE ON forsured.broker_acknowledgements
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_manager_acknowledgements_updated_at BEFORE UPDATE ON forsured.manager_acknowledgements
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON forsured.bids
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON forsured.approvals
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_ai_extractions_updated_at BEFORE UPDATE ON forsured.ai_extractions
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_broker_delegations_updated_at BEFORE UPDATE ON forsured.broker_delegations
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_compliance_issues_updated_at BEFORE UPDATE ON forsured.compliance_issues
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

CREATE TRIGGER update_integration_connections_updated_at BEFORE UPDATE ON forsured.integration_connections
    FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE forsured.relationships IS 'Manager-subcontractor business relationships';
COMMENT ON TABLE forsured.broker_acknowledgements IS 'Broker acknowledgement forms for subcontractor coverage';
COMMENT ON TABLE forsured.manager_acknowledgements IS 'Manager acknowledgement packets with complex nested data';
COMMENT ON TABLE forsured.bids IS 'Subcontractor bid proposals for projects';
COMMENT ON TABLE forsured.approvals IS 'Approval workflow items requiring manager review';
COMMENT ON TABLE forsured.ai_extractions IS 'AI-extracted fields from insurance documents';
COMMENT ON TABLE forsured.broker_delegations IS 'Broker delegations of authority from clients';
COMMENT ON TABLE forsured.document_versions IS 'Version history for documents';
COMMENT ON TABLE forsured.compliance_issues IS 'Compliance issues and their resolution status';
COMMENT ON TABLE forsured.integration_connections IS 'Third-party integration connections and sync settings';
