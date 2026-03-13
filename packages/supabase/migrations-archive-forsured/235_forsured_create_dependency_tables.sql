-- Migration: Create Dependency System Tables (REQ-2, TASK-3)
-- Description: Dependency management tables including umbrella underlying schedule
--              for conditional excess layer validation
-- Author: Claude (REQ-2, TASK-3)
-- Date: 2025-12-13

-- =============================================================================
-- DEPENDENCY SYSTEM TABLES
-- =============================================================================
-- This migration creates three tables for managing requirement dependencies:
-- 1. compliance_requirement_dependencies - Links between requirements
-- 2. umbrella_underlying_schedule - Umbrella insurance underlying coverage requirements
-- 3. compliance_requirement_rules - Conditional applicability rules
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. COMPLIANCE REQUIREMENT DEPENDENCIES TABLE
-- =============================================================================
-- Tracks dependencies between requirements (e.g., umbrella requires GL)
-- Supports three dependency types: requires, recommended, alternative

CREATE TABLE IF NOT EXISTS forsured.compliance_requirement_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The requirement that has the dependency
  requirement_id UUID NOT NULL,
  CONSTRAINT fk_dependencies_requirement
    FOREIGN KEY (requirement_id)
    REFERENCES forsured.compliance_requirements(id)
    ON DELETE CASCADE,

  -- The requirement being depended upon
  depends_on_id UUID NOT NULL,
  CONSTRAINT fk_dependencies_depends_on
    FOREIGN KEY (depends_on_id)
    REFERENCES forsured.compliance_requirements(id)
    ON DELETE CASCADE,

  -- Type of dependency
  dependency_type VARCHAR(50) NOT NULL CHECK (dependency_type IN (
    'requires',      -- Must have this dependency
    'recommended',   -- Should have but not mandatory
    'alternative'    -- Can substitute for another requirement
  )),

  -- Conditional rules for this dependency (JSONB)
  -- Structure: {
  --   "min_underlying_limit": 1000000,
  --   "attachment_point": 1000000,
  --   "follow_form": true,
  --   "conditions": [{ "field": "project.contract_value", "operator": ">", "value": 5000000 }]
  -- }
  condition JSONB,

  -- Optional notes explaining the dependency
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID,
  CONSTRAINT fk_dependencies_created_by
    FOREIGN KEY (created_by)
    REFERENCES core.users(id)
    ON DELETE SET NULL,

  -- Prevent self-referential dependencies
  CONSTRAINT no_self_dependency CHECK (requirement_id != depends_on_id),

  -- Unique constraint: only one dependency relationship per pair
  CONSTRAINT unique_dependency_pair UNIQUE (requirement_id, depends_on_id)
);

-- =============================================================================
-- 2. UMBRELLA UNDERLYING SCHEDULE TABLE
-- =============================================================================
-- Critical for umbrella insurance validation - tracks the required underlying
-- coverages, their minimum limits, and attachment points

CREATE TABLE IF NOT EXISTS forsured.umbrella_underlying_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the umbrella requirement
  umbrella_requirement_id UUID NOT NULL,
  CONSTRAINT fk_umbrella_schedule_requirement
    FOREIGN KEY (umbrella_requirement_id)
    REFERENCES forsured.compliance_requirements(id)
    ON DELETE CASCADE,

  -- Type of underlying coverage required
  underlying_coverage_type VARCHAR(100) NOT NULL CHECK (underlying_coverage_type IN (
    'general_liability',
    'auto_liability',
    'employers_liability',
    'professional_liability'
  )),

  -- Minimum limit required on the underlying policy
  required_minimum_limit DECIMAL(15, 2) NOT NULL,

  -- Attachment point - when the umbrella kicks in
  attachment_point DECIMAL(15, 2) NOT NULL,

  -- Whether this underlying must be explicitly scheduled on the umbrella
  is_scheduled BOOLEAN NOT NULL DEFAULT TRUE,

  -- Follow-form rules
  follows_form BOOLEAN NOT NULL DEFAULT TRUE,

  -- Drop-down provisions (umbrella drops down when underlying exhausted)
  drop_down_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  drop_down_sir DECIMAL(15, 2), -- Self-insured retention for drop-down

  -- Exclusions specific to this underlying coverage
  -- Structure: { "professional_services": true, "pollution": true, "aircraft": true }
  exclusions JSONB,

  -- Additional notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one entry per coverage type per umbrella
  CONSTRAINT unique_umbrella_underlying UNIQUE (umbrella_requirement_id, underlying_coverage_type)
);

-- =============================================================================
-- 3. COMPLIANCE REQUIREMENT RULES TABLE
-- =============================================================================
-- Conditional applicability rules for requirements based on project attributes

CREATE TABLE IF NOT EXISTS forsured.compliance_requirement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to the requirement
  requirement_id UUID NOT NULL,
  CONSTRAINT fk_rules_requirement
    FOREIGN KEY (requirement_id)
    REFERENCES forsured.compliance_requirements(id)
    ON DELETE CASCADE,

  -- Rule type: include (requirement applies when condition met) or exclude (doesn't apply)
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('include', 'exclude')),

  -- Field to evaluate (dot notation for nested fields)
  -- Examples: 'project.contract_value', 'project.type', 'subcontractor.work_type'
  condition_field VARCHAR(100) NOT NULL,

  -- Operator for comparison
  condition_operator VARCHAR(20) NOT NULL CHECK (condition_operator IN (
    'equals',
    'not_equals',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'contains',
    'not_contains',
    'in',
    'not_in',
    'is_null',
    'is_not_null'
  )),

  -- Value(s) to compare against (JSONB for flexibility)
  -- Can be: number, string, array for 'in'/'not_in' operators
  condition_value JSONB NOT NULL,

  -- Priority for rule evaluation (higher = evaluated first)
  priority INTEGER NOT NULL DEFAULT 0,

  -- Optional description of the rule
  description TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Dependencies: query by requirement
