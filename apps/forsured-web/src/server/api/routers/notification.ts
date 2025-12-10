/**
 * Notification Router
 * REQ-264: Task History Tracking - TASK-2: Due Date Change Notifications
 *
 * Implements notification management procedures for user alerts about
 * task changes, assignments, and due date updates.
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { forsured } from '../../../lib/supabase';

/**
 * Notification type enum for validation
 */
const NotificationTypeEnum = z.enum([
  'due_date_change',
  'task_assigned',
  'task_completed',
  'comment_added',
  'mention',
]);

/**
 * Entity type enum for validation
 */
const EntityTypeEnum = z.enum(['task', 'project', 'document', 'policy']);

/**
 * Notification Router
 *
 * Provides procedures for:
 * - Listing notifications for current user
 * - Marking notifications as read
 * - Getting unread count
 * - Dismissing notifications
 */
export const notificationRouter = createTRPCRouter({
  /**
   * List notifications for current user
   *
   * Returns paginated list of notifications with optional filters.
   */
  list: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
        unreadOnly: z.boolean().optional().default(false),
        entityType: EntityTypeEnum.optional(),
        type: NotificationTypeEnum.optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        cursor: z.string().uuid().optional(), // For pagination
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be authenticated',
        });
      }

      let query = forsured('notifications')
        .select(
          `
          id,
          type,
          title,
          message,
          entity_type,
          entity_id,
          triggered_by,
          is_read,
          read_at,
          metadata,
          created_at
        `
        )
        .eq('user_id', userId)
        .eq('organization_id', input.organizationId)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      // Apply filters
      if (input.unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (input.entityType) {
        query = query.eq('entity_type', input.entityType);
      }

      if (input.type) {
        query = query.eq('type', input.type);
      }

      // Cursor-based pagination
      if (input.cursor) {
        const cursorResult = await forsured('notifications')
          .select('created_at')
          .eq('id', input.cursor)
          .single();

        if (cursorResult.data) {
          query = query.lt('created_at', cursorResult.data.created_at);
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch notifications: ${error.message}`,
        });
      }

      // Determine next cursor
      const nextCursor = data && data.length === input.limit ? data[data.length - 1]?.id : undefined;

      return {
        notifications: data || [],
        nextCursor,
      };
    }),

  /**
   * Get unread notification count
   *
   * Returns the total number of unread notifications for the user.
   */
  getUnreadCount: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be authenticated',
        });
      }

      const { count, error } = await forsured('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('organization_id', input.organizationId)
        .eq('is_read', false);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to count notifications: ${error.message}`,
        });
      }

      return { count: count || 0 };
    }),

  /**
   * Mark notification as read
   *
   * Updates a single notification to mark it as read.
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be authenticated',
        });
      }

      const { data, error } = await forsured('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('user_id', userId) // Ensure user owns notification
        .select()
        .single();

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to mark notification as read: ${error.message}`,
        });
      }

      if (!data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Notification not found or not owned by user',
        });
      }

      return { success: true, notification: data };
    }),

  /**
   * Mark all notifications as read
   *
   * Updates all unread notifications for the user in an organization.
   */
  markAllAsRead: protectedProcedure
    .input(
      z.object({
        organizationId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be authenticated',
        });
      }

      const { error, count } = await forsured('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('organization_id', input.organizationId)
        .eq('is_read', false);

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to mark notifications as read: ${error.message}`,
        });
      }

      return { success: true, updatedCount: count || 0 };
    }),

  /**
   * Get notification by ID
   *
   * Returns a single notification with full details.
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User must be authenticated',
        });
      }

      const { data, error } = await forsured('notifications')
        .select(
          `
          id,
          type,
          title,
          message,
          entity_type,
          entity_id,
          triggered_by,
          is_read,
          read_at,
          metadata,
          created_at
        `
        )
        .eq('id', input.id)
        .eq('user_id', userId) // Ensure user owns notification
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Notification not found',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch notification: ${error.message}`,
        });
      }

      return { notification: data };
    }),
});
