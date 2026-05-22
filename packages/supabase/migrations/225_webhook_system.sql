-- Migration: Webhook Delivery System
-- Description: Tables and functions for webhook registration, delivery, and retry logic
-- Created: 2026-01-07

-- ================================================================
-- WEBHOOKS TABLE
-- ================================================================
-- Stores webhook endpoint registrations for organizations
CREATE TABLE IF NOT EXISTS public.webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

    -- Webhook configuration
    url TEXT NOT NULL,
    description TEXT,
    secret TEXT NOT NULL, -- HMAC secret for signing payloads
    is_active BOOLEAN NOT NULL DEFAULT true,

    -- Event subscriptions (array of event types)
    events TEXT[] NOT NULL DEFAULT '{}',

    -- Delivery settings
    retry_max_attempts INT NOT NULL DEFAULT 3,
    retry_backoff_seconds INT[] NOT NULL DEFAULT ARRAY[60, 300, 900], -- 1min, 5min, 15min
    timeout_ms INT NOT NULL DEFAULT 10000, -- 10 seconds

    -- Rate limiting
    rate_limit_per_minute INT DEFAULT 60,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Statistics
    last_delivery_at TIMESTAMPTZ,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    total_deliveries INT NOT NULL DEFAULT 0,
    successful_deliveries INT NOT NULL DEFAULT 0,
    failed_deliveries INT NOT NULL DEFAULT 0,

    -- Audit fields
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT valid_url CHECK (url ~* '^https?://'),
    CONSTRAINT valid_events CHECK (array_length(events, 1) > 0),
    CONSTRAINT valid_retry_attempts CHECK (retry_max_attempts BETWEEN 0 AND 10),
    CONSTRAINT valid_timeout CHECK (timeout_ms BETWEEN 1000 AND 60000)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_organization ON public.webhooks(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_webhooks_events ON public.webhooks USING GIN (events);

-- ================================================================
-- WEBHOOK_DELIVERIES TABLE
-- ================================================================
-- Tracks individual webhook delivery attempts
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,

    -- Event information
    event_type TEXT NOT NULL,
    event_id UUID NOT NULL, -- Reference to the source event (job_id, application_id, etc.)
    event_data JSONB NOT NULL,

    -- Delivery information
    attempt_number INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed, retrying

    -- Request details
    request_headers JSONB,
    request_body JSONB NOT NULL,
    request_signature TEXT, -- HMAC-SHA256 signature

    -- Response details
    response_status_code INT,
    response_headers JSONB,
    response_body TEXT,
    response_time_ms INT,

    -- Error information
    error_message TEXT,
    error_code TEXT,

    -- Retry information
    next_retry_at TIMESTAMPTZ,
    retry_count INT NOT NULL DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    delivered_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'success', 'failed', 'retrying', 'cancelled')),
    CONSTRAINT valid_attempt_number CHECK (attempt_number > 0),
    CONSTRAINT valid_retry_count CHECK (retry_count >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON public.webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON public.webhook_deliveries(status, next_retry_at) WHERE status IN ('pending', 'retrying');
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON public.webhook_deliveries(event_type, event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON public.webhook_deliveries(created_at DESC);

-- ================================================================
-- WEBHOOK_EVENTS TABLE
-- ================================================================
-- Event log for debugging and analytics
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

    -- Event information
    event_type TEXT NOT NULL,
    event_id UUID NOT NULL,
    event_data JSONB NOT NULL,

    -- Delivery tracking
    webhooks_triggered INT NOT NULL DEFAULT 0,
    webhooks_succeeded INT NOT NULL DEFAULT 0,
    webhooks_failed INT NOT NULL DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_organization ON public.webhook_events(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON public.webhook_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);

-- ================================================================
-- FUNCTIONS
-- ================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON public.webhooks;
CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON public.webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_updated_at();

-- Update webhook statistics on delivery completion
CREATE OR REPLACE FUNCTION update_webhook_delivery_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'success' AND (OLD.status IS NULL OR OLD.status != 'success') THEN
        UPDATE public.webhooks
        SET
            total_deliveries = total_deliveries + 1,
            successful_deliveries = successful_deliveries + 1,
            last_delivery_at = now(),
            last_success_at = now()
        WHERE id = NEW.webhook_id;
    ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
        UPDATE public.webhooks
        SET
            total_deliveries = total_deliveries + 1,
            failed_deliveries = failed_deliveries + 1,
            last_delivery_at = now(),
            last_failure_at = now()
        WHERE id = NEW.webhook_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_webhook_stats_on_delivery ON public.webhook_deliveries;
CREATE TRIGGER update_webhook_stats_on_delivery
    AFTER UPDATE OF status ON public.webhook_deliveries
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_delivery_stats();

-- Function to get webhooks for an event
CREATE OR REPLACE FUNCTION get_webhooks_for_event(
    p_organization_id UUID,
    p_event_type TEXT
)
RETURNS TABLE (
    webhook_id UUID,
    url TEXT,
    secret TEXT,
    retry_max_attempts INT,
    retry_backoff_seconds INT[],
    timeout_ms INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id,
        w.url,
        w.secret,
        w.retry_max_attempts,
        w.retry_backoff_seconds,
        w.timeout_ms
    FROM public.webhooks w
    WHERE
        w.organization_id = p_organization_id
        AND w.is_active = true
        AND p_event_type = ANY(w.events);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending deliveries for retry
CREATE OR REPLACE FUNCTION get_pending_webhook_deliveries()
RETURNS TABLE (
    delivery_id UUID,
    webhook_id UUID,
    webhook_url TEXT,
    webhook_secret TEXT,
    event_type TEXT,
    request_body JSONB,
    attempt_number INT,
    retry_count INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.webhook_id,
        w.url,
        w.secret,
        d.event_type,
        d.request_body,
        d.attempt_number,
        d.retry_count
    FROM public.webhook_deliveries d
    JOIN public.webhooks w ON w.id = d.webhook_id
    WHERE
        d.status IN ('pending', 'retrying')
        AND (d.next_retry_at IS NULL OR d.next_retry_at <= now())
        AND w.is_active = true
    ORDER BY d.created_at ASC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- RLS POLICIES
-- ================================================================

-- Enable RLS
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Webhooks: Organization members can view and manage
DROP POLICY IF EXISTS webhooks_select_policy ON public.webhooks;
CREATE POLICY webhooks_select_policy ON public.webhooks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM core.role_assignments ra
            WHERE ra.scope_org_id = webhooks.organization_id
            AND ra.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS webhooks_insert_policy ON public.webhooks;
CREATE POLICY webhooks_insert_policy ON public.webhooks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.scope_org_id = webhooks.organization_id
            AND ra.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS webhooks_update_policy ON public.webhooks;
CREATE POLICY webhooks_update_policy ON public.webhooks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.scope_org_id = webhooks.organization_id
            AND ra.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS webhooks_delete_policy ON public.webhooks;
CREATE POLICY webhooks_delete_policy ON public.webhooks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM core.role_assignments ra
            JOIN core.roles r ON r.id = ra.role_id
            WHERE ra.scope_org_id = webhooks.organization_id
            AND ra.user_id = auth.uid()
        )
    );

-- Webhook Deliveries: Read-only for organization members
DROP POLICY IF EXISTS webhook_deliveries_select_policy ON public.webhook_deliveries;
CREATE POLICY webhook_deliveries_select_policy ON public.webhook_deliveries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.webhooks w
            JOIN core.role_assignments ra ON ra.scope_org_id = w.organization_id
            WHERE w.id = webhook_deliveries.webhook_id
            AND ra.user_id = auth.uid()
        )
    );

