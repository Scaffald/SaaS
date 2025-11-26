// @ts-nocheck
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { insertNotification } from '../../_shared/notifications/utils.ts'
import { protectedProcedure, t } from '../middleware.ts'

// =========================================================
// Zod Schemas
// =========================================================

const sendRequestSchema = z.object({
  targetUserId: z.string().uuid(),
})

const connectionIdSchema = z.object({
  connectionId: z.string().uuid(),
})

// =========================================================
// Helper Functions
// =========================================================

/**
 * Upsert connection analytics for a user, incrementing or decrementing counters
 */
async function updateConnectionAnalytics(
  supabase: any,
  userId: string,
  updates: {
    connections_count?: number
    pending_sent_count?: number
    pending_received_count?: number
  }
) {
  // Get current analytics or initialize
  const { data: current } = await supabase
    .schema('engagement')
    .from('connection_analytics')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  const currentCounts = current || {
    connections_count: 0,
    pending_sent_count: 0,
    pending_received_count: 0,
    followers_count: 0,
    following_count: 0,
    profile_views_30d: 0,
    profile_views_total: 0,
  }

  const updated = {
    user_id: userId,
    connections_count: Math.max(0, (currentCounts.connections_count || 0) + (updates.connections_count || 0)),
    pending_sent_count: Math.max(0, (currentCounts.pending_sent_count || 0) + (updates.pending_sent_count || 0)),
    pending_received_count: Math.max(0, (currentCounts.pending_received_count || 0) + (updates.pending_received_count || 0)),
    followers_count: currentCounts.followers_count || 0,
    following_count: currentCounts.following_count || 0,
    profile_views_30d: currentCounts.profile_views_30d || 0,
    profile_views_total: currentCounts.profile_views_total || 0,
    last_profile_view_at: currentCounts.last_profile_view_at || null,
  }

  await supabase.schema('engagement').from('connection_analytics').upsert(updated, {
    onConflict: 'user_id',
  })
}

/**
 * Create an activity event
 */
async function createActivityEvent(
  supabase: any,
  userId: string,
  eventType: string,
  targetType: string | null,
  targetId: string | null,
  metadata: Record<string, unknown> = {}
) {
  await supabase.schema('engagement').from('activity_events').insert({
    user_id: userId,
    event_type: eventType,
    target_type: targetType,
    target_id: targetId,
    event_metadata: metadata,
    occurred_at: new Date().toISOString(),
  })
}

// =========================================================
// Connections Router
// =========================================================

