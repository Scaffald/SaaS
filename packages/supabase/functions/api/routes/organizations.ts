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

export default app
