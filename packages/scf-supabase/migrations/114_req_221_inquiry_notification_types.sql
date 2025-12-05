-- =========================================================
-- 114_req_221_inquiry_notification_types.sql
-- Add inquiry-related notification types
-- =========================================================

BEGIN;

-- Add inquiry notification types to notification_type enum
DO $$
DECLARE
  value TEXT;
  values_to_add TEXT[] := ARRAY[
    'inquiry.created',
    'inquiry.sent',
    'inquiry.comment_added',
    'inquiry.section_accepted',
    'inquiry.fully_accepted',
    'inquiry.capability_answered',
    'inquiry.updated'
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

