-- Migration: 316_forsured_conversation_email_functions.sql
-- Description: Helper functions for conversation inbound email processing
-- Date: 2026-02-16
--
-- Creates:
-- 1. forsured.verify_conversation_email_sender - verify sender is a conversation participant
-- 2. forsured.notify_conversation_message - pg_notify for async message processing
-- 3. Alters email_rejection_log.contractor_id to be nullable (conversations may not have one)

-- =============================================================================
-- STEP 1: ALTER email_rejection_log FOR CONVERSATION USE
-- =============================================================================
-- The existing email_rejection_log requires contractor_id NOT NULL, but
-- conversation-based email rejections (e.g. conversation_not_found) may
-- not have a contractor_id. Make it nullable.

ALTER TABLE forsured.email_rejection_log
  ALTER COLUMN contractor_id DROP NOT NULL;

COMMENT ON COLUMN forsured.email_rejection_log.contractor_id IS
  'The contractor this email was intended for. NULL for conversation-based rejections where no contractor context exists.';

-- =============================================================================
-- STEP 2: VERIFY CONVERSATION EMAIL SENDER
-- =============================================================================

-- Verify that an email sender is a participant in a conversation.
-- Joins conversation_participants with users on email, filtering for
-- active participants (left_at IS NULL) with matching email (case-insensitive).
CREATE OR REPLACE FUNCTION forsured.verify_conversation_email_sender(
  p_conversation_id UUID,
  p_sender_email TEXT
)
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT cp.user_id
  FROM forsured.conversation_participants cp
  JOIN forsured.users u ON u.id = cp.user_id
  WHERE cp.conversation_id = p_conversation_id
    AND cp.left_at IS NULL
    AND lower(trim(u.email)) = lower(trim(p_sender_email));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION forsured.verify_conversation_email_sender IS
  'Verifies that an email sender is an active participant in a conversation by matching email address';

-- Grant execute to service_role (used by edge functions)
GRANT EXECUTE ON FUNCTION forsured.verify_conversation_email_sender(UUID, TEXT) TO service_role;

-- =============================================================================
-- STEP 3: NOTIFY CONVERSATION MESSAGE
-- =============================================================================

-- Sends a pg_notify event for async notification processing when a new
-- conversation message arrives (e.g. via inbound email).
CREATE OR REPLACE FUNCTION forsured.notify_conversation_message(
  p_conversation_id UUID,
  p_message_id UUID,
  p_sender_user_id UUID
)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_notify(
    'conversation_message',
    json_build_object(
      'conversation_id', p_conversation_id,
      'message_id', p_message_id,
      'sender_user_id', p_sender_user_id
    )::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION forsured.notify_conversation_message IS
  'Sends a pg_notify event with conversation message details for async notification processing';

-- Grant execute to service_role (used by edge functions)
GRANT EXECUTE ON FUNCTION forsured.notify_conversation_message(UUID, UUID, UUID) TO service_role;

-- =============================================================================
-- STEP 4: VERIFICATION
-- =============================================================================

DO $$
DECLARE
  func_exists BOOLEAN;
BEGIN
  -- Verify verify_conversation_email_sender exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'forsured'
    AND p.proname = 'verify_conversation_email_sender'
  ) INTO func_exists;

  IF NOT func_exists THEN
    RAISE EXCEPTION 'Function verify_conversation_email_sender was not created successfully';
  END IF;

  -- Verify notify_conversation_message exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'forsured'
    AND p.proname = 'notify_conversation_message'
  ) INTO func_exists;

  IF NOT func_exists THEN
    RAISE EXCEPTION 'Function notify_conversation_message was not created successfully';
  END IF;

  RAISE NOTICE 'Migration 316_forsured_conversation_email_functions.sql completed successfully';
  RAISE NOTICE '  - email_rejection_log.contractor_id made nullable';
  RAISE NOTICE '  - forsured.verify_conversation_email_sender function created';
  RAISE NOTICE '  - forsured.notify_conversation_message function created';
END $$;
