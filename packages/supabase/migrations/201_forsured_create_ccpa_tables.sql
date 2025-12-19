-- Migration: 002_create_ccpa_tables.sql
-- Description: CCPA compliance tables for privacy requests, consent management, and breach notifications
-- REQ-131: CCPA Compliance Implementation (USA-Only Scope)
-- Created: 2025-11-08
-- Part of: ForSured MVP - Security & Privacy

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- PRIVACY REQUESTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS privacy_requests (
  -- Primary key and timestamps
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Request identification
  request_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., REQ-2025-001234
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN (
    'right_to_know',
    'right_to_delete',
    'right_to_correct',
    'opt_out_sale',
    'limit_sensitive_pi'
  )),

  -- Requester information
  user_id UUID, -- NULL if request from non-user
  requester_name VARCHAR(255) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requester_phone VARCHAR(50),

  -- Verification
  verification_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (verification_status IN (
    'pending',
    'verified',
    'failed',
    'requires_additional_info'
  )),
  verification_method VARCHAR(100), -- e.g., "email_verification", "two_factor_match"
  verification_date TIMESTAMP WITH TIME ZONE,
  verification_notes TEXT,

  -- Request details
  request_description TEXT,
  requested_data_categories TEXT[], -- Categories of data requested
  scope VARCHAR(50) CHECK (scope IN ('all_data', 'categories_only', 'specific_pieces')),

  -- Processing
  status VARCHAR(50) NOT NULL DEFAULT 'received' CHECK (status IN (
    'received',
    'verification_pending',
    'in_progress',
    'completed',
    'denied',
    'expired'
  )),
  assigned_to_user_id UUID,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  -- Response timeline (CCPA requires 45 days, extendable to 90)
  due_date TIMESTAMP WITH TIME ZONE NOT NULL, -- 45 days from creation
  extended_due_date TIMESTAMP WITH TIME ZONE, -- Up to 90 days if extended
  extension_reason TEXT,

  -- Response
  completed_date TIMESTAMP WITH TIME ZONE,
  response_method VARCHAR(50) CHECK (response_method IN ('email', 'portal', 'mail', 'api')),
  response_notes TEXT,
  denial_reason TEXT,

  -- Data export (for Right to Know requests)
  export_file_url TEXT, -- S3 URL or similar
  export_file_size BIGINT, -- bytes
  export_format VARCHAR(20) CHECK (export_format IN ('json', 'csv', 'pdf')),
  export_generated_at TIMESTAMP WITH TIME ZONE,
  export_expires_at TIMESTAMP WITH TIME ZONE, -- 7 days after generation

  -- Data deletion (for Right to Delete requests)
  deletion_scheduled_date TIMESTAMP WITH TIME ZONE, -- 90-day grace period
  deletion_completed_date TIMESTAMP WITH TIME ZONE,
  deletion_scope JSONB, -- What was deleted

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,

  -- Audit trail
  created_by_user_id UUID,
  last_modified_by_user_id UUID
);

-- Indexes
CREATE INDEX idx_privacy_requests_created_at ON privacy_requests(created_at DESC);
CREATE INDEX idx_privacy_requests_user_id ON privacy_requests(user_id);
CREATE INDEX idx_privacy_requests_email ON privacy_requests(requester_email);
CREATE INDEX idx_privacy_requests_status ON privacy_requests(status);
CREATE INDEX idx_privacy_requests_type ON privacy_requests(request_type);
CREATE INDEX idx_privacy_requests_due_date ON privacy_requests(due_date);
CREATE INDEX idx_privacy_requests_number ON privacy_requests(request_number);

-- GIN index for metadata searches
CREATE INDEX idx_privacy_requests_metadata ON privacy_requests USING gin(metadata);

-- Comments
COMMENT ON TABLE privacy_requests IS 'CCPA privacy requests (Right to Know, Right to Delete, etc.) with 45-day response timeline';
COMMENT ON COLUMN privacy_requests.request_number IS 'Human-readable request ID (e.g., REQ-2025-001234)';
COMMENT ON COLUMN privacy_requests.due_date IS 'CCPA requires response within 45 days of receipt';
COMMENT ON COLUMN privacy_requests.extended_due_date IS 'Can extend to 90 days with notice to consumer';
COMMENT ON COLUMN privacy_requests.deletion_scheduled_date IS '90-day soft delete grace period before permanent deletion';

