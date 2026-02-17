/**
 * Conversation Router
 * Task 4: tRPC Router - Conversation CRUD
 * Task 5: tRPC Router - Messages (Send & List with Encryption)
 *
 * Implements conversation management procedures for the messaging feature.
 * Provides CRUD operations for conversations with participant management.
 * Includes encrypted message sending and retrieval with field-level encryption.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured, supabaseServiceRole } from '../../../lib/supabase';
import { uploadTaskDocument } from '../../../lib/api/taskDocumentService';
import { FieldEncryptionService } from '../../../lib/encryption/fieldEncryption';
import type { IVaultClient, EncryptedField } from '../../../lib/encryption/types';

/**
 * Simple vault client that derives the encryption key from an environment variable.
 * In production, this would be replaced with a proper vault integration (e.g. Supabase Vault).
 * The key is expected to be a 64-character hex string (32 bytes) stored in MESSAGING_ENCRYPTION_KEY.
 */
class EnvVaultClient implements IVaultClient {
  async getDataKey(_keyId: string): Promise<Buffer> {
    const keyHex =
      (typeof process !== 'undefined' && process.env?.MESSAGING_ENCRYPTION_KEY) || '';
    if (!keyHex || keyHex.length !== 64) {
      throw new Error(
        'MESSAGING_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)'
      );
    }
    return Buffer.from(keyHex, 'hex');
  }

  async createDataKey() {
    throw new Error('Key creation not supported via env vault client');
  }

  async rotateKey() {
    throw new Error('Key rotation not supported via env vault client');
  }

  async listKeys() {
    return [];
  }

  async keyExists() {
    return true;
  }
}

/**
 * Lazily-initialized encryption service singleton.
 * Uses EnvVaultClient to source the data encryption key from environment variables.
 */
let encryptionService: FieldEncryptionService | null = null;

function getEncryptionService(): FieldEncryptionService {
  if (!encryptionService) {
    encryptionService = new FieldEncryptionService(new EnvVaultClient());
  }
  return encryptionService;
}

/**
 * Inbound email domain for generated conversation email addresses.
 * Falls back to chat.forsured.com when CONVERSATION_EMAIL_DOMAIN is not set.
 */
const INBOUND_EMAIL_DOMAIN =
  (typeof process !== 'undefined' && process.env?.CONVERSATION_EMAIL_DOMAIN) ||
  'chat.forsured.com';

/**
 * Conversation Router
 *
 * All procedures require authentication via protectedProcedure.
 * Access is scoped by participant membership rather than organization.
 */
