/**
 * Organizations REST API
 * Organization management, members, documents, and settings
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()
app.use('*', authMiddleware)

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
})

/**
 * GET /v1/organizations/:id
 * Get organization by ID
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Organizations'],
    summary: 'Get organization',
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: 'Organization',
        content: {
          'application/json': {
            schema: z.any(),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get('supabase')
    const user = c.get('user')
    const { id } = c.req.valid('param')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { data, error } = await supabase.schema('core').from('organizations').select('*').eq('id', id).single()

    if (error || !data) {
      return c.json({ error: 'Organization not found' }, 404)
    }

    return c.json(data)
  }
)

/**
 * GET /v1/organizations/:id/members
 * List organization members
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/{id}/members',
    tags: ['Organizations'],
    summary: 'List members',
    request: {
      params: z.object({ id: z.string().uuid() }),
      query: z.object({
        search: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: 'Members',
        content: {
          'application/json': {
            schema: z.array(z.any()),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get('supabase')
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const { search } = c.req.valid('query')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    let query = supabase.schema('core').from('organization_members').select('*').eq('organization_id', id)

    if (search) {
      query = query.ilike('user_id', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return c.json({ error: 'Failed to fetch members', message: error.message }, 500)
    }

    return c.json(data || [])
  }
)

/**
 * GET /v1/organizations/:id/settings
 * Get organization settings
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/{id}/settings',
    tags: ['Organizations'],
    summary: 'Get settings',
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: 'Settings',
        content: {
          'application/json': {
            schema: z.any(),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get('supabase')
    const user = c.get('user')
    const { id } = c.req.valid('param')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { data, error } = await supabase
      .schema('core')
      .from('organization_settings')
      .select('*')
      .eq('organization_id', id)
      .single()

    if (error || !data) {
      return c.json({ error: 'Settings not found' }, 404)
    }

    return c.json(data)
  }
)

/**
 * PATCH /v1/organizations/:id/settings
 * Update organization settings
 */
app.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}/settings',
    tags: ['Organizations'],
    summary: 'Update settings',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              timezone: z.string().optional(),
              enforceMfa: z.boolean().optional(),
              sessionTimeoutMinutes: z.number().optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Settings updated',
        content: {
          'application/json': {
            schema: z.any(),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get('supabase')
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { data, error } = await supabase
      .schema('core')
      .from('organization_settings')
      .update(body)
      .eq('organization_id', id)
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to update settings' }, 500)
    }

    return c.json(data)
  }
)

/**
 * POST /v1/organizations/requests
 * Create organization request
 */
app.openapi(
  createRoute({
    method: 'post',
    path: '/requests',
    tags: ['Organizations'],
    summary: 'Create organization request',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string().min(1),
              slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
              website: z.string().url().optional(),
              notes: z.string().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Organization request created',
        content: {
          'application/json': {
            schema: z.object({
              request: z.object({
                id: z.string().uuid(),
                name: z.string(),
                slug: z.string(),
                status: z.string(),
                created_at: z.string(),
              }),
            }),
          },
        },
      },
      400: {
        description: 'Bad request',
        content: {
          'application/json': {
            schema: errorResponseSchema,
          },
        },
      },
      409: {
        description: 'Conflict - slug already exists',
        content: {
          'application/json': {
            schema: errorResponseSchema,
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get('supabase')
    const user = c.get('user')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const body = c.req.valid('json')
    const trimmedName = body.name.trim()
    const normalizedSlug = body.slug.trim().toLowerCase()

    // Check if slug is already in use by an existing organization
    const { data: existingOrganization, error: existingOrgError } = await supabase
      .schema('core')
      .from('organizations')
      .select('id')
      .eq('slug', normalizedSlug)
      .maybeSingle()

    if (existingOrgError && existingOrgError.code !== 'PGRST116') {
      return c.json(
        { error: 'Failed to validate organization slug', message: existingOrgError.message },
        500
      )
    }

    if (existingOrganization) {
      return c.json({ error: 'An organization with this slug already exists' }, 409)
    }

    // Check for pending or approved requests with this slug
    const { data: existingRequest, error: existingRequestError } = await supabase
      .schema('core')
      .from('organization_requests')
      .select('id, status, created_by_user_id')
      .eq('slug', normalizedSlug)
      .in('status', ['pending', 'approved'])
      .maybeSingle()

    if (existingRequestError && existingRequestError.code !== 'PGRST116') {
      return c.json(
        { error: 'Failed to validate organization request', message: existingRequestError.message },
        500
      )
    }

    if (existingRequest) {
      const isOwnRequest = existingRequest.created_by_user_id === user.id
      const message = isOwnRequest
        ? 'You already have a pending request for this organization'
        : 'Another user already requested this organization and it is pending review'
      return c.json({ error: message }, 409)
    }

    // Create the organization request
    const { data: request, error: requestError } = await supabase
      .schema('core')
      .from('organization_requests')
      .insert({
        name: trimmedName,
        slug: normalizedSlug,
        website: body.website?.trim() ?? null,
        notes: body.notes?.trim() ?? null,
        created_by_user_id: user.id,
      })
      .select('id, name, slug, status, created_at')
      .single()

    if (requestError) {
      return c.json(
        { error: 'Failed to submit organization request', message: requestError.message },
        500
      )
    }

    return c.json({ request }, 201)
  }
)

/**
 * GET /v1/organizations/:id/reminder-settings
 * Get inquiry reminder settings
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/{id}/reminder-settings',
    tags: ['Organizations'],
    summary: 'Get reminder settings',
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: 'Reminder settings',
        content: {
          'application/json': {
            schema: z.object({
              reminderEnabled: z.boolean(),
              reminderDays: z.number(),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get('supabase')
    const user = c.get('user')
    const { id } = c.req.valid('param')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // TODO: Add organization admin check
    // For now, allow any authenticated user to read reminder settings

    const { data: org, error } = await supabase
      .schema('core')
      .from('organizations')
      .select('inquiry_reminder_enabled, inquiry_reminder_days')
      .eq('id', id)
      .single()

    if (error || !org) {
      return c.json({ error: 'Organization not found' }, 404)
    }

    return c.json({
      reminderEnabled: org.inquiry_reminder_enabled ?? true,
      reminderDays: org.inquiry_reminder_days ?? 3,
    })
  }
)

/**
 * PUT /v1/organizations/:id/reminder-settings
 * Update inquiry reminder settings
 */
app.openapi(
  createRoute({
    method: 'put',
    path: '/{id}/reminder-settings',
    tags: ['Organizations'],
    summary: 'Update reminder settings',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              reminderEnabled: z.boolean(),
              reminderDays: z.number().int().min(1).max(14),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Reminder settings updated',
        content: {
          'application/json': {
            schema: z.object({
              reminderEnabled: z.boolean(),
              reminderDays: z.number(),
            }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get('supabase')
    const user = c.get('user')
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // TODO: Add organization admin check
    // For now, allow any authenticated user to update reminder settings

    const { data: org, error } = await supabase
      .schema('core')
      .from('organizations')
      .update({
        inquiry_reminder_enabled: body.reminderEnabled,
        inquiry_reminder_days: body.reminderDays,
      })
      .eq('id', id)
      .select('inquiry_reminder_enabled, inquiry_reminder_days')
      .single()

    if (error || !org) {
      return c.json({ error: 'Failed to update reminder settings', message: error?.message }, 500)
    }

    return c.json({
      reminderEnabled: org.inquiry_reminder_enabled,
      reminderDays: org.inquiry_reminder_days,
    })
  }
)

export default app
