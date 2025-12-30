-- Migration: 275_forsured_audit_triggers.sql
-- Description: Create audit triggers for automatic data modification logging
-- REQ: Phase 4 - Hybrid Audit Logging System
-- Author: Claude
-- Date: 2024-12-23

BEGIN;

-- =============================================================================
-- GENERIC AUDIT TRIGGER FUNCTION
-- =============================================================================
-- This function automatically logs all INSERT, UPDATE, DELETE operations
-- on tables that have the trigger attached. It captures:
-- - The table and schema being modified
-- - The operation type (INSERT/UPDATE/DELETE)
-- - Old and new data (as JSONB)
-- - Changed fields for UPDATEs
-- - User context from auth.uid()
--
-- The audit log is WORM (Write Once Read Many) protected by existing triggers.

CREATE OR REPLACE FUNCTION forsured.audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  changed_fields TEXT[];
  record_id UUID;
  old_data JSONB;
  new_data JSONB;
  audit_action TEXT;
  org_id UUID;
  resource_name_val TEXT;
BEGIN
  -- Determine the operation type
  audit_action := TG_OP;

  -- Get the record ID and data based on operation
  CASE TG_OP
    WHEN 'DELETE' THEN
      record_id := OLD.id;
      old_data := to_jsonb(OLD);
      new_data := NULL;
      changed_fields := NULL;
    WHEN 'UPDATE' THEN
      record_id := NEW.id;
      old_data := to_jsonb(OLD);
      new_data := to_jsonb(NEW);
      -- Calculate changed fields
      SELECT array_agg(key) INTO changed_fields
      FROM jsonb_each(new_data)
      WHERE new_data -> key IS DISTINCT FROM old_data -> key;
    WHEN 'INSERT' THEN
      record_id := NEW.id;
      old_data := NULL;
      new_data := to_jsonb(NEW);
      changed_fields := ARRAY[]::TEXT[];
  END CASE;

  -- Try to get organization_id from the record
  BEGIN
    CASE TG_OP
      WHEN 'DELETE' THEN
        org_id := (OLD->>'organization_id')::UUID;
      ELSE
        org_id := (NEW->>'organization_id')::UUID;
    END CASE;
  EXCEPTION WHEN OTHERS THEN
    org_id := NULL;
  END;

  -- Try to get a meaningful resource name
  BEGIN
    CASE TG_OP
      WHEN 'DELETE' THEN
        resource_name_val := COALESCE(
          OLD->>'name',
          OLD->>'title',
          OLD->>'policy_number',
          OLD->>'file_name',
          OLD->>'company',
          record_id::TEXT
        );
      ELSE
        resource_name_val := COALESCE(
          NEW->>'name',
          NEW->>'title',
          NEW->>'policy_number',
          NEW->>'file_name',
          NEW->>'company',
          record_id::TEXT
        );
    END CASE;
  EXCEPTION WHEN OTHERS THEN
    resource_name_val := record_id::TEXT;
  END;

  -- Insert audit log entry
  -- Uses forsured.audit_log table which has WORM protection
  INSERT INTO forsured.audit_log (
    category,
    action,
    severity,
    user_id,
    organization_id,
    table_name,
    record_id,
    operation,
    old_data,
    new_data,
    changed_fields,
    resource_type,
    resource_name,
    metadata,
    status
  ) VALUES (
    'data_modification',
    TG_TABLE_NAME || '_' || lower(TG_OP),
    CASE
      WHEN TG_OP = 'DELETE' THEN 'high'
      WHEN TG_OP = 'UPDATE' THEN 'medium'
      ELSE 'low'
    END,
    auth.uid(),
    org_id,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    record_id,
    TG_OP,
    old_data,
    new_data,
    changed_fields,
    TG_TABLE_NAME,
    resource_name_val,
    jsonb_build_object(
      'schema', TG_TABLE_SCHEMA,
      'trigger_name', TG_NAME,
      'trigger_when', TG_WHEN,
      'trigger_level', TG_LEVEL
    ),
    'success'
  );

  -- Return appropriate value based on operation
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;

EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the original operation
  -- Audit logging should never prevent data operations
  RAISE WARNING 'Audit trigger failed for %.%: %', TG_TABLE_SCHEMA, TG_TABLE_NAME, SQLERRM;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION forsured.audit_trigger_function IS
'Generic audit trigger that logs all data modifications to forsured.audit_log table.
Never fails the original operation - logs warning on error.';

