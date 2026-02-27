-- Migration: Create Conversations, Participants, Messages, and Attachments tables
-- Description: Core messaging infrastructure for task-level conversations
-- Date: 2026-02-16

-- =============================================================================
-- ENUM TYPES (idempotent)
-- =============================================================================

DO $$ BEGIN
    CREATE TYPE forsured.conversation_type AS ENUM ('private_broker', 'cross_party');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE forsured.conversation_status AS ENUM ('active', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE forsured.conversation_role AS ENUM ('owner', 'participant');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE forsured.message_source AS ENUM ('app', 'email', 'system');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- CONVERSATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES forsured.tasks(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES forsured.organizations(id) ON DELETE CASCADE,
    type forsured.conversation_type NOT NULL,
    created_by_user_id UUID NOT NULL REFERENCES forsured.users(id),
    status forsured.conversation_status NOT NULL DEFAULT 'active',
    inbound_email_address TEXT UNIQUE NOT NULL,
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversations_task_id
    ON forsured.conversations(task_id);

CREATE INDEX IF NOT EXISTS idx_conversations_organization_id
    ON forsured.conversations(organization_id);

CREATE INDEX IF NOT EXISTS idx_conversations_created_by_user_id
    ON forsured.conversations(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_inbound_email_address
    ON forsured.conversations(inbound_email_address);

-- updated_at trigger
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON forsured.conversations
    FOR EACH ROW
    EXECUTE FUNCTION forsured.update_updated_at_column();

-- Audit trigger
DROP TRIGGER IF EXISTS audit_conversations ON forsured.conversations;
CREATE TRIGGER audit_conversations
    AFTER INSERT OR UPDATE OR DELETE ON forsured.conversations
    FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

COMMENT ON TABLE forsured.conversations IS
    'Task-level conversations supporting private broker and cross-party messaging with inbound email';

-- =============================================================================
-- CONVERSATION PARTICIPANTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES forsured.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES forsured.users(id),
    role_in_conversation forsured.conversation_role NOT NULL DEFAULT 'participant',
    added_by_user_id UUID NOT NULL REFERENCES forsured.users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    left_at TIMESTAMPTZ,
    UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id
    ON forsured.conversation_participants(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
    ON forsured.conversation_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_added_by_user_id
    ON forsured.conversation_participants(added_by_user_id);

-- Audit trigger
DROP TRIGGER IF EXISTS audit_conversation_participants ON forsured.conversation_participants;
CREATE TRIGGER audit_conversation_participants
    AFTER INSERT OR UPDATE OR DELETE ON forsured.conversation_participants
    FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

COMMENT ON TABLE forsured.conversation_participants IS
    'Tracks which users are participants in each conversation and their role';

-- =============================================================================
-- CONVERSATION MESSAGES TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES forsured.conversations(id) ON DELETE CASCADE,
    sender_user_id UUID REFERENCES forsured.users(id),
    encrypted_content JSONB NOT NULL,
    source forsured.message_source NOT NULL DEFAULT 'app',
    email_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id
    ON forsured.conversation_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_user_id
    ON forsured.conversation_messages(sender_user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_created_at
    ON forsured.conversation_messages(conversation_id, created_at);

-- Audit trigger
DROP TRIGGER IF EXISTS audit_conversation_messages ON forsured.conversation_messages;
CREATE TRIGGER audit_conversation_messages
    AFTER INSERT OR UPDATE OR DELETE ON forsured.conversation_messages
    FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

COMMENT ON TABLE forsured.conversation_messages IS
    'Individual messages within conversations, with encrypted content and email metadata';

-- =============================================================================
-- CONVERSATION ATTACHMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS forsured.conversation_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES forsured.conversation_messages(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES forsured.conversations(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    encryption_metadata JSONB,
    promoted_to_document_id UUID REFERENCES forsured.documents(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_conversation_attachments_message_id
    ON forsured.conversation_attachments(message_id);

CREATE INDEX IF NOT EXISTS idx_conversation_attachments_conversation_id
    ON forsured.conversation_attachments(conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_attachments_promoted_to_document_id
    ON forsured.conversation_attachments(promoted_to_document_id)
    WHERE promoted_to_document_id IS NOT NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS audit_conversation_attachments ON forsured.conversation_attachments;
CREATE TRIGGER audit_conversation_attachments
    AFTER INSERT OR UPDATE OR DELETE ON forsured.conversation_attachments
    FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger_function();

COMMENT ON TABLE forsured.conversation_attachments IS
    'File attachments on messages, with encryption metadata and optional promotion to formal documents';

-- =============================================================================
-- TRIGGER: Update conversation last_message_at on new message
-- =============================================================================

CREATE OR REPLACE FUNCTION forsured.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE forsured.conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_conversation_last_message
    AFTER INSERT ON forsured.conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION forsured.update_conversation_last_message();

COMMENT ON FUNCTION forsured.update_conversation_last_message IS
    'Updates conversations.last_message_at when a new message is inserted';