CREATE INDEX IF NOT EXISTS idx_dependencies_requirement
  ON forsured.compliance_requirement_dependencies(requirement_id);

-- Dependencies: reverse lookup (what depends on this?)
CREATE INDEX IF NOT EXISTS idx_dependencies_reverse
  ON forsured.compliance_requirement_dependencies(depends_on_id);

-- Dependencies: find by type
CREATE INDEX IF NOT EXISTS idx_dependencies_type
  ON forsured.compliance_requirement_dependencies(dependency_type);

-- Umbrella schedule: query by umbrella requirement
CREATE INDEX IF NOT EXISTS idx_umbrella_schedule_requirement
  ON forsured.umbrella_underlying_schedule(umbrella_requirement_id);

-- Rules: query by requirement, ordered by priority
CREATE INDEX IF NOT EXISTS idx_rules_requirement_priority
  ON forsured.compliance_requirement_rules(requirement_id, priority DESC);

-- Rules: query by field for debugging
CREATE INDEX IF NOT EXISTS idx_rules_field
  ON forsured.compliance_requirement_rules(condition_field);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Dependencies table
ALTER TABLE forsured.compliance_requirement_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY dependencies_select_policy
  ON forsured.compliance_requirement_dependencies
  FOR SELECT
  USING (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT scope_org_id FROM core.role_assignments
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY dependencies_insert_policy
  ON forsured.compliance_requirement_dependencies
  FOR INSERT
  WITH CHECK (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.scope_org_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

CREATE POLICY dependencies_update_policy
  ON forsured.compliance_requirement_dependencies
  FOR UPDATE
  USING (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.scope_org_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

CREATE POLICY dependencies_delete_policy
  ON forsured.compliance_requirement_dependencies
  FOR DELETE
  USING (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.scope_org_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

-- Umbrella schedule table
ALTER TABLE forsured.umbrella_underlying_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY umbrella_schedule_select_policy
  ON forsured.umbrella_underlying_schedule
  FOR SELECT
  USING (
    umbrella_requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT scope_org_id FROM core.role_assignments
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY umbrella_schedule_insert_policy
  ON forsured.umbrella_underlying_schedule
  FOR INSERT
  WITH CHECK (
    umbrella_requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.scope_org_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

CREATE POLICY umbrella_schedule_update_policy
  ON forsured.umbrella_underlying_schedule
  FOR UPDATE
  USING (
    umbrella_requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.scope_org_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

CREATE POLICY umbrella_schedule_delete_policy
  ON forsured.umbrella_underlying_schedule
  FOR DELETE
  USING (
    umbrella_requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.scope_org_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

-- Rules table
ALTER TABLE forsured.compliance_requirement_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY rules_select_policy
  ON forsured.compliance_requirement_rules
  FOR SELECT
  USING (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT scope_org_id FROM core.role_assignments
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY rules_insert_policy
  ON forsured.compliance_requirement_rules
  FOR INSERT
  WITH CHECK (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.scope_org_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

CREATE POLICY rules_update_policy
  ON forsured.compliance_requirement_rules
  FOR UPDATE
  USING (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.scope_org_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

CREATE POLICY rules_delete_policy
  ON forsured.compliance_requirement_rules
  FOR DELETE
  USING (
    requirement_id IN (
      SELECT cr.id FROM forsured.compliance_requirements cr
      WHERE cr.organization_id IN (
        SELECT ra.scope_org_id
        FROM core.role_assignments ra
        JOIN core.roles r ON r.id = ra.role_id
        WHERE ra.user_id = auth.uid()
          AND r.name IN ('admin', 'super_admin', 'platform_admin')
      )
    )
  );

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE forsured.compliance_requirement_dependencies IS
  'REQ-2: Dependency relationships between compliance requirements';

COMMENT ON COLUMN forsured.compliance_requirement_dependencies.dependency_type IS
  'Type of dependency: requires (mandatory), recommended (suggested), alternative (substitute)';

COMMENT ON COLUMN forsured.compliance_requirement_dependencies.condition IS
  'Conditional rules for this dependency (e.g., min_underlying_limit for umbrella)';

COMMENT ON TABLE forsured.umbrella_underlying_schedule IS
  'REQ-2: Underlying coverage requirements for umbrella insurance policies';

COMMENT ON COLUMN forsured.umbrella_underlying_schedule.attachment_point IS
  'Dollar amount at which umbrella coverage begins (excess over underlying)';

COMMENT ON COLUMN forsured.umbrella_underlying_schedule.follows_form IS
  'Whether umbrella follows the form of the underlying policy';

COMMENT ON COLUMN forsured.umbrella_underlying_schedule.drop_down_allowed IS
  'Whether umbrella can drop down when underlying is exhausted';

COMMENT ON TABLE forsured.compliance_requirement_rules IS
  'REQ-2: Conditional applicability rules for requirements based on project attributes';

COMMENT ON COLUMN forsured.compliance_requirement_rules.priority IS
  'Higher priority rules are evaluated first (use for rule ordering)';

COMMIT;