-- Webhook Events: Read-only for organization members
DROP POLICY IF EXISTS webhook_events_select_policy ON public.webhook_events;
CREATE POLICY webhook_events_select_policy ON public.webhook_events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM core.role_assignments ra
            WHERE ra.scope_org_id = webhook_events.organization_id
            AND ra.user_id = auth.uid()
        )
    );

-- ================================================================
-- COMMENTS
-- ================================================================

COMMENT ON TABLE public.webhooks IS 'Webhook endpoint registrations for organizations';
COMMENT ON TABLE public.webhook_deliveries IS 'Individual webhook delivery attempts and their results';
COMMENT ON TABLE public.webhook_events IS 'Event log for webhook triggers and deliveries';

COMMENT ON COLUMN public.webhooks.secret IS 'HMAC-SHA256 secret for signing webhook payloads';
COMMENT ON COLUMN public.webhooks.events IS 'Array of event types this webhook subscribes to (e.g., job.created, application.submitted)';
COMMENT ON COLUMN public.webhooks.retry_backoff_seconds IS 'Seconds to wait between retry attempts (exponential backoff)';

COMMENT ON FUNCTION get_webhooks_for_event IS 'Returns active webhooks subscribed to a specific event type for an organization';
COMMENT ON FUNCTION get_pending_webhook_deliveries IS 'Returns webhook deliveries that are pending or due for retry';
