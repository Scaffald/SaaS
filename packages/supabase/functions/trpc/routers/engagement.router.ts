import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, t } from '../middleware.ts'

// =========================================================
// Zod Schemas
// =========================================================

const trackEventSchema = z.object({
  eventType: z.enum([
    'profile.viewed',
    'connection.requested',
    'connection.accepted',
    'connection.declined',
    'user.followed',
    'user.unfollowed',
    'job.viewed',
    'application.started',
    'application.submitted',
    'skill.searched',
    'occupation.searched',
    'review.viewed',
    'review.submitted',
  ]),
  targetType: z.enum(['user', 'job', 'organization']).nullable().optional(),
  targetId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
})

const getRecentActivitySchema = z
  .object({
    limit: z.number().min(1).max(100).default(50),
    eventTypes: z.array(z.string()).optional(),
  })
  .optional()
  .default({})

const getEngagementMetricsSchema = z
  .object({
    days: z.number().min(1).max(365).default(30),
  })
  .optional()
  .default({})

// =========================================================
// Engagement Router
// =========================================================

export const engagementRouter = t.router({
  /**
   * Track a generic engagement event
   */
  trackEvent: protectedProcedure.input(trackEventSchema).mutation(async ({ ctx, input }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const { error } = await ctx.supabase
      .schema('engagement')
      .from('activity_events')
      .insert({
        user_id: ctx.user.id,
        event_type: input.eventType,
        target_type: input.targetType || null,
        target_id: input.targetId || null,
        event_metadata: input.metadata || {},
        occurred_at: new Date().toISOString(),
      })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to track event: ${error.message}`,
      })
    }

    return { success: true }
  }),

  /**
   * Get user's recent engagement activity
   */
  getRecentActivity: protectedProcedure
    .input(getRecentActivitySchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      let query = ctx.supabase
        .schema('engagement')
        .from('activity_events')
        .select('*')
        .eq('user_id', ctx.user.id)
        .order('occurred_at', { ascending: false })
        .limit(input.limit)

      if (input.eventTypes && input.eventTypes.length > 0) {
        query = query.in('event_type', input.eventTypes)
      }

      const { data, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch recent activity: ${error.message}`,
        })
      }

      return data || []
    }),

  /**
   * Get aggregated engagement metrics
   */
  getEngagementMetrics: protectedProcedure
    .input(getEngagementMetricsSchema)
    .query(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const daysAgo = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString()

      // Get event counts by type
      const { data: eventsByType } = await ctx.supabase
        .schema('engagement')
        .from('activity_events')
        .select('event_type')
        .eq('user_id', ctx.user.id)
        .gte('occurred_at', daysAgo)

      // Count events by type
      const eventCounts: Record<string, number> = {}
      if (eventsByType) {
        for (const event of eventsByType) {
          eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1
        }
      }

      // Get total event count
      const { count: totalEvents } = await ctx.supabase
        .schema('engagement')
        .from('activity_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', ctx.user.id)
        .gte('occurred_at', daysAgo)

      // Get unique target counts (jobs viewed, users viewed, etc.)
      const { data: uniqueTargets } = await ctx.supabase
        .schema('engagement')
        .from('activity_events')
        .select('target_type, target_id')
        .eq('user_id', ctx.user.id)
        .gte('occurred_at', daysAgo)
        .not('target_id', 'is', null)

      const targetCounts: Record<string, Set<string>> = {}
      if (uniqueTargets) {
        for (const target of uniqueTargets) {
          if (target.target_type && target.target_id) {
            if (!targetCounts[target.target_type]) {
              targetCounts[target.target_type] = new Set()
            }
            targetCounts[target.target_type].add(target.target_id)
          }
        }
      }

      return {
        totalEvents: totalEvents || 0,
        eventCountsByType: eventCounts,
        uniqueTargets: {
          user: targetCounts.user?.size || 0,
          job: targetCounts.job?.size || 0,
          organization: targetCounts.organization?.size || 0,
        },
        periodDays: input.days,
      }
    }),
})
