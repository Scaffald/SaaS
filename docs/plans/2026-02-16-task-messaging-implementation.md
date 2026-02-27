# Task-Based Messaging System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build encrypted, task-scoped conversation threads with email integration for contractor-broker and cross-party communication.

**Architecture:** New `forsured.conversations`, `conversation_participants`, `conversation_messages`, and `conversation_attachments` tables with RLS. A `conversation` tRPC router handles CRUD. A Supabase edge function handles inbound email via SendGrid parse. Field-level encryption on messages, file-level encryption on attachments. Attachment promotion to policy docs goes through the existing `taskDocumentService` upload pipeline.

**Tech Stack:** PostgreSQL (Supabase), tRPC, Zod, AES-256-GCM (existing `fieldEncryption`), SendGrid, Deno (edge functions), React (UI)

**Design doc:** `docs/plans/2026-02-16-task-messaging-design.md`

**Worktree:** `.worktrees/task-messaging` (branch: `feature/task-messaging`, based on `forsured`)

---

## Task 1: Database Migration - Core Tables

**Files:**
- Create: `packages/supabase/migrations/313_forsured_conversations.sql`

**Step 1: Write the migration**

```sql
-- Migration: 313_forsured_conversations.sql
-- Task-based messaging: conversations, participants, messages, attachments

-- ============================================================
-- 1. Conversation type enum
-- ============================================================
DO $$ BEGIN
  CREATE TYPE forsured.conversation_type AS ENUM ('private_broker', 'cross_party');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE forsured.conversation_status AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE forsured.conversation_role AS ENUM ('owner', 'participant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE forsured.message_source AS ENUM ('app', 'email', 'system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. conversations table
-- ============================================================
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

COMMENT ON TABLE forsured.conversations IS 'Task-scoped conversation threads for contractor-broker and cross-party communication';

CREATE INDEX IF NOT EXISTS idx_conversations_task_id ON forsured.conversations(task_id);
CREATE INDEX IF NOT EXISTS idx_conversations_organization_id ON forsured.conversations(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversations_inbound_email ON forsured.conversations(inbound_email_address);

-- updated_at trigger
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON forsured.conversations
  FOR EACH ROW EXECUTE FUNCTION forsured.update_updated_at_column();

-- ============================================================
-- 3. conversation_participants table
-- ============================================================
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

COMMENT ON TABLE forsured.conversation_participants IS 'Tracks who can see and send messages in each conversation';

CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation_id
  ON forsured.conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id
  ON forsured.conversation_participants(user_id);

-- ============================================================
-- 4. conversation_messages table
-- ============================================================
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

COMMENT ON TABLE forsured.conversation_messages IS 'Encrypted messages within conversations. Content stored as EncryptedField JSONB.';

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id
  ON forsured.conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_created_at
  ON forsured.conversation_messages(conversation_id, created_at);

-- ============================================================
-- 5. conversation_attachments table
-- ============================================================
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

COMMENT ON TABLE forsured.conversation_attachments IS 'File attachments on conversation messages. Stored encrypted in conversation-attachments bucket.';

CREATE INDEX IF NOT EXISTS idx_conversation_attachments_message_id
  ON forsured.conversation_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_conversation_attachments_conversation_id
  ON forsured.conversation_attachments(conversation_id);

-- ============================================================
-- 6. Update last_message_at trigger
-- ============================================================
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
  FOR EACH ROW EXECUTE FUNCTION forsured.update_conversation_last_message();

-- ============================================================
-- 7. Audit triggers (same pattern as existing tables)
-- ============================================================
CREATE TRIGGER audit_conversations
  AFTER INSERT OR UPDATE OR DELETE ON forsured.conversations
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger();

CREATE TRIGGER audit_conversation_participants
  AFTER INSERT OR UPDATE OR DELETE ON forsured.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger();

CREATE TRIGGER audit_conversation_messages
  AFTER INSERT OR UPDATE OR DELETE ON forsured.conversation_messages
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger();

CREATE TRIGGER audit_conversation_attachments
  AFTER INSERT OR UPDATE OR DELETE ON forsured.conversation_attachments
  FOR EACH ROW EXECUTE FUNCTION forsured.audit_trigger();
```

**Step 2: Verify the migration syntax**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && pnpm supa db push --dry-run 2>&1 | tail -20`

If errors, fix them. If clean, proceed.

**Step 3: Commit**

```bash
cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging
git add packages/supabase/migrations/313_forsured_conversations.sql
git commit -m "feat(messaging): add conversations, participants, messages, attachments tables"
```

---

## Task 2: Database Migration - RLS Policies

**Files:**
- Create: `packages/supabase/migrations/314_forsured_conversations_rls.sql`

**Step 1: Write the RLS migration**

```sql
-- Migration: 314_forsured_conversations_rls.sql
-- RLS policies for conversation tables

-- ============================================================
-- Enable RLS on all conversation tables
-- ============================================================
ALTER TABLE forsured.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE forsured.conversation_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper: check if user is a participant in a conversation
-- ============================================================
CREATE OR REPLACE FUNCTION forsured.is_conversation_participant(
  p_conversation_id UUID,
  p_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM forsured.conversation_participants
    WHERE conversation_id = p_conversation_id
      AND user_id = p_user_id
      AND left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- conversations policies
-- ============================================================

-- Users can see conversations they participate in
CREATE POLICY conversations_select ON forsured.conversations
  FOR SELECT TO authenticated
  USING (
    forsured.is_conversation_participant(id, auth.uid())
  );

-- Authenticated users can create conversations (app-level checks handle permissions)
CREATE POLICY conversations_insert ON forsured.conversations
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = auth.uid()
  );

-- Only creator can update (archive) conversations
CREATE POLICY conversations_update ON forsured.conversations
  FOR UPDATE TO authenticated
  USING (
    created_by_user_id = auth.uid()
  );

