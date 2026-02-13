/**
 * Workers REST API
 * Public discovery of worker profiles
 * Endpoints for listing and viewing worker profiles
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

// Auth middleware provides supabase client (endpoint can still be public)
app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi('ErrorResponse')

const workerSchema = z
  .object({
    id: z.string().uuid(),
    display_name: z.string(),
    username: z.string(),
    slug: z.string().nullable(),
    about: z.string().nullable(),
    avatar_path: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi('Worker')

const workerDetailedSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().nullable(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
    about: z.string().nullable(),
    avatar_path: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .openapi('WorkerDetailed')

// Request schemas
const getWorkersQuerySchema = z.object({
  search: z.string().optional(),
  industryIds: z.array(z.string()).optional(),
  skillIds: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
})

// Response schemas
const workersListResponseSchema = z
  .object({
    workers: z.array(workerSchema),
    total: z.number().int(),
  })
  .openapi('WorkersListResponse')

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/workers
 * Get all workers with optional filtering
 */
const getWorkersRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Workers'],
  summary: 'List workers',
  description: 'Get all workers with optional filtering for public discovery',
  request: {
    query: getWorkersQuerySchema,
  },
  responses: {
    200: {
      description: 'List of workers',
      content: {
        'application/json': {
          schema: workersListResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
})

app.openapi(getWorkersRoute, async (c) => {
  const supabase = c.get('supabase')
  const { limit = 50 } = c.req.valid('query')

  let dbQuery = supabase
    .schema('core')
    .from('users')
    .select(`
      id,
      display_name,
      username,
      slug,
      about,
      avatar_path,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false })

  // Apply limit
  if (limit) {
    dbQuery = dbQuery.limit(limit)
  }

  const { data: workers, error } = await dbQuery

  if (error) {
    console.error('Error fetching workers:', error)
    return c.json({ error: 'Failed to fetch workers', message: error.message }, 500)
  }

  return c.json({
    workers: workers || [],
    total: workers?.length || 0,
  })
})

/**
 * GET /v1/workers/:id
 * Get a single worker profile by ID
 */
const getWorkerByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Workers'],
  summary: 'Get worker by ID',
  description: 'Get detailed worker profile by ID',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Worker profile',
      content: {
        'application/json': {
          schema: workerDetailedSchema,
        },
      },
    },
    404: {
      description: 'Worker not found',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    500: {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
  },
})

app.openapi(getWorkerByIdRoute, async (c) => {
  const supabase = c.get('supabase')
  const { id } = c.req.valid('param')

  const { data: worker, error } = await supabase
    .schema('core')
    .from('users')
    .select(`
      id,
      name,
      first_name,
      last_name,
      about,
      avatar_path,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching worker:', error)
    if (error.code === 'PGRST116') {
      return c.json({ error: 'Worker not found' }, 404)
    }
    return c.json({ error: 'Failed to fetch worker', message: error.message }, 500)
  }

  return c.json(worker)
})

export default app
