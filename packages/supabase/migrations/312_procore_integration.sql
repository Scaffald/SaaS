-- =============================================================================
-- 312_procore_integration.sql
--
-- Procore Integration: Create tables for OAuth integration, sync queue,
-- and sync logging. Alter existing projects/subcontractors tables to
-- support Procore ID tracking.
--
-- Tables created:
--   1. forsured.integrations       - OAuth connections to external providers
--   2. forsured.sync_queue         - Queued items awaiting user resolution
--   3. forsured.sync_log           - History of sync operations
--
-- Tables altered:
--   - forsured.projects            - ADD procore_id, procore_last_synced_at
--   - forsured.subcontractors      - ADD procore_vendor_id, procore_last_synced_at
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. forsured.integrations
-- =============================================================================

CREATE TABLE forsured.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Ownership
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,

    -- Provider details
    provider TEXT NOT NULL,
    provider_user_id TEXT,
    provider_company_id TEXT,

    -- OAuth tokens (encrypted at rest by application layer)
    access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    token_expires_at TIMESTAMPTZ,

    -- Scopes & status
    scopes TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'connected',

    -- Sync scheduling
    last_sync_at TIMESTAMPTZ,
    sync_error TEXT,
    sync_interval_minutes INTEGER DEFAULT 15,
    next_sync_at TIMESTAMPTZ,
    last_change_detected_at TIMESTAMPTZ,
    manual_sync_requested_at TIMESTAMPTZ,

    -- Extensible metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign keys
    CONSTRAINT fk_integrations_user
        FOREIGN KEY (user_id)
        REFERENCES forsured.users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_integrations_organization
        FOREIGN KEY (organization_id)
        REFERENCES forsured.organizations(id)
        ON DELETE CASCADE,

    -- Each user can only have one connection per provider
    CONSTRAINT uq_integrations_user_provider UNIQUE (user_id, provider),

    -- Constraints
    CONSTRAINT chk_integrations_status
        CHECK (status IN ('connected', 'disconnected', 'error')),
    CONSTRAINT chk_integrations_provider
        CHECK (provider IN ('procore'))
);

COMMENT ON TABLE forsured.integrations IS 'OAuth integrations with external providers (e.g. Procore)';

-- Indexes
CREATE INDEX idx_integrations_user_id
    ON forsured.integrations(user_id);

CREATE INDEX idx_integrations_organization_id
    ON forsured.integrations(organization_id);

CREATE INDEX idx_integrations_status_provider
    ON forsured.integrations(status, provider);

CREATE INDEX idx_integrations_next_sync_at
    ON forsured.integrations(next_sync_at)
    WHERE status = 'connected';


-- =============================================================================
-- 2. forsured.sync_queue
-- =============================================================================

CREATE TABLE forsured.sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- References
    integration_id UUID NOT NULL,
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,

    -- Entity being synced
    entity_type TEXT NOT NULL,
    provider_entity_id TEXT,
    provider_data JSONB,

    -- Match results
    match_status TEXT,
    matched_entity_id UUID,
    match_confidence NUMERIC(3,2),
    match_reason TEXT,

    -- Resolution
    resolution TEXT NOT NULL DEFAULT 'pending',
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Foreign keys
    CONSTRAINT fk_sync_queue_integration
        FOREIGN KEY (integration_id)
        REFERENCES forsured.integrations(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sync_queue_user
        FOREIGN KEY (user_id)
        REFERENCES forsured.users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sync_queue_organization
        FOREIGN KEY (organization_id)
        REFERENCES forsured.organizations(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_sync_queue_resolved_by
        FOREIGN KEY (resolved_by)
        REFERENCES forsured.users(id)
        ON DELETE SET NULL,

    -- Constraints
    CONSTRAINT chk_sync_queue_entity_type
        CHECK (entity_type IN ('project', 'subcontractor', 'project_removed', 'subcontractor_removed')),
    CONSTRAINT chk_sync_queue_match_status
        CHECK (match_status IN ('no_match', 'exact_match', 'fuzzy_match')),
    CONSTRAINT chk_sync_queue_resolution
        CHECK (resolution IN ('pending', 'link', 'create_new', 'skip'))
);

COMMENT ON TABLE forsured.sync_queue IS 'Queued sync items from external providers awaiting user resolution';

-- Indexes
CREATE INDEX idx_sync_queue_integration_id
    ON forsured.sync_queue(integration_id);

CREATE INDEX idx_sync_queue_user_id
    ON forsured.sync_queue(user_id);

CREATE INDEX idx_sync_queue_organization_id
    ON forsured.sync_queue(organization_id);

CREATE INDEX idx_sync_queue_resolution
    ON forsured.sync_queue(resolution)
    WHERE resolution = 'pending';

CREATE INDEX idx_sync_queue_entity_type
    ON forsured.sync_queue(entity_type);


-- =============================================================================
-- 3. forsured.sync_log
-- =============================================================================

CREATE TABLE forsured.sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Reference
    integration_id UUID NOT NULL,

    -- Trigger info
    triggered_by TEXT NOT NULL,

    -- Timing
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- Status
    status TEXT NOT NULL DEFAULT 'running',

    -- Counters
    projects_found INTEGER DEFAULT 0,
    projects_changed INTEGER DEFAULT 0,
    vendors_found INTEGER DEFAULT 0,
    vendors_changed INTEGER DEFAULT 0,
    new_items_queued INTEGER DEFAULT 0,
    updates_applied INTEGER DEFAULT 0,

    -- Adaptive interval tracking
    interval_before_minutes INTEGER,
    interval_after_minutes INTEGER,

    -- Error details
    error_message TEXT,

    -- Extensible metadata
    metadata JSONB DEFAULT '{}',

    -- Foreign keys
    CONSTRAINT fk_sync_log_integration
        FOREIGN KEY (integration_id)
        REFERENCES forsured.integrations(id)
        ON DELETE CASCADE,

    -- Constraints
    CONSTRAINT chk_sync_log_triggered_by
        CHECK (triggered_by IN ('scheduled', 'manual', 'initial')),
    CONSTRAINT chk_sync_log_status
        CHECK (status IN ('running', 'completed', 'failed'))
);