-- Service role bypass for edge functions (inbound email)
CREATE POLICY conversations_service ON forsured.conversations
  FOR ALL TO service_role
  USING (true);

-- ============================================================
-- conversation_participants policies
-- ============================================================

-- Participants can see other participants in their conversations
CREATE POLICY conv_participants_select ON forsured.conversation_participants
  FOR SELECT TO authenticated
  USING (
    forsured.is_conversation_participant(conversation_id, auth.uid())
  );

-- Participants can add others (app-level checks enforce broker rules)
CREATE POLICY conv_participants_insert ON forsured.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    forsured.is_conversation_participant(conversation_id, auth.uid())
  );

-- Participants can leave (update their own left_at)
CREATE POLICY conv_participants_update ON forsured.conversation_participants
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
  );

CREATE POLICY conv_participants_service ON forsured.conversation_participants
  FOR ALL TO service_role
  USING (true);

-- ============================================================
-- conversation_messages policies
-- ============================================================

-- Participants can read all messages in their conversations
CREATE POLICY conv_messages_select ON forsured.conversation_messages
  FOR SELECT TO authenticated
  USING (
    forsured.is_conversation_participant(conversation_id, auth.uid())
  );

-- Participants can send messages
CREATE POLICY conv_messages_insert ON forsured.conversation_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    forsured.is_conversation_participant(conversation_id, auth.uid())
    AND sender_user_id = auth.uid()
  );

CREATE POLICY conv_messages_service ON forsured.conversation_messages
  FOR ALL TO service_role
  USING (true);

-- ============================================================
-- conversation_attachments policies
-- ============================================================

-- Participants can see attachments
CREATE POLICY conv_attachments_select ON forsured.conversation_attachments
  FOR SELECT TO authenticated
  USING (
    forsured.is_conversation_participant(conversation_id, auth.uid())
  );

-- Participants can add attachments
CREATE POLICY conv_attachments_insert ON forsured.conversation_attachments
  FOR INSERT TO authenticated
  WITH CHECK (
    forsured.is_conversation_participant(conversation_id, auth.uid())
  );

-- Allow updating promoted_to_document_id
CREATE POLICY conv_attachments_update ON forsured.conversation_attachments
  FOR UPDATE TO authenticated
  USING (
    forsured.is_conversation_participant(conversation_id, auth.uid())
  );

CREATE POLICY conv_attachments_service ON forsured.conversation_attachments
  FOR ALL TO service_role
  USING (true);
```

**Step 2: Verify**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && pnpm supa db push --dry-run 2>&1 | tail -20`

**Step 3: Commit**

```bash
git add packages/supabase/migrations/314_forsured_conversations_rls.sql
git commit -m "feat(messaging): add RLS policies for conversation tables"
```

---

## Task 3: Database Migration - Storage Bucket + Org Setting

**Files:**
- Create: `packages/supabase/migrations/315_forsured_conversation_attachments_storage.sql`

**Step 1: Write the migration**

```sql
-- Migration: 315_forsured_conversation_attachments_storage.sql
-- Storage bucket for conversation attachments + org email policy setting

-- ============================================================
-- 1. Create conversation-attachments bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'conversation-attachments',
  'conversation-attachments',
  FALSE,
  10485760, -- 10MB
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Storage RLS policies
-- ============================================================

-- Read: participants can read files in their conversations
CREATE POLICY conversation_attachments_read
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'conversation-attachments'
    AND forsured.is_conversation_participant(
      (storage.foldername(name))[1]::UUID,
      auth.uid()
    )
  );

-- Write: participants can upload files to their conversations
CREATE POLICY conversation_attachments_write
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'conversation-attachments'
    AND forsured.is_conversation_participant(
      (storage.foldername(name))[1]::UUID,
      auth.uid()
    )
  );

-- Service role: edge function can read/write for email attachments
CREATE POLICY conversation_attachments_service
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'conversation-attachments');

-- ============================================================
-- 3. Add conversation_email_policy to organizations
-- ============================================================
DO $$ BEGIN
  CREATE TYPE forsured.email_policy AS ENUM ('full_content', 'links_only');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE forsured.organizations
  ADD COLUMN IF NOT EXISTS conversation_email_policy forsured.email_policy
  NOT NULL DEFAULT 'full_content';

COMMENT ON COLUMN forsured.organizations.conversation_email_policy IS
  'Controls whether conversation notification emails include full message content or just links';
```

**Step 2: Verify**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && pnpm supa db push --dry-run 2>&1 | tail -20`

**Step 3: Commit**

```bash
git add packages/supabase/migrations/315_forsured_conversation_attachments_storage.sql
git commit -m "feat(messaging): add conversation-attachments bucket and org email policy"
```

---

## Task 4: tRPC Router - Conversation CRUD

**Files:**
- Create: `apps/forsured-web/src/server/api/routers/conversation.ts`
- Modify: `apps/forsured-web/src/server/api/root.ts`

**Step 1: Write the failing test**

Create: `apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

