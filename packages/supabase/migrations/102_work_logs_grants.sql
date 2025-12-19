-- =========================================================
-- 102_work_logs_grants.sql
-- Ensure work log tables are accessible via Supabase clients
-- =========================================================

BEGIN;

-- Work log entries
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.work_logs TO authenticated;
GRANT ALL ON TABLE core.work_logs TO service_role;

-- Collaborators
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.work_log_collaborators TO authenticated;
GRANT ALL ON TABLE core.work_log_collaborators TO service_role;

-- Photos
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.work_log_photos TO authenticated;
GRANT ALL ON TABLE core.work_log_photos TO service_role;

-- Conversations
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE core.work_log_conversations TO authenticated;
GRANT ALL ON TABLE core.work_log_conversations TO service_role;

-- Audit log (read and append only for end users)
GRANT SELECT, INSERT ON TABLE core.work_log_audit_log TO authenticated;
GRANT ALL ON TABLE core.work_log_audit_log TO service_role;

-- Storage usage tracking
GRANT SELECT, UPDATE ON TABLE core.user_storage_usage TO authenticated;
GRANT ALL ON TABLE core.user_storage_usage TO service_role;

COMMIT;


