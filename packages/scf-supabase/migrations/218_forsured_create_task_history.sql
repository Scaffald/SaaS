-- Migration: Create Task History Tracking
-- REQ: REQ-264 - Task History Tracking
-- Date: 2025-11-26
-- Description: Creates task_history table and triggers to track all task field changes

-- =============================================================================
-- 1. ADD MISSING COLUMNS TO TASKS TABLE
-- =============================================================================

-- Add due_date and priority columns if they don't exist
ALTER TABLE forsured.tasks
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium';

-- Create index for due_date queries
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_due_date ON forsured.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_forsured_tasks_priority ON forsured.tasks(priority);

COMMENT ON COLUMN forsured.tasks.due_date IS 'Task due date for deadline tracking';
COMMENT ON COLUMN forsured.tasks.priority IS 'Task priority: low, medium, high, urgent';

-- =============================================================================
-- 2. TASK HISTORY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES forsured.tasks(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

    -- Change tracking
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,

    -- Who made the change
    changed_by UUID REFERENCES core.users(id) ON DELETE SET NULL,

    -- Timestamp
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for task_history
CREATE INDEX idx_forsured_task_history_task ON forsured.task_history(task_id);
CREATE INDEX idx_forsured_task_history_organization ON forsured.task_history(organization_id);
CREATE INDEX idx_forsured_task_history_created ON forsured.task_history(created_at DESC);
CREATE INDEX idx_forsured_task_history_field ON forsured.task_history(field_name);
CREATE INDEX idx_forsured_task_history_changed_by ON forsured.task_history(changed_by);

-- Composite index for common query: get history for a task ordered by time
CREATE INDEX idx_forsured_task_history_task_created ON forsured.task_history(task_id, created_at DESC);

-- RLS for task_history
ALTER TABLE forsured.task_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task history in their organization" ON forsured.task_history
    FOR SELECT TO authenticated
    USING (organization_id IN (
        SELECT organization_id FROM core.role_assignments WHERE user_id = auth.uid()
    ));

-- Task history is insert-only from triggers (no manual insert/update/delete)
CREATE POLICY "Service role bypass" ON forsured.task_history
    TO service_role
    USING (true);

-- Grant permissions
GRANT SELECT ON forsured.task_history TO authenticated;
GRANT ALL ON forsured.task_history TO service_role;

COMMENT ON TABLE forsured.task_history IS 'Audit trail for all task field changes';
COMMENT ON COLUMN forsured.task_history.field_name IS 'Name of the field that was changed';
COMMENT ON COLUMN forsured.task_history.old_value IS 'Previous value (serialized as text)';
COMMENT ON COLUMN forsured.task_history.new_value IS 'New value (serialized as text)';

-- =============================================================================
-- 3. TASK HISTORY TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.record_task_history()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID;
    v_field_name TEXT;
    v_old_value TEXT;
    v_new_value TEXT;
BEGIN
    -- Get the user making the change from the session context
    -- Falls back to NULL if not set (e.g., during migrations)
    BEGIN
        v_changed_by := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_changed_by := NULL;
    END;

    -- Track title changes
    IF OLD.title IS DISTINCT FROM NEW.title THEN
        INSERT INTO forsured.task_history (task_id, organization_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, NEW.organization_id, 'title', OLD.title, NEW.title, v_changed_by);
    END IF;

    -- Track description changes
    IF OLD.description IS DISTINCT FROM NEW.description THEN
        INSERT INTO forsured.task_history (task_id, organization_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, NEW.organization_id, 'description', OLD.description, NEW.description, v_changed_by);
    END IF;

    -- Track status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO forsured.task_history (task_id, organization_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, NEW.organization_id, 'status', OLD.status, NEW.status, v_changed_by);

        -- Also insert into status_history for backwards compatibility
        INSERT INTO forsured.status_history (entity_type, entity_id, organization_id, old_status, new_status, changed_by)
        VALUES ('task', NEW.id, NEW.organization_id, OLD.status, NEW.status, v_changed_by);
    END IF;

    -- Track due_date changes
    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
        INSERT INTO forsured.task_history (task_id, organization_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, NEW.organization_id, 'due_date',
            CASE WHEN OLD.due_date IS NULL THEN NULL ELSE OLD.due_date::TEXT END,
            CASE WHEN NEW.due_date IS NULL THEN NULL ELSE NEW.due_date::TEXT END,
            v_changed_by);
    END IF;

    -- Track priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
        INSERT INTO forsured.task_history (task_id, organization_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, NEW.organization_id, 'priority', OLD.priority, NEW.priority, v_changed_by);
    END IF;

    -- Track assigned_to changes
    IF OLD.assigned_to_user_id IS DISTINCT FROM NEW.assigned_to_user_id THEN
        INSERT INTO forsured.task_history (task_id, organization_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, NEW.organization_id, 'assigned_to_user_id',
            CASE WHEN OLD.assigned_to_user_id IS NULL THEN NULL ELSE OLD.assigned_to_user_id::TEXT END,
            CASE WHEN NEW.assigned_to_user_id IS NULL THEN NULL ELSE NEW.assigned_to_user_id::TEXT END,
            v_changed_by);
    END IF;

    -- Track project changes
    IF OLD.project_id IS DISTINCT FROM NEW.project_id THEN
        INSERT INTO forsured.task_history (task_id, organization_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, NEW.organization_id, 'project_id', OLD.project_id::TEXT, NEW.project_id::TEXT, v_changed_by);
    END IF;

    -- Track subcontractor changes
    IF OLD.subcontractor_id IS DISTINCT FROM NEW.subcontractor_id THEN
        INSERT INTO forsured.task_history (task_id, organization_id, field_name, old_value, new_value, changed_by)
        VALUES (NEW.id, NEW.organization_id, 'subcontractor_id',
            CASE WHEN OLD.subcontractor_id IS NULL THEN NULL ELSE OLD.subcontractor_id::TEXT END,
            CASE WHEN NEW.subcontractor_id IS NULL THEN NULL ELSE NEW.subcontractor_id::TEXT END,
            v_changed_by);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 4. ATTACH TRIGGER TO TASKS TABLE
-- =============================================================================

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_record_task_history ON forsured.tasks;

-- Create the trigger
CREATE TRIGGER trigger_record_task_history
    AFTER UPDATE ON forsured.tasks
    FOR EACH ROW
    EXECUTE FUNCTION forsured.record_task_history();

COMMENT ON FUNCTION forsured.record_task_history IS 'Records all task field changes to task_history table';

-- =============================================================================
-- 5. TASK CREATION HISTORY (Optional - records initial creation)
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.record_task_creation()
RETURNS TRIGGER AS $$
DECLARE
    v_created_by UUID;
BEGIN
    -- Get the user creating the task
    BEGIN
        v_created_by := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_created_by := NULL;
    END;

    -- Record the task creation as a history event
    INSERT INTO forsured.task_history (task_id, organization_id, field_name, old_value, new_value, changed_by)
    VALUES (NEW.id, NEW.organization_id, 'created', NULL, 'Task created', v_created_by);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_record_task_creation ON forsured.tasks;

-- Create the trigger for task creation
CREATE TRIGGER trigger_record_task_creation
    AFTER INSERT ON forsured.tasks
    FOR EACH ROW
    EXECUTE FUNCTION forsured.record_task_creation();

COMMENT ON FUNCTION forsured.record_task_creation IS 'Records task creation event to task_history table';

-- =============================================================================
-- 6. NOTIFICATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,

    -- Notification type and content
    type TEXT NOT NULL CHECK (type IN ('due_date_change', 'task_assigned', 'task_completed', 'comment_added', 'mention')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,

    -- Related entity
    entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'project', 'document', 'policy')),
    entity_id UUID NOT NULL,

    -- Who triggered the notification
    triggered_by UUID REFERENCES core.users(id) ON DELETE SET NULL,

    -- Read status
    read_at TIMESTAMPTZ,
    is_read BOOLEAN NOT NULL DEFAULT false,

    -- Metadata for additional context
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for notifications
CREATE INDEX idx_forsured_notifications_user ON forsured.notifications(user_id);
CREATE INDEX idx_forsured_notifications_organization ON forsured.notifications(organization_id);
CREATE INDEX idx_forsured_notifications_user_unread ON forsured.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_forsured_notifications_created ON forsured.notifications(created_at DESC);
CREATE INDEX idx_forsured_notifications_entity ON forsured.notifications(entity_type, entity_id);

