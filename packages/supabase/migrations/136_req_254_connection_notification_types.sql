-- =========================================================
-- 136_req_254_connection_notification_types.sql
-- Add connection-related notification types for REQ-254
-- =========================================================

BEGIN;

-- =========================================================
-- Add connection notification types to enum
-- =========================================================
DO $$
DECLARE
  value TEXT;
  values_to_add TEXT[] := ARRAY[
    'connection.request',
    'connection.accepted'
  ];
BEGIN
  FOREACH value IN ARRAY values_to_add LOOP
    BEGIN
      EXECUTE format('ALTER TYPE core.notification_type ADD VALUE IF NOT EXISTS %L', value);
    EXCEPTION
      WHEN duplicate_object THEN
        NULL;
    END;
  END LOOP;
END;
$$;

COMMIT;