export const connectionsRouter = t.router({
  /**
   * Send a connection request to another user
   */
  sendRequest: protectedProcedure
    .input(sendRequestSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const requesterId = ctx.user.id
      const addresseeId = input.targetUserId

      // Prevent connecting to self
      if (requesterId === addresseeId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot send connection request to yourself',
        })
      }

      // Check for existing connection (any status) - check both directions
      const { data: existing1 } = await ctx.supabase
        .schema('core')
        .from('connections')
        .select('id, status')
        .eq('requester_user_id', requesterId)
        .eq('addressee_user_id', addresseeId)
        .maybeSingle()

      const { data: existing2 } = await ctx.supabase
        .schema('core')
        .from('connections')
        .select('id, status')
        .eq('requester_user_id', addresseeId)
        .eq('addressee_user_id', requesterId)
        .maybeSingle()

      if (existing1 || existing2) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Connection already exists or is pending',
        })
      }

      // Create connection request
      const { data: connection, error: connError } = await ctx.supabase
        .schema('core')
        .from('connections')
        .insert({
          requester_user_id: requesterId,
          addressee_user_id: addresseeId,
          status: 'pending',
        })
        .select()
        .single()

      if (connError || !connection) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: connError ? `Failed to create connection request: ${connError.message}` : 'Failed to create connection request',
        })
      }

      // Get requester display name for notification
      const { data: requester } = await ctx.supabase
        .schema('core')
        .from('users')
        .select('display_name, username')
        .eq('id', requesterId)
        .single()

      const requesterName = requester?.display_name || requester?.username || 'Someone'

      // Create activity event
      await createActivityEvent(ctx.supabase, requesterId, 'connection.requested', 'user', addresseeId, {
        connection_id: connection.id,
        target_user_id: addresseeId,
      })

      // Update analytics
      await updateConnectionAnalytics(ctx.supabase, requesterId, {
        pending_sent_count: 1,
      })
      await updateConnectionAnalytics(ctx.supabase, addresseeId, {
        pending_received_count: 1,
      })

      // Create notification for addressee
      await insertNotification(ctx.supabase, {
        user_id: addresseeId,
        type: 'connection.request',
        severity: 'info',
        title: 'New Connection Request',
        message: `${requesterName} wants to connect with you`,
        preview: `Connection request from ${requesterName}`,
        cta_label: 'View Request',
        cta_url: `/connections`,
        metadata: {
          connection_id: connection.id,
          requester_user_id: requesterId,
        },
      })

      return connection
    }),

  /**
   * Accept a pending connection request
   */
  acceptRequest: protectedProcedure
    .input(connectionIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Get connection and verify
      const { data: connection, error: connError } = await ctx.supabase
        .schema('core')
        .from('connections')
        .select('*')
        .eq('id', input.connectionId)
        .single()

      if (connError || !connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        })
      }

      // Verify user is the addressee
      if (connection.addressee_user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only accept connection requests addressed to you',
        })
      }

      // Verify status is pending
      if (connection.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Connection is already ${connection.status}`,
        })
      }

      // Update connection status
      const { data: updated, error: updateError } = await ctx.supabase
        .schema('core')
        .from('connections')
        .update({
          status: 'accepted',
          decided_at: new Date().toISOString(),
        })
        .eq('id', input.connectionId)
        .select()
        .single()

      if (updateError || !updated) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: updateError ? `Failed to accept connection: ${updateError.message}` : 'Failed to accept connection',
        })
      }

      // Create activity event for both users
      await createActivityEvent(ctx.supabase, ctx.user.id, 'connection.accepted', 'user', connection.requester_user_id, {
        connection_id: updated.id,
        target_user_id: connection.requester_user_id,
      })
      await createActivityEvent(ctx.supabase, connection.requester_user_id, 'connection.accepted', 'user', ctx.user.id, {
        connection_id: updated.id,
        target_user_id: ctx.user.id,
      })

      // Update analytics for both users
      await updateConnectionAnalytics(ctx.supabase, ctx.user.id, {
        pending_received_count: -1,
        connections_count: 1,
      })
      await updateConnectionAnalytics(ctx.supabase, connection.requester_user_id, {
        pending_sent_count: -1,
        connections_count: 1,
      })

      // Get addressee display name for notification
      const { data: addressee } = await ctx.supabase
        .schema('core')
        .from('users')
        .select('display_name, username')
        .eq('id', ctx.user.id)
        .single()

      const addresseeName = addressee?.display_name || addressee?.username || 'Someone'

      // Create notification for requester
      await insertNotification(ctx.supabase, {
        user_id: connection.requester_user_id,
        type: 'connection.accepted',
        severity: 'info',
        title: 'Connection Accepted',
        message: `${addresseeName} accepted your connection request`,
        preview: `Connection accepted by ${addresseeName}`,
        cta_label: 'View Connection',
        cta_url: `/connections`,
        metadata: {
          connection_id: updated.id,
          addressee_user_id: ctx.user.id,
        },
      })

      return updated
    }),

  /**
   * Decline a pending connection request
   */
  declineRequest: protectedProcedure
    .input(connectionIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Get connection and verify
      const { data: connection, error: connError } = await ctx.supabase
        .schema('core')
        .from('connections')
        .select('*')
        .eq('id', input.connectionId)
        .single()

      if (connError || !connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        })
      }

      // Verify user is the addressee
      if (connection.addressee_user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only decline connection requests addressed to you',
        })
      }

      // Verify status is pending
      if (connection.status !== 'pending') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Connection is already ${connection.status}`,
        })
      }

      // Update connection status
      const { error: updateError } = await ctx.supabase
        .schema('core')
        .from('connections')
        .update({
          status: 'declined',
          decided_at: new Date().toISOString(),
        })
        .eq('id', input.connectionId)

      if (updateError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to decline connection: ${updateError.message}`,
        })
      }

      // Create activity event
      await createActivityEvent(ctx.supabase, ctx.user.id, 'connection.declined', 'user', connection.requester_user_id, {
        connection_id: input.connectionId,
        target_user_id: connection.requester_user_id,
      })

      // Update analytics for both users
      await updateConnectionAnalytics(ctx.supabase, ctx.user.id, {
        pending_received_count: -1,
      })
      await updateConnectionAnalytics(ctx.supabase, connection.requester_user_id, {
        pending_sent_count: -1,
      })

      return { success: true }
    }),

  /**
   * Remove an accepted connection
   */
  removeConnection: protectedProcedure
    .input(connectionIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Get connection and verify
      const { data: connection, error: connError } = await ctx.supabase
        .schema('core')
        .from('connections')
        .select('*')
        .eq('id', input.connectionId)
        .single()

      if (connError || !connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Connection not found',
        })
      }

      // Verify user is either party
      if (connection.requester_user_id !== ctx.user.id && connection.addressee_user_id !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only remove connections you are part of',
        })
      }

      // Verify status is accepted
      if (connection.status !== 'accepted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Can only remove accepted connections (current status: ${connection.status})`,
        })
      }

      // Delete connection
      const { error: deleteError } = await ctx.supabase.schema('core').from('connections').delete().eq('id', input.connectionId)

      if (deleteError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to remove connection: ${deleteError.message}`,
        })
      }

      // Update analytics for both users
      await updateConnectionAnalytics(ctx.supabase, connection.requester_user_id, {
        connections_count: -1,
      })
      await updateConnectionAnalytics(ctx.supabase, connection.addressee_user_id, {
        connections_count: -1,
      })

      return { success: true }
    }),

  /**
   * Get user's accepted connections
   */
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { data, error } = await ctx.supabase
      .schema('core')
      .from('connections')
      .select(
        `
        id,
        status,
        requester_user_id,
        addressee_user_id,
        created_at,
        decided_at,
        requester:requester_user_id(
          id,
          display_name,
          username,
          avatar_url,
          headline
        ),
        addressee:addressee_user_id(
          id,
          display_name,
          username,
          avatar_url,
          headline
        )
      `
      )
      .eq('status', 'accepted')
      .or(`requester_user_id.eq.${ctx.user.id},addressee_user_id.eq.${ctx.user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch connections: ${error.message}`,
      })
    }

    // Transform to include the other user's info
    return (data || []).map((conn: { requester_user_id: string; addressee?: unknown; requester?: unknown; id: string; status: string; created_at: string; decided_at?: string | null; [key: string]: unknown }) => {
      const otherUser = conn.requester_user_id === ctx.user.id ? conn.addressee : conn.requester
      return {
        id: conn.id,
        status: conn.status,
        created_at: conn.created_at,
        decided_at: conn.decided_at,
        user: otherUser,
      }
    })
  }),

  /**
   * Get pending connection requests (sent and received)
   */
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    // Get sent requests
    const { data: sentData, error: sentError } = await ctx.supabase
      .schema('core')
      .from('connections')
      .select(
        `
        id,
        status,
        addressee_user_id,
        created_at,
        addressee:addressee_user_id(
          id,
          display_name,
          username,
          avatar_url,
          headline
        )
      `
      )
      .eq('requester_user_id', ctx.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (sentError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch sent requests: ${sentError.message}`,
      })
    }

    // Get received requests
    const { data: receivedData, error: receivedError } = await ctx.supabase
      .schema('core')
      .from('connections')
      .select(
        `
        id,
        status,
        requester_user_id,
        created_at,
        requester:requester_user_id(
          id,
          display_name,
          username,
          avatar_url,
          headline
        )
      `
      )
      .eq('addressee_user_id', ctx.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (receivedError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch received requests: ${receivedError.message}`,
      })
    }

    return {
      sent: (sentData || []).map((conn: { id: string; status: string; created_at: string; addressee?: unknown; [key: string]: unknown }) => ({
        id: conn.id,
        status: conn.status,
        created_at: conn.created_at,
        user: conn.addressee,
      })),
      received: (receivedData || []).map((conn: { id: string; status: string; created_at: string; requester?: unknown; [key: string]: unknown }) => ({
        id: conn.id,
        status: conn.status,
        created_at: conn.created_at,
        user: conn.requester,
      })),
    }
  }),
})