-- RLS for notifications
ALTER TABLE forsured.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON forsured.notifications
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON forsured.notifications
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Service role bypass" ON forsured.notifications
    TO service_role
    USING (true);

-- Grant permissions
GRANT SELECT, UPDATE ON forsured.notifications TO authenticated;
GRANT ALL ON forsured.notifications TO service_role;

COMMENT ON TABLE forsured.notifications IS 'User notifications for task and project events';

-- =============================================================================
-- 7. DUE DATE CHANGE NOTIFICATION TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.notify_due_date_change()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by UUID;
    v_task_title TEXT;
    v_old_date TEXT;
    v_new_date TEXT;
BEGIN
    -- Only trigger on due_date changes
    IF OLD.due_date IS NOT DISTINCT FROM NEW.due_date THEN
        RETURN NEW;
    END IF;

    -- Get the user making the change
    BEGIN
        v_changed_by := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        v_changed_by := NULL;
    END;

    -- Don't notify if no assigned user or if assignee is making the change
    IF NEW.assigned_to_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF v_changed_by IS NOT NULL AND v_changed_by = NEW.assigned_to_user_id THEN
        RETURN NEW;
    END IF;

    -- Format dates for message
    v_task_title := NEW.title;
    v_old_date := CASE
        WHEN OLD.due_date IS NULL THEN 'none'
        ELSE to_char(OLD.due_date, 'Mon DD, YYYY')
    END;
    v_new_date := CASE
        WHEN NEW.due_date IS NULL THEN 'none'
        ELSE to_char(NEW.due_date, 'Mon DD, YYYY')
    END;

    -- Create notification for the assignee
    INSERT INTO forsured.notifications (
        user_id,
        organization_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        triggered_by,
        metadata
    ) VALUES (
        NEW.assigned_to_user_id,
        NEW.organization_id,
        'due_date_change',
        'Due date changed',
        CASE
            WHEN OLD.due_date IS NULL THEN
                'Due date set to ' || v_new_date || ' for "' || v_task_title || '"'
            WHEN NEW.due_date IS NULL THEN
                'Due date removed from "' || v_task_title || '"'
            ELSE
                'Due date changed from ' || v_old_date || ' to ' || v_new_date || ' for "' || v_task_title || '"'
        END,
        'task',
        NEW.id,
        v_changed_by,
        jsonb_build_object(
            'old_due_date', OLD.due_date,
            'new_due_date', NEW.due_date,
            'task_title', v_task_title
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_due_date_change ON forsured.tasks;

-- Create the notification trigger (runs AFTER the history trigger)
CREATE TRIGGER trigger_notify_due_date_change
    AFTER UPDATE ON forsured.tasks
    FOR EACH ROW
    EXECUTE FUNCTION forsured.notify_due_date_change();

COMMENT ON FUNCTION forsured.notify_due_date_change IS 'Creates notification when task due date is changed by someone other than assignee';
