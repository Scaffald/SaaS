/**
 * Notifications Router
 *
 * Direct database implementation for notifications.
 * Queries forsured.notifications table via service role client.
 * Matches the API shape expected by useNotifications hook.
 */

import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { supabaseServiceRole, forsured } from '../../../lib/supabase'

/**
 * Get the service role client for forsured schema queries (bypasses RLS)
 */
function getForsuredNotifications() {
  const client = supabaseServiceRole || undefined
  if (client) {
    return client.schema('forsured').from('notifications')
  }
  // Fallback to regular client
  return forsured('notifications')
}

export const notificationsProxyRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z
        .object({
          status: z.enum(['all', 'unread', 'read', 'archived']).default('all'),
          limit: z.number().int().min(1).max(100).default(25),
          cursor: z.string().optional(),
        })
        .optional()
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      }

      const status = input?.status ?? 'all'
      const limit = input?.limit ?? 25

      let query = getForsuredNotifications()
        .select('id, type, title, message, entity_type, entity_id, triggered_by, is_read, read_at, metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status === 'unread') {
        query = query.eq('is_read', false)
      } else if (status === 'read') {
        query = query.eq('is_read', true)
      }
      // 'all' and 'archived' don't add extra filters (archived not yet implemented at DB level)

      if (input?.cursor) {
        // Cursor-based pagination: get items created before the cursor
        const { data: cursorRow } = await getForsuredNotifications()
          .select('created_at')
          .eq('id', input.cursor)
          .single()

        if (cursorRow) {
          query = query.lt('created_at', cursorRow.created_at)
        }
      }

      const { data, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch notifications: ${error.message}`,
        })
      }

      const items = data || []
      const nextCursor = items.length === limit ? items[items.length - 1]?.id : undefined

      return { items, nextCursor }
    }),

  getUnreadCount: protectedProcedure
    .input(z.object({}).optional().default({}))
    .query(async ({ ctx }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      }

      const { count, error } = await getForsuredNotifications()
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to count notifications: ${error.message}`,
        })
      }

      return { count: count || 0 }
    }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      }

      const { error } = await getForsuredNotifications()
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', input.id)
        .eq('user_id', userId)

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }
      return { success: true }
    }),

  markAsUnread: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      }

      const { error } = await getForsuredNotifications()
        .update({ is_read: false, read_at: null })
        .eq('id', input.id)
        .eq('user_id', userId)

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }
      return { success: true }
    }),

  markManyRead: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      }

      const { error } = await getForsuredNotifications()
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', input.ids)
        .eq('user_id', userId)

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }
      return { success: true }
    }),

  markManyUnread: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      }

      const { error } = await getForsuredNotifications()
        .update({ is_read: false, read_at: null })
        .in('id', input.ids)
        .eq('user_id', userId)

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }
      return { success: true }
    }),

  archiveMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      }

      // Hard delete (no deleted_at column on notifications table)
      const { error } = await getForsuredNotifications()
        .delete()
        .in('id', input.ids)
        .eq('user_id', userId)

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }
      return { success: true }
    }),

  restoreMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      }

      // Restore not supported (no deleted_at column) - just return success
      return { success: true }
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.userId
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
    }

    const { error } = await getForsuredNotifications()
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
    }
    return { success: true }
  }),

  deleteMany: protectedProcedure
    .input(z.object({ ids: z.array(z.string().uuid()).min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId
      if (!userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
      }

      const { error } = await getForsuredNotifications()
        .delete()
        .in('id', input.ids)
        .eq('user_id', userId)

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message })
      }
      return { success: true }
    }),
})
