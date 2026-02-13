/**
 * Profile Views REST API
 * Track and analyze profile views with deduplication
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()
app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
}).openapi('ErrorResponse')

// ============================================================================
// Routes
// ============================================================================

/**
 * POST /v1/profile-views/record
 * Record a profile view (with deduplication)
 */
const recordViewRoute = createRoute({
  method: 'post',
  path: '/record',
  tags: ['Profile Views'],
  summary: 'Record profile view',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            viewed_user_id: z.string().uuid(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'View recorded',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            skipped: z.boolean(),
            reason: z.enum(['own_profile', 'already_viewed_today', 'already_viewed_session', 'duplicate_prevented']).optional(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(recordViewRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { viewed_user_id } = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Don't record own profile views
  if (user.id === viewed_user_id) {
    return c.json({ success: false, skipped: true, reason: 'own_profile' })
  }

  // Check if already viewed today
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: existingView } = await supabase
    .schema('core')
    .from('profile_views')
    .select('id')
    .eq('viewer_id', user.id)
    .eq('viewed_user_id', viewed_user_id)
    .gte('viewed_at', today.toISOString())
    .limit(1)
    .single()

  if (existingView) {
    return c.json({ success: false, skipped: true, reason: 'already_viewed_today' })
  }

  // Record the view
  const { error } = await supabase
    .schema('core')
    .from('profile_views')
    .insert({
      viewer_id: user.id,
      viewed_user_id,
      viewed_at: new Date().toISOString(),
    })

  if (error) {
    return c.json({ error: 'Failed to record view', message: error.message }, 500)
  }

  return c.json({ success: true, skipped: false })
})

/**
 * GET /v1/profile-views
 * Get who viewed current user's profile
 */
const getProfileViewsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Profile Views'],
  summary: 'Get profile views',
  request: {
    query: z.object({
      limit: z.coerce.number().optional(),
      offset: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Profile views',
      content: {
        'application/json': {
          schema: z.object({
            views: z.array(z.object({
              id: z.string().uuid(),
              viewed_at: z.string(),
              viewer: z.object({
                id: z.string().uuid(),
                display_name: z.string().nullable(),
                username: z.string().nullable(),
                avatar_url: z.string().nullable(),
                headline: z.string().nullable(),
                industry_id: z.string().uuid().nullable(),
              }).nullable(),
              viewer_role_type: z.string().nullable(),
              viewer_industry: z.object({
                id: z.string().uuid(),
                name: z.string(),
              }).nullable(),
            })),
            total: z.number(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getProfileViewsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { limit = 50, offset = 0 } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('profile_views')
    .select(`
      id,
      viewed_at,
      viewer:user_profiles!profile_views_viewer_id_fkey(
        id,
        display_name,
        username,
        avatar_url,
        headline,
        industry_id
      )
    `)
    .eq('viewed_user_id', user.id)
    .order('viewed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return c.json({ error: 'Failed to fetch views', message: error.message }, 500)
  }

  const { count } = await supabase
    .schema('core')
    .from('profile_views')
    .select('*', { count: 'exact', head: true })
    .eq('viewed_user_id', user.id)

  return c.json({
    views: (data || []).map((view: any) => ({
      id: view.id,
      viewed_at: view.viewed_at,
      viewer: view.viewer,
      viewer_role_type: null,
      viewer_industry: null,
    })),
    total: count || 0,
  })
})

/**
 * GET /v1/profile-views/analytics
 * Get aggregated view statistics
 */
const getViewAnalyticsRoute = createRoute({
  method: 'get',
  path: '/analytics',
  tags: ['Profile Views'],
  summary: 'Get view analytics',
  responses: {
    200: {
      description: 'View analytics',
      content: {
        'application/json': {
          schema: z.object({
            views30d: z.number(),
            viewsTotal: z.number(),
            lastViewAt: z.string().nullable(),
            trend: z.number(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getViewAnalyticsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get total views
  const { count: totalCount } = await supabase
    .schema('core')
    .from('profile_views')
    .select('*', { count: 'exact', head: true })
    .eq('viewed_user_id', user.id)

  // Get views in last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { count: views30d } = await supabase
    .schema('core')
    .from('profile_views')
    .select('*', { count: 'exact', head: true })
    .eq('viewed_user_id', user.id)
    .gte('viewed_at', thirtyDaysAgo.toISOString())

  // Get last view
  const { data: lastView } = await supabase
    .schema('core')
    .from('profile_views')
    .select('viewed_at')
    .eq('viewed_user_id', user.id)
    .order('viewed_at', { ascending: false })
    .limit(1)
    .single()

  return c.json({
    views30d: views30d || 0,
    viewsTotal: totalCount || 0,
    lastViewAt: lastView?.viewed_at || null,
    trend: 0, // Could calculate trend from historical data
  })
})

export default app
