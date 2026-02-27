import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { Context } from '../context.ts'
import { protectedProcedure, t } from '../middleware.ts'

// =========================================================
// Zod Schemas
// =========================================================

const viewedUserIdSchema = z.object({
  viewedUserId: z.string().uuid(),
})

// =========================================================
// Helper Functions
// =========================================================

/**
 * Get user's primary role type (worker/employer/customer)
 */
async function getUserRoleType(
  supabase: Context['supabase'],
  userId: string
): Promise<string | null> {
  const { data: preferences } = await supabase
    .schema('core')
    .from('preferences')
    .select('user_types')
    .eq('user_id', userId)
    .maybeSingle()

  if (
    !preferences?.user_types ||
    !Array.isArray(preferences.user_types) ||
    preferences.user_types.length === 0
  ) {
    return null
  }

  // Return first user type (primary)
  return preferences.user_types[0] || null
}

/**
 * Get user's industry ID
 */
async function getUserIndustryId(
  supabase: Context['supabase'],
  userId: string
): Promise<string | null> {
  const { data: user } = await supabase
    .schema('core')
    .from('users')
    .select('industry_id')
    .eq('id', userId)
    .maybeSingle()

  return user?.industry_id || null
}

/**
 * Update connection analytics with profile view
 */
async function updateProfileViewAnalytics(
  supabase: Context['supabase'],
  viewedUserId: string,
  isRecentView: boolean
) {
  const { data: current } = await supabase
    .schema('engagement')
    .from('connection_analytics')
    .select('*')
    .eq('user_id', viewedUserId)
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
    user_id: viewedUserId,
    connections_count: currentCounts.connections_count || 0,
    pending_sent_count: currentCounts.pending_sent_count || 0,
    pending_received_count: currentCounts.pending_received_count || 0,
    followers_count: currentCounts.followers_count || 0,
    following_count: currentCounts.following_count || 0,
    profile_views_30d: isRecentView
      ? (currentCounts.profile_views_30d || 0) + 1
      : currentCounts.profile_views_30d || 0,
    profile_views_total: (currentCounts.profile_views_total || 0) + 1,
    last_profile_view_at: new Date().toISOString(),
  }

  await supabase.schema('engagement').from('connection_analytics').upsert(updated, {
    onConflict: 'user_id',
  })
}

/**
 * Create an activity event
 */
