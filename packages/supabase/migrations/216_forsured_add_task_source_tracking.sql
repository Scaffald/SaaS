-- Migration: Add Task Source Tracking (REQ-272)
-- Description: Add columns to track if task is for org-level or project-level requirement
-- Author: Claude (REQ-272)
-- Date: 2025-11-21

-- =============================================================================
-- Add Source Tracking Columns to Tasks Table
-- =============================================================================

-- Add source_type column with CHECK constraint
ALTER TABLE forsured.tasks
ADD COLUMN source_type TEXT
CHECK (source_type IN ('org_requirement', 'project_requirement', 'manual'));

-- Add source_requirement_id to link to the requirement that created the task
ALTER TABLE forsured.tasks
ADD COLUMN source_requirement_id UUID;

-- Add index for filtering tasks by source type
CREATE INDEX IF NOT EXISTS idx_tasks_source_type
ON forsured.tasks(source_type)
WHERE source_type IS NOT NULL;

-- Add index for querying tasks by source requirement
CREATE INDEX IF NOT EXISTS idx_tasks_source_requirement
ON forsured.tasks(source_requirement_id)
WHERE source_requirement_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN forsured.tasks.source_type IS
  'REQ-272: Type of requirement that created this task (org_requirement, project_requirement, or manual)';

COMMENT ON COLUMN forsured.tasks.source_requirement_id IS
  'REQ-272: UUID of the coverage_requirement record that triggered this task (NULL for manual tasks)';

-- =============================================================================
-- Summary
-- =============================================================================
-- REQ-272: Task Source Tracking
--
-- Enables tracking whether a task is for:
-- - org_requirement: Company-wide coverage requirement
-- - project_requirement: Project-specific coverage requirement
-- - manual: Manually created task (not from requirement)
--
-- This allows brokers to:
-- - Filter tasks by source ("Show only company tasks" vs "Show only project tasks")
-- - Display context: "Required for: Company GL" vs "Required for: Project ABC"
-- - Link compliance gaps back to their source requirements
-- =============================================================================
