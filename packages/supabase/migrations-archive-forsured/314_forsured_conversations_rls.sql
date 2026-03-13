-- Migration: 314_forsured_conversations_rls.sql
-- Description: Enable RLS and create policies for conversation tables
-- Date: 2026-02-16

BEGIN;

-- =============================================================================
-- 1. ENABLE RLS ON ALL CONVERSATION TABLES
-- =============================================================================

ALTER TABLE forsured.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.conversation_attachments ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. HELPER FUNCTION: is_conversation_participant
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.is_conversation_participant(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM forsured.conversation_participants
        WHERE conversation_id = p_conversation_id
          AND user_id = p_user_id
          AND left_at IS NULL
    );
$$;

COMMENT ON FUNCTION forsured.is_conversation_participant IS
    'Returns true if user is an active participant (left_at IS NULL) in the conversation';

-- =============================================================================
-- 3. RLS POLICIES: forsured.conversations
-- =============================================================================

-- Drop existing policies (idempotent)
DROP POLICY IF EXISTS conversations_select_participant ON forsured.conversations;
DROP POLICY IF EXISTS conversations_insert_creator ON forsured.conversations;
DROP POLICY IF EXISTS conversations_update_creator ON forsured.conversations;
DROP POLICY IF EXISTS conversations_service_role ON forsured.conversations;

-- SELECT: user is a participant
CREATE POLICY conversations_select_participant
    ON forsured.conversations
    FOR SELECT TO authenticated
    USING (
        forsured.is_conversation_participant(id, auth.uid())
    );

-- INSERT: created_by_user_id must be the authenticated user
CREATE POLICY conversations_insert_creator
    ON forsured.conversations
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by_user_id = auth.uid()
    );

-- UPDATE: only the creator can update (e.g., archive)
CREATE POLICY conversations_update_creator
    ON forsured.conversations
    FOR UPDATE TO authenticated
    USING (
        created_by_user_id = auth.uid()
    );

-- ALL: service_role has full access (edge functions)
CREATE POLICY conversations_service_role
    ON forsured.conversations
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 4. RLS POLICIES: forsured.conversation_participants
-- =============================================================================

DROP POLICY IF EXISTS conversation_participants_select ON forsured.conversation_participants;
DROP POLICY IF EXISTS conversation_participants_insert ON forsured.conversation_participants;
DROP POLICY IF EXISTS conversation_participants_update_own ON forsured.conversation_participants;
DROP POLICY IF EXISTS conversation_participants_service_role ON forsured.conversation_participants;

-- SELECT: user is a participant in that conversation
CREATE POLICY conversation_participants_select
    ON forsured.conversation_participants
    FOR SELECT TO authenticated
    USING (
        forsured.is_conversation_participant(conversation_id, auth.uid())
    );

-- INSERT: user is a participant in that conversation (app-level checks handle broker rules)
CREATE POLICY conversation_participants_insert
    ON forsured.conversation_participants
    FOR INSERT TO authenticated
    WITH CHECK (
        forsured.is_conversation_participant(conversation_id, auth.uid())
    );

-- UPDATE: can only update own record (e.g., leave conversation)
CREATE POLICY conversation_participants_update_own
    ON forsured.conversation_participants
    FOR UPDATE TO authenticated
    USING (
        user_id = auth.uid()
    );

-- ALL: service_role has full access
CREATE POLICY conversation_participants_service_role
    ON forsured.conversation_participants
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 5. RLS POLICIES: forsured.conversation_messages
-- =============================================================================

DROP POLICY IF EXISTS conversation_messages_select ON forsured.conversation_messages;
DROP POLICY IF EXISTS conversation_messages_insert ON forsured.conversation_messages;
DROP POLICY IF EXISTS conversation_messages_service_role ON forsured.conversation_messages;

-- SELECT: user is a participant in that conversation
CREATE POLICY conversation_messages_select
    ON forsured.conversation_messages
    FOR SELECT TO authenticated
    USING (
        forsured.is_conversation_participant(conversation_id, auth.uid())
    );

-- INSERT: user is a participant AND sender_user_id must be the authenticated user
CREATE POLICY conversation_messages_insert
    ON forsured.conversation_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        forsured.is_conversation_participant(conversation_id, auth.uid())
        AND sender_user_id = auth.uid()
    );

-- ALL: service_role has full access
CREATE POLICY conversation_messages_service_role
    ON forsured.conversation_messages
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 6. RLS POLICIES: forsured.conversation_attachments
-- =============================================================================

DROP POLICY IF EXISTS conversation_attachments_select ON forsured.conversation_attachments;
DROP POLICY IF EXISTS conversation_attachments_insert ON forsured.conversation_attachments;
DROP POLICY IF EXISTS conversation_attachments_update ON forsured.conversation_attachments;
DROP POLICY IF EXISTS conversation_attachments_service_role ON forsured.conversation_attachments;

-- SELECT: user is a participant
CREATE POLICY conversation_attachments_select
    ON forsured.conversation_attachments
    FOR SELECT TO authenticated
    USING (
        forsured.is_conversation_participant(conversation_id, auth.uid())
    );

-- INSERT: user is a participant
CREATE POLICY conversation_attachments_insert
    ON forsured.conversation_attachments
    FOR INSERT TO authenticated
    WITH CHECK (
        forsured.is_conversation_participant(conversation_id, auth.uid())
    );

-- UPDATE: user is a participant (for setting promoted_to_document_id)
CREATE POLICY conversation_attachments_update
    ON forsured.conversation_attachments
    FOR UPDATE TO authenticated
    USING (
        forsured.is_conversation_participant(conversation_id, auth.uid())
    );

-- ALL: service_role has full access
CREATE POLICY conversation_attachments_service_role
    ON forsured.conversation_attachments
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- 7. VERIFICATION
-- =============================================================================

DO $$
DECLARE
    tbl TEXT;
    rls_enabled BOOLEAN;
    policy_count INT;
BEGIN
    FOREACH tbl IN ARRAY ARRAY['conversations', 'conversation_participants', 'conversation_messages', 'conversation_attachments']
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE oid = ('forsured.' || tbl)::regclass;

        SELECT count(*) INTO policy_count
        FROM pg_policies
        WHERE schemaname = 'forsured' AND tablename = tbl;

        IF rls_enabled THEN
            RAISE NOTICE '  RLS enabled on forsured.% with % policies', tbl, policy_count;
        ELSE
            RAISE WARNING '  RLS NOT enabled on forsured.%', tbl;
        END IF;
    END LOOP;

    -- Verify helper function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'is_conversation_participant'
          AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'forsured')
    ) THEN
        RAISE NOTICE '  Helper function forsured.is_conversation_participant exists';
    ELSE
        RAISE WARNING '  Helper function forsured.is_conversation_participant NOT found';
    END IF;
END $$;

COMMIT;
