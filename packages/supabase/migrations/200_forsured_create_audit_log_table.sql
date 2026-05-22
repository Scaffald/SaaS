-- Migration: 001_create_audit_log_table.sql
-- Description: Enhanced audit trail with tamper prevention (WORM) and hash chaining
-- REQ-130: Comprehensive Audit Logging with 7-Year Retention
-- Created: 2025-11-07
-- Part of: ForSured MVP - Security & Compliance

-- Enable pgcrypto extension for hash functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  -- Primary key and timestamp
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Event classification
  category VARCHAR(50) NOT NULL CHECK (category IN (
    'authentication',
    'authorization',
    'data_access',
    'data_modification',
    'admin',
    'security',
    'compliance',
    'system'
  )),
  action VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN (
    'critical',
    'high',
    'medium',
    'low',
    'info'
  )),

  -- Actor (who performed the action)
  user_id UUID,  -- References will be added when user table is created
  organization_id UUID,
  impersonated_by_user_id UUID,

  -- Target (what was affected)
  table_name VARCHAR(100),
  record_id UUID,
  resource_type VARCHAR(100),
  resource_name VARCHAR(500),

  -- Operation details
  operation VARCHAR(10) CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT', 'EXECUTE')),

  -- Data changes (for modifications)
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],

  -- Event metadata (flexible storage)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Request context
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  session_id VARCHAR(255),

  -- Geographic context
  country_code VARCHAR(2),
  region VARCHAR(100),
  city VARCHAR(100),

  -- Result and status
  status VARCHAR(20) CHECK (status IN ('success', 'failure', 'partial', 'denied')),
  error_message TEXT,

  -- Tamper prevention (WORM + Hash Chaining)
  previous_hash VARCHAR(64),  -- SHA-256 hash of previous record
  current_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of current record
  signature VARCHAR(512),  -- Digital signature (future)

  -- Retention metadata
  retention_period INTERVAL DEFAULT '7 years'::interval,
  archived_at TIMESTAMP WITH TIME ZONE,
  purge_after TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_category ON audit_log(category);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org ON audit_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_request ON audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_session ON audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_status ON audit_log(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_ip ON audit_log(ip_address);

-- GIN index for JSONB metadata searches
CREATE INDEX IF NOT EXISTS idx_audit_log_metadata ON audit_log USING gin(metadata);

-- Hash integrity index
CREATE INDEX IF NOT EXISTS idx_audit_log_hash ON audit_log(current_hash);
CREATE INDEX IF NOT EXISTS idx_audit_log_archived ON audit_log(archived_at) WHERE archived_at IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_log_user_created ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON audit_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_category_created ON audit_log(category, created_at DESC);

-- Partial indexes for specific use cases
CREATE INDEX IF NOT EXISTS idx_audit_log_failures ON audit_log(created_at DESC)
  WHERE status = 'failure';
CREATE INDEX IF NOT EXISTS idx_audit_log_security_events ON audit_log(created_at DESC)
  WHERE category = 'security';
CREATE INDEX IF NOT EXISTS idx_audit_log_critical ON audit_log(created_at DESC)
  WHERE severity IN ('critical', 'high');

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE audit_log IS 'Comprehensive audit trail for all system activities with WORM and 7-year retention';
COMMENT ON COLUMN audit_log.previous_hash IS 'SHA-256 hash of previous audit record (tamper detection via hash chaining)';
COMMENT ON COLUMN audit_log.current_hash IS 'SHA-256 hash of current record fields (tamper detection)';
COMMENT ON COLUMN audit_log.signature IS 'Digital signature for non-repudiation (future enhancement)';
COMMENT ON COLUMN audit_log.metadata IS 'Flexible JSONB storage for event-specific data';
COMMENT ON COLUMN audit_log.impersonated_by_user_id IS 'Admin who is impersonating the user';
COMMENT ON COLUMN audit_log.retention_period IS '7-year retention period for insurance industry compliance';

-- =============================================================================
-- HASH CALCULATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION calculate_audit_hash(
  p_id UUID,
  p_created_at TIMESTAMP WITH TIME ZONE,
  p_category VARCHAR,
  p_action VARCHAR,
  p_user_id UUID,
  p_record_id UUID,
  p_metadata JSONB
) RETURNS VARCHAR AS $$
DECLARE
  hash_input TEXT;
BEGIN
  -- Concatenate key fields for hashing
  -- Order matters for hash consistency!
  hash_input := CONCAT(
    p_id::text,
    '|',
    p_created_at::text,
    '|',
    p_category,
    '|',
    p_action,
    '|',
    COALESCE(p_user_id::text, ''),
    '|',
    COALESCE(p_record_id::text, ''),
    '|',
    p_metadata::text
  );

  -- Return SHA-256 hash
  RETURN encode(digest(hash_input, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_audit_hash IS 'Calculate SHA-256 hash for audit log record to enable tamper detection';

-- =============================================================================
-- HASH CHAINING TRIGGER (Before Insert)
-- =============================================================================

CREATE OR REPLACE FUNCTION set_audit_log_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(64);
BEGIN
  -- Get hash of most recent record (for hash chaining)
  SELECT current_hash INTO prev_hash
  FROM audit_log
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  -- Set previous_hash to create blockchain-like chain
  NEW.previous_hash := prev_hash;

  -- Calculate hash for current record
  NEW.current_hash := calculate_audit_hash(
    NEW.id,
    NEW.created_at,
    NEW.category,
    NEW.action,
    NEW.user_id,
    NEW.record_id,
    NEW.metadata
  );

  -- Set purge_after based on retention_period
  NEW.purge_after := NEW.created_at + COALESCE(NEW.retention_period, '7 years'::interval);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_hash_trigger ON audit_log;
CREATE TRIGGER audit_log_hash_trigger
  BEFORE INSERT ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_log_hash();

COMMENT ON FUNCTION set_audit_log_hash IS 'Automatically set hash chain and purge date before inserting audit log record';

-- =============================================================================
-- WORM IMPLEMENTATION (Prevent Updates and Deletes)
-- =============================================================================

CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable (WORM) and cannot be modified or deleted. This is a security violation.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Prevent UPDATE operations
DROP TRIGGER IF EXISTS audit_log_prevent_update ON audit_log;
CREATE TRIGGER audit_log_prevent_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- Prevent DELETE operations
DROP TRIGGER IF EXISTS audit_log_prevent_delete ON audit_log;
CREATE TRIGGER audit_log_prevent_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

COMMENT ON FUNCTION prevent_audit_log_modification IS 'Enforce WORM (Write Once Read Many) - audit logs cannot be updated or deleted';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on audit_log table
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT for authenticated users (logging events)
-- Note: In production, this should be restricted to a service account
DROP POLICY IF EXISTS "Allow authenticated users to insert audit logs" ON audit_log;
CREATE POLICY "Allow authenticated users to insert audit logs"
  ON audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can view their own audit logs (limited categories)
-- Excludes sensitive categories (admin, system, security)
DROP POLICY IF EXISTS "Users can view own audit logs" ON audit_log;
CREATE POLICY "Users can view own audit logs"
  ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND category NOT IN ('admin', 'system', 'security')
    AND severity NOT IN ('critical', 'high')
  );

-- Policy: Service role can read all (for archival and reporting)
DROP POLICY IF EXISTS "Service role can read all audit logs" ON audit_log;
CREATE POLICY "Service role can read all audit logs"
  ON audit_log
  FOR SELECT
  TO service_role
  USING (true);

-- Note: Additional RLS policies for managers, admins, and auditors
-- will be added after user roles are implemented

-- =============================================================================
-- AUDIT LOG ARCHIVE INDEX TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS audit_log_archive_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path VARCHAR(500) NOT NULL,
  storage_tier VARCHAR(20) NOT NULL CHECK (storage_tier IN ('hot', 'warm', 'cold')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  record_count INTEGER NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  checksum VARCHAR(64) NOT NULL,  -- SHA-256 checksum for integrity
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_archive_index_date ON audit_log_archive_index(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_archive_index_tier ON audit_log_archive_index(storage_tier);
CREATE INDEX IF NOT EXISTS idx_archive_index_checksum ON audit_log_archive_index(checksum);

COMMENT ON TABLE audit_log_archive_index IS 'Metadata index for archived audit logs in S3 (warm/cold storage)';
COMMENT ON COLUMN audit_log_archive_index.storage_tier IS 'Storage tier: hot (PostgreSQL 0-90 days), warm (S3 Standard 90 days-2 years), cold (S3 Glacier 2-7 years)';
COMMENT ON COLUMN audit_log_archive_index.checksum IS 'SHA-256 checksum of archived file for integrity verification';

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to verify hash chain integrity
CREATE OR REPLACE FUNCTION verify_audit_log_hash_chain(
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
  valid BOOLEAN,
  error_count BIGINT,
  verified_count BIGINT,
  errors TEXT[]
) AS $$
DECLARE
  prev_hash VARCHAR(64);
  curr_record RECORD;
  calculated_hash VARCHAR(64);
  error_list TEXT[] := ARRAY[]::TEXT[];
  error_count_val BIGINT := 0;
  verified_count_val BIGINT := 0;
BEGIN
  -- Iterate through audit logs in chronological order
  FOR curr_record IN
    SELECT *
    FROM audit_log
    WHERE created_at >= p_start_date
      AND created_at <= p_end_date
    ORDER BY created_at ASC, id ASC
  LOOP
    verified_count_val := verified_count_val + 1;

    -- Verify hash chain linkage
    IF prev_hash IS NOT NULL AND prev_hash != COALESCE(curr_record.previous_hash, '') THEN
      error_list := array_append(error_list, format(
        'Hash chain broken at record %s (created %s): expected previous_hash=%s, got=%s',
        curr_record.id,
        curr_record.created_at,
        prev_hash,
        COALESCE(curr_record.previous_hash, 'NULL')
      ));
      error_count_val := error_count_val + 1;
    END IF;

    -- Verify current hash matches recalculated hash
    calculated_hash := calculate_audit_hash(
      curr_record.id,
      curr_record.created_at,
      curr_record.category,
      curr_record.action,
      curr_record.user_id,
      curr_record.record_id,
      curr_record.metadata
    );

    IF calculated_hash != curr_record.current_hash THEN
      error_list := array_append(error_list, format(
        'Hash mismatch at record %s: expected %s, got %s',
        curr_record.id,
        curr_record.current_hash,
        calculated_hash
      ));
      error_count_val := error_count_val + 1;
    END IF;

    prev_hash := curr_record.current_hash;
  END LOOP;

  RETURN QUERY SELECT
    (error_count_val = 0),
    error_count_val,
    verified_count_val,
    error_list;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verify_audit_log_hash_chain IS 'Verify hash chain integrity for a date range. Returns errors if tampering detected.';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant SELECT to authenticated users (via RLS policies)
GRANT SELECT ON audit_log TO authenticated;

-- Grant INSERT to authenticated users (for logging)
GRANT INSERT ON audit_log TO authenticated;

-- Grant all to service_role (for archival and admin operations)
GRANT ALL ON audit_log TO service_role;
GRANT ALL ON audit_log_archive_index TO service_role;

-- Revoke UPDATE and DELETE from everyone (WORM enforcement at permission level)
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;
REVOKE UPDATE, DELETE ON audit_log FROM authenticated;
-- Note: service_role has UPDATE/DELETE permissions but triggers will prevent them

-- =============================================================================
-- INITIAL DATA / TESTING
-- =============================================================================

-- Insert a genesis audit log record (first record in the chain).
-- Guarded so re-running this migration during catch-up reconciliation does not
-- add a second genesis row (which would break the hash chain).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM audit_log
    WHERE category = 'system'
      AND action = 'audit_system_initialized'
  ) THEN
    INSERT INTO audit_log (
      category,
      action,
      severity,
      metadata,
      status
    ) VALUES (
      'system',
      'audit_system_initialized',
      'info',
      jsonb_build_object(
        'version', '1.0',
        'migration', '001_create_audit_log_table.sql',
        'initialized_at', NOW()
      ),
      'success'
    );
  END IF;
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON SCHEMA public IS 'REQ-130 Audit Logging Migration 001 applied successfully';
