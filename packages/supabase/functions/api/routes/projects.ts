/**
 * Projects REST API
 * Project management with sites, addresses, and worker management
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()
app.use('*', authMiddleware)

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
})

/**
 * GET /v1/projects
 * List projects
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Projects'],
    summary: 'List projects',
    request: {
      query: z.object({
        organization_id: z.string().uuid().optional(),
        status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
        limit: z.coerce.number().optional(),
        offset: z.coerce.number().optional(),
      }),
    },
    responses: {
      200: {
        description: 'Projects',
        content: {
          'application/json': {
            schema: z.object({
              projects: z.array(z.any()),
              count: z.number(),
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
    const { organization_id, status, limit, offset } = c.req.valid('query')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    let query = supabase.schema('core').from('projects').select('*', { count: 'exact' })

    if (organization_id) {
      query = query.eq('organization_id', organization_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(limit)
    }

    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      return c.json({ error: 'Failed to fetch projects', message: error.message }, 500)
    }

    return c.json({ projects: data || [], count: count || 0 })
  }
)

/**
 * POST /v1/projects
 * Create project
 */
app.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Projects'],
    summary: 'Create project',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              organization_id: z.string().uuid(),
              name: z.string(),
              description: z.string().optional(),
              status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
              start_date: z.string().optional(),
              end_date: z.string().optional(),
              location_visibility: z.enum(['public', 'authenticated', 'organization_only', 'private']).optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Project created',
        content: {
          'application/json': {
            schema: z.object({ project: z.any() }),
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }),
  async (c) => {
    const supabase = c.get('supabase')
    const user = c.get('user')
    const body = c.req.valid('json')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { data, error } = await supabase
      .schema('core')
      .from('projects')
      .insert({
        organization_id: body.organization_id,
        name: body.name,
        description: body.description,
        status: body.status || 'planning',
        start_date: body.start_date,
        end_date: body.end_date,
        location_visibility: body.location_visibility || 'organization_only',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return c.json({ error: 'Failed to create project', message: error.message }, 500)
    }

    return c.json({ project: data }, 201)
  }
)

/**
 * GET /v1/projects/:id
 * Get project by ID
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/{id}',
    tags: ['Projects'],
    summary: 'Get project',
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: 'Project',
        content: {
          'application/json': {
            schema: z.object({ project: z.any() }),
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

    const { data, error } = await supabase.schema('core').from('projects').select('*').eq('id', id).single()

    if (error || !data) {
      return c.json({ error: 'Project not found' }, 404)
    }

    return c.json({ project: data })
  }
)

/**
 * PATCH /v1/projects/:id
 * Update project
 */
app.openapi(
  createRoute({
    method: 'patch',
    path: '/{id}',
    tags: ['Projects'],
    summary: 'Update project',
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string().optional(),
              description: z.string().nullable().optional(),
              status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Project updated',
        content: {
          'application/json': {
            schema: z.object({ project: z.any() }),
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

    const { data, error } = await supabase.schema('core').from('projects').update(body).eq('id', id).select().single()

    if (error || !data) {
      return c.json({ error: 'Failed to update project' }, 500)
    }

    return c.json({ project: data })
  }
)

export default app
