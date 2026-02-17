/**
 * Conversation Router
 * Task 4: tRPC Router - Conversation CRUD
 *
 * Implements conversation management procedures for the messaging feature.
 * Provides CRUD operations for conversations with participant management.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { nanoid } from 'nanoid';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

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
});