-- =============================================================================
-- ATTACH TRIGGERS TO CRITICAL FORSURED TABLES
-- =============================================================================

-- Projects
DROP TRIGGER IF EXISTS audit_projects ON forsured.projects;
CREATE TRIGGER audit_projects
  AFTER INSERT OR UPDATE OR DELETE ON forsured.projects
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Subcontractors
DROP TRIGGER IF EXISTS audit_subcontractors ON forsured.subcontractors;
CREATE TRIGGER audit_subcontractors
  AFTER INSERT OR UPDATE OR DELETE ON forsured.subcontractors
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Documents
DROP TRIGGER IF EXISTS audit_documents ON forsured.documents;
CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON forsured.documents
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Policies
DROP TRIGGER IF EXISTS audit_policies ON forsured.policies;
CREATE TRIGGER audit_policies
  AFTER INSERT OR UPDATE OR DELETE ON forsured.policies
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Tasks
DROP TRIGGER IF EXISTS audit_tasks ON forsured.tasks;
CREATE TRIGGER audit_tasks
  AFTER INSERT OR UPDATE OR DELETE ON forsured.tasks
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Compliance Scores
DROP TRIGGER IF EXISTS audit_compliance_scores ON forsured.compliance_scores;
CREATE TRIGGER audit_compliance_scores
  AFTER INSERT OR UPDATE OR DELETE ON forsured.compliance_scores
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Requirements
DROP TRIGGER IF EXISTS audit_requirements ON forsured.requirements;
CREATE TRIGGER audit_requirements
  AFTER INSERT OR UPDATE OR DELETE ON forsured.requirements
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Project Subcontractors (invitations/assignments)
DROP TRIGGER IF EXISTS audit_project_subcontractors ON forsured.project_subcontractors;
CREATE TRIGGER audit_project_subcontractors
  AFTER INSERT OR UPDATE OR DELETE ON forsured.project_subcontractors
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- User Profiles
DROP TRIGGER IF EXISTS audit_user_profiles ON forsured.user_profiles;
CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON forsured.user_profiles
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

-- Insurance Policies (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'forsured' AND table_name = 'insurance_policies') THEN
    DROP TRIGGER IF EXISTS audit_insurance_policies ON forsured.insurance_policies;
    CREATE TRIGGER audit_insurance_policies
      AFTER INSERT OR UPDATE OR DELETE ON forsured.insurance_policies
      FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();
  END IF;
END $$;

-- Broker Clients (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'forsured' AND table_name = 'broker_clients') THEN
    DROP TRIGGER IF EXISTS audit_broker_clients ON forsured.broker_clients;
    CREATE TRIGGER audit_broker_clients
      AFTER INSERT OR UPDATE OR DELETE ON forsured.broker_clients
      FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();
  END IF;
END $$;

-- Compliance Records (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'forsured' AND table_name = 'compliance_records') THEN
    DROP TRIGGER IF EXISTS audit_compliance_records ON forsured.compliance_records;
    CREATE TRIGGER audit_compliance_records
      AFTER INSERT OR UPDATE OR DELETE ON forsured.compliance_records
      FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();
  END IF;
END $$;

-- Project Requirements (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'forsured' AND table_name = 'project_requirements') THEN
    DROP TRIGGER IF EXISTS audit_project_requirements ON forsured.project_requirements;
    CREATE TRIGGER audit_project_requirements
      AFTER INSERT OR UPDATE OR DELETE ON forsured.project_requirements
      FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();
  END IF;
END $$;

-- Relationship Invitations (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'forsured' AND table_name = 'relationship_invitations') THEN
    DROP TRIGGER IF EXISTS audit_relationship_invitations ON forsured.relationship_invitations;
    CREATE TRIGGER audit_relationship_invitations
      AFTER INSERT OR UPDATE OR DELETE ON forsured.relationship_invitations
      FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();
  END IF;
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
  trigger_names TEXT;
BEGIN
  SELECT COUNT(*), string_agg(trigger_name, ', ') INTO trigger_count, trigger_names
  FROM information_schema.triggers
  WHERE trigger_name LIKE 'audit_%'
    AND trigger_schema = 'forsured';

  RAISE NOTICE '✅ Attached % audit triggers to forsured schema tables', trigger_count;
  RAISE NOTICE 'Triggers: %', trigger_names;
END $$;

COMMIT;