-- =============================================================================
-- CONSENT RECORDS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS consent_records (
  -- Primary key and timestamps
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- User and organization
  user_id UUID NOT NULL,
  organization_id UUID,

  -- Consent details
  consent_type VARCHAR(100) NOT NULL CHECK (consent_type IN (
    'data_collection',
    'data_processing',
    'data_sharing',
    'marketing_communications',
    'analytics',
    'opt_out_sale',
    'limit_sensitive_pi',
    'third_party_sharing',
    'cookies_essential',
    'cookies_analytics',
    'cookies_marketing'
  )),
  consent_given BOOLEAN NOT NULL,
  consent_version VARCHAR(50) NOT NULL, -- Version of privacy policy/terms

  -- Context
  consent_method VARCHAR(100) NOT NULL CHECK (consent_method IN (
    'explicit_opt_in',
    'explicit_opt_out',
    'implied',
    'pre_checked_box',
    'unchecked_box',
    'toggle_switch',
    'button_click',
    'form_submission',
    'api_call'
  )),
  consent_text TEXT, -- The text user consented to
  consent_scope JSONB, -- What specific data/purposes

  -- Tracking
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  location_country VARCHAR(2),
  location_region VARCHAR(100),

  -- Expiration and withdrawal
  expires_at TIMESTAMP WITH TIME ZONE, -- Some consents expire
  withdrawn_at TIMESTAMP WITH TIME ZONE,
  withdrawal_reason TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_type ON consent_records(consent_type);
CREATE INDEX idx_consent_records_given ON consent_records(consent_given);
CREATE INDEX idx_consent_records_created_at ON consent_records(created_at DESC);
CREATE INDEX idx_consent_records_withdrawn ON consent_records(withdrawn_at) WHERE withdrawn_at IS NOT NULL;

-- Composite index for active consents
-- Note: Cannot use NOW() in index predicate (not immutable)
-- Application should filter expired consents at query time
CREATE INDEX idx_consent_records_active ON consent_records(user_id, consent_type, consent_given)
  WHERE withdrawn_at IS NULL;

-- Comments
COMMENT ON TABLE consent_records IS 'Auditable consent tracking for CCPA compliance and privacy management';
COMMENT ON COLUMN consent_records.consent_version IS 'Version of privacy policy user consented to (enables consent invalidation on policy changes)';
COMMENT ON COLUMN consent_records.consent_text IS 'Exact text user consented to (for audit proof)';
COMMENT ON COLUMN consent_records.consent_method IS 'How consent was obtained (explicit opt-in preferred for CCPA)';

-- =============================================================================
-- BREACH NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS breach_notifications (
  -- Primary key and timestamps
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Breach identification
  breach_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., BREACH-2025-001
  breach_type VARCHAR(100) NOT NULL CHECK (breach_type IN (
    'unauthorized_access',
    'data_exfiltration',
    'ransomware',
    'insider_threat',
    'lost_device',
    'misconfiguration',
    'third_party_breach',
    'other'
  )),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),

  -- Discovery and reporting
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reported_internally_at TIMESTAMP WITH TIME ZONE,
  reported_externally_at TIMESTAMP WITH TIME ZONE,

  -- Affected data
  affected_user_count INTEGER NOT NULL DEFAULT 0,
  affected_california_residents INTEGER NOT NULL DEFAULT 0,
  data_types_exposed TEXT[] NOT NULL, -- e.g., ['email', 'policy_number', 'SSN']
  sensitive_data_exposed BOOLEAN NOT NULL DEFAULT false,

  -- Impact assessment
  impact_description TEXT,
  root_cause TEXT,
  attack_vector TEXT,
  systems_compromised TEXT[],

  -- Containment and remediation
  contained_at TIMESTAMP WITH TIME ZONE,
  containment_actions TEXT,
  remediation_status VARCHAR(50) CHECK (remediation_status IN (
    'not_started',
    'in_progress',
    'completed',
    'ongoing_monitoring'
  )),
  remediation_notes TEXT,

  -- Notification status (CCPA requires 72 hours)
  notification_required BOOLEAN NOT NULL DEFAULT false,
  notification_deadline TIMESTAMP WITH TIME ZONE, -- 72 hours from discovery
  user_notification_sent BOOLEAN NOT NULL DEFAULT false,
  user_notification_sent_at TIMESTAMP WITH TIME ZONE,
  user_notification_method VARCHAR(50), -- 'email', 'mail', 'phone', 'website'

  -- Regulatory notification
  california_ag_notified BOOLEAN NOT NULL DEFAULT false,
  california_ag_notified_at TIMESTAMP WITH TIME ZONE,
  other_regulators_notified TEXT[], -- Other regulatory bodies notified

  -- Law enforcement
  law_enforcement_notified BOOLEAN NOT NULL DEFAULT false,
  law_enforcement_agency TEXT,
  law_enforcement_case_number VARCHAR(100),

  -- Insurance
  cyber_insurance_claim_filed BOOLEAN NOT NULL DEFAULT false,
  cyber_insurance_claim_number VARCHAR(100),

  -- Post-incident
  post_incident_review_completed BOOLEAN NOT NULL DEFAULT false,
  post_incident_review_date TIMESTAMP WITH TIME ZONE,
  lessons_learned TEXT,
  preventive_measures TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_by_user_id UUID NOT NULL,
  last_modified_by_user_id UUID
);

