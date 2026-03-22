/**
 * Analytics REST API
 * Dashboard analytics endpoints for engagement, visibility, and search metrics
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi('AnalyticsErrorResponse')

const daysQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional().default(30),
})

const timelineQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional().default(30),
  granularity: z.enum(['day', 'week']).optional().default('day'),
  eventTypes: z
    .string()
    .transform((val) => val.split(','))
    .optional(),
})

const visitorsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional().default(30),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

const keywordsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).optional().default(30),
  limit: z.coerce.number().int().positive().max(50).optional().default(20),
})

// Response schemas
const metricWithSparklineSchema = z.object({
  total: z.number(),
  previous: z.number(),
  sparkline: z.array(z.number()),
})

const summaryResponseSchema = z
  .object({
    profileViews: metricWithSparklineSchema,
    searchAppearances: metricWithSparklineSchema,
    jobViews: metricWithSparklineSchema,
    applications: metricWithSparklineSchema,
    totalEngagement: metricWithSparklineSchema,
    liveViewers: z.number(),
  })
  .openapi('AnalyticsSummaryResponse')

const engagementTimelineResponseSchema = z
  .object({
    timeline: z.array(
      z.object({
        date: z.string(),
        profileViews: z.number(),
        jobViews: z.number(),
        applications: z.number(),
        searches: z.number(),
        total: z.number(),
      })
    ),
  })
  .openapi('EngagementTimelineResponse')

const visitorSchema = z.object({
  viewerId: z.string().uuid().nullable(),
  viewerName: z.string().nullable(),
  viewerAvatar: z.string().nullable(),
  viewerHeadline: z.string().nullable(),
  viewedAt: z.string(),
  roleType: z.string().nullable(),
  industryName: z.string().nullable(),
})

const visitorsResponseSchema = z
  .object({
    visitors: z.array(visitorSchema),
    total: z.number(),
    byIndustry: z.array(z.object({ industry: z.string(), count: z.number() })),
    byRoleType: z.array(z.object({ roleType: z.string(), count: z.number() })),
  })
  .openapi('AnalyticsVisitorsResponse')

const visibilityTimelineResponseSchema = z
  .object({
    timeline: z.array(
      z.object({
        date: z.string(),
        searchResults: z.number(),
        recommendations: z.number(),
        feedAppearances: z.number(),
        clicks: z.number(),
        ctr: z.number(),
      })
    ),
  })
  .openapi('VisibilityTimelineResponse')

const searchKeywordsResponseSchema = z
  .object({
    keywords: z.array(
      z.object({
        query: z.string(),
        impressions: z.number(),
        clicks: z.number(),
        ctr: z.number(),
        avgPosition: z.number(),
      })
    ),
  })
  .openapi('SearchKeywordsResponse')

const searchTimelineResponseSchema = z
  .object({
    timeline: z.array(
      z.object({
        date: z.string(),
        impressions: z.number(),
        clicks: z.number(),
        ctr: z.number(),
      })
    ),
  })
  .openapi('SearchTimelineResponse')

const trackImpressionSchema = z.object({
  userId: z.string().uuid(),
  impressionType: z.enum(['search_result', 'recommendation', 'feed_appearance']),
  searchQuery: z.string().optional(),
  searchFilters: z.record(z.unknown()).optional(),
  position: z.number().int().optional(),
})

// ============================================================================
// Helper: build date range
// ============================================================================

function getDateRange(days: number) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const prevStartDate = new Date()
  prevStartDate.setDate(prevStartDate.getDate() - days * 2)
  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    prevStartDate: prevStartDate.toISOString(),
    prevEndDate: startDate.toISOString(),
  }
}

// ============================================================================
// Helper: build sparkline from daily data
// ============================================================================

function buildSparkline(
  rows: Array<{ date: string; count: number }>,
  days: number
): number[] {
  const map = new Map<string, number>()
  for (const row of rows) {
    map.set(row.date, row.count)
  }

  const sparkline: number[] = []
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    sparkline.push(map.get(key ?? '') || 0)
  }
  return sparkline
}

// ============================================================================
// GET /v1/analytics/summary
// ============================================================================

const getSummaryRoute = createRoute({
  method: 'get',
  path: '/summary',
  tags: ['Analytics'],
  summary: 'Get analytics summary',
  description: 'Get key metrics with sparkline data for the analytics overview',
  request: { query: daysQuerySchema },
  responses: {
    200: {
      description: 'Analytics summary',
      content: { 'application/json': { schema: summaryResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getSummaryRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { days } = c.req.valid('query')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { startDate, prevStartDate, prevEndDate } = getDateRange(days)

  // Get current period rollups
  const { data: currentRollups } = await supabase
    .schema('engagement')
    .from('daily_engagement_rollups')
    .select('date, event_type, count')
    .eq('user_id', user.id)
    .gte('date', startDate.split('T')[0])
    .order('date', { ascending: true })

  // Get previous period rollups for delta
  const { data: prevRollups } = await supabase
    .schema('engagement')
    .from('daily_engagement_rollups')
    .select('event_type, count')
    .eq('user_id', user.id)
    .gte('date', prevStartDate.split('T')[0])
    .lt('date', prevEndDate.split('T')[0])

  // Get current visibility rollups
  const { data: visibilityRollups } = await supabase
    .schema('engagement')
    .from('daily_visibility_rollups')
    .select('date, impression_type, impressions')
    .eq('user_id', user.id)
    .gte('date', startDate.split('T')[0])
    .order('date', { ascending: true })

  // Get previous visibility rollups
  const { data: prevVisibility } = await supabase
    .schema('engagement')
    .from('daily_visibility_rollups')
    .select('impression_type, impressions')
    .eq('user_id', user.id)
    .gte('date', prevStartDate.split('T')[0])
    .lt('date', prevEndDate.split('T')[0])

  // Live viewers: profile views in last 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { count: liveViewers } = await supabase
    .schema('engagement')
    .from('profile_views')
    .select('*', { count: 'exact', head: true })
    .eq('viewed_user_id', user.id)
    .gte('viewed_at', fiveMinAgo)

  // Aggregate metrics
  const rows = currentRollups || []
  const prevRows = prevRollups || []
  const visRows = visibilityRollups || []
  const prevVisRows = prevVisibility || []

  const sumByType = (data: typeof rows, type: string) =>
    data.filter((r) => r.event_type === type).reduce((sum, r) => sum + (r.count || 0), 0)

  const sparklineByType = (data: typeof rows, type: string) =>
    buildSparkline(
      data.filter((r) => r.event_type === type).map((r) => ({ date: r.date, count: r.count || 0 })),
      days
    )

  const sumVisibility = (data: typeof visRows) =>
    data.reduce((sum, r) => sum + (r.impressions || 0), 0)

  const profileViewsCurrent = sumByType(rows, 'profile_view') + sumByType(rows, 'profile_view_direct')
  const profileViewsPrev = sumByType(prevRows, 'profile_view') + sumByType(prevRows, 'profile_view_direct')
  const jobViewsCurrent = sumByType(rows, 'job_view')
  const jobViewsPrev = sumByType(prevRows, 'job_view')
  const appsCurrent = sumByType(rows, 'application_start') + sumByType(rows, 'application_complete')
  const appsPrev = sumByType(prevRows, 'application_start') + sumByType(prevRows, 'application_complete')
  const searchAppCurrent = sumVisibility(visRows)
  const searchAppPrev = sumVisibility(prevVisRows)

  const totalCurrent = profileViewsCurrent + jobViewsCurrent + appsCurrent + searchAppCurrent
  const totalPrev = profileViewsPrev + jobViewsPrev + appsPrev + searchAppPrev

  // Build sparklines for profile views (combine both types)
  const pvSparkline = buildSparkline(
    rows
      .filter((r) => r.event_type === 'profile_view' || r.event_type === 'profile_view_direct')
      .reduce(
        (acc, r) => {
          const existing = acc.find((a) => a.date === r.date)
          if (existing) existing.count += r.count || 0
          else acc.push({ date: r.date, count: r.count || 0 })
          return acc
        },
        [] as Array<{ date: string; count: number }>
      ),
    days
  )

  return c.json({
    profileViews: { total: profileViewsCurrent, previous: profileViewsPrev, sparkline: pvSparkline },
    searchAppearances: {
      total: searchAppCurrent,
      previous: searchAppPrev,
      sparkline: buildSparkline(
        visRows.map((r) => ({ date: r.date, count: r.impressions || 0 })),
        days
      ),
    },
    jobViews: {
      total: jobViewsCurrent,
      previous: jobViewsPrev,
      sparkline: sparklineByType(rows, 'job_view'),
    },
    applications: {
      total: appsCurrent,
      previous: appsPrev,
      sparkline: buildSparkline(
        rows
          .filter((r) => r.event_type === 'application_start' || r.event_type === 'application_complete')
          .reduce(
            (acc, r) => {
              const existing = acc.find((a) => a.date === r.date)
              if (existing) existing.count += r.count || 0
              else acc.push({ date: r.date, count: r.count || 0 })
              return acc
            },
            [] as Array<{ date: string; count: number }>
          ),
        days
      ),
    },
    totalEngagement: {
      total: totalCurrent,
      previous: totalPrev,
      sparkline: pvSparkline.map((v, i) => v + (sparklineByType(rows, 'job_view')[i] || 0)),
    },
    liveViewers: liveViewers || 0,
  })
})

// ============================================================================
// GET /v1/analytics/engagement/timeline
// ============================================================================

const getEngagementTimelineRoute = createRoute({
  method: 'get',
  path: '/engagement/timeline',
  tags: ['Analytics'],
  summary: 'Get engagement timeline',
  description: 'Get time-series engagement data for charts',
  request: { query: timelineQuerySchema },
  responses: {
    200: {
      description: 'Engagement timeline',
      content: { 'application/json': { schema: engagementTimelineResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getEngagementTimelineRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { days, granularity } = c.req.valid('query')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: rollups } = await supabase
    .schema('engagement')
    .from('daily_engagement_rollups')
    .select('date, event_type, count')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  // Build timeline map
  const dateMap = new Map<
    string,
    { profileViews: number; jobViews: number; applications: number; searches: number; total: number }
  >()

  for (const row of rollups || []) {
    let dateKey = row.date
    if (granularity === 'week') {
      // Round to Monday of that week
      const d = new Date(row.date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      d.setDate(diff)
      dateKey = d.toISOString().split('T')[0] ?? dateKey
    }

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { profileViews: 0, jobViews: 0, applications: 0, searches: 0, total: 0 })
    }
    const entry = dateMap.get(dateKey) ?? { profileViews: 0, jobViews: 0, applications: 0, searches: 0, total: 0 }
    const count = row.count || 0

    switch (row.event_type) {
      case 'profile_view':
      case 'profile_view_direct':
        entry.profileViews += count
        break
      case 'job_view':
        entry.jobViews += count
        break
      case 'application_start':
      case 'application_complete':
        entry.applications += count
        break
      case 'search':
      case 'filter_change':
        entry.searches += count
        break
    }
    entry.total += count
  }

  const timeline = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }))

  return c.json({ timeline })
})

// ============================================================================
// GET /v1/analytics/engagement/visitors
// ============================================================================

const getVisitorsRoute = createRoute({
  method: 'get',
  path: '/engagement/visitors',
  tags: ['Analytics'],
  summary: 'Get profile visitors',
  description: 'Get recent profile visitors with demographics breakdown',
  request: { query: visitorsQuerySchema },
  responses: {
    200: {
      description: 'Visitors data',
      content: { 'application/json': { schema: visitorsResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getVisitorsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { days, limit, offset } = c.req.valid('query')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Get visitors with viewer info
  const { data: views, count: total } = await supabase
    .schema('engagement')
    .from('profile_views')
    .select(
      `
      viewer_user_id,
      viewed_at,
      viewer_role_type,
      viewer:core.users!profile_views_viewer_user_id_fkey(
        id, display_name, avatar_url, headline
      ),
      industry:core.industries!profile_views_viewer_industry_id_fkey(
        name
      )
    `,
      { count: 'exact' }
    )
    .eq('viewed_user_id', user.id)
    .gte('viewed_at', startDate.toISOString())
    .order('viewed_at', { ascending: false })
    .range(offset, offset + limit - 1)

  interface ProfileViewRow {
    viewer_user_id: string
    viewer?: { display_name?: string; avatar_url?: string; headline?: string }
    industry?: { name?: string }
    viewed_at: string
    viewer_role_type?: string
  }
  const visitors = ((views || []) as ProfileViewRow[]).map((v) => ({
    viewerId: v.viewer_user_id,
    viewerName: v.viewer?.display_name ?? null,
    viewerAvatar: v.viewer?.avatar_url ?? null,
    viewerHeadline: v.viewer?.headline ?? null,
    viewedAt: v.viewed_at,
    roleType: v.viewer_role_type,
    industryName: v.industry?.name ?? null,
  }))

  // Industry breakdown
  const { data: industryData } = await supabase
    .schema('engagement')
    .from('profile_views')
    .select(
      `
      viewer_industry_id,
      industry:core.industries!profile_views_viewer_industry_id_fkey(name)
    `
    )
    .eq('viewed_user_id', user.id)
    .gte('viewed_at', startDate.toISOString())
    .not('viewer_industry_id', 'is', null)

  const industryMap = new Map<string, number>()
  for (const row of industryData || []) {
    const name = (row as { industry?: { name?: string } }).industry?.name || 'Unknown'
    industryMap.set(name, (industryMap.get(name) || 0) + 1)
  }
  const byIndustry = Array.from(industryMap.entries())
    .map(([industry, count]) => ({ industry, count }))
    .sort((a, b) => b.count - a.count)

  // Role type breakdown
  const { data: roleData } = await supabase
    .schema('engagement')
    .from('profile_views')
    .select('viewer_role_type')
    .eq('viewed_user_id', user.id)
    .gte('viewed_at', startDate.toISOString())
    .not('viewer_role_type', 'is', null)

  const roleMap = new Map<string, number>()
  for (const row of roleData || []) {
    const rt = row.viewer_role_type || 'Unknown'
    roleMap.set(rt, (roleMap.get(rt) || 0) + 1)
  }
  const byRoleType = Array.from(roleMap.entries())
    .map(([roleType, count]) => ({ roleType, count }))
    .sort((a, b) => b.count - a.count)

  return c.json({ visitors, total: total || 0, byIndustry, byRoleType })
})

// ============================================================================
// GET /v1/analytics/visibility/timeline
// ============================================================================

const getVisibilityTimelineRoute = createRoute({
  method: 'get',
  path: '/visibility/timeline',
  tags: ['Analytics'],
  summary: 'Get visibility timeline',
  description: 'Get search impression timeline data',
  request: { query: timelineQuerySchema },
  responses: {
    200: {
      description: 'Visibility timeline',
      content: { 'application/json': { schema: visibilityTimelineResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getVisibilityTimelineRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { days, granularity } = c.req.valid('query')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: rollups } = await supabase
    .schema('engagement')
    .from('daily_visibility_rollups')
    .select('date, impression_type, impressions, clicks')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  const dateMap = new Map<
    string,
    { searchResults: number; recommendations: number; feedAppearances: number; clicks: number }
  >()

  for (const row of rollups || []) {
    let dateKey = row.date
    if (granularity === 'week') {
      const d = new Date(row.date)
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      d.setDate(diff)
      dateKey = d.toISOString().split('T')[0] ?? dateKey
    }

    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { searchResults: 0, recommendations: 0, feedAppearances: 0, clicks: 0 })
    }
    const entry = dateMap.get(dateKey) ?? { searchResults: 0, recommendations: 0, feedAppearances: 0, clicks: 0 }

    switch (row.impression_type) {
      case 'search_result':
        entry.searchResults += row.impressions || 0
        break
      case 'recommendation':
        entry.recommendations += row.impressions || 0
        break
      case 'feed_appearance':
        entry.feedAppearances += row.impressions || 0
        break
    }
    entry.clicks += row.clicks || 0
  }

  const timeline = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => {
      const totalImpressions = data.searchResults + data.recommendations + data.feedAppearances
      return {
        date,
        ...data,
        ctr: totalImpressions > 0 ? Math.round((data.clicks / totalImpressions) * 10000) / 100 : 0,
      }
    })

  return c.json({ timeline })
})

// ============================================================================
// GET /v1/analytics/search/keywords
// ============================================================================

const getSearchKeywordsRoute = createRoute({
  method: 'get',
  path: '/search/keywords',
  tags: ['Analytics'],
  summary: 'Get top search keywords',
  description: 'Get search queries that led to profile appearances',
  request: { query: keywordsQuerySchema },
  responses: {
    200: {
      description: 'Search keywords',
      content: { 'application/json': { schema: searchKeywordsResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getSearchKeywordsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { days, limit } = c.req.valid('query')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  // Query raw search_impressions for keyword aggregation
  const { data: impressions } = await supabase
    .schema('engagement')
    .from('search_impressions')
    .select('search_query, clicked, position')
    .eq('user_id', user.id)
    .gte('occurred_at', startDate.toISOString())
    .not('search_query', 'is', null)

  // Aggregate by query
  const queryMap = new Map<
    string,
    { impressions: number; clicks: number; totalPosition: number }
  >()

  for (const row of impressions || []) {
    if (!row.search_query) continue
    const query = row.search_query.toLowerCase().trim()
    if (!queryMap.has(query)) {
      queryMap.set(query, { impressions: 0, clicks: 0, totalPosition: 0 })
    }
    const entry = queryMap.get(query) ?? { impressions: 0, clicks: 0, totalPosition: 0 }
    entry.impressions++
    if (row.clicked) entry.clicks++
    if (row.position != null) entry.totalPosition += row.position
  }

  const keywords = Array.from(queryMap.entries())
    .map(([query, data]) => ({
      query,
      impressions: data.impressions,
      clicks: data.clicks,
      ctr: data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0,
      avgPosition:
        data.impressions > 0 ? Math.round((data.totalPosition / data.impressions) * 10) / 10 : 0,
    }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)

  return c.json({ keywords })
})

// ============================================================================
// GET /v1/analytics/search/timeline
// ============================================================================

const getSearchTimelineRoute = createRoute({
  method: 'get',
  path: '/search/timeline',
  tags: ['Analytics'],
  summary: 'Get search appearance timeline',
  description: 'Get daily search impressions and clicks over time',
  request: { query: daysQuerySchema },
  responses: {
    200: {
      description: 'Search timeline',
      content: { 'application/json': { schema: searchTimelineResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getSearchTimelineRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { days } = c.req.valid('query')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data: rollups } = await supabase
    .schema('engagement')
    .from('daily_visibility_rollups')
    .select('date, impressions, clicks')
    .eq('user_id', user.id)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })

  // Merge all impression types per date
  const dateMap = new Map<string, { impressions: number; clicks: number }>()
  for (const row of rollups || []) {
    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, { impressions: 0, clicks: 0 })
    }
    const entry = dateMap.get(row.date) ?? { impressions: 0, clicks: 0 }
    entry.impressions += row.impressions || 0
    entry.clicks += row.clicks || 0
  }

  const timeline = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      ...data,
      ctr: data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0,
    }))

  return c.json({ timeline })
})

// ============================================================================
// POST /v1/analytics/impressions/track
// ============================================================================

const trackImpressionRoute = createRoute({
  method: 'post',
  path: '/impressions/track',
  tags: ['Analytics'],
  summary: 'Track search impression',
  description: 'Track when a user profile appears in search results (server-side)',
  request: {
    body: {
      content: { 'application/json': { schema: trackImpressionSchema } },
    },
  },
  responses: {
    201: {
      description: 'Impression tracked',
      content: {
        'application/json': { schema: z.object({ success: z.boolean() }).openapi('TrackImpressionResponse') },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(trackImpressionRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { userId, impressionType, searchQuery, searchFilters, position } = c.req.valid('json')

  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  const { error } = await supabase
    .schema('engagement')
    .from('search_impressions')
    .insert({
      user_id: userId,
      searcher_id: user.id,
      impression_type: impressionType,
      search_query: searchQuery,
      search_filters: searchFilters,
      position,
      occurred_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error tracking impression:', error)
    return c.json({ error: 'Failed to track impression', message: error.message }, 500)
  }

  return c.json({ success: true }, 201)
})

export default app
