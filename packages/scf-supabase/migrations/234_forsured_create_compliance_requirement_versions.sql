-- Migration: Create Compliance Requirement Versions Table (REQ-2, TASK-2)
-- Description: Version history table with field-level change tracking for compliance requirements
-- Author: Claude (REQ-2, TASK-2)
-- Date: 2025-12-13

-- =============================================================================
-- VERSION HISTORY TABLE
-- =============================================================================
-- This table stores version history for compliance requirements with:
-- - Complete snapshots at each version
-- - Field-level change tracking (changed_fields JSONB)
-- - Parent version linking for version tree visualization
-- - Automatic versioning via database trigger
-- =============================================================================

BEGIN;

-- =============================================================================
-- VERSION HISTORY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.compliance_requirement_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the requirement
  requirement_id UUID NOT NULL,
  CONSTRAINT fk_versions_requirement
    FOREIGN KEY (requirement_id)
    REFERENCES forsured.compliance_requirements(id)
    ON DELETE CASCADE,

  -- Version number (auto-incremented within requirement)
  version INTEGER NOT NULL,

  -- Complete snapshot at this version
  -- Stores the full state of the requirement at this point in time
  snapshot JSONB NOT NULL,

  -- Field-level changes from previous version
  -- Structure: { "field.path": { "old": value, "new": value } }
  -- Example: { "requirement_definition.coverage_limits.aggregate": { "old": 2000000, "new": 4000000 } }
  changed_fields JSONB,

  -- Human-readable summary of changes
  change_summary TEXT NOT NULL,

  -- Who made the change
  changed_by UUID NOT NULL,
  CONSTRAINT fk_versions_changed_by
    FOREIGN KEY (changed_by)
    REFERENCES core.users(id)
    ON DELETE RESTRICT,

  -- When the change was made
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Parent version for version tree tracking
  parent_version_id UUID,
  CONSTRAINT fk_versions_parent
    FOREIGN KEY (parent_version_id)
    REFERENCES forsured.compliance_requirement_versions(id)
    ON DELETE SET NULL,

  -- Unique constraint: one version number per requirement
  CONSTRAINT unique_requirement_version UNIQUE (requirement_id, version)
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary query pattern: get versions for a requirement, newest first
CREATE INDEX IF NOT EXISTS idx_versions_requirement_desc
  ON forsured.compliance_requirement_versions(requirement_id, version DESC);

-- Query by who made changes
CREATE INDEX IF NOT EXISTS idx_versions_changed_by
  ON forsured.compliance_requirement_versions(changed_by);

-- Query by time range
CREATE INDEX IF NOT EXISTS idx_versions_changed_at
  ON forsured.compliance_requirement_versions(changed_at DESC);

