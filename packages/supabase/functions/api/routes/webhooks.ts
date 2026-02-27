/**
 * Webhooks Management REST API
 * Manage webhook endpoints and deliveries
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
 * GET /v1/webhooks
 * List webhooks
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Webhooks'],
    summary: 'List webhooks',
    responses: {
      200: {
        description: 'Webhooks',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(z.any()),
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

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { data, error } = await supabase.schema('core').from('webhooks').select('*').eq('user_id', user.id)

    if (error) {
      return c.json({ error: 'Failed to fetch webhooks', message: error.message }, 500)
    }

    return c.json({ data: data || [] })
  }
)

/**
 * POST /v1/webhooks
 * Create webhook
 */
app.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Webhooks'],
    summary: 'Create webhook',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              url: z.string().url(),
              description: z.string().optional(),
              events: z.array(z.string()),
              retry_max_attempts: z.number().optional(),
              timeout_ms: z.number().optional(),
              metadata: z.record(z.any()).optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Webhook created',
        content: {
          'application/json': {
            schema: z.object({
              data: z.any(),
              message: z.string(),
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
    const body = c.req.valid('json')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    // Generate webhook secret
    const secret = crypto.randomUUID()

    const { data, error } = await supabase
      .schema('core')
      .from('webhooks')
      .insert({
        user_id: user.id,
        url: body.url,
        description: body.description,
        events: body.events,
        secret,
        retry_max_attempts: body.retry_max_attempts || 3,
        timeout_ms: body.timeout_ms || 10000,
        metadata: body.metadata,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return c.json({ error: 'Failed to create webhook', message: error.message }, 500)
    }

    return c.json(
      {
        data: { ...data, secret },
        message: 'Webhook created. Save the secret - it will not be shown again.',
      },
      201
    )
  }
)

/**
 * DELETE /v1/webhooks/:id
 * Delete webhook
 */
app.openapi(
  createRoute({
    method: 'delete',
    path: '/{id}',
    tags: ['Webhooks'],
    summary: 'Delete webhook',
    request: {
      params: z.object({ id: z.string().uuid() }),
    },
    responses: {
      200: {
        description: 'Webhook deleted',
        content: {
          'application/json': {
            schema: z.object({ success: z.boolean() }),
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

    const { error } = await supabase.schema('core').from('webhooks').delete().eq('id', id).eq('user_id', user.id)

    if (error) {
      return c.json({ error: 'Failed to delete webhook', message: error.message }, 500)
    }

    return c.json({ success: true })
  }
)

export default app