export const conversationRouter = createTRPCRouter({
  /**
   * List conversations for a given task that the caller participates in.
   * Orders by last_message_at DESC (nulls last).
   */
  listByTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Query conversations joined with conversation_participants
      // where the caller is an active participant (left_at IS NULL)
      const { data, error } = await forsured('conversations')
        .select(
          `
          *,
          conversation_participants!inner (
            user_id,
            role,
            joined_at,
            left_at
          )
        `
        )
        .eq('task_id', input.taskId)
        .eq('conversation_participants.user_id', ctx.userId)
        .is('conversation_participants.left_at', null)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch conversations',
          cause: error,
        });
      }

      return data || [];
    }),

  /**
   * Get a single conversation by ID with nested participants.
   * Verifies caller is an active participant before returning data.
   */
  get: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify caller is an active participant
      const { data: participant } = await forsured('conversation_participants')
        .select('user_id')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .maybeSingle();

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation',
        });
      }

      // Fetch conversation with nested participants including user details
      const { data, error } = await forsured('conversations')
        .select(
          `
          *,
          conversation_participants (
            id,
            user_id,
            role,
            joined_at,
            left_at,
            users:user_id (
              id,
              name,
              email,
              display_name
            )
          )
        `
        )
        .eq('id', input.conversationId)
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Conversation not found',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Create a new conversation.
   * Generates an inbound email address, inserts the conversation record,
   * and adds the creator as owner plus all specified participants.
   */
  create: protectedProcedure
    .input(
      z.object({
        taskId: z.string().uuid(),
        organizationId: z.string().uuid(),
        type: z.enum(['private_broker', 'cross_party']),
        participantUserIds: z.array(z.string().uuid()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Generate unique inbound email address
      const inboundEmailAddress = `conv-${nanoid(12)}@${INBOUND_EMAIL_DOMAIN}`;

      // Insert conversation record
      const { data: conversation, error: conversationError } = await forsured('conversations')
        .insert({
          task_id: input.taskId,
          organization_id: input.organizationId,
          type: input.type,
          status: 'active',
          created_by_user_id: ctx.userId,
          inbound_email_address: inboundEmailAddress,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (conversationError || !conversation) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create conversation',
          cause: conversationError,
        });
      }

      // Build participant records: creator as owner + provided participant IDs as members
      const now = new Date().toISOString();
      const participantRecords = [
        {
          conversation_id: conversation.id,
          user_id: ctx.userId,
          role: 'owner',
          joined_at: now,
        },
        ...input.participantUserIds
          .filter((uid) => uid !== ctx.userId) // Avoid duplicate if creator is also in the list
          .map((uid) => ({
            conversation_id: conversation.id,
            user_id: uid,
            role: 'member',
            joined_at: now,
          })),
      ];

      const { error: participantError } = await forsured('conversation_participants')
        .insert(participantRecords);

      if (participantError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add participants to conversation',
          cause: participantError,
        });
      }

      return conversation;
    }),

  /**
   * Add a participant to an existing conversation.
   * Verifies the caller is a participant first.
   * If the user was previously removed (left_at set), re-adds them by clearing left_at.
   * If the user is already active, throws CONFLICT.
   */
  addParticipant: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        userId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify caller is an active participant
      const { data: callerParticipant } = await forsured('conversation_participants')
        .select('user_id')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .maybeSingle();

      if (!callerParticipant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation',
        });
      }

      // Check if user already exists as a participant
      const { data: existingParticipant } = await forsured('conversation_participants')
        .select('id, left_at')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', input.userId)
        .maybeSingle();

      if (existingParticipant) {
        if (existingParticipant.left_at) {
          // Re-add by clearing left_at
          const { error } = await forsured('conversation_participants')
            .update({ left_at: null, joined_at: new Date().toISOString() })
            .eq('id', existingParticipant.id);

          if (error) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to re-add participant',
              cause: error,
            });
          }

          return { success: true };
        }

        // Already an active participant
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'User is already an active participant in this conversation',
        });
      }

      // Insert new participant
      const { error } = await forsured('conversation_participants')
        .insert({
          conversation_id: input.conversationId,
          user_id: input.userId,
          role: 'member',
          joined_at: new Date().toISOString(),
        });

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to add participant',
          cause: error,
        });
      }

      return { success: true };
    }),

  /**
   * Archive a conversation.
   * Only the creator (created_by_user_id) can archive it.
   */
  archive: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update status to archived, but only if the caller is the creator
      const { data, error } = await forsured('conversations')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.conversationId)
        .eq('created_by_user_id', ctx.userId)
        .select()
        .single();

      if (error || !data) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to archive this conversation. Only the creator can archive it.',
          cause: error,
        });
      }

      return data;
    }),

  /**
   * Send a message in a conversation.
   * Encrypts the content using FieldEncryptionService before storing.
   * Verifies the caller is an active participant.
   */
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify caller is an active participant (left_at IS NULL)
      const { data: participant } = await forsured('conversation_participants')
        .select('user_id')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .maybeSingle();

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation',
        });
      }

      // Encrypt message content
      const encryption = getEncryptionService();
      const encryptedContent = await encryption.encrypt(input.content, 'message_content');

      // Insert message record
      const { data: message, error } = await forsured('conversation_messages')
        .insert({
          conversation_id: input.conversationId,
          sender_user_id: ctx.userId,
          encrypted_content: encryptedContent as unknown as Record<string, unknown>,
          source: 'app',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error || !message) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to send message',
          cause: error,
        });
      }

      return message;
    }),

  /**
   * Get messages for a conversation with keyset pagination.
   * Decrypts each message's encrypted_content before returning.
   * Verifies the caller is an active participant.
   */
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify caller is an active participant (left_at IS NULL)
      const { data: participant } = await forsured('conversation_participants')
        .select('user_id')
        .eq('conversation_id', input.conversationId)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .maybeSingle();

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation',
        });
      }

      // If cursor provided, get the cursor message's created_at for keyset pagination
      let cursorCreatedAt: string | null = null;
      if (input.cursor) {
        const { data: cursorMessage } = await forsured('conversation_messages')
          .select('created_at')
          .eq('id', input.cursor)
          .single();

        if (cursorMessage) {
          cursorCreatedAt = cursorMessage.created_at;
        }
      }

      // Build query for messages with nested sender user and attachments
      let query = forsured('conversation_messages')
        .select(
          `
          *,
          sender:sender_user_id (
            id,
            name,
            email,
            display_name
          ),
          conversation_attachments (
            id,
            original_filename,
            mime_type,
            file_size_bytes,
            promoted_to_document_id
          )
        `
        )
        .eq('conversation_id', input.conversationId)
        .order('created_at', { ascending: true })
        .limit(input.limit);

      // Apply cursor filter for keyset pagination
      if (cursorCreatedAt) {
        query = query.gt('created_at', cursorCreatedAt);
      }

      const { data: messages, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch messages',
          cause: error,
        });
      }

      if (!messages || messages.length === 0) {
        return [];
      }

      // Decrypt each message's encrypted_content
      const encryption = getEncryptionService();
      const decryptedMessages = await Promise.all(
        messages.map(async (msg) => {
          let content: string;
          try {
            content = await encryption.decrypt(msg.encrypted_content as unknown as EncryptedField);
          } catch {
            content = '[Unable to decrypt message]';
          }

          // Return message with decrypted content, removing encrypted_content
          const { encrypted_content: _removed, ...rest } = msg;
          return { ...rest, content };
        })
      );

      return decryptedMessages;
    }),

  /**
   * Get a signed URL for downloading a conversation attachment.
   * Verifies the caller is an active participant in the attachment's conversation.
   */
  getAttachmentUrl: protectedProcedure
    .input(
      z.object({
        attachmentId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get the attachment record
      const { data: attachment, error: attachmentError } = await forsured('conversation_attachments')
        .select('*')
        .eq('id', input.attachmentId)
        .maybeSingle();

      if (attachmentError || !attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attachment not found',
          cause: attachmentError,
        });
      }

      // Verify caller is an active participant of the attachment's conversation
      const { data: participant } = await forsured('conversation_participants')
        .select('user_id')
        .eq('conversation_id', attachment.conversation_id)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .maybeSingle();

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation',
        });
      }

      // Generate a signed URL (1 hour)
      if (!supabaseServiceRole) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Storage service not available',
        });
      }

      const { data: signedUrlData, error: signedUrlError } = await supabaseServiceRole.storage
        .from('conversation-attachments')
        .createSignedUrl(attachment.storage_path, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate signed URL',
          cause: signedUrlError,
        });
      }

      return {
        url: signedUrlData.signedUrl,
        filename: attachment.original_filename,
        mimeType: attachment.mime_type,
      };
    }),

  /**
   * Promote a conversation attachment to a task document.
   * Downloads the file from conversation-attachments, uploads it to task-documents,
   * and creates a task document record via the canonical pipeline.
   */
  promoteAttachment: protectedProcedure
    .input(
      z.object({
        attachmentId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the attachment with its parent conversation (need task_id, organization_id)
      const { data: attachment, error: attachmentError } = await forsured('conversation_attachments')
        .select(
          `
          *,
          conversation:conversation_id (
            task_id,
            organization_id
          )
        `
        )
        .eq('id', input.attachmentId)
        .maybeSingle();

      if (attachmentError || !attachment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attachment not found',
          cause: attachmentError,
        });
      }

      // Throw CONFLICT if already promoted
      if (attachment.promoted_to_document_id) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Attachment has already been promoted to a document',
        });
      }

      // Verify caller is an active participant
      const { data: participant } = await forsured('conversation_participants')
        .select('user_id')
        .eq('conversation_id', attachment.conversation_id)
        .eq('user_id', ctx.userId)
        .is('left_at', null)
        .maybeSingle();

      if (!participant) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not a participant in this conversation',
        });
      }

      if (!supabaseServiceRole) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Storage service not available',
        });
      }

      // Download the file from conversation-attachments bucket
      const { data: fileData, error: downloadError } = await supabaseServiceRole.storage
        .from('conversation-attachments')
        .download(attachment.storage_path);

      if (downloadError || !fileData) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to download attachment file',
          cause: downloadError,
        });
      }

      // Extract conversation details (joined relation)
      const conversation = attachment.conversation as unknown as {
        task_id: string;
        organization_id: string;
      };

      // Upload to task-documents storage bucket
      const taskDocStoragePath = `${conversation.organization_id}/${conversation.task_id}/${attachment.original_filename}`;
      const { error: uploadError } = await supabaseServiceRole.storage
        .from('task-documents')
        .upload(taskDocStoragePath, fileData, {
          contentType: attachment.mime_type,
          upsert: false,
        });

      if (uploadError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to upload file to task documents storage',
          cause: uploadError,
        });
      }

      // Get the public URL for the uploaded document
      const { data: publicUrlData } = supabaseServiceRole.storage
        .from('task-documents')
        .getPublicUrl(taskDocStoragePath);

      // Create task document via the canonical pipeline
      const document = await uploadTaskDocument(
        {
          task_id: conversation.task_id,
          organization_id: conversation.organization_id,
          document_url: publicUrlData.publicUrl,
          document_name: attachment.original_filename,
          mime_type: attachment.mime_type,
          file_size_bytes: attachment.file_size_bytes,
        },
        ctx.userId
      );

      // Update the attachment record with the promoted document ID
      const { error: updateError } = await forsured('conversation_attachments')
        .update({ promoted_to_document_id: document.id })
        .eq('id', input.attachmentId);

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update attachment with promoted document ID',
          cause: updateError,
        });
      }

      return document;
    }),
});