-- =============================================================================
-- FUNCTION: Calculate Changed Fields Between Two JSONB Objects
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.calculate_changed_fields(
  old_data JSONB,
  new_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  result JSONB := '{}'::jsonb;
  old_val JSONB;
  new_val JSONB;
  key TEXT;
BEGIN
  -- Compare top-level keys from old data
  FOR key IN SELECT jsonb_object_keys(old_data)
  LOOP
    old_val := old_data->key;
    new_val := new_data->key;

    -- Key exists in both, check if value changed
    IF new_val IS NOT NULL THEN
      IF old_val IS DISTINCT FROM new_val THEN
        result := result || jsonb_build_object(
          key,
          jsonb_build_object('old', old_val, 'new', new_val)
        );
      END IF;
    ELSE
      -- Key was removed in new data
      result := result || jsonb_build_object(
        key,
        jsonb_build_object('old', old_val, 'new', NULL)
      );
    END IF;
  END LOOP;

  -- Check for new keys in new_data
  FOR key IN SELECT jsonb_object_keys(new_data)
  LOOP
    IF old_data->key IS NULL THEN
      result := result || jsonb_build_object(
        key,
        jsonb_build_object('old', NULL, 'new', new_data->key)
      );
    END IF;
  END LOOP;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION forsured.calculate_changed_fields IS
  'Calculates field-level differences between two JSONB objects for version tracking';

-- =============================================================================
-- FUNCTION: Create Version Record
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.create_version_record()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_version_number INTEGER;
  parent_version UUID;
  old_snapshot JSONB;
  new_snapshot JSONB;
  diff_fields JSONB;
BEGIN
  -- Only create version if this is an actual content change
  -- Skip if only timestamps or is_current changed
  IF TG_OP = 'UPDATE' AND (
    OLD.name = NEW.name AND
    OLD.type = NEW.type AND
    OLD.description IS NOT DISTINCT FROM NEW.description AND
    OLD.status = NEW.status AND
    OLD.requirement_definition = NEW.requirement_definition AND
    OLD.effective_date = NEW.effective_date AND
    OLD.expiration_date IS NOT DISTINCT FROM NEW.expiration_date
  ) THEN
    RETURN NEW;
  END IF;

  -- Get the next version number
  SELECT COALESCE(MAX(version), 0) + 1
  INTO new_version_number
  FROM forsured.compliance_requirement_versions
  WHERE requirement_id = NEW.id;

  -- Get the parent version ID (most recent version)
  SELECT id
  INTO parent_version
  FROM forsured.compliance_requirement_versions
  WHERE requirement_id = NEW.id
  ORDER BY version DESC
  LIMIT 1;

  -- Build old and new snapshots for comparison
  IF TG_OP = 'INSERT' THEN
    old_snapshot := '{}'::jsonb;
    diff_fields := NULL;
  ELSE
    old_snapshot := jsonb_build_object(
      'code', OLD.code,
      'name', OLD.name,
      'type', OLD.type,
      'description', OLD.description,
      'status', OLD.status,
      'effective_date', OLD.effective_date,
      'expiration_date', OLD.expiration_date,
      'is_template', OLD.is_template,
      'requirement_definition', OLD.requirement_definition
    );

    new_snapshot := jsonb_build_object(
      'code', NEW.code,
      'name', NEW.name,
      'type', NEW.type,
      'description', NEW.description,
      'status', NEW.status,
      'effective_date', NEW.effective_date,
      'expiration_date', NEW.expiration_date,
      'is_template', NEW.is_template,
      'requirement_definition', NEW.requirement_definition
    );

    diff_fields := forsured.calculate_changed_fields(old_snapshot, new_snapshot);
  END IF;

  -- Build the full snapshot
  new_snapshot := jsonb_build_object(
    'code', NEW.code,
    'name', NEW.name,
    'type', NEW.type,
    'description', NEW.description,
    'status', NEW.status,
    'effective_date', NEW.effective_date,
    'expiration_date', NEW.expiration_date,
    'is_template', NEW.is_template,
    'requirement_definition', NEW.requirement_definition,
    'organization_id', NEW.organization_id,
    'created_by', NEW.created_by
  );

  -- Insert version record
  INSERT INTO forsured.compliance_requirement_versions (
    requirement_id,
    version,
    snapshot,
    changed_fields,
    change_summary,
    changed_by,
    parent_version_id
  ) VALUES (
    NEW.id,
    new_version_number,
    new_snapshot,
    diff_fields,
    COALESCE(NEW.change_summary, CASE
      WHEN TG_OP = 'INSERT' THEN 'Initial version'
      ELSE 'Updated requirement'
    END),
    COALESCE(NEW.created_by, auth.uid()),
    parent_version
  );

  -- Update the current_version on the requirement
  NEW.current_version := new_version_number;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION forsured.create_version_record IS
  'Trigger function to automatically create version records on requirement changes';

-- =============================================================================
-- TRIGGER: Auto-create version on INSERT/UPDATE
-- =============================================================================

DROP TRIGGER IF EXISTS trigger_create_version_on_change
  ON forsured.compliance_requirements;

CREATE TRIGGER trigger_create_version_on_change
  BEFORE INSERT OR UPDATE ON forsured.compliance_requirements
  FOR EACH ROW
  EXECUTE FUNCTION forsured.create_version_record();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE forsured.compliance_requirement_versions ENABLE ROW LEVEL SECURITY;

-- Users can read version history for requirements they can access
CREATE POLICY versions_select_policy
  ON forsured.compliance_requirement_versions
  FOR SELECT
  USING (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT organization_id FROM core.role_assignments
        WHERE user_id = auth.uid()
      )
    )
  );

-- Version records are created automatically by trigger, no direct insert needed
-- But allow admins to insert for data migration purposes
CREATE POLICY versions_insert_policy
  ON forsured.compliance_requirement_versions
  FOR INSERT
  WITH CHECK (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.organization_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

-- No updates or deletes to version history (immutable audit trail)
-- If needed, admins can use service role

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE forsured.compliance_requirement_versions IS
  'REQ-2: Version history for compliance requirements with field-level change tracking';

COMMENT ON COLUMN forsured.compliance_requirement_versions.snapshot IS
  'Complete state of the requirement at this version';

COMMENT ON COLUMN forsured.compliance_requirement_versions.changed_fields IS
  'Field-level diff showing what changed from previous version';

COMMENT ON COLUMN forsured.compliance_requirement_versions.parent_version_id IS
  'Reference to previous version for version tree tracking';

COMMIT;