-- Indexes
CREATE INDEX idx_breach_notifications_created_at ON breach_notifications(created_at DESC);
CREATE INDEX idx_breach_notifications_discovered_at ON breach_notifications(discovered_at DESC);
CREATE INDEX idx_breach_notifications_severity ON breach_notifications(severity);
CREATE INDEX idx_breach_notifications_type ON breach_notifications(breach_type);
CREATE INDEX idx_breach_notifications_number ON breach_notifications(breach_number);
CREATE INDEX idx_breach_notifications_deadline ON breach_notifications(notification_deadline)
  WHERE notification_required = true AND user_notification_sent = false;

-- Comments
COMMENT ON TABLE breach_notifications IS 'Data breach incident tracking with CCPA 72-hour notification requirement';
COMMENT ON COLUMN breach_notifications.notification_deadline IS 'CCPA requires notification within 72 hours of discovery if >500 CA residents affected';
COMMENT ON COLUMN breach_notifications.affected_california_residents IS 'CCPA applies to California residents specifically';
COMMENT ON COLUMN breach_notifications.california_ag_notified IS 'California AG must be notified if >500 CA residents affected';

-- =============================================================================
-- DATA PROCESSING AGREEMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS data_processing_agreements (
  -- Primary key and timestamps
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Vendor/processor information
  vendor_name VARCHAR(255) NOT NULL,
  vendor_contact_email VARCHAR(255) NOT NULL,
  vendor_contact_phone VARCHAR(50),
  vendor_type VARCHAR(100) NOT NULL CHECK (vendor_type IN (
    'hosting',
    'database',
    'storage',
    'ocr_ai',
    'email',
    'authentication',
    'monitoring',
    'analytics',
    'other'
  )),

  -- Agreement details
  dpa_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (dpa_status IN (
    'pending',
    'under_review',
    'signed',
    'expired',
    'terminated'
  )),
  dpa_signed_date DATE,
  dpa_expiration_date DATE,
  dpa_document_url TEXT, -- S3 URL or similar

  -- Data processing scope
  data_types_processed TEXT[], -- Types of data vendor processes
  processing_purposes TEXT[], -- Purposes of processing
  data_retention_period INTERVAL,
  data_location_countries TEXT[], -- Where data is stored/processed

  -- Compliance commitments
  ccpa_compliant BOOLEAN NOT NULL DEFAULT false,
  gdpr_compliant BOOLEAN,
  soc2_certified BOOLEAN,
  iso27001_certified BOOLEAN,
  hipaa_compliant BOOLEAN,

  -- Breach notification requirements
  breach_notification_sla_hours INTEGER DEFAULT 72, -- Hours to notify ForSured

  -- Subprocessors
  subprocessors JSONB DEFAULT '[]'::jsonb, -- Array of subprocessor details

  -- Review and audit
  last_review_date DATE,
  next_review_date DATE,
  audit_rights BOOLEAN NOT NULL DEFAULT true,
  last_audit_date DATE,

  -- Risk assessment
  risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  risk_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit trail
  created_by_user_id UUID NOT NULL,
  last_modified_by_user_id UUID
);

-- Indexes
CREATE INDEX idx_dpa_vendor_name ON data_processing_agreements(vendor_name);
CREATE INDEX idx_dpa_status ON data_processing_agreements(dpa_status);
CREATE INDEX idx_dpa_expiration ON data_processing_agreements(dpa_expiration_date)
  WHERE dpa_status = 'signed';
