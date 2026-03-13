-- Migration: Add metadata and additional fields to tasks table
-- REQ: Fix dashboard modal buttons (Contact Broker, Upload Document, Request Quote)
-- Date: 2025-01-19
-- Depends on: 204_forsured_migrate_core_tables.sql

-- =============================================================================
-- OVERVIEW
-- =============================================================================
-- This migration adds missing fields to the forsured.tasks table to support
-- the dashboard UI requirements:
-- - metadata JSONB column for quick_actions, severity_level, broker_contact, etc.
-- - Additional fields for task type, origin, priority, due dates, etc.
--
-- The quick_actions field in metadata controls which action buttons appear
-- on tasks in the subcontractor dashboard:
-- - 'contact_broker': Show Contact Broker button
-- - 'upload_document': Show Upload Document button
-- - 'request_quote': Show Request Quote button
-- - 'view_requirements': Show View Requirements button
-- =============================================================================

-- Add missing columns to forsured.tasks
-- Note: source_type and source_requirement_id were already added in migration 216
ALTER TABLE forsured.tasks
  -- Metadata as JSONB for flexible data storage
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,

  -- Task classification
  ADD COLUMN IF NOT EXISTS task_type TEXT,
  ADD COLUMN IF NOT EXISTS origin_role TEXT CHECK (origin_role IN ('manager', 'broker')),
  -- source_type already added in 216_forsured_add_task_source_tracking.sql
  -- source_requirement_id already added in 216_forsured_add_task_source_tracking.sql

  -- Priority and severity
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Due date tracking
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS due_date_source TEXT CHECK (due_date_source IN ('inferred_policy', 'inferred_project', 'inferred_onboarding', 'manual', 'gc_set', 'broker_set')),

  -- Additional references
  ADD COLUMN IF NOT EXISTS policy_id UUID,
  ADD COLUMN IF NOT EXISTS policy_number TEXT,
  ADD COLUMN IF NOT EXISTS document_link TEXT,

  -- Creator tracking (in addition to assigned_to_user_id)
  ADD COLUMN IF NOT EXISTS created_by_user_id UUID,

  -- Quick actions array (stored in metadata but indexed separately for performance)
  ADD COLUMN IF NOT EXISTS quick_actions TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add foreign key for created_by_user_id (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_created_by'
  ) THEN
    ALTER TABLE forsured.tasks
      ADD CONSTRAINT fk_tasks_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES core.users(id)
        ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for new columns (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_task_type ON forsured.tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_origin_role ON forsured.tasks(origin_role);
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_priority ON forsured.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_due_date ON forsured.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_created_by ON forsured.tasks(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_policy_id ON forsured.tasks(policy_id);

-- Create GIN index for metadata JSONB column
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_metadata ON forsured.tasks USING GIN (metadata);

-- Create GIN index for quick_actions array
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_quick_actions ON forsured.tasks USING GIN (quick_actions);

-- Comments
COMMENT ON COLUMN forsured.tasks.metadata IS 'JSONB column for flexible metadata including quick_actions, severity_level, broker_contact, current_limit, required_limit, etc.';
COMMENT ON COLUMN forsured.tasks.quick_actions IS 'Array of quick action identifiers (contact_broker, upload_document, request_quote, view_requirements)';
COMMENT ON COLUMN forsured.tasks.task_type IS 'Type of task (coi_upload, endorsement_correction, auto_symbol_compliance, limit_inadequacy, operations_language)';
COMMENT ON COLUMN forsured.tasks.origin_role IS 'Who created the task (manager or broker)';
COMMENT ON COLUMN forsured.tasks.source_type IS 'How the task was created (org_requirement, project_requirement, manual)';
COMMENT ON COLUMN forsured.tasks.priority IS 'Task priority level (low, medium, high, urgent)';
COMMENT ON COLUMN forsured.tasks.due_date_source IS 'How the due date was determined';
COMMENT ON COLUMN forsured.tasks.created_by_user_id IS 'User who created the task';
