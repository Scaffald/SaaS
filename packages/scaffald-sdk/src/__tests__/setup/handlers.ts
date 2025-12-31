import { http, HttpResponse, delay } from 'msw'

// SDK already includes the base URL, so we just match the path
const BASE_URL = 'http://localhost:54321'

/**
 * Mock API handlers for all SDK endpoints
 *
 * These handlers simulate the Scaffald API responses for testing.
 */
export const handlers = [
  // ===========================
  // Jobs Endpoints
  // ===========================

  http.get(`${BASE_URL}/v1/jobs`, async ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20', 10)
    const offset = parseInt(url.searchParams.get('offset') || '0', 10)

    await delay(10) // Simulate network delay

    return HttpResponse.json({
      data: [
        {
          id: 'job_1',
          title: 'Senior Software Engineer',
          organization_id: 'org_1',
          status: 'published',
          location: 'San Francisco, CA',
          employment_type: 'full_time',
          remote_option: 'hybrid',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'job_2',
          title: 'Frontend Developer',
          organization_id: 'org_1',
          status: 'published',
          location: 'Remote',
          employment_type: 'full_time',
          remote_option: 'remote',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        },
      ].slice(offset, offset + limit),
      pagination: {
        limit,
        offset,
        total: 2,
        has_more: false,
      },
    })
  }),

  http.get(`${BASE_URL}/v1/jobs/:id`, async ({ params }) => {
    await delay(10)

    if (params.id === 'not_found') {
      return HttpResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      data: {
        id: params.id,
        title: 'Senior Software Engineer',
        organization_id: 'org_1',
        status: 'published',
        location: 'San Francisco, CA',
        employment_type: 'full_time',
        remote_option: 'hybrid',
        description: 'We are looking for a senior software engineer...',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    })
  }),

  http.get(`${BASE_URL}/v1/jobs/:id/similar`, async ({ params }) => {
    await delay(10)

    return HttpResponse.json({
      data: [
        {
          id: 'job_3',
          title: 'Staff Software Engineer',
          organization_id: 'org_2',
          status: 'published',
          location: 'San Francisco, CA',
          employment_type: 'full_time',
          remote_option: 'hybrid',
          created_at: '2025-01-03T00:00:00Z',
          updated_at: '2025-01-03T00:00:00Z',
        },
      ],
    })
  }),

  http.get(`${BASE_URL}/v1/jobs/filter-options`, async () => {
    await delay(10)

    return HttpResponse.json({
      data: {
        employment_types: ['full_time', 'part_time', 'contract'],
        remote_options: ['on_site', 'hybrid', 'remote'],
        locations: ['San Francisco, CA', 'New York, NY', 'Remote'],
      },
    })
  }),

  // ===========================
  // API Keys Endpoints
  // ===========================

  http.get(`${BASE_URL}/v1/api-keys`, async ({ request }) => {
    await delay(10)

    // Check for auth header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return HttpResponse.json({
      data: [
        {
          id: 'key_1',
          organization_id: 'org_1',
          name: 'Production Key',
          key_prefix: 'sk_live_abc',
          scopes: ['read:jobs', 'write:jobs'],
          rate_limit_tier: 'pro',
          is_active: true,
          last_used_at: '2025-01-01T12:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          expires_at: null,
        },
        {
          id: 'key_2',
          organization_id: 'org_1',
          name: 'Test Key',
          key_prefix: 'sk_test_def',
          scopes: ['read:jobs'],
          rate_limit_tier: 'free',
          is_active: true,
          last_used_at: null,
          created_at: '2025-01-02T00:00:00Z',
          expires_at: null,
        },
      ],
    })
  }),

  http.post(`${BASE_URL}/v1/api-keys`, async ({ request }) => {
    await delay(10)

    const body = await request.json() as any

    // Validation
    if (!body.name || !body.scopes || body.scopes.length === 0) {
      return HttpResponse.json(
        {
          error: 'Validation failed',
          errors: {
            name: body.name ? undefined : 'Name is required',
            scopes: body.scopes?.length > 0 ? undefined : 'At least one scope is required',
          }
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      data: {
        id: 'key_new',
        organization_id: 'org_1',
        name: body.name,
        key: `sk_${body.environment || 'live'}_${'x'.repeat(32)}`,
        key_prefix: `sk_${body.environment || 'live'}_xxx`,
        scopes: body.scopes,
        rate_limit_tier: body.rate_limit_tier || 'free',
        is_active: true,
        last_used_at: null,
        created_at: new Date().toISOString(),
        expires_at: body.expires_at || null,
      },
      warning: 'This key will only be shown once. Save it securely!',
    }, {
      status: 201,
    })
  }),

  http.get(`${BASE_URL}/v1/api-keys/:id`, async ({ params }) => {
    await delay(10)

    if (params.id === 'not_found') {
      return HttpResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({
      data: {
        id: params.id,
        organization_id: 'org_1',
        name: 'Production Key',
        key_prefix: 'sk_live_abc',
        scopes: ['read:jobs', 'write:jobs'],
        rate_limit_tier: 'pro',
        is_active: true,
        last_used_at: '2025-01-01T12:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        expires_at: null,
      },
    })
  }),

  http.patch(`${BASE_URL}/v1/api-keys/:id`, async ({ request, params }) => {
    await delay(10)

    const body = await request.json() as any

    return HttpResponse.json({
      data: {
        id: params.id,
        organization_id: 'org_1',
        name: body.name || 'Updated Key',
        key_prefix: 'sk_live_abc',
        scopes: body.scopes || ['read:jobs'],
        rate_limit_tier: 'pro',
        is_active: body.is_active !== undefined ? body.is_active : true,
        last_used_at: '2025-01-01T12:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        expires_at: null,
      },
    })
  }),

  http.delete(`${BASE_URL}/v1/api-keys/:id`, async ({ params }) => {
    await delay(10)

    return HttpResponse.json({
      data: {
        id: params.id,
        name: 'Production Key',
        message: 'API key has been revoked successfully',
      },
    })
  }),

  http.get(`${BASE_URL}/v1/api-keys/:id/usage`, async ({ params, request }) => {
    await delay(10)

    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get('days') || '30', 10)

    return HttpResponse.json({
      data: {
        total_requests: 1500,
        success_requests: 1450,
        error_requests: 50,
        error_rate: '3.33',
        avg_response_time_ms: 125,
        period_days: days,
        usage: [
          {
            endpoint: '/v1/jobs',
            method: 'GET',
            status_code: 200,
            response_time_ms: 120,
            timestamp: '2025-01-01T12:00:00Z',
          },
          {
            endpoint: '/v1/api-keys',
            method: 'POST',
            status_code: 201,
            response_time_ms: 150,
            timestamp: '2025-01-01T13:00:00Z',
          },
        ],
      },
    })
  }),

  // ===========================
  // Error Simulation Endpoints
  // ===========================

  // Rate limit error
  http.get(`${BASE_URL}/v1/test/rate-limit`, () => {
    return HttpResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
          'Retry-After': '60',
        },
      }
    )
  }),

  // Server error (should retry)
  http.get(`${BASE_URL}/v1/test/server-error`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }),

  // Network timeout
  http.get(`${BASE_URL}/v1/test/timeout`, async () => {
    await delay(70000) // Longer than default timeout
    return HttpResponse.json({ data: {} })
  }),

  // Authentication error
  http.get(`${BASE_URL}/v1/test/auth-error`, () => {
    return HttpResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    )
  }),
]
