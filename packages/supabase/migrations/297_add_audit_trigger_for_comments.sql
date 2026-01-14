-- Migration: 297_add_audit_trigger_for_comments.sql
-- Description: Add audit trigger for comments table to capture user_id
-- This ensures that "added a note" history entries include user information

BEGIN;

-- Add audit trigger for Comments table
-- This will capture user_id from auth.uid() when comments are inserted/updated/deleted
DROP TRIGGER IF EXISTS audit_comments ON forsured.comments;
CREATE TRIGGER audit_comments
  AFTER INSERT OR UPDATE OR DELETE ON forsured.comments
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

COMMENT ON TRIGGER audit_comments ON forsured.comments IS
'Audit trigger for comments table. Captures user_id, operation type, and data changes for history tracking.';

COMMIT;