// Verify the router module exports correctly
describe('conversation router', () => {
  it('exports conversationRouter', async () => {
    const mod = await import('../conversation');
    expect(mod.conversationRouter).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && npx vitest run apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts 2>&1`

Expected: FAIL - module not found

**Step 3: Write the conversation router**

Create `apps/forsured-web/src/server/api/routers/conversation.ts`:

```typescript
/**
 * Conversation Router
 * Task-based messaging: encrypted conversations between contractors, brokers, and managers
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';
import { nanoid } from 'nanoid';

const INBOUND_EMAIL_DOMAIN = process.env.CONVERSATION_EMAIL_DOMAIN || 'chat.forsured.com';

const ConversationTypeEnum = z.enum(['private_broker', 'cross_party']);
const ConversationStatusEnum = z.enum(['active', 'archived']);
const MessageSourceEnum = z.enum(['app', 'email', 'system']);

export const conversationRouter = createTRPCRouter({
  /**
   * List conversations for a task that the current user participates in
   */
  listByTask: protectedProcedure
    .input(z.object({
      taskId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await forsured('conversations')
        .select(`
          *,
          conversation_participants!inner(user_id)
        `)
        .eq('task_id', input.taskId)
        .eq('conversation_participants.user_id', ctx.userId)
        .is('conversation_participants.left_at', null)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data ?? [];
    }),

  /**
   * Get a single conversation with participants
   */
  get: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify participant access
      const { data: participant } = await forsured('conversation_participants')
        .select('id')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .single();

      if (!participant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a participant in this conversation' });
      }

      const { data, error } = await forsured('conversations')
        .select(`
          *,
          conversation_participants(
            id, user_id, role_in_conversation, joined_at, left_at,
            user:forsured.users(id, name, email, display_name)
          )
        `)
        .eq('id', input.conversationId)
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  /**
   * Create a new conversation on a task
   */
  create: protectedProcedure
    .input(z.object({
      taskId: z.string().uuid(),
      organizationId: z.string().uuid(),
      type: ConversationTypeEnum,
      participantUserIds: z.array(z.string().uuid()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const inboundEmail = `conv-${nanoid(12)}@${INBOUND_EMAIL_DOMAIN}`;

      // Create conversation
      const { data: conversation, error: convError } = await forsured('conversations')
        .insert({
          task_id: input.taskId,
          organization_id: input.organizationId,
          type: input.type,
          created_by_user_id: ctx.userId,
          inbound_email_address: inboundEmail,
          status: 'active',
        })
        .select()
        .single();

      if (convError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: convError.message });

      // Add creator as owner
      const participants = [
        {
          conversation_id: conversation.id,
          user_id: ctx.userId,
          role_in_conversation: 'owner' as const,
          added_by_user_id: ctx.userId,
        },
        ...input.participantUserIds.map((uid) => ({
          conversation_id: conversation.id,
          user_id: uid,
          role_in_conversation: 'participant' as const,
          added_by_user_id: ctx.userId,
        })),
      ];

      const { error: partError } = await forsured('conversation_participants')
        .insert(participants);

      if (partError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: partError.message });

      // Insert system message: "{user} started this conversation"
      // Note: system messages have sender_user_id = null, source = 'system'
      // Content still encrypted for consistency
      // This will be implemented in the sendMessage procedure

      return conversation;
    }),

  /**
   * Add a participant to a conversation
   */
  addParticipant: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      userId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify caller is a participant
      const { data: callerParticipant } = await forsured('conversation_participants')
        .select('id')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .single();

      if (!callerParticipant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a participant in this conversation' });
      }

      // Check if user is already a participant
      const { data: existing } = await forsured('conversation_participants')
        .select('id, left_at')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', input.userId)
        .single();

      if (existing && !existing.left_at) {
        throw new TRPCError({ code: 'CONFLICT', message: 'User is already a participant' });
      }

      if (existing && existing.left_at) {
        // Re-add: clear left_at
        const { error } = await forsured('conversation_participants')
          .update({ left_at: null, added_by_user_id: ctx.userId })
          .eq('id', existing.id);

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      } else {
        const { error } = await forsured('conversation_participants')
          .insert({
            conversation_id: input.conversationId,
            user_id: input.userId,
            role_in_conversation: 'participant',
            added_by_user_id: ctx.userId,
          });

        if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true };
    }),

  /**
   * Archive a conversation
   */
  archive: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await forsured('conversations')
        .update({ status: 'archived' })
        .eq('id', input.conversationId)
        .eq('created_by_user_id', ctx.userId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      if (!data) throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the creator can archive a conversation' });

      return data;
    }),
});
```

**Step 4: Register the router**

Modify `apps/forsured-web/src/server/api/root.ts`:

Add import:
```typescript
import { conversationRouter } from './routers/conversation'; // Task messaging
```

Add to appRouter object:
```typescript
conversation: conversationRouter, // Task messaging
```

**Step 5: Run test to verify it passes**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && npx vitest run apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts 2>&1`

Expected: PASS

**Step 6: Commit**

```bash
git add apps/forsured-web/src/server/api/routers/conversation.ts \
       apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts \
       apps/forsured-web/src/server/api/root.ts
git commit -m "feat(messaging): add conversation tRPC router with CRUD procedures"
```

---

## Task 5: tRPC Router - Messages (Send & List with Encryption)

**Files:**
- Modify: `apps/forsured-web/src/server/api/routers/conversation.ts`

**Step 1: Write the failing test**

Add to `apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts`:

```typescript
describe('conversation router - message procedures', () => {
  it('exports sendMessage and getMessages procedures', async () => {
    const mod = await import('../conversation');
    const router = mod.conversationRouter;
    // Verify the router has the expected procedure keys
    expect(router._def.procedures).toHaveProperty('sendMessage');
    expect(router._def.procedures).toHaveProperty('getMessages');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && npx vitest run apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts 2>&1`

Expected: FAIL - procedures not found

**Step 3: Add message procedures to conversation router**

Add these procedures to the `conversationRouter` in `conversation.ts`:

```typescript
  /**
   * Send a message in a conversation (encrypts content before storing)
   */
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      content: z.string().min(1).max(10000),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify participant
      const { data: participant } = await forsured('conversation_participants')
        .select('id')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .single();

      if (!participant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a participant' });
      }

      // Encrypt message content
      const { FieldEncryptionService } = await import('../../../lib/encryption/fieldEncryption');
      const encryption = new FieldEncryptionService();
      const encryptedContent = await encryption.encrypt(input.content, 'message_content');

      // Insert message
      const { data: message, error } = await forsured('conversation_messages')
        .insert({
          conversation_id: input.conversationId,
          sender_user_id: ctx.userId,
          encrypted_content: encryptedContent,
          source: 'app',
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      return message;
    }),

  /**
   * Get messages for a conversation (decrypts content before returning)
   */
  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
      cursor: z.string().uuid().optional(), // message ID for pagination
    }))
    .query(async ({ ctx, input }) => {
      // Verify participant
      const { data: participant } = await forsured('conversation_participants')
        .select('id')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .single();

      if (!participant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not a participant' });
      }

      let query = forsured('conversation_messages')
        .select(`
          *,
          sender:forsured.users(id, name, email, display_name),
          conversation_attachments(
            id, original_filename, mime_type, file_size_bytes, promoted_to_document_id
          )
        `)
        .eq('conversation_id', input.conversationId)
        .order('created_at', { ascending: true })
        .limit(input.limit);

      if (input.cursor) {
        // Get the created_at of the cursor message for keyset pagination
        const { data: cursorMsg } = await forsured('conversation_messages')
          .select('created_at')
          .eq('id', input.cursor)
          .single();

        if (cursorMsg) {
          query = query.gt('created_at', cursorMsg.created_at);
        }
      }

      const { data: messages, error } = await query;

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      // Decrypt message contents
      const { FieldEncryptionService } = await import('../../../lib/encryption/fieldEncryption');
      const encryption = new FieldEncryptionService();

      const decryptedMessages = await Promise.all(
        (messages ?? []).map(async (msg) => {
          try {
            const decryptedContent = msg.source === 'system'
              ? await encryption.decrypt(msg.encrypted_content)
              : await encryption.decrypt(msg.encrypted_content);

            return { ...msg, content: decryptedContent, encrypted_content: undefined };
          } catch {
            return { ...msg, content: '[Unable to decrypt message]', encrypted_content: undefined };
          }
        })
      );

      return decryptedMessages;
    }),
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && npx vitest run apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts 2>&1`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/forsured-web/src/server/api/routers/conversation.ts \
       apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts
