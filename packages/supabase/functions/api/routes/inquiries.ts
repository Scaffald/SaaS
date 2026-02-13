/**
 * Inquiries REST API
 * User inquiries and support tickets
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
 * GET /v1/inquiries
 * List inquiries
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Inquiries'],
    summary: 'List inquiries',
    request: {
      query: z.object({
        direction: z.enum(['sent', 'received']).optional(),
        status: z.enum(['pending', 'responded', 'archived']).optional(),
        inquiry_type: z.enum(['general', 'job_inquiry', 'support', 'feedback']).optional(),
        page: z.coerce.number().optional(),
        limit: z.coerce.number().optional(),
      }),
    },
    responses: {
      200: {
        description: 'Inquiries list',
        content: {
          'application/json': {
            schema: z.object({
              data: z.array(z.any()),
              pagination: z.object({
                total: z.number(),
                page: z.number(),
                limit: z.number(),
                total_pages: z.number(),
              }),
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
    const { direction, status, page = 1, limit = 20 } = c.req.valid('query')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    let query = supabase.schema('core').from('inquiries').select('*', { count: 'exact' })

    if (direction === 'sent') {
      query = query.eq('sender_id', user.id)
    } else if (direction === 'received') {
      query = query.eq('recipient_id', user.id)
    } else {
      query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return c.json({ error: 'Failed to fetch inquiries', message: error.message }, 500)
    }

    return c.json({
      data: data || [],
      pagination: {
        total: count || 0,
        page,
        limit,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  }
)

/**
 * POST /v1/inquiries
 * Create inquiry
 */
app.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Inquiries'],
    summary: 'Create inquiry',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              recipient_id: z.string().uuid(),
              subject: z.string().optional(),
              message: z.string().optional(),
              inquiry_type: z.enum(['general', 'job_inquiry', 'support', 'feedback']).optional(),
              job_id: z.string().uuid().optional(),
              template_id: z.string().uuid().optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Inquiry created',
        content: {
          'application/json': {
            schema: z.object({ data: z.any() }),
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
      .from('inquiries')
      .insert({
        sender_id: user.id,
        recipient_id: body.recipient_id,
        subject: body.subject || 'Inquiry',
        message: body.message || '',
        inquiry_type: body.inquiry_type || 'general',
        job_id: body.job_id,
        template_id: body.template_id,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      return c.json({ error: 'Failed to create inquiry', message: error.message }, 500)
    }

    return c.json({ data }, 201)
  }
)

export default app
