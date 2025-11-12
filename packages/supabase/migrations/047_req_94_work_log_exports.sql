-- =========================================================
-- 047_req_94_work_log_exports.sql
-- Storage bucket & audit log support for work log exports
-- =========================================================

BEGIN;

-- ---------------------------------------------------------
-- Storage bucket for generated exports
-- ---------------------------------------------------------

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'work-log-exports',
  'work-log-exports',
  FALSE,
  10485760, -- 10 MB per generated export
  ARRAY['application/pdf', 'text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- Reset existing policies for the exports bucket
DROP POLICY IF EXISTS work_log_exports_read_self ON storage.objects;
DROP POLICY IF EXISTS work_log_exports_write_self ON storage.objects;
DROP POLICY IF EXISTS work_log_exports_delete_self ON storage.objects;
DROP POLICY IF EXISTS work_log_exports_admin_access ON storage.objects;

-- Authenticated users can download their own generated exports via signed URLs
CREATE POLICY work_log_exports_read_self
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'work-log-exports'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

-- Service role uploads generated exports on behalf of users
CREATE POLICY work_log_exports_admin_access
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'work-log-exports')
  WITH CHECK (bucket_id = 'work-log-exports');

-- ---------------------------------------------------------
-- Expand audit log actions to capture export events
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
      'photo_removed',
      'export_generated'
    )
  );

COMMIT;