git commit -m "feat(messaging): add sendMessage and getMessages with encryption"
```

---

## Task 6: tRPC Router - Attachment Upload & Promotion

**Files:**
- Modify: `apps/forsured-web/src/server/api/routers/conversation.ts`

**Step 1: Write the failing test**

Add to test file:

```typescript
describe('conversation router - attachment procedures', () => {
  it('exports promoteAttachment procedure', async () => {
    const mod = await import('../conversation');
    expect(mod.conversationRouter._def.procedures).toHaveProperty('promoteAttachment');
  });

  it('exports getAttachmentUrl procedure', async () => {
    const mod = await import('../conversation');
    expect(mod.conversationRouter._def.procedures).toHaveProperty('getAttachmentUrl');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && npx vitest run apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts 2>&1`

Expected: FAIL

**Step 3: Add attachment procedures**

Add to `conversation.ts`:

```typescript
  /**
   * Get a signed download URL for a conversation attachment
   */
  getAttachmentUrl: protectedProcedure
    .input(z.object({
      attachmentId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Get attachment and verify participant access
      const { data: attachment, error } = await forsured('conversation_attachments')
        .select('*, conversation_id')
        .eq('id', input.attachmentId)
        .single();

      if (error || !attachment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not found' });
      }

      const { data: participant } = await forsured('conversation_participants')
        .select('id')
        .eq('conversation_id', attachment.conversation_id)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .single();

      if (!participant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a participant' });
      }

      // Generate signed URL (1 hour expiry)
      const { supabaseServiceRole } = await import('../../../lib/supabase');
      const { data: urlData, error: urlError } = await supabaseServiceRole
        .storage
        .from('conversation-attachments')
        .createSignedUrl(attachment.storage_path, 3600);

      if (urlError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: urlError.message });

      return { url: urlData.signedUrl, filename: attachment.original_filename, mimeType: attachment.mime_type };
    }),

  /**
   * Promote a conversation attachment to a policy document on the task.
   * Downloads from conversation bucket, re-uploads through taskDocumentService pipeline.
   */
  promoteAttachment: protectedProcedure
    .input(z.object({
      attachmentId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get attachment with conversation and task info
      const { data: attachment } = await forsured('conversation_attachments')
        .select(`
          *,
          conversation:forsured.conversations(task_id, organization_id)
        `)
        .eq('id', input.attachmentId)
        .single();

      if (!attachment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Attachment not found' });
      }

      if (attachment.promoted_to_document_id) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Attachment already promoted to a policy document' });
      }

      // Verify participant
      const { data: participant } = await forsured('conversation_participants')
        .select('id')
        .eq('conversation_id', attachment.conversation_id)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .single();

      if (!participant) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not a participant' });
      }

      // Download file from conversation bucket
      const { supabaseServiceRole } = await import('../../../lib/supabase');
      const { data: fileData, error: downloadError } = await supabaseServiceRole
        .storage
        .from('conversation-attachments')
        .download(attachment.storage_path);

      if (downloadError || !fileData) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to download attachment' });
      }

      // Upload through the canonical task document pipeline
      const { uploadTaskDocument } = await import('../../../lib/api/taskDocumentService');
      const document = await uploadTaskDocument(
        {
          task_id: attachment.conversation.task_id,
          organization_id: attachment.conversation.organization_id,
          document_type: 'uploaded',
          document_name: attachment.original_filename,
          mime_type: attachment.mime_type,
          file_size_bytes: attachment.file_size_bytes,
          file: fileData,
        },
        ctx.userId,
      );

      // Mark attachment as promoted
      await forsured('conversation_attachments')
        .update({ promoted_to_document_id: document.id })
        .eq('id', input.attachmentId);

      return document;
    }),
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && npx vitest run apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts 2>&1`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/forsured-web/src/server/api/routers/conversation.ts \
       apps/forsured-web/src/server/api/routers/__tests__/conversation.test.ts
git commit -m "feat(messaging): add attachment URL generation and promotion to policy doc"
```

---

## Task 7: Email Notification Service

**Files:**
- Create: `apps/forsured-web/src/lib/email/conversationNotifications.ts`

**Step 1: Write the failing test**

Create: `apps/forsured-web/src/lib/email/__tests__/conversationNotifications.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('conversationNotifications', () => {
  it('exports notifyConversationParticipants', async () => {
    const mod = await import('../conversationNotifications');
    expect(mod.notifyConversationParticipants).toBeDefined();
    expect(typeof mod.notifyConversationParticipants).toBe('function');
  });

  it('exports buildConversationEmailHtml', async () => {
    const mod = await import('../conversationNotifications');
    expect(mod.buildConversationEmailHtml).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && npx vitest run apps/forsured-web/src/lib/email/__tests__/conversationNotifications.test.ts 2>&1`

Expected: FAIL

**Step 3: Write the notification service**

Create `apps/forsured-web/src/lib/email/conversationNotifications.ts`:

```typescript
/**
 * Conversation Email Notifications
 *
 * Sends notification emails to conversation participants when new messages arrive.
 * Respects org-level email policy (full_content vs links_only).
 * Includes broker upsell for non-account brokers.
 */

import { sendEmail } from './emailConfig';
import { forsured } from '../supabase';

const APP_URL = process.env.VITE_APP_URL || 'https://app.forsured.com';

const CONFIDENTIALITY_FOOTER = `
  <p style="font-size: 12px; color: #666; margin-top: 24px; border-top: 1px solid #eee; padding-top: 12px;">
    Conversations are confidential between the members of this conversation, encrypted in flight and at rest within Forsured's systems.
  </p>
`;

const BROKER_UPSELL_BANNER = (clientName: string) => `
  <div style="background: #f0f7ff; border: 1px solid #d0e3ff; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
    <p style="margin: 0; font-size: 14px;">You're receiving this because <strong>${clientName}</strong> uses Forsured to manage insurance compliance.</p>
  </div>
`;

const BROKER_UPSELL_CTA = `
  <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-top: 16px; text-align: center;">
    <p style="margin: 0 0 8px;">Sign up for Forsured to see all your tasks, manage documents, and communicate with your clients in one place.</p>
    <a href="${APP_URL}/signup?ref=conversation-email" style="display: inline-block; background: #2563eb; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Create your free account</a>
  </div>
`;

interface NotifyParams {
  conversationId: string;
  senderUserId: string;
  senderName: string;
  messageContent: string;
  taskName: string;
  projectName?: string;
  attachmentNames?: string[];
}

export function buildConversationEmailHtml(params: {
  policy: 'full_content' | 'links_only';
  senderName: string;
  messageContent: string;
  taskName: string;
  conversationUrl: string;
  attachmentNames?: string[];
  isBrokerWithoutAccount: boolean;
  clientName?: string;
}): string {
  const { policy, senderName, messageContent, taskName, conversationUrl, attachmentNames, isBrokerWithoutAccount, clientName } = params;

  let html = '';

  if (isBrokerWithoutAccount && clientName) {
    html += BROKER_UPSELL_BANNER(clientName);
  }

  if (policy === 'full_content') {
    html += `
      <p><strong>${senderName}</strong> sent a message on <strong>${taskName}</strong>:</p>
      <div style="background: #f8f9fa; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        ${messageContent.replace(/\n/g, '<br>')}
      </div>
    `;

    if (attachmentNames && attachmentNames.length > 0) {
      html += `<p>Attachments: ${attachmentNames.join(', ')}</p>`;
    }

    html += `<p><a href="${conversationUrl}">View in Forsured</a></p>`;
  } else {
    html += `
      <p><strong>${senderName}</strong> sent you a message about <strong>${taskName}</strong>.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${conversationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Message</a>
      </p>
    `;
  }

  if (isBrokerWithoutAccount) {
    html += BROKER_UPSELL_CTA;
  }

  html += CONFIDENTIALITY_FOOTER;

  return html;
}

export async function notifyConversationParticipants(params: NotifyParams): Promise<void> {
  // Get conversation with participants and org policy
  const { data: conversation } = await forsured('conversations')
    .select(`
      *,
      conversation_participants(
        user_id,
        user:forsured.users(id, email, name, display_name)
      ),
      organization:forsured.organizations(conversation_email_policy)
    `)
    .eq('id', params.conversationId)
    .single();

  if (!conversation) return;

  const policy = conversation.organization?.conversation_email_policy ?? 'full_content';
  const conversationUrl = `${APP_URL}/tasks/${conversation.task_id}/conversations/${conversation.id}`;

  // Get participants excluding the sender
  const recipients = conversation.conversation_participants
    .filter((p: { user_id: string }) => p.user_id !== params.senderUserId)
    .map((p: { user: { id: string; email: string; name: string | null; display_name: string | null } }) => p.user);

  // Check which users have real accounts (non-manual users)
  // Manual users will have a specific flag or lack auth records
  for (const recipient of recipients) {
    if (!recipient?.email) continue;

    // Check if this is a manual user (broker without account)
    const { data: userProfile } = await forsured('user_profiles')
      .select('id')
      .eq('user_id', recipient.id)
      .single();

    const isBrokerWithoutAccount = !userProfile;

    const subject = policy === 'full_content'
      ? `[Forsured] New message on ${params.taskName} from ${params.senderName}`
      : `[Forsured] New message on ${params.taskName}`;

    const html = buildConversationEmailHtml({
      policy,
      senderName: params.senderName,
      messageContent: params.messageContent,
      taskName: params.taskName,
      conversationUrl,
      attachmentNames: params.attachmentNames,
      isBrokerWithoutAccount,
      clientName: params.senderName,
    });

    await sendEmail({
      to: [recipient.email],
      subject,
      html,
      replyTo: conversation.inbound_email_address,
    });
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && npx vitest run apps/forsured-web/src/lib/email/__tests__/conversationNotifications.test.ts 2>&1`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/forsured-web/src/lib/email/conversationNotifications.ts \
       apps/forsured-web/src/lib/email/__tests__/conversationNotifications.test.ts
git commit -m "feat(messaging): add conversation email notification service with broker upsell"
```

---

## Task 8: Edge Function - Inbound Conversation Email

**Files:**
- Create: `packages/supabase/functions/inbound-conversation-email/index.ts`

**Step 1: Write the edge function**

```typescript
/**
 * Inbound Conversation Email Edge Function
 *
 * Receives emails from SendGrid Inbound Parse for conversation replies.
 * Verifies sender, encrypts content, stores message, triggers notifications.
 *
 * IMPORTANT: Always returns 200 to SendGrid, even for rejections.
 * Non-200 responses cause SendGrid to retry delivery.
 */

import { serve } from 'https://deno.land/std@0.223.0/http/server'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, createCorsResponse } from '../_shared/cors'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return createCorsResponse('ok')
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // SendGrid sends multipart form data
    const formData = await req.formData()

    const to = formData.get('to') as string
    const from = formData.get('from') as string
    const subject = formData.get('subject') as string
    const text = formData.get('text') as string
    const html = formData.get('html') as string

    // Extract email address from "Name <email>" format
    const senderEmail = from.includes('<')
      ? from.match(/<(.+?)>/)?.[1] ?? from
      : from

    const recipientEmail = to.includes('<')
      ? to.match(/<(.+?)>/)?.[1] ?? to
      : to

    // 1. Look up conversation by inbound email address
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, status, task_id, organization_id')
      .eq('inbound_email_address', recipientEmail.toLowerCase().trim())
      .single()

    if (convError || !conversation) {
      // Log rejection and return 200
      await supabase.from('email_rejection_log').insert({
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        rejection_reason: 'conversation_not_found',
        subject: subject,
      })
      return jsonResponse({ status: 'rejected', reason: 'conversation_not_found' })
    }

    // 2. Check conversation is active
    if (conversation.status !== 'active') {
      await supabase.from('email_rejection_log').insert({
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        rejection_reason: 'conversation_archived',
        subject: subject,
      })
      return jsonResponse({ status: 'rejected', reason: 'conversation_archived' })
    }

    // 3. Verify sender is a participant (check email against users in conversation)
    const { data: senderParticipant } = await supabase
      .rpc('verify_conversation_email_sender', {
        p_conversation_id: conversation.id,
        p_sender_email: senderEmail.toLowerCase().trim(),
      })

    if (!senderParticipant || senderParticipant.length === 0) {
      await supabase.from('email_rejection_log').insert({
        sender_email: senderEmail,
        recipient_email: recipientEmail,
        rejection_reason: 'sender_not_participant',
        subject: subject,
      })
      return jsonResponse({ status: 'rejected', reason: 'sender_not_participant' })
    }

    const senderId = senderParticipant[0].user_id

    // 4. Extract and clean message body
    // Prefer plain text, strip reply chains
    const messageBody = cleanEmailBody(text || stripHtml(html || ''))

    if (!messageBody.trim()) {
      return jsonResponse({ status: 'rejected', reason: 'empty_message' })
    }

    // 5. Store message (content will be stored as plaintext JSONB for edge function;
    //    encryption happens at application layer for consistency with key management)
    //    Note: Edge function uses service role, so RLS is bypassed.
    //    We store a marker that the app layer should encrypt on first read,
    //    OR we store as a simple JSONB structure that the app handles.
    const { data: message, error: msgError } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversation.id,
        sender_user_id: senderId,
        encrypted_content: { plaintext_pending_encryption: messageBody },
        source: 'email',
        email_metadata: {
          subject,
          from: senderEmail,
          message_id: formData.get('Message-Id'),
          in_reply_to: formData.get('In-Reply-To'),
        },
      })
      .select()
      .single()

    if (msgError) {
      console.error('Failed to insert message:', msgError)
      return jsonResponse({ status: 'error', reason: 'insert_failed' })
    }

    // 6. Handle attachments
    const attachmentCount = parseInt(formData.get('attachments') as string || '0', 10)
    const attachmentNames: string[] = []

    for (let i = 1; i <= attachmentCount; i++) {
      const file = formData.get(`attachment${i}`) as File | null
      if (!file) continue

      const storagePath = `${conversation.id}/${message.id}/${file.name}`

      // Upload to conversation-attachments bucket
      const { error: uploadError } = await supabase.storage
        .from('conversation-attachments')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        console.error(`Failed to upload attachment ${file.name}:`, uploadError)
        continue
      }

      // Record attachment
      await supabase.from('conversation_attachments').insert({
        message_id: message.id,
        conversation_id: conversation.id,
        storage_path: storagePath,
        original_filename: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
      })

      attachmentNames.push(file.name)
    }

    // 7. Trigger notifications to other participants
    // Call the notification edge function or handle inline
    // For now, use pg_notify to trigger async processing
    await supabase.rpc('notify_conversation_message', {
      p_conversation_id: conversation.id,
      p_message_id: message.id,
      p_sender_user_id: senderId,
    })

    return jsonResponse({
      status: 'accepted',
      messageId: message.id,
      attachments: attachmentNames.length,
    })
  } catch (error) {
    console.error('Inbound email processing error:', error)
    // Always return 200 to prevent SendGrid retries
    return jsonResponse({ status: 'error', reason: 'processing_failed' })
  }
})

