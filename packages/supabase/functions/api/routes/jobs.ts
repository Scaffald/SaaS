import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

/**
 * Zod Schemas for Jobs API
 */

// Query parameters schema for listing jobs
const jobsQuerySchema = z.object({
  status: z
    .enum(['published', 'draft', 'archived', 'open', 'paused', 'closed'])
    .optional()
    .default('published')
    .openapi({
      description: 'Filter jobs by status',
      example: 'published',
    }),
  limit: z.coerce.number().int().positive().max(100).optional().default(20).openapi({
    description: 'Number of jobs to return (max 100)',
    example: 20,
  }),
  offset: z.coerce.number().int().nonnegative().optional().default(0).openapi({
    description: 'Offset for pagination',
    example: 0,
  }),
  organizationId: z.string().uuid().optional().openapi({
    description: 'Filter by organization ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  }),
  location: z.string().optional().openapi({
    description: 'Filter by location (partial match)',
    example: 'San Francisco',
  }),
  employmentType: z
    .enum(['full_time', 'part_time', 'contract', 'temp', 'intern'])
    .optional()
    .openapi({
      description: 'Filter by employment type',
      example: 'full_time',
    }),
  remoteOption: z.enum(['on_site', 'hybrid', 'remote']).optional().openapi({
    description: 'Filter by remote work option',
    example: 'remote',
  }),
})

// Job response schema (simplified public fields)
const jobSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    title: z.string(),
    description: z.string(),
    status: z.enum(['draft', 'open', 'paused', 'closed', 'published']),
    employment_type: z.enum(['full_time', 'part_time', 'contract', 'temp', 'intern']).nullable(),
    remote_option: z.enum(['on_site', 'hybrid', 'remote']).nullable(),
    location: z.string().nullable(),
    pay_range_min_cents: z.number().int().nullable(),
    pay_range_max_cents: z.number().int().nullable(),
    pay_range_type: z.enum(['hourly', 'salary', 'contract', 'project']).nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    application_deadline: z.string().nullable(),
    number_of_openings: z.number().int().nullable(),
    is_featured: z.boolean().nullable(),
  })
  .openapi('Job')

// Pagination metadata schema
const paginationSchema = z
  .object({
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
    hasMore: z.boolean(),
  })
  .openapi('Pagination')

// Jobs list response schema
const jobsListResponseSchema = z
  .object({
    data: z.array(jobSchema),
    pagination: paginationSchema,
  })
  .openapi('JobsListResponse')

// Single job response schema
const jobResponseSchema = z
  .object({
    data: jobSchema,
  })
  .openapi('JobResponse')

// Error response schema
const errorResponseSchema = z
  .object({
    error: z.string(),
  })
  .openapi('ErrorResponse')

// Similar jobs query schema
const similarJobsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(20).optional().default(5).openapi({
    description: 'Number of similar jobs to return (max 20)',
    example: 5,
  }),
})

/**
 * GET /v1/jobs
 * List published jobs with filtering and pagination
 */
const getJobsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Jobs'],
  summary: 'List published jobs',
  description: 'Retrieve a paginated list of published jobs with optional filtering',
  request: {
    query: jobsQuerySchema,
  },
  responses: {
    200: {
      description: 'List of jobs matching the query',
      content: {
        'application/json': {
          schema: jobsListResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized - missing or invalid authentication',
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
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getJobsRoute, async (c) => {
  const supabase = c.get('supabase')
  const query = c.req.valid('query')

  // Build query
  let dbQuery = supabase
    .schema('core')
    .from('jobs')
    .select('*', { count: 'exact' })
    .eq('status', query.status)
    .range(query.offset, query.offset + query.limit - 1)
    .order('created_at', { ascending: false })

  // Apply filters
  if (query.organizationId) {
    dbQuery = dbQuery.eq('organization_id', query.organizationId)
  }
  if (query.location) {
    dbQuery = dbQuery.ilike('location', `%${query.location}%`)
  }
  if (query.employmentType) {
    dbQuery = dbQuery.eq('employment_type', query.employmentType)
  }
  if (query.remoteOption) {
    dbQuery = dbQuery.eq('remote_option', query.remoteOption)
  }

  const { data, error, count } = await dbQuery

  if (error) {
    console.error('Error fetching jobs:', error)
    return c.json({ error: error.message }, 500)
  }

  return c.json(
    {
      data: data || [],
      pagination: {
        total: count || 0,
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < (count || 0),
      },
    },
    200
  )
})

/**
 * GET /v1/jobs/:id
 * Get job details by ID
 */
const getJobByIdRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Jobs'],
  summary: 'Get job details',
  description: 'Retrieve detailed information about a specific job by ID',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Job ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Job details',
      content: {
        'application/json': {
          schema: jobResponseSchema,
        },
      },
    },
    404: {
      description: 'Job not found',
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
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getJobByIdRoute, async (c) => {
  const supabase = c.get('supabase')
  const { id } = c.req.valid('param')

  const { data, error } = await supabase
    .schema('core')
    .from('jobs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return c.json({ error: 'Job not found' }, 404)
    }
    console.error('Error fetching job:', error)
    return c.json({ error: error.message }, 500)
  }

  return c.json({ data }, 200)
})

/**
 * GET /v1/jobs/:id/similar
 * Get similar jobs based on job ID
 */
const getSimilarJobsRoute = createRoute({
  method: 'get',
  path: '/{id}/similar',
  tags: ['Jobs'],
  summary: 'Get similar jobs',
  description:
    'Retrieve jobs similar to the specified job based on organization, employment type, and location',
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Job ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
    query: similarJobsQuerySchema,
  },
  responses: {
    200: {
      description: 'List of similar jobs',
      content: {
        'application/json': {
          schema: z.object({
            data: z.array(jobSchema),
          }),
        },
      },
    },
    404: {
      description: 'Source job not found',
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
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getSimilarJobsRoute, async (c) => {
  const supabase = c.get('supabase')
  const { id } = c.req.valid('param')
  const query = c.req.valid('query')

  // First get the source job to find similar ones
  const { data: sourceJob, error: sourceError } = await supabase
    .schema('core')
    .from('jobs')
    .select('organization_id, employment_type, location')
    .eq('id', id)
    .single()

  if (sourceError) {
    if (sourceError.code === 'PGRST116') {
      return c.json({ error: 'Job not found' }, 404)
    }
    return c.json({ error: sourceError.message }, 500)
  }

  // Find similar jobs (same organization or type)
  const { data, error } = await supabase
    .schema('core')
    .from('jobs')
    .select('*')
    .eq('status', 'published')
    .neq('id', id)
    .or(
      `organization_id.eq.${sourceJob.organization_id},employment_type.eq.${sourceJob.employment_type}`
    )
    .limit(query.limit)

  if (error) {
    console.error('Error fetching similar jobs:', error)
    return c.json({ error: error.message }, 500)
  }

  return c.json({ data: data || [] }, 200)
})

/**
 * GET /v1/jobs/filter-options
 * Get available filter values for published jobs
 */
const getFilterOptionsRoute = createRoute({
  method: 'get',
  path: '/filter-options',
  tags: ['Jobs'],
  summary: 'Get job filter options',
  description:
    'Retrieve unique values for employment types, locations, and remote options to use in job filters',
  responses: {
    200: {
      description: 'Available filter options',
      content: {
        'application/json': {
          schema: z.object({
            data: z.object({
              employmentTypes: z.array(z.string()),
              locations: z.array(z.string()),
              remoteOptions: z.array(z.string()),
            }),
          }),
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
  security: [
    {
      bearerAuth: [],
    },
  ],
})

app.openapi(getFilterOptionsRoute, async (c) => {
  const supabase = c.get('supabase')

  try {
    // Get unique employment types
    const { data: employmentData, error: employmentError } = await supabase
      .schema('core')
      .from('jobs')
      .select('employment_type')
      .eq('status', 'published')
      .not('employment_type', 'is', null)

    if (employmentError) throw employmentError

    // Get unique locations
    const { data: locationData, error: locationError } = await supabase
      .schema('core')
      .from('jobs')
      .select('location')
      .eq('status', 'published')
      .not('location', 'is', null)

    if (locationError) throw locationError

    // Get unique remote options
    const { data: remoteData, error: remoteError } = await supabase
      .schema('core')
      .from('jobs')
      .select('remote_option')
      .eq('status', 'published')
      .not('remote_option', 'is', null)

    if (remoteError) throw remoteError

    // Extract unique values
    const employmentTypes = Array.from(
      new Set((employmentData || []).map((row) => row.employment_type).filter(Boolean))
    )
    const locations = Array.from(
      new Set((locationData || []).map((row) => row.location).filter(Boolean))
    )
    const remoteOptions = Array.from(
      new Set((remoteData || []).map((row) => row.remote_option).filter(Boolean))
    )

    return c.json(
      {
        data: {
          employmentTypes,
          locations,
          remoteOptions,
        },
      },
      200
    )
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})

// Generate OpenAPI documentation
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Scaffald Jobs API',
    version: '1.0.0',
    description: 'Public API for job discovery and filtering',
  },
  servers: [
    {
      url: Deno.env.get('SUPABASE_URL')
        ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/api`
        : 'https://your-project.supabase.co/functions/v1/api',
      description: 'Production API',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT token obtained via authentication or OAuth',
      },
    },
  },
  tags: [
    {
      name: 'Jobs',
      description: 'Job listing and search endpoints',
    },
  ],
})

export default app
