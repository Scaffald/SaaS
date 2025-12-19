-- Migration: Migrate audit_log to forsured schema
-- REQ: REQ-211 - Database Schema Migration to forsured.*
-- Phase: 1 - Schema Migration
-- Date: 2025-01-14
-- Depends on: 003_create_forsured_schema.sql

-- =============================================================================
-- OVERVIEW
-- =============================================================================
-- This migration moves the audit_log table from public schema to forsured schema
-- and adds cross-schema foreign keys to core.users and core.organizations.
--
-- Key Changes:
-- - Table moved from public.audit_log → forsured.audit_log
-- - Adds FK: user_id → core.users.id
-- - Adds FK: organization_id → core.organizations.id
-- - Adds FK: impersonated_by_user_id → core.users.id
-- - Recreates all indexes, triggers, and functions in forsured schema
-- - Copies all data from public.audit_log to forsured.audit_log
-- - Preserves WORM (Write Once Read Many) guarantees and hash chaining
--
-- See: /docs/FORSURED_ARCHITECTURE_MIGRATION_PLAN.md (Phase 1, Task 2)
-- =============================================================================

-- =============================================================================
-- STEP 1: CREATE AUDIT LOG TABLE IN FORSURED SCHEMA
-- =============================================================================

CREATE TABLE forsured.audit_log (
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
  -- CROSS-SCHEMA FOREIGN KEYS to scaffald schema
  user_id UUID,
  CONSTRAINT fk_audit_log_user
    FOREIGN KEY (user_id)
    REFERENCES core.users(id)
    ON DELETE SET NULL,

  organization_id UUID,
  CONSTRAINT fk_audit_log_organization
    FOREIGN KEY (organization_id)
    REFERENCES core.organizations(id)
    ON DELETE CASCADE,

  impersonated_by_user_id UUID,
  CONSTRAINT fk_audit_log_impersonated_by
    FOREIGN KEY (impersonated_by_user_id)
    REFERENCES core.users(id)
    ON DELETE SET NULL,

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
-- STEP 2: CREATE INDEXES
-- =============================================================================

-- Primary query patterns
CREATE INDEX idx_forsured_audit_log_created_at ON forsured.audit_log(created_at DESC);
CREATE INDEX idx_forsured_audit_log_category ON forsured.audit_log(category);
CREATE INDEX idx_forsured_audit_log_action ON forsured.audit_log(action);
CREATE INDEX idx_forsured_audit_log_severity ON forsured.audit_log(severity);
CREATE INDEX idx_forsured_audit_log_user ON forsured.audit_log(user_id);
CREATE INDEX idx_forsured_audit_log_org ON forsured.audit_log(organization_id);
CREATE INDEX idx_forsured_audit_log_table ON forsured.audit_log(table_name);
CREATE INDEX idx_forsured_audit_log_record ON forsured.audit_log(record_id);
CREATE INDEX idx_forsured_audit_log_resource ON forsured.audit_log(resource_type);
CREATE INDEX idx_forsured_audit_log_request ON forsured.audit_log(request_id);
CREATE INDEX idx_forsured_audit_log_session ON forsured.audit_log(session_id);
CREATE INDEX idx_forsured_audit_log_status ON forsured.audit_log(status);
CREATE INDEX idx_forsured_audit_log_ip ON forsured.audit_log(ip_address);

-- GIN index for JSONB metadata searches
CREATE INDEX idx_forsured_audit_log_metadata ON forsured.audit_log USING gin(metadata);

-- Hash integrity index
CREATE INDEX idx_forsured_audit_log_hash ON forsured.audit_log(current_hash);
CREATE INDEX idx_forsured_audit_log_archived ON forsured.audit_log(archived_at) WHERE archived_at IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX idx_forsured_audit_log_user_created ON forsured.audit_log(user_id, created_at DESC);
CREATE INDEX idx_forsured_audit_log_org_created ON forsured.audit_log(organization_id, created_at DESC);
CREATE INDEX idx_forsured_audit_log_category_created ON forsured.audit_log(category, created_at DESC);

-- Partial indexes for specific use cases
CREATE INDEX idx_forsured_audit_log_failures ON forsured.audit_log(created_at DESC)
  WHERE status = 'failure';
CREATE INDEX idx_forsured_audit_log_security_events ON forsured.audit_log(created_at DESC)
  WHERE category = 'security';
CREATE INDEX idx_forsured_audit_log_critical ON forsured.audit_log(created_at DESC)
  WHERE severity IN ('critical', 'high');

-- =============================================================================
-- STEP 3: ADD COMMENTS
-- =============================================================================

COMMENT ON TABLE forsured.audit_log IS 'Comprehensive audit trail for all system activities with WORM and 7-year retention';
COMMENT ON COLUMN forsured.audit_log.user_id IS 'References core.users (cross-schema FK)';
COMMENT ON COLUMN forsured.audit_log.organization_id IS 'References core.organizations (cross-schema FK)';
COMMENT ON COLUMN forsured.audit_log.impersonated_by_user_id IS 'Admin who is impersonating the user (references core.users)';
COMMENT ON COLUMN forsured.audit_log.previous_hash IS 'SHA-256 hash of previous audit record (tamper detection via hash chaining)';
COMMENT ON COLUMN forsured.audit_log.current_hash IS 'SHA-256 hash of current record fields (tamper detection)';
COMMENT ON COLUMN forsured.audit_log.signature IS 'Digital signature for non-repudiation (future enhancement)';
COMMENT ON COLUMN forsured.audit_log.metadata IS 'Flexible JSONB storage for event-specific data';
COMMENT ON COLUMN forsured.audit_log.retention_period IS '7-year retention period for insurance industry compliance';

-- =============================================================================
-- STEP 4: CREATE HASH CALCULATION FUNCTION (FORSURED SCHEMA)
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.calculate_audit_hash(
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

COMMENT ON FUNCTION forsured.calculate_audit_hash IS 'Calculate SHA-256 hash for audit log record to enable tamper detection';

-- =============================================================================
-- STEP 5: CREATE HASH CHAINING TRIGGER (BEFORE INSERT)
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.set_audit_log_hash()
RETURNS TRIGGER AS $$
DECLARE
  prev_hash VARCHAR(64);
BEGIN
  -- Get hash of most recent record (for hash chaining)
  SELECT current_hash INTO prev_hash
  FROM forsured.audit_log
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  -- Set previous_hash to create blockchain-like chain
  NEW.previous_hash := prev_hash;

  -- Calculate hash for current record
  NEW.current_hash := forsured.calculate_audit_hash(
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

CREATE TRIGGER forsured_audit_log_hash_trigger
  BEFORE INSERT ON forsured.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION forsured.set_audit_log_hash();

COMMENT ON FUNCTION forsured.set_audit_log_hash IS 'Automatically set hash chain and purge date before inserting audit log record';

-- =============================================================================
-- STEP 6: CREATE WORM PROTECTION (PREVENT UPDATES AND DELETES)
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable (WORM) and cannot be modified or deleted. This is a security violation.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Prevent UPDATE operations
CREATE TRIGGER forsured_audit_log_prevent_update
  BEFORE UPDATE ON forsured.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION forsured.prevent_audit_log_modification();

-- Prevent DELETE operations
CREATE TRIGGER forsured_audit_log_prevent_delete
  BEFORE DELETE ON forsured.audit_log
  FOR EACH ROW
  EXECUTE FUNCTION forsured.prevent_audit_log_modification();

COMMENT ON FUNCTION forsured.prevent_audit_log_modification IS 'Enforce WORM (Write Once Read Many) - audit logs cannot be updated or deleted';

-- =============================================================================
-- STEP 7: ENABLE ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE forsured.audit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT for authenticated users (logging events)
CREATE POLICY "Allow authenticated users to insert audit logs"
  ON forsured.audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can view their own audit logs (limited categories)
CREATE POLICY "Users can view own audit logs"
  ON forsured.audit_log
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND category NOT IN ('admin', 'system', 'security')
    AND severity NOT IN ('critical', 'high')
  );

-- Policy: Service role can read all (for archival and reporting)
CREATE POLICY "Service role can read all audit logs"
  ON forsured.audit_log
  FOR SELECT
  TO service_role
  USING (true);

-- =============================================================================
-- STEP 8: CREATE AUDIT LOG ARCHIVE INDEX TABLE
-- =============================================================================

CREATE TABLE forsured.audit_log_archive_index (
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

CREATE INDEX idx_forsured_archive_index_date ON forsured.audit_log_archive_index(start_date, end_date);
CREATE INDEX idx_forsured_archive_index_tier ON forsured.audit_log_archive_index(storage_tier);
CREATE INDEX idx_forsured_archive_index_checksum ON forsured.audit_log_archive_index(checksum);

COMMENT ON TABLE forsured.audit_log_archive_index IS 'Metadata index for archived audit logs in S3 (warm/cold storage)';
COMMENT ON COLUMN forsured.audit_log_archive_index.storage_tier IS 'Storage tier: hot (PostgreSQL 0-90 days), warm (S3 Standard 90 days-2 years), cold (S3 Glacier 2-7 years)';
COMMENT ON COLUMN forsured.audit_log_archive_index.checksum IS 'SHA-256 checksum of archived file for integrity verification';

-- =============================================================================
-- STEP 9: CREATE HASH CHAIN VERIFICATION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.verify_audit_log_hash_chain(
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
    FROM forsured.audit_log
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
    calculated_hash := forsured.calculate_audit_hash(
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

COMMENT ON FUNCTION forsured.verify_audit_log_hash_chain IS 'Verify hash chain integrity for a date range. Returns errors if tampering detected.';

-- =============================================================================
-- STEP 10: GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT ON forsured.audit_log TO authenticated;
GRANT INSERT ON forsured.audit_log TO authenticated;
GRANT ALL ON forsured.audit_log TO service_role;
GRANT ALL ON forsured.audit_log_archive_index TO service_role;

-- Revoke UPDATE and DELETE (WORM enforcement at permission level)
REVOKE UPDATE, DELETE ON forsured.audit_log FROM PUBLIC;
REVOKE UPDATE, DELETE ON forsured.audit_log FROM authenticated;

-- =============================================================================
-- STEP 11: COPY DATA FROM PUBLIC.AUDIT_LOG
-- =============================================================================

-- Disable triggers temporarily to copy data without recalculating hashes
ALTER TABLE forsured.audit_log DISABLE TRIGGER forsured_audit_log_hash_trigger;

INSERT INTO forsured.audit_log (
  id, created_at, category, action, severity,
  user_id, organization_id, impersonated_by_user_id,
  table_name, record_id, resource_type, resource_name, operation,
  old_data, new_data, changed_fields, metadata,
  ip_address, user_agent, request_id, session_id,
  country_code, region, city,
  status, error_message,
  previous_hash, current_hash, signature,
  retention_period, archived_at, purge_after
)
SELECT
  id, created_at, category, action, severity,
  user_id, organization_id, impersonated_by_user_id,
  table_name, record_id, resource_type, resource_name, operation,
  old_data, new_data, changed_fields, metadata,
  ip_address, user_agent, request_id, session_id,
  country_code, region, city,
  status, error_message,
  previous_hash, current_hash, signature,
  retention_period, archived_at, purge_after
FROM audit_log
ORDER BY created_at ASC, id ASC;

-- Re-enable triggers
ALTER TABLE forsured.audit_log ENABLE TRIGGER forsured_audit_log_hash_trigger;

-- Copy archive index data
INSERT INTO forsured.audit_log_archive_index
SELECT * FROM audit_log_archive_index;

-- =============================================================================
-- STEP 12: VERIFY DATA MIGRATION
-- =============================================================================

DO $$
DECLARE
  public_count BIGINT;
  forsured_count BIGINT;
BEGIN
  SELECT COUNT(*) INTO public_count FROM audit_log;
  SELECT COUNT(*) INTO forsured_count FROM forsured.audit_log;

  IF public_count != forsured_count THEN
    RAISE EXCEPTION 'Data migration verification failed: public.audit_log has % rows, forsured.audit_log has % rows',
      public_count, forsured_count;
  END IF;

  RAISE NOTICE '✅ Data migration verified: % rows copied successfully', forsured_count;
END $$;

-- =============================================================================
-- STEP 13: INSERT MIGRATION MARKER
-- =============================================================================

INSERT INTO forsured.audit_log (
  category,
  action,
  severity,
  metadata,
  status
) VALUES (
  'system',
  'audit_log_migrated_to_forsured_schema',
  'info',
  jsonb_build_object(
    'migration', '004_migrate_audit_log.sql',
    'migrated_at', NOW(),
    'records_migrated', (SELECT COUNT(*) FROM forsured.audit_log)
  ),
  'success'
);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

COMMENT ON SCHEMA forsured IS 'REQ-211 Audit Log Migration (004) applied - audit_log moved to forsured schema with cross-schema FKs';