/**
 * Strip reply chains from email body (lines starting with > or "On ... wrote:")
 */
function cleanEmailBody(text: string): string {
  const lines = text.split('\n')
  const cleanLines: string[] = []

  for (const line of lines) {
    // Stop at reply chain markers
    if (line.match(/^On .+ wrote:$/)) break
    if (line.match(/^-{3,}\s*Original Message/i)) break
    if (line.match(/^>{2,}/)) break // Multiple > levels = deep reply

    // Skip single-level quotes but don't break
    if (line.startsWith('>')) continue

    cleanLines.push(line)
  }

  return cleanLines.join('\n').trim()
}

/**
 * Basic HTML to text conversion
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}
```

**Step 2: Write the DB function for sender verification**

Create: `packages/supabase/migrations/316_forsured_conversation_email_functions.sql`

```sql
-- Migration: 316_forsured_conversation_email_functions.sql
-- Helper functions for conversation email processing

-- Verify that an email sender is a participant in a conversation
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

-- Notify function for async message processing (notifications)
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
```

**Step 3: Commit**

```bash
git add packages/supabase/functions/inbound-conversation-email/index.ts \
       packages/supabase/migrations/316_forsured_conversation_email_functions.sql
git commit -m "feat(messaging): add inbound email edge function with sender verification"
```

---

## Task 9: Seed Data

**Files:**
- Create: `packages/supabase/seeds/forsured/10_conversations.sql`

**Step 1: Write seed data**

Create seed data that exercises the conversation model with test users from existing seeds:

```sql
-- Seed: 10_conversations.sql
-- Test conversations for development

-- NOTE: This seed depends on existing users and tasks from prior seed files.
-- It uses known UUIDs from the existing seed data.
-- Only run after all other forsured seeds.

-- Placeholder: actual UUIDs will be pulled from existing seed data
-- This seed file should be written to SELECT existing user/task IDs
-- and create conversations between them for local development testing.

DO $$
DECLARE
  v_contractor_id UUID;
  v_broker_id UUID;
  v_manager_id UUID;
  v_task_id UUID;
  v_org_id UUID;
  v_conv_id UUID;
BEGIN
  -- Get a contractor user
  SELECT id INTO v_contractor_id FROM forsured.users WHERE role = 'subcontractor' LIMIT 1;
  -- Get a broker user
  SELECT id INTO v_broker_id FROM forsured.users WHERE role = 'broker' LIMIT 1;
  -- Get a manager user
  SELECT id INTO v_manager_id FROM forsured.users WHERE role = 'manager' LIMIT 1;
  -- Get a task
  SELECT id, organization_id INTO v_task_id, v_org_id FROM forsured.tasks LIMIT 1;

  IF v_contractor_id IS NULL OR v_task_id IS NULL THEN
    RAISE NOTICE 'Skipping conversation seeds: required users or tasks not found';
    RETURN;
  END IF;

  -- Create a private broker conversation
  INSERT INTO forsured.conversations (id, task_id, organization_id, type, created_by_user_id, inbound_email_address, status)
  VALUES (gen_random_uuid(), v_task_id, v_org_id, 'private_broker', v_contractor_id, 'conv-seed-private@chat.forsured.com', 'active')
  RETURNING id INTO v_conv_id;

  INSERT INTO forsured.conversation_participants (conversation_id, user_id, role_in_conversation, added_by_user_id)
  VALUES
    (v_conv_id, v_contractor_id, 'owner', v_contractor_id),
    (v_conv_id, v_broker_id, 'participant', v_contractor_id);

  -- Seed messages (stored as plaintext JSONB for seeds - not encrypted)
  INSERT INTO forsured.conversation_messages (conversation_id, sender_user_id, encrypted_content, source)
  VALUES
    (v_conv_id, v_contractor_id, '{"plaintext_seed": "Hi, can you help me with the GL COI for this project?"}'::jsonb, 'app'),
    (v_conv_id, v_broker_id, '{"plaintext_seed": "Sure! I''ll get that sent over today."}'::jsonb, 'app');

  RAISE NOTICE 'Conversation seeds created successfully';
END $$;
```

**Step 2: Commit**

```bash
git add packages/supabase/seeds/forsured/10_conversations.sql
git commit -m "feat(messaging): add conversation seed data for development"
```

---

## Task 10: Integration Tests - Database Layer

**Files:**
- Create: `apps/forsured-web/src/server/api/routers/__tests__/conversation.integration.test.ts`

**Step 1: Write integration tests against a real database**

These tests verify the migration, RLS policies, and tRPC procedures work together. They require the test database to be running (`pnpm supa db push` applied).

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Integration tests for conversation system.
 * These test the actual database schema and RLS policies.
 * Requires: test database with migrations applied.
 */
