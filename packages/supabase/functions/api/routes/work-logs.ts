/**
 * Work Logs REST API
 * Work time tracking and work log management
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
 * GET /v1/work-logs
 * List work logs
 */
app.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['Work Logs'],
    summary: 'List work logs',
    request: {
      query: z.object({
        page: z.coerce.number().optional(),
        pageSize: z.coerce.number().optional(),
        projectId: z.string().uuid().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
    },
    responses: {
      200: {
        description: 'Work logs',
        content: {
          'application/json': {
            schema: z.object({
              workLogs: z.array(z.any()),
              totalCount: z.number(),
              page: z.number(),
              pageSize: z.number(),
              hasMore: z.boolean(),
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
    const { page = 1, pageSize = 20, projectId } = c.req.valid('query')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    let query = supabase.schema('core').from('work_logs').select('*', { count: 'exact' }).eq('user_id', user.id)

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const offset = (page - 1) * pageSize
    query = query.range(offset, offset + pageSize - 1).order('log_date', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      return c.json({ error: 'Failed to fetch work logs', message: error.message }, 500)
    }

    return c.json({
      workLogs: data || [],
      totalCount: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    })
  }
)

/**
 * POST /v1/work-logs
 * Create work log
 */
app.openapi(
  createRoute({
    method: 'post',
    path: '/',
    tags: ['Work Logs'],
    summary: 'Create work log',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              projectId: z.string().uuid().optional(),
              entryType: z.enum(['single_day', 'date_range']),
              logDate: z.string(),
              endDate: z.string().optional(),
              timeEntries: z.array(z.any()).optional(),
              tasksCompleted: z.array(z.string()).optional(),
              skillsUsed: z.array(z.string()).optional(),
              workDescription: z.string().optional(),
              visibility: z.enum(['private', 'organization', 'public']).optional(),
            }),
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Work log created',
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
    const body = c.req.valid('json')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { data, error } = await supabase
      .schema('core')
      .from('work_logs')
      .insert({
        user_id: user.id,
        project_id: body.projectId,
        entry_type: body.entryType,
        log_date: body.logDate,
        time_entries: body.timeEntries,
        tasks_completed: body.tasksCompleted,
        skills_used: body.skillsUsed,
        work_description: body.workDescription,
        visibility: body.visibility || 'private',
        status: 'draft',
        total_hours: 0, // Calculate from time_entries
      })
      .select()
      .single()

    if (error) {
      return c.json({ error: 'Failed to create work log', message: error.message }, 500)
    }

    return c.json(data, 201)
  }
)

/**
 * PATCH /v1/work-logs/:workLogId
 * Update work log
 */
app.openapi(
  createRoute({
    method: 'patch',
    path: '/{workLogId}',
    tags: ['Work Logs'],
    summary: 'Update work log',
    request: {
      params: z.object({ workLogId: z.string().uuid() }),
      body: {
        content: {
          'application/json': {
            schema: z.object({
              workDescription: z.string().optional(),
              visibility: z.enum(['private', 'organization', 'public']).optional(),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Work log updated',
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
    const { workLogId } = c.req.valid('param')
    const body = c.req.valid('json')

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401)
    }

    const { data, error } = await supabase
      .schema('core')
      .from('work_logs')
      .update(body)
      .eq('id', workLogId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      return c.json({ error: 'Failed to update work log' }, 500)
    }

    return c.json(data)
  }
)

export default app
