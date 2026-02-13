import { http, HttpResponse } from 'msw'

const BASE_URL = 'https://api.scaffald.com'

// Track viewed users per session for deduplication
const viewedInSession = new Map<string, Set<string>>()
const viewedToday = new Map<string, Set<string>>()
const rapidViewPrevention = new Map<string, number>()

export const profileViewsHandlers = [
  // POST /v1/profile-views/record - Record view
  http.post(`${BASE_URL}/v1/profile-views/record`, async ({ request }) => {
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')
    const body = (await request.json()) as any
    const viewedUserId = body.viewed_user_id

    // Handle special error cases
    if (viewedUserId === 'user_unauthorized') {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (viewedUserId === 'user_nonexistent') {
      return HttpResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (viewedUserId === 'user_deactivated') {
      return HttpResponse.json({ error: 'User deactivated' }, { status: 404 })
    }

    if (viewedUserId === 'user_rate_limit') {
      return HttpResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    if (viewedUserId === 'user_network_error') {
      return HttpResponse.json({ error: 'Network error' }, { status: 500 })
    }

    // Validation
    if (!viewedUserId || viewedUserId === '') {
      return HttpResponse.json({ error: 'viewed_user_id is required' }, { status: 400 })
    }

    if (viewedUserId.includes('@') || viewedUserId.includes('invalid')) {
      return HttpResponse.json({ error: 'Invalid userId format' }, { status: 400 })
    }

    // Deduplication logic - check special user IDs first
    if (viewedUserId === 'user_self') {
      return HttpResponse.json({
        success: true,
        skipped: true,
        reason: 'own_profile',
      })
    }

    if (viewedUserId === 'user_session') {
      return HttpResponse.json({
        success: true,
        skipped: true,
        reason: 'already_viewed_session',
      })
    }

    if (viewedUserId === 'user_rapid') {
      return HttpResponse.json({
        success: true,
        skipped: true,
        reason: 'duplicate_prevented',
      })
    }

    // Check session deduplication
    const sessionKey = apiKey || 'default'
    if (!viewedInSession.has(sessionKey)) {
      viewedInSession.set(sessionKey, new Set())
    }
    const sessionViews = viewedInSession.get(sessionKey) ?? new Set()

    // Initialize today views
    if (!viewedToday.has(sessionKey)) {
      viewedToday.set(sessionKey, new Set())
    }
    const todayViews = viewedToday.get(sessionKey) ?? new Set()

    // Check today deduplication for user_duplicate (before session check)
    if (viewedUserId === 'user_duplicate' && todayViews.has(viewedUserId)) {
      return HttpResponse.json({
        success: true,
        skipped: true,
        reason: 'already_viewed_today',
      })
    }

    // Special user that simulates being viewed in the same session
    if (viewedUserId === 'user_same_session') {
      return HttpResponse.json({
        success: true,
        skipped: true,
        reason: 'already_viewed_session',
      })
    }

    if (viewedUserId !== 'user_duplicate' && sessionViews.has(viewedUserId)) {
      return HttpResponse.json({
        success: true,
        skipped: true,
        reason: 'already_viewed_session',
      })
    }

    // Check rapid duplicate prevention for normal users (after other checks)
    const now = Date.now()
    const lastView = rapidViewPrevention.get(viewedUserId)
    if (viewedUserId !== 'user_duplicate' && lastView && now - lastView < 1000) {
      return HttpResponse.json({
        success: true,
        skipped: true,
        reason: 'duplicate_prevented',
      })
    }

    // Record the view
    sessionViews.add(viewedUserId)
    todayViews.add(viewedUserId)
    rapidViewPrevention.set(viewedUserId, now)

    return HttpResponse.json({
      success: true,
      skipped: false,
    })
  }),

  // GET /v1/profile-views - Get profile views
  http.get(`${BASE_URL}/v1/profile-views`, ({ request }) => {
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    // Validation
    if (limit < 0) {
      return HttpResponse.json({ error: 'Limit must be non-negative' }, { status: 400 })
    }

    if (offset < 0) {
      return HttpResponse.json({ error: 'Offset must be non-negative' }, { status: 400 })
    }

    // Handle empty views for specific API keys
    if (apiKey === 'test_key_empty') {
      return HttpResponse.json({
        views: [],
        total: 0,
      })
    }

    // Generate test data
    const allViews = Array.from({ length: 15 }, (_, i) => {
      const isAnonymous = i >= 15
      const roleTypes = ['job_seeker', 'recruiter', 'hiring_manager']

      return {
        id: `view_${i + 1}`,
        viewed_at: new Date(Date.now() - i * 3600000).toISOString(), // 1 hour apart
        viewer: isAnonymous
          ? null
          : {
              id: `user_viewer_${i + 1}`,
              display_name: 'Jane Smith',
              username: 'janesmith',
              avatar_url: `https://example.com/avatar${i + 1}.jpg`,
              headline: 'Senior Engineer at Tech Corp',
              industry_id: i % 2 === 0 ? 'industry_tech' : null,
              industries:
                i % 2 === 0
                  ? {
                      id: 'industry_tech',
                      name: 'Technology',
                    }
                  : null,
            },
        viewer_role_type: roleTypes[i % 3],
        viewer_industry:
          i % 3 === 0
            ? {
                id: 'industry_tech',
                name: 'Technology',
              }
            : null,
      }
    })

    // Return unpaginated for default requests
    if (limit === 50 && offset === 0) {
      return HttpResponse.json({
        views: allViews,
        total: allViews.length,
      })
    }

    // Apply pagination
    const cappedLimit = Math.min(limit, 100) // Cap at 100
    const paginated = allViews.slice(offset, offset + cappedLimit)

    return HttpResponse.json({
      views: paginated,
      total: allViews.length,
    })
  }),

  // GET /v1/profile-views/analytics - Get analytics
  http.get(`${BASE_URL}/v1/profile-views/analytics`, ({ request }) => {
    const apiKey = request.headers.get('Authorization')?.replace('Bearer ', '')

    // Handle server error
    if (apiKey === 'test_key_server_error') {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Handle new profiles with zero views
    if (apiKey === 'test_key_new') {
      return HttpResponse.json({
        views30d: 0,
        viewsTotal: 0,
        lastViewAt: null,
        trend: 0,
      })
    }

    // Handle declining trend
    if (apiKey === 'test_key_declining') {
      return HttpResponse.json({
        views30d: 25,
        viewsTotal: 150,
        lastViewAt: new Date(Date.now() - 86400000).toISOString(),
        trend: -15.5,
      })
    }

    // Handle stable trend
    if (apiKey === 'test_key_stable') {
      return HttpResponse.json({
        views30d: 50,
        viewsTotal: 200,
        lastViewAt: new Date(Date.now() - 3600000).toISOString(),
        trend: 0,
      })
    }

    // Default analytics
    return HttpResponse.json({
      views30d: 47,
      viewsTotal: 234,
      lastViewAt: new Date(Date.now() - 7200000).toISOString(),
      trend: 12.5,
    })
  }),
]