COMMENT ON TABLE forsured.sync_log IS 'Log of sync operations performed against external providers';

-- Indexes
CREATE INDEX idx_sync_log_integration_id
    ON forsured.sync_log(integration_id);

CREATE INDEX idx_sync_log_started_at
    ON forsured.sync_log(started_at DESC);

CREATE INDEX idx_sync_log_status
    ON forsured.sync_log(status)
    WHERE status = 'running';


-- =============================================================================
-- 4. ALTER EXISTING TABLES
-- =============================================================================

-- Add Procore columns to projects
ALTER TABLE forsured.projects
    ADD COLUMN IF NOT EXISTS procore_id TEXT,
    ADD COLUMN IF NOT EXISTS procore_last_synced_at TIMESTAMPTZ;

-- Add Procore columns to subcontractors
ALTER TABLE forsured.subcontractors
    ADD COLUMN IF NOT EXISTS procore_vendor_id TEXT,
    ADD COLUMN IF NOT EXISTS procore_last_synced_at TIMESTAMPTZ;

-- Unique partial indexes (only enforce uniqueness where value is set)
CREATE UNIQUE INDEX IF NOT EXISTS uq_projects_procore_id
    ON forsured.projects(procore_id)
    WHERE procore_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_subcontractors_procore_vendor_id
    ON forsured.subcontractors(procore_vendor_id)
    WHERE procore_vendor_id IS NOT NULL;

COMMENT ON COLUMN forsured.projects.procore_id IS 'Procore project ID, set when linked via sync';
COMMENT ON COLUMN forsured.projects.procore_last_synced_at IS 'Last time this project was synced from Procore';
COMMENT ON COLUMN forsured.subcontractors.procore_vendor_id IS 'Procore vendor ID, set when linked via sync';
COMMENT ON COLUMN forsured.subcontractors.procore_last_synced_at IS 'Last time this subcontractor was synced from Procore';


-- =============================================================================
-- 5. ENABLE RLS ON NEW TABLES
-- =============================================================================

ALTER TABLE forsured.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.sync_log ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 6. RLS POLICIES — Service role bypass (all three tables)
-- =============================================================================

CREATE POLICY "Service role has full access to integrations"
    ON forsured.integrations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to sync_queue"
    ON forsured.sync_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role has full access to sync_log"
    ON forsured.sync_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);


-- =============================================================================
-- 7. RLS POLICIES — Authenticated user policies
-- =============================================================================

-- ----- integrations: own user only (user_id = auth.uid()) -----

CREATE POLICY "Users can view their own integrations"
    ON forsured.integrations
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create their own integrations"
    ON forsured.integrations
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own integrations"
    ON forsured.integrations
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own integrations"
    ON forsured.integrations
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- ----- sync_queue: own user for SELECT, UPDATE (resolution fields only) -----

CREATE POLICY "Users can view their own sync queue items"
    ON forsured.sync_queue
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update resolution on their own sync queue items"
    ON forsured.sync_queue
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- ----- sync_log: own integration's logs via subquery -----

CREATE POLICY "Users can view logs for their own integrations"
    ON forsured.sync_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM forsured.integrations i
            WHERE i.id = sync_log.integration_id
              AND i.user_id = auth.uid()
        )
    );


-- =============================================================================
-- 8. GRANTS
-- =============================================================================

-- Authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON forsured.integrations TO authenticated;
GRANT SELECT, UPDATE ON forsured.sync_queue TO authenticated;
GRANT SELECT ON forsured.sync_log TO authenticated;

-- Service role (full access)
GRANT ALL ON forsured.integrations TO service_role;
GRANT ALL ON forsured.sync_queue TO service_role;
GRANT ALL ON forsured.sync_log TO service_role;


-- =============================================================================
-- 9. TRIGGER — updated_at on integrations
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_integrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_integrations_updated_at ON forsured.integrations;

CREATE TRIGGER trg_integrations_updated_at
    BEFORE UPDATE ON forsured.integrations
    FOR EACH ROW
    EXECUTE FUNCTION forsured.update_integrations_updated_at();


COMMIT;