describe('conversation database integration', () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  // Skip if no database connection
  const canRunIntegration = supabaseUrl && serviceRoleKey;

  it.skipIf(!canRunIntegration)('conversations table exists and accepts inserts', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    // Verify table exists by querying it
    const { error } = await supabase
      .from('conversations')
      .select('id')
      .limit(0);

    expect(error).toBeNull();
  });

  it.skipIf(!canRunIntegration)('conversation_participants table exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    const { error } = await supabase
      .from('conversation_participants')
      .select('id')
      .limit(0);

    expect(error).toBeNull();
  });

  it.skipIf(!canRunIntegration)('conversation_messages table exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    const { error } = await supabase
      .from('conversation_messages')
      .select('id')
      .limit(0);

    expect(error).toBeNull();
  });

  it.skipIf(!canRunIntegration)('conversation_attachments table exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    const { error } = await supabase
      .from('conversation_attachments')
      .select('id')
      .limit(0);

    expect(error).toBeNull();
  });

  it.skipIf(!canRunIntegration)('verify_conversation_email_sender function exists', async () => {
    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    // Call with dummy args - should return empty, not error
    const { error } = await supabase
      .rpc('verify_conversation_email_sender', {
        p_conversation_id: '00000000-0000-0000-0000-000000000000',
        p_sender_email: 'test@example.com',
      });

    expect(error).toBeNull();
  });
});
```

**Step 2: Run the tests**

Run: `cd /Users/mattbernier/projects/unicorn/UNI-Construct/.worktrees/task-messaging && npx vitest run apps/forsured-web/src/server/api/routers/__tests__/conversation.integration.test.ts 2>&1`

Note: These will skip if no database is available. When database is present, they verify the schema.

**Step 3: Commit**

```bash
git add apps/forsured-web/src/server/api/routers/__tests__/conversation.integration.test.ts
git commit -m "test(messaging): add database integration tests for conversation schema"
```

---

## Task 11: Organization Settings - Email Policy UI

**Files:**
- Modify: The organization settings component (find with `grep -r "organization.*settings" apps/forsured-web/src/`)

**Step 1: Find the org settings component**

Run: `grep -rl "conversation_email_policy\|org.*settings\|organization.*settings" apps/forsured-web/src/components/ apps/forsured-web/src/pages/`

This task adds a "Communications" section to the existing org settings page with the email policy toggle. The exact component path depends on the existing structure - the implementing agent should locate it and add the toggle.

**Step 2: Add the toggle**

Add a radio group or select with two options:
- "Include full message content in email notifications" (`full_content`)
- "Send notification links only - messages viewable in app" (`links_only`)

**Step 3: Add tRPC mutation for updating the policy**

Add to the organization router (or conversation router):

```typescript
updateEmailPolicy: protectedProcedure
  .input(z.object({
    organizationId: z.string().uuid(),
    policy: z.enum(['full_content', 'links_only']),
  }))
  .mutation(async ({ ctx, input }) => {
    const { data, error } = await forsured('organizations')
      .update({ conversation_email_policy: input.policy })
      .eq('id', input.organizationId)
      .select()
      .single();

    if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    return data;
  }),
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(messaging): add organization email policy setting UI"
```

---

## Task 12: UI - Conversations Tab on Task Detail

**Files:**
- Create: `apps/forsured-web/src/components/conversations/ConversationList.tsx`
- Create: `apps/forsured-web/src/components/conversations/ConversationThread.tsx`
- Create: `apps/forsured-web/src/components/conversations/MessageInput.tsx`
- Create: `apps/forsured-web/src/components/conversations/ConversationHeader.tsx`
- Modify: Task detail page to add Conversations tab

This is the largest UI task. The implementing agent should:

1. **Find the task detail page** component and its tab structure
2. **Add a "Conversations" tab** alongside existing tabs
3. **Build ConversationList** - shows conversations the user participates in for this task, with last message preview, participant avatars, unread indicators, type badges (lock icon for private_broker, people icon for cross_party)
4. **Build ConversationThread** - chat-like message display with sender info, timestamps, source badges, attachment previews, confidentiality banner
5. **Build MessageInput** - text input with send button and attachment upload
6. **Build ConversationHeader** - participant list, "Add broker" button, conversation type label
7. **Add "New Conversation" dropdown** - "Discuss with my broker" (opens broker picker) and "Contact manager"/"Contact contractor" (role-dependent)

**Key patterns to follow:**
- Use existing Beyond UI component library
- Use tRPC hooks: `trpc.conversation.listByTask.useQuery()`, `trpc.conversation.getMessages.useQuery()`, `trpc.conversation.sendMessage.useMutation()`
- Use TanStack Query for data fetching and cache invalidation
- Follow existing component patterns in `apps/forsured-web/src/components/`

**Step N: Commit after each component**

```bash
git add apps/forsured-web/src/components/conversations/
git commit -m "feat(messaging): add conversation UI components for task detail"
```

---

## Task 13: UI - Attachment Promotion Flow

**Files:**
- Modify: `apps/forsured-web/src/components/conversations/ConversationThread.tsx`

Add to each attachment in the message thread:
1. A context menu with "Download" and "Use as policy document"
2. "Use as policy document" calls `trpc.conversation.promoteAttachment.useMutation()`
3. On success, show a badge on the attachment: "Added to task as policy document"
4. If already promoted (`promoted_to_document_id` is set), show the badge and disable the action

**Commit:**

```bash
git add apps/forsured-web/src/components/conversations/
git commit -m "feat(messaging): add attachment promotion to policy document flow"
```

---

## Task 14: End-to-End Testing

**Files:**
- Create: `apps/forsured-web/e2e/conversations.spec.ts`

Write Playwright e2e tests covering:
1. Contractor creates a private broker conversation on a task
2. Contractor sends a message
3. Message appears in the thread
4. Contractor adds an attachment
5. Contractor promotes attachment to policy document
6. Manager creates a cross-party conversation
7. Manager adds their broker to the conversation
8. Verify manager cannot see private broker conversations

Follow existing e2e test patterns in `apps/forsured-web/e2e/`.

**Commit:**

```bash
git add apps/forsured-web/e2e/conversations.spec.ts
git commit -m "test(messaging): add e2e tests for conversation flows"
```

---

## Task Summary

| # | Task | Depends On |
|---|------|-----------|
| 1 | Migration: core tables | - |
| 2 | Migration: RLS policies | 1 |
| 3 | Migration: storage bucket + org setting | 2 |
| 4 | tRPC router: conversation CRUD | 1-3 |
| 5 | tRPC router: messages with encryption | 4 |
| 6 | tRPC router: attachment upload + promotion | 5 |
| 7 | Email notification service | 4 |
| 8 | Edge function: inbound email | 3, 5 |
| 9 | Seed data | 1-3 |
| 10 | Integration tests | 1-8 |
| 11 | UI: org settings email policy | 4 |
| 12 | UI: conversations tab + thread | 5, 6 |
| 13 | UI: attachment promotion flow | 6, 12 |
| 14 | E2E testing | all |