async function createActivityEvent(
  supabase: Context['supabase'],
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
// Profile Views Router
// =========================================================

export const profileViewsRouter = t.router({
  /**
   * Record a profile view (with deduplication)
   */
  recordView: protectedProcedure.input(viewedUserIdSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const viewerId = ctx.user.id
    const viewedId = input.viewedUserId

    // Prevent viewing own profile as a view
    if (viewerId === viewedId) {
      return { success: true, skipped: true, reason: 'own_profile' }
    }

    // Generate session ID (for deduplication - use a simple approach)
    // In production, this would come from session storage or request headers
    const sessionId = `session_${viewerId}_${Date.now()}`

    // Get viewer's role type and industry
    const viewerRoleType = await getUserRoleType(ctx.supabase, viewerId)
    const viewerIndustryId = await getUserIndustryId(ctx.supabase, viewerId)

    // Check if view already exists today (deduplication)
    const today = new Date().toISOString().split('T')[0]
    const { data: existingView } = await ctx.supabase
      .schema('engagement')
      .from('profile_views')
      .select('id')
      .eq('viewer_user_id', viewerId)
      .eq('viewed_user_id', viewedId)
      .gte('viewed_at', `${today}T00:00:00Z`)
      .lt('viewed_at', `${today}T23:59:59Z`)
      .maybeSingle()

    // If view exists today, skip (deduplication)
    if (existingView) {
      return { success: true, skipped: true, reason: 'already_viewed_today' }
    }

    // Check if view exists in last 24 hours with same session (additional deduplication)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentView } = await ctx.supabase
      .schema('engagement')
      .from('profile_views')
      .select('id')
      .eq('viewer_user_id', viewerId)
      .eq('viewed_user_id', viewedId)
      .eq('session_id', sessionId)
      .gte('viewed_at', yesterday)
      .maybeSingle()

    if (recentView) {
      return { success: true, skipped: true, reason: 'already_viewed_session' }
    }

    // Record profile view
    const { error: viewError } = await ctx.supabase
      .schema('engagement')
      .from('profile_views')
      .insert({
        viewer_user_id: viewerId,
        viewed_user_id: viewedId,
        viewer_industry_id: viewerIndustryId,
        viewer_role_type: viewerRoleType,
        session_id: sessionId,
        viewed_at: new Date().toISOString(),
        metadata: {},
      })

    if (viewError) {
      // If unique constraint violation, it's already recorded (deduplication working)
      if (viewError.code === '23505') {
        return { success: true, skipped: true, reason: 'duplicate_prevented' }
      }

      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to record profile view: ${viewError.message}`,
      })
    }

    // Create activity event
    await createActivityEvent(ctx.supabase, viewerId, 'profile.viewed', 'user', viewedId, {
      target_user_id: viewedId,
    })

    // Update analytics (check if view is within 30 days)
    const isRecentView = true // Always true for new views
    await updateProfileViewAnalytics(ctx.supabase, viewedId, isRecentView)

    return { success: true, skipped: false }
  }),

  /**
   * Get who viewed current user's profile
   */
  getProfileViews: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
        .optional()
        .default({ limit: 50, offset: 0 })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // First, get profile views with basic data
      const { data: views, error: viewsError } = await ctx.supabase
        .schema('engagement')
        .from('profile_views')
        .select('id, viewed_at, viewer_user_id, viewer_role_type, viewer_industry_id')
        .eq('viewed_user_id', ctx.user.id)
        .order('viewed_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1)

      if (viewsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch profile views: ${viewsError.message}`,
        })
      }

      // Get total count
      const { count } = await ctx.supabase
        .schema('engagement')
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewed_user_id', ctx.user.id)

      if (!views || views.length === 0) {
        return {
          views: [],
          total: count || 0,
        }
      }

      // Extract unique viewer user IDs and industry IDs
      const viewerUserIds = [
        ...new Set(
          views.map((v: { viewer_user_id: string | null }) => v.viewer_user_id).filter(Boolean)
        ),
      ]
      const industryIds = [
        ...new Set(
          views
            .map((v: { viewer_industry_id: string | null }) => v.viewer_industry_id)
            .filter(Boolean)
        ),
      ]

      // Fetch viewer user data
      const usersMap = new Map()
      if (viewerUserIds.length > 0) {
        const { data: users, error: usersError } = await ctx.supabase
          .schema('core')
          .from('users')
          .select(
            `
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
          `
          )
          .in('id', viewerUserIds)

        if (usersError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch viewer users: ${usersError.message}`,
          })
        }

        // Create users map
        users?.forEach((user: { id: string; [key: string]: unknown }) => {
          usersMap.set(user.id, user)
        })
      }

      // Fetch industry data
      const industriesMap = new Map()
      if (industryIds.length > 0) {
        const { data: industries, error: industriesError } = await ctx.supabase
          .schema('core')
          .from('industries')
          .select('id, name')
          .in('id', industryIds)

        if (industriesError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to fetch industries: ${industriesError.message}`,
          })
        }

        // Create industries map
        industries?.forEach((industry: { id: string; name: string }) => {
          industriesMap.set(industry.id, industry)
        })
      }

      // Join the data
      return {
        views: views.map(
          (view: {
            id: string
            viewed_at: string
            viewer_user_id: string | null
            viewer_role_type: string
            viewer_industry_id: string | null
            [key: string]: unknown
          }) => ({
            id: view.id,
            viewed_at: view.viewed_at,
            viewer: view.viewer_user_id ? usersMap.get(view.viewer_user_id) || null : null,
            viewer_role_type: view.viewer_role_type,
            viewer_industry: view.viewer_industry_id
              ? industriesMap.get(view.viewer_industry_id) || null
              : null,
          })
        ),
        total: count || 0,
      }
    }),

  /**
   * Get aggregated view statistics
   */
  getViewAnalytics: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    // Get analytics from connection_analytics table
    const { data: analytics } = await ctx.supabase
      .schema('engagement')
      .from('connection_analytics')
      .select('profile_views_30d, profile_views_total, last_profile_view_at')
      .eq('user_id', ctx.user.id)
      .maybeSingle()

    // Get 30-day count manually for verification
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { count: count30d } = await ctx.supabase
      .schema('engagement')
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('viewed_user_id', ctx.user.id)
      .gte('viewed_at', thirtyDaysAgo)

    // Get previous 30-day period for trend calculation
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const { count: countPrev30d } = await ctx.supabase
      .schema('engagement')
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('viewed_user_id', ctx.user.id)
      .gte('viewed_at', sixtyDaysAgo)
      .lt('viewed_at', thirtyDaysAgo)

    const views30d = count30d || 0
    const viewsPrev30d = countPrev30d || 0
    const trend = viewsPrev30d > 0 ? ((views30d - viewsPrev30d) / viewsPrev30d) * 100 : 0

    return {
      views30d: analytics?.profile_views_30d || views30d,
      viewsTotal: analytics?.profile_views_total || 0,
      lastViewAt: analytics?.last_profile_view_at || null,
      trend: Math.round(trend * 10) / 10, // Round to 1 decimal place
    }
  }),
})
