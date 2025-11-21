import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, t } from '../middleware.ts'

// =========================================================
// Zod Schemas
// =========================================================

const targetUserIdSchema = z.object({
  targetUserId: z.string().uuid(),
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
    followers_count?: number
    following_count?: number
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
    connections_count: currentCounts.connections_count || 0,
    pending_sent_count: currentCounts.pending_sent_count || 0,
    pending_received_count: currentCounts.pending_received_count || 0,
    followers_count: Math.max(0, (currentCounts.followers_count || 0) + (updates.followers_count || 0)),
    following_count: Math.max(0, (currentCounts.following_count || 0) + (updates.following_count || 0)),
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
// Follows Router
// =========================================================

export const followsRouter = t.router({
  /**
   * Follow a user (one-way, no approval needed)
   */
  followUser: protectedProcedure
    .input(targetUserIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const followerId = ctx.user.id
      const followeeId = input.targetUserId

      // Prevent following self
      if (followerId === followeeId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot follow yourself',
        })
      }

      // Check if already following
      const { data: existing } = await ctx.supabase
        .schema('core')
        .from('follows')
        .select('id')
        .eq('follower_type', 'user')
        .eq('follower_id', followerId)
        .eq('followee_type', 'user')
        .eq('followee_id', followeeId)
        .maybeSingle()

      if (existing) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Already following this user',
        })
      }

      // Create follow relationship
      const { data: follow, error: followError } = await ctx.supabase
        .schema('core')
        .from('follows')
        .insert({
          follower_type: 'user',
          follower_id: followerId,
          followee_type: 'user',
          followee_id: followeeId,
        })
        .select('id, created_at')
        .single()

      if (followError || !follow) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: followError ? `Failed to follow user: ${followError.message}` : 'Failed to follow user',
        })
      }

      // Create activity event
      await createActivityEvent(ctx.supabase, followerId, 'user.followed', 'user', followeeId, {
        follow_id: follow.id,
        target_user_id: followeeId,
      })

      // Update analytics for both users
      await updateConnectionAnalytics(ctx.supabase, followerId, {
        following_count: 1,
      })
      await updateConnectionAnalytics(ctx.supabase, followeeId, {
        followers_count: 1,
      })

      // No notification sent (as per requirements)

      return { success: true, follow }
    }),

  /**
   * Unfollow a user
   */
  unfollowUser: protectedProcedure
    .input(targetUserIdSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const followerId = ctx.user.id
      const followeeId = input.targetUserId

      // Verify follow relationship exists
      const { data: existing } = await ctx.supabase
        .schema('core')
        .from('follows')
        .select('id')
        .eq('follower_type', 'user')
        .eq('follower_id', followerId)
        .eq('followee_type', 'user')
        .eq('followee_id', followeeId)
        .maybeSingle()

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Not following this user',
        })
      }

      // Delete follow relationship
      const { error: deleteError } = await ctx.supabase
        .schema('core')
        .from('follows')
        .delete()
        .eq('follower_type', 'user')
        .eq('follower_id', followerId)
        .eq('followee_type', 'user')
        .eq('followee_id', followeeId)

      if (deleteError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to unfollow user: ${deleteError.message}`,
        })
      }

      // Create activity event
      await createActivityEvent(ctx.supabase, followerId, 'user.unfollowed', 'user', followeeId, {
        target_user_id: followeeId,
      })

      // Update analytics for both users
      await updateConnectionAnalytics(ctx.supabase, followerId, {
        following_count: -1,
      })
      await updateConnectionAnalytics(ctx.supabase, followeeId, {
        followers_count: -1,
      })

      return { success: true }
    }),

  /**
   * Get current user's followers (users following this user)
   */
  getFollowers: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { data, error } = await ctx.supabase
      .schema('core')
      .from('follows')
      .select(
        `
        id,
        created_at,
        follower:follower_id(
          id,
          display_name,
          username,
          avatar_url,
          headline,
          industry_id,
          industries:industry_id(
            id,
            name
          )
        )
      `
      )
      .eq('followee_type', 'user')
      .eq('followee_id', ctx.user.id)
      .eq('follower_type', 'user')
      .order('created_at', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch followers: ${error.message}`,
      })
    }

    // Transform to include follower user info
    return (data || []).map((follow) => ({
      id: follow.id,
      created_at: follow.created_at,
      user: follow.follower,
    }))
  }),

  /**
   * Get users that current user is following
   */
  getFollowing: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { data, error } = await ctx.supabase
      .schema('core')
      .from('follows')
      .select(
        `
        id,
        created_at,
        followee:followee_id(
          id,
          display_name,
          username,
          avatar_url,
          headline,
          industry_id,
          industries:industry_id(
            id,
            name
          )
        )
      `
      )
      .eq('follower_type', 'user')
      .eq('follower_id', ctx.user.id)
      .eq('followee_type', 'user')
      .order('created_at', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch following: ${error.message}`,
      })
    }

    // Transform to include followee user info
    return (data || []).map((follow) => ({
      id: follow.id,
      created_at: follow.created_at,
      user: follow.followee,
    }))
  }),
})

