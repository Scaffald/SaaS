-- =========================================================
-- 039_work_log_policies.sql
-- RLS policies and helpers for Work Log system
-- =========================================================

BEGIN;

-- Helper function to determine access to a work log
CREATE OR REPLACE FUNCTION core.can_access_work_log(target_work_log_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = core, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM core.work_logs wl
    WHERE wl.id = target_work_log_id
      AND (
        wl.user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM core.work_log_collaborators c
          WHERE c.work_log_id = wl.id
            AND c.collaborator_user_id = auth.uid()
        )
      )
  );
$$;

COMMENT ON FUNCTION core.can_access_work_log IS
  'Returns true when the current user is the owner or collaborator on the provided work log.';

CREATE OR REPLACE FUNCTION core.is_work_log_owner(target_work_log_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = core, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM core.work_logs wl
    WHERE wl.id = target_work_log_id
      AND wl.user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION core.is_work_log_owner IS
  'Returns true when the current user created the provided work log.';

-- Enable RLS
ALTER TABLE core.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.work_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE core.work_log_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.work_log_photos FORCE ROW LEVEL SECURITY;

ALTER TABLE core.work_log_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.work_log_collaborators FORCE ROW LEVEL SECURITY;

ALTER TABLE core.work_log_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.work_log_audit_log FORCE ROW LEVEL SECURITY;

ALTER TABLE core.work_log_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.work_log_conversations FORCE ROW LEVEL SECURITY;

ALTER TABLE core.user_storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_storage_usage FORCE ROW LEVEL SECURITY;

-- Work logs policies
DROP POLICY IF EXISTS work_logs_select_self ON core.work_logs;
DROP POLICY IF EXISTS work_logs_insert_self ON core.work_logs;
DROP POLICY IF EXISTS work_logs_update_self ON core.work_logs;
DROP POLICY IF EXISTS work_logs_delete_self ON core.work_logs;
DROP POLICY IF EXISTS work_logs_service_role ON core.work_logs;

CREATE POLICY work_logs_select_self
  ON core.work_logs
  FOR SELECT
  TO authenticated
  USING (core.can_access_work_log(id));

CREATE POLICY work_logs_insert_self
  ON core.work_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY work_logs_update_self
  ON core.work_logs
  FOR UPDATE
  TO authenticated
  USING (core.can_access_work_log(id))
  WITH CHECK (core.can_access_work_log(id));

CREATE POLICY work_logs_delete_self
  ON core.work_logs
  FOR DELETE
  TO authenticated
  USING (core.is_work_log_owner(id));

CREATE POLICY work_logs_service_role
  ON core.work_logs
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Work log collaborators policies
DROP POLICY IF EXISTS work_log_collaborators_select ON core.work_log_collaborators;
DROP POLICY IF EXISTS work_log_collaborators_insert ON core.work_log_collaborators;
DROP POLICY IF EXISTS work_log_collaborators_update ON core.work_log_collaborators;
DROP POLICY IF EXISTS work_log_collaborators_delete ON core.work_log_collaborators;
DROP POLICY IF EXISTS work_log_collaborators_service_role ON core.work_log_collaborators;

CREATE POLICY work_log_collaborators_select
  ON core.work_log_collaborators
  FOR SELECT
  TO authenticated
  USING (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_collaborators_insert
  ON core.work_log_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (core.is_work_log_owner(work_log_id));

CREATE POLICY work_log_collaborators_update
  ON core.work_log_collaborators
  FOR UPDATE
  TO authenticated
  USING (core.is_work_log_owner(work_log_id))
  WITH CHECK (core.is_work_log_owner(work_log_id));

CREATE POLICY work_log_collaborators_delete
  ON core.work_log_collaborators
  FOR DELETE
  TO authenticated
  USING (core.is_work_log_owner(work_log_id));

CREATE POLICY work_log_collaborators_service_role
  ON core.work_log_collaborators
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Work log photos policies
DROP POLICY IF EXISTS work_log_photos_select ON core.work_log_photos;
DROP POLICY IF EXISTS work_log_photos_insert ON core.work_log_photos;
DROP POLICY IF EXISTS work_log_photos_update ON core.work_log_photos;
DROP POLICY IF EXISTS work_log_photos_delete ON core.work_log_photos;
DROP POLICY IF EXISTS work_log_photos_service_role ON core.work_log_photos;

CREATE POLICY work_log_photos_select
  ON core.work_log_photos
  FOR SELECT
  TO authenticated
  USING (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_photos_insert
  ON core.work_log_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_photos_update
  ON core.work_log_photos
  FOR UPDATE
  TO authenticated
  USING (core.can_access_work_log(work_log_id))
  WITH CHECK (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_photos_delete
  ON core.work_log_photos
  FOR DELETE
  TO authenticated
  USING (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_photos_service_role
  ON core.work_log_photos
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Work log audit log policies
DROP POLICY IF EXISTS work_log_audit_log_select ON core.work_log_audit_log;
DROP POLICY IF EXISTS work_log_audit_log_insert ON core.work_log_audit_log;
DROP POLICY IF EXISTS work_log_audit_log_service_role ON core.work_log_audit_log;

CREATE POLICY work_log_audit_log_select
  ON core.work_log_audit_log
  FOR SELECT
  TO authenticated
  USING (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_audit_log_insert
  ON core.work_log_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_audit_log_service_role
  ON core.work_log_audit_log
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- Work log conversations policies
DROP POLICY IF EXISTS work_log_conversations_select ON core.work_log_conversations;
DROP POLICY IF EXISTS work_log_conversations_insert ON core.work_log_conversations;
DROP POLICY IF EXISTS work_log_conversations_update ON core.work_log_conversations;
DROP POLICY IF EXISTS work_log_conversations_delete ON core.work_log_conversations;
DROP POLICY IF EXISTS work_log_conversations_service_role ON core.work_log_conversations;

CREATE POLICY work_log_conversations_select
  ON core.work_log_conversations
  FOR SELECT
  TO authenticated
  USING (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_conversations_insert
  ON core.work_log_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_conversations_update
  ON core.work_log_conversations
  FOR UPDATE
  TO authenticated
  USING (core.can_access_work_log(work_log_id))
  WITH CHECK (core.can_access_work_log(work_log_id));

CREATE POLICY work_log_conversations_delete
  ON core.work_log_conversations
  FOR DELETE
  TO authenticated
  USING (core.is_work_log_owner(work_log_id));

CREATE POLICY work_log_conversations_service_role
  ON core.work_log_conversations
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- User storage usage policies
DROP POLICY IF EXISTS user_storage_usage_select ON core.user_storage_usage;
DROP POLICY IF EXISTS user_storage_usage_update ON core.user_storage_usage;
DROP POLICY IF EXISTS user_storage_usage_service_role ON core.user_storage_usage;

CREATE POLICY user_storage_usage_select
  ON core.user_storage_usage
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_storage_usage_update
  ON core.user_storage_usage
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_storage_usage_service_role
  ON core.user_storage_usage
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

COMMIT;


