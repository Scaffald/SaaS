-- =========================================================
-- 041_req_94_work_log_project_moves.sql
-- Work log project move workflow support
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- Extend work_logs with pending move workflow metadata
-- ---------------------------------------------------------

ALTER TABLE core.work_logs
  ADD COLUMN IF NOT EXISTS pending_move_to_project_id UUID,
  ADD COLUMN IF NOT EXISTS pending_move_reason TEXT,
  ADD COLUMN IF NOT EXISTS pending_move_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pending_move_requested_by UUID;

CREATE INDEX IF NOT EXISTS work_logs_pending_move_project_idx
  ON core.work_logs (pending_move_to_project_id)
  WHERE pending_move_to_project_id IS NOT NULL;

-- ---------------------------------------------------------
-- Allow tracking of approval requirements per project
-- ---------------------------------------------------------

ALTER TABLE public.construction_projects
  ADD COLUMN IF NOT EXISTS work_log_require_approval_to_move_override BOOLEAN;

-- ---------------------------------------------------------
-- Expand audit log action set for move workflow
-- ---------------------------------------------------------

ALTER TABLE core.work_log_audit_log
  DROP CONSTRAINT IF EXISTS work_log_audit_log_action_check;

ALTER TABLE core.work_log_audit_log
  ADD CONSTRAINT work_log_audit_log_action_check
  CHECK (
    action IN (
      'status_change',
      'edit',
      'comment',
      'move_project',
      'move_requested',
      'move_cancelled',
      'move_denied',
      'move_approved',
      'collaborator_added',
      'photo_added',
      'photo_removed'
    )
  );

COMMIT;