CREATE INDEX idx_dpa_review ON data_processing_agreements(next_review_date)
  WHERE dpa_status = 'signed';
CREATE INDEX idx_dpa_risk ON data_processing_agreements(risk_level);

-- Comments
COMMENT ON TABLE data_processing_agreements IS 'Track Data Processing Agreements (DPAs) with service providers for CCPA compliance';
COMMENT ON COLUMN data_processing_agreements.breach_notification_sla_hours IS 'Hours vendor commits to notify ForSured of data breaches';
COMMENT ON COLUMN data_processing_agreements.subprocessors IS 'JSONB array of subprocessor details (vendor must disclose and obtain approval)';

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all CCPA tables
CREATE TRIGGER update_privacy_requests_updated_at
  BEFORE UPDATE ON privacy_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breach_notifications_updated_at
  BEFORE UPDATE ON breach_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dpa_updated_at
  BEFORE UPDATE ON data_processing_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- AUTOMATIC DUE DATE TRIGGER FOR PRIVACY REQUESTS
-- =============================================================================

CREATE OR REPLACE FUNCTION set_privacy_request_due_date()
RETURNS TRIGGER AS $$
BEGIN
  -- CCPA requires 45-day response time
  IF NEW.due_date IS NULL THEN
    NEW.due_date := NEW.created_at + INTERVAL '45 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_privacy_request_due_date_trigger
  BEFORE INSERT ON privacy_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_privacy_request_due_date();

-- =============================================================================
-- AUTOMATIC BREACH NOTIFICATION DEADLINE TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION set_breach_notification_deadline()
RETURNS TRIGGER AS $$
BEGIN
  -- CCPA requires 72-hour notification if notification required
  IF NEW.notification_required AND NEW.notification_deadline IS NULL THEN
    NEW.notification_deadline := NEW.discovered_at + INTERVAL '72 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_breach_notification_deadline_trigger
  BEFORE INSERT ON breach_notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_breach_notification_deadline();

-- =============================================================================
-- PRIVACY REQUEST NUMBER GENERATION
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS privacy_request_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_privacy_request_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := CONCAT(
      'REQ-',
      TO_CHAR(NEW.created_at, 'YYYY'),
      '-',
      LPAD(nextval('privacy_request_number_seq')::TEXT, 6, '0')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_privacy_request_number_trigger
  BEFORE INSERT ON privacy_requests
  FOR EACH ROW
  EXECUTE FUNCTION generate_privacy_request_number();

-- =============================================================================
-- BREACH NUMBER GENERATION
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS breach_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_breach_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.breach_number IS NULL THEN
    NEW.breach_number := CONCAT(
      'BREACH-',
      TO_CHAR(NEW.discovered_at, 'YYYY'),
      '-',
      LPAD(nextval('breach_number_seq')::TEXT, 3, '0')
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_breach_number_trigger
  BEFORE INSERT ON breach_notifications
  FOR EACH ROW
  EXECUTE FUNCTION generate_breach_number();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Privacy Requests RLS
ALTER TABLE privacy_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own privacy requests
CREATE POLICY "Users can view own privacy requests"
  ON privacy_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR requester_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Users can create privacy requests
CREATE POLICY "Users can create privacy requests"
  ON privacy_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Service role can read/update all
CREATE POLICY "Service role can manage privacy requests"
  ON privacy_requests
  FOR ALL
  TO service_role
  USING (true);

-- Consent Records RLS
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

-- Users can view their own consent records
CREATE POLICY "Users can view own consent records"
  ON consent_records
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create/update their own consent records
CREATE POLICY "Users can manage own consent records"
  ON consent_records
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Service role can read all
CREATE POLICY "Service role can manage consent records"
  ON consent_records
  FOR ALL
  TO service_role
  USING (true);

-- Breach Notifications RLS (restricted to admins/service role only)
ALTER TABLE breach_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage breach notifications"
  ON breach_notifications
  FOR ALL
  TO service_role
  USING (true);

-- DPA RLS (restricted to admins/service role only)
ALTER TABLE data_processing_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage DPAs"
  ON data_processing_agreements
  FOR ALL
  TO service_role
  USING (true);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant appropriate permissions
GRANT SELECT, INSERT ON privacy_requests TO authenticated;
GRANT ALL ON privacy_requests TO service_role;

GRANT ALL ON consent_records TO authenticated;
GRANT ALL ON consent_records TO service_role;

GRANT ALL ON breach_notifications TO service_role;
GRANT ALL ON data_processing_agreements TO service_role;

-- Grant sequence usage
GRANT USAGE ON SEQUENCE privacy_request_number_seq TO authenticated, service_role;
GRANT USAGE ON SEQUENCE breach_number_seq TO service_role;

-- =============================================================================
-- AUDIT LOG INTEGRATION
-- =============================================================================

-- Log privacy request creation
CREATE OR REPLACE FUNCTION log_privacy_request_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    category,
    action,
    severity,
    user_id,
    resource_type,
    resource_name,
    record_id,
    metadata,
    status
  ) VALUES (
    'compliance',
    CASE
      WHEN TG_OP = 'INSERT' THEN 'privacy_request_created'
      WHEN TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN 'privacy_request_status_changed'
      WHEN TG_OP = 'UPDATE' AND NEW.verification_status != OLD.verification_status THEN 'privacy_request_verified'
      ELSE 'privacy_request_updated'
    END,
    'medium',
    NEW.user_id,
    'privacy_request',
    NEW.request_number,
    NEW.id,
    jsonb_build_object(
      'request_type', NEW.request_type,
      'status', NEW.status,
      'verification_status', NEW.verification_status
    ),
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_privacy_request_audit_trigger
  AFTER INSERT OR UPDATE ON privacy_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_privacy_request_audit();

-- Log consent changes
CREATE OR REPLACE FUNCTION log_consent_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    category,
    action,
    severity,
    user_id,
    resource_type,
    record_id,
    metadata,
    status
  ) VALUES (
    'compliance',
    CASE
      WHEN TG_OP = 'INSERT' THEN 'consent_recorded'
      WHEN TG_OP = 'UPDATE' AND NEW.withdrawn_at IS NOT NULL AND OLD.withdrawn_at IS NULL THEN 'consent_withdrawn'
      ELSE 'consent_updated'
    END,
    'low',
    NEW.user_id,
    'consent_record',
    NEW.id,
    jsonb_build_object(
      'consent_type', NEW.consent_type,
      'consent_given', NEW.consent_given,
      'consent_method', NEW.consent_method
    ),
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_consent_audit_trigger
  AFTER INSERT OR UPDATE ON consent_records
  FOR EACH ROW
  EXECUTE FUNCTION log_consent_audit();

-- Log breach notifications
CREATE OR REPLACE FUNCTION log_breach_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    category,
    action,
    severity,
    user_id,
    resource_type,
    resource_name,
    record_id,
    metadata,
    status
  ) VALUES (
    'security',
    CASE
      WHEN TG_OP = 'INSERT' THEN 'breach_reported'
      WHEN TG_OP = 'UPDATE' AND NEW.user_notification_sent != OLD.user_notification_sent THEN 'breach_notification_sent'
      WHEN TG_OP = 'UPDATE' AND NEW.contained_at IS NOT NULL AND OLD.contained_at IS NULL THEN 'breach_contained'
      ELSE 'breach_updated'
    END,
    'critical',
    NEW.created_by_user_id,
    'breach_notification',
    NEW.breach_number,
    NEW.id,
    jsonb_build_object(
      'breach_type', NEW.breach_type,
      'severity', NEW.severity,
      'affected_users', NEW.affected_user_count,
      'notification_required', NEW.notification_required
    ),
    'success'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_breach_audit_trigger
  AFTER INSERT OR UPDATE ON breach_notifications
  FOR EACH ROW
  EXECUTE FUNCTION log_breach_audit();

-- =============================================================================
-- INITIAL DATA / TESTING
-- =============================================================================

-- Insert sample DPA for demonstration
INSERT INTO data_processing_agreements (
  vendor_name,
  vendor_contact_email,
  vendor_type,
  dpa_status,
  data_types_processed,
  processing_purposes,
  ccpa_compliant,
  risk_level,
  created_by_user_id
) VALUES (
  'Example Cloud Provider',
  'privacy@example.com',
  'hosting',
  'pending',
  ARRAY['user_profiles', 'project_data', 'policy_documents'],
  ARRAY['hosting', 'infrastructure'],
  false,
  'high',
  gen_random_uuid()
);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON SCHEMA public IS 'REQ-131 CCPA Compliance Migration 002 applied successfully';
