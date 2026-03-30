import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware, requireAuth } from '../middleware/auth.ts'
import {
  applicationCreateSchema,
  applicationUpdateSchema,
} from '../../_shared/application-schemas.ts'

const app = new OpenAPIHono()

// Apply auth middleware to all routes
app.use('*', authMiddleware)

/**
 * Zod Schemas for Applications API
 */

// DB status → API status mapping
const STATUS_DB_TO_API: Record<string, string> = {
  new: 'pending',
  screen: 'reviewing',
}

function mapDbStatus(dbStatus: string): string {
  return STATUS_DB_TO_API[dbStatus] ?? dbStatus
}

// Job summary embedded in application responses
const jobSummarySchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().nullable(),
    location: z.string().nullable(),
    employment_type: z.string().nullable(),
    remote_option: z.string().nullable(),
    pay_range_min_cents: z.number().int().nullable(),
    pay_range_max_cents: z.number().int().nullable(),
    pay_range_type: z.string().nullable(),
    organization: z
      .object({
        id: z.string().uuid(),
        name: z.string().nullable(),
        logo_url: z.string().nullable(),
      })
      .nullable(),
  })
  .openapi('ApplicationJobSummary')

// Application response schema (public fields only)
const applicationSchema = z
  .object({
    id: z.string().uuid(),
    job_id: z.string().uuid(),
    user_id: z.string().uuid(),
    status: z.enum([
      'pending',
      'reviewing',
      'inquired',
      'interview',
      'offer',
      'hired',
      'rejected',
      'withdrawn',
    ]),
    screening_answers: z.record(z.string(), z.unknown()).nullable(),
    attachment_metadata: z.record(z.string(), z.unknown()).nullable(),
    completed_steps: z.array(z.string()).nullable(),
    created_at: z.string(),
    stage_changed_at: z.string().nullable(),
    score: z.number().int().nullable(),
    job: jobSummarySchema.nullable().optional(),
  })
  .openapi('Application')

// Application create request schema
const createApplicationRequestSchema = applicationCreateSchema.openapi('CreateApplicationRequest')

// Application update request schema
const updateApplicationRequestSchema = applicationUpdateSchema
  .omit({ application_id: true })
  .openapi('UpdateApplicationRequest')

// Withdraw request schema
const withdrawRequestSchema = z
  .object({
    reason: z.string().optional().openapi({
      description: 'Optional reason for withdrawal',
      example: 'Accepted another offer',
    }),
  })
  .openapi('WithdrawRequest')

// Application response wrapper
const applicationResponseSchema = z
  .object({
    data: applicationSchema,
  })
  .openapi('ApplicationResponse')

// List applications response
const listApplicationsResponseSchema = z
  .object({
    data: z.array(applicationSchema),
    total: z.number().int(),
    limit: z.number().int(),
    offset: z.number().int(),
  })
  .openapi('ListApplicationsResponse')

// Error response schema
const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi('ErrorResponse')

/**
 * GET /v1/applications
 * List current user's applications (with optional status filter and pagination)
 */
const listApplicationsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Applications'],
  summary: 'List applications',
  description: "List the authenticated user's applications with optional status filter and pagination.",
  middleware: requireAuth,
  request: {
    query: z.object({
      status: z.enum([
        'pending',
        'reviewing',
        'inquired',
        'interview',
        'offer',
        'hired',
        'rejected',
        'withdrawn',
      ]).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional().default(20),
      offset: z.coerce.number().int().min(0).optional().default(0),
    }),
  },
  responses: {
    200: {
      description: 'List of applications',
      content: {
        'application/json': {
          schema: listApplicationsResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(listApplicationsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { status, limit, offset } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401)
  }

  // Map API status filter back to DB status for querying
  const STATUS_API_TO_DB: Record<string, string> = {
    pending: 'new',
    reviewing: 'screen',
  }
  const dbStatus = status ? (STATUS_API_TO_DB[status] ?? status) : undefined

  let query = supabase
    .schema('core')
    .from('applications')
    .select(
      '*, job:jobs!job_id(id, title, location, employment_type, remote_option, pay_range_min_cents, pay_range_max_cents, pay_range_type, organization:organizations!organization_id(id, name, logo_url))',
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (dbStatus) {
    query = query.eq('status', dbStatus)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Error listing applications:', error)
    return c.json({ error: 'Internal Server Error', message: error.message }, 500)
  }

  const rows = data ?? []
  const mapped = rows.map((row: Record<string, unknown>) => ({
    ...row,
    status: mapDbStatus(row.status as string),
  }))

  return c.json(
    {
      data: mapped,
      total: count ?? 0,
      limit,
      offset,
    },
    200
  )
})

/**
 * POST /v1/applications
 * Submit a new job application
 */
const createApplicationRoute = createRoute({
  method: 'post',
  path: '/',
  tags: ['Applications'],
  summary: 'Submit job application',
  description:
    'Submit a new application for a job posting. Supports both quick applications (screening questions only) and full applications with custom questions and document uploads.',
  middleware: requireAuth,
  request: {
    body: {
      content: {
        'application/json': {
          schema: createApplicationRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Application created successfully',
      content: {
        'application/json': {
          schema: applicationResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request - validation error or job not accepting applications',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized - authentication required',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    409: {
      description: 'Conflict - already applied to this job',
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

app.openapi(createApplicationRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const input = c.req.valid('json')

  if (!user) {
    return c.json(
      {
        error: 'Unauthorized',
        message: 'Authentication required to submit application',
      },
      401
    )
  }

  // Check for duplicate application
  const { data: existingApp } = await supabase
    .schema('core')
    .from('applications')
    .select('id')
    .eq('job_id', input.job_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingApp) {
    return c.json(
      {
        error: 'Conflict',
        message: 'You have already applied to this job',
      },
      409
    )
  }

  // Verify job exists and is accepting applications
  const { data: job, error: jobError } = await supabase
    .schema('core')
    .from('jobs')
    .select('id, status, application_deadline, assigned_team_id, organization_id')
    .eq('id', input.job_id)
    .single()

  if (jobError || !job) {
    return c.json(
      {
        error: 'Not Found',
        message: 'Job not found',
      },
      404
    )
  }

  if (job.status !== 'open') {
    return c.json(
      {
        error: 'Bad Request',
        message: 'This job is not accepting applications',
      },
      400
    )
  }

  if (job.application_deadline) {
    const deadline = new Date(job.application_deadline)
    if (deadline < new Date()) {
      return c.json(
        {
          error: 'Bad Request',
          message: 'Application deadline has passed',
        },
        400
      )
    }
  }

  // Create application
  // Map flat screening fields into the screening_answers JSONB column
  // and attachments into attachment_metadata JSONB column
  const screeningAnswers = {
    current_location: input.current_location,
    willing_to_relocate: input.willing_to_relocate,
    years_experience: input.years_experience,
    is_authorized_to_work: input.is_authorized_to_work,
    earliest_start_date: input.earliest_start_date,
    ...(input.screening_answers || {}),
  }

  const { data: application, error } = await supabase
    .schema('core')
    .from('applications')
    .insert({
      job_id: input.job_id,
      user_id: user.id,
      screening_answers: screeningAnswers,
      attachment_metadata: input.attachments || {},
      completed_steps: input.completed_steps || [],
      status: 'new',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating application:', error)
    return c.json(
      {
        error: 'Internal Server Error',
        message: error.message,
      },
      500
    )
  }

  // Trigger webhook for application.created event
  await triggerWebhook('application.created', application, c)

  return c.json({ data: application }, 201)
})

/**
 * GET /v1/applications/:id
 * Get application details by ID
 */
const getApplicationRoute = createRoute({
  method: 'get',
  path: '/{id}',
  tags: ['Applications'],
  summary: 'Get application details',
  description:
    'Retrieve detailed information about a specific application. Users can only access their own applications.',
  middleware: requireAuth,
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Application ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
  },
  responses: {
    200: {
      description: 'Application details',
      content: {
        'application/json': {
          schema: applicationResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden - not authorized to view this application',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Application not found',
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

app.openapi(getApplicationRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data: application, error } = await supabase
    .schema('core')
    .from('applications')
    .select(
      '*, job:jobs!job_id(id, title, location, employment_type, remote_option, pay_range_min_cents, pay_range_max_cents, pay_range_type, organization:organizations!organization_id(id, name, logo_url))'
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return c.json({ error: 'Application not found' }, 404)
    }
    console.error('Error fetching application:', error)
    return c.json({ error: error.message }, 500)
  }

  // Verify user owns this application
  if (application.user_id !== user.id) {
    return c.json(
      {
        error: 'Forbidden',
        message: 'You can only access your own applications',
      },
      403
    )
  }

  return c.json({
    data: {
      ...application,
      status: mapDbStatus(application.status as string),
    },
  }, 200)
})

/**
 * PATCH /v1/applications/:id
 * Update an application
 */
const updateApplicationRoute = createRoute({
  method: 'patch',
  path: '/{id}',
  tags: ['Applications'],
  summary: 'Update application',
  description:
    'Update an existing application. Users can only update their own applications that are in pending or reviewing status.',
  middleware: requireAuth,
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Application ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: updateApplicationRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Application updated successfully',
      content: {
        'application/json': {
          schema: applicationResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request - cannot update application in current status',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Application not found',
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

app.openapi(updateApplicationRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const input = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get existing application
  const { data: existing, error: fetchError } = await supabase
    .schema('core')
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return c.json({ error: 'Application not found' }, 404)
    }
    return c.json({ error: fetchError.message }, 500)
  }

  // Verify user owns this application
  if (existing.user_id !== user.id) {
    return c.json(
      {
        error: 'Forbidden',
        message: 'You can only update your own applications',
      },
      403
    )
  }

  // Check if application can be updated
  if (!['pending', 'reviewing'].includes(existing.status)) {
    return c.json(
      {
        error: 'Bad Request',
        message: `Cannot update application with status: ${existing.status}`,
      },
      400
    )
  }

  // Update application
  const { data: application, error } = await supabase
    .schema('core')
    .from('applications')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating application:', error)
    return c.json({ error: error.message }, 500)
  }

  // Trigger webhook for application.updated event
  await triggerWebhook('application.updated', application, c)

  return c.json({ data: application }, 200)
})

/**
 * POST /v1/applications/:id/withdraw
 * Withdraw an application
 */
const withdrawApplicationRoute = createRoute({
  method: 'post',
  path: '/{id}/withdraw',
  tags: ['Applications'],
  summary: 'Withdraw application',
  description:
    'Withdraw a submitted application. Can only withdraw applications in pending, reviewing, or inquired status.',
  middleware: requireAuth,
  request: {
    params: z.object({
      id: z.string().uuid().openapi({
        description: 'Application ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
      }),
    }),
    body: {
      content: {
        'application/json': {
          schema: withdrawRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Application withdrawn successfully',
      content: {
        'application/json': {
          schema: applicationResponseSchema,
        },
      },
    },
    400: {
      description: 'Bad request - cannot withdraw application in current status',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    403: {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: errorResponseSchema,
        },
      },
    },
    404: {
      description: 'Application not found',
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

app.openapi(withdrawApplicationRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')
  const input = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get existing application
  const { data: existing, error: fetchError } = await supabase
    .schema('core')
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) {
    if (fetchError.code === 'PGRST116') {
      return c.json({ error: 'Application not found' }, 404)
    }
    return c.json({ error: fetchError.message }, 500)
  }

  // Verify user owns this application
  if (existing.user_id !== user.id) {
    return c.json(
      {
        error: 'Forbidden',
        message: 'You can only withdraw your own applications',
      },
      403
    )
  }

  // Check if application can be withdrawn
  if (!['pending', 'reviewing', 'inquired'].includes(existing.status)) {
    return c.json(
      {
        error: 'Bad Request',
        message: `Cannot withdraw application with status: ${existing.status}`,
      },
      400
    )
  }

  // Withdraw application
  const { data: application, error } = await supabase
    .schema('core')
    .from('applications')
    .update({
      status: 'withdrawn',
      metadata: {
        ...existing.metadata,
        withdrawal_reason: input.reason || null,
        withdrawn_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error withdrawing application:', error)
    return c.json({ error: error.message }, 500)
  }

  // Trigger webhook for application.withdrawn event
  await triggerWebhook('application.withdrawn', application, c)

  return c.json({ data: application }, 200)
})

/**
 * Webhook trigger helper
 * Sends application events to configured webhook URLs
 */
async function triggerWebhook(event: string, application: Record<string, unknown>, c: { get: (key: string) => unknown; json: (data: unknown, status?: number) => Response }) {
  // Get webhook configuration for the organization
  const supabase = c.get('supabase')

  try {
    // Fetch organization's webhook configuration
    const { data: job } = await supabase
      .schema('core')
      .from('jobs')
      .select('organization_id')
      .eq('id', application.job_id)
      .single()

    if (!job) return

    const { data: webhooks } = await supabase
      .schema('core')
      .from('webhook_configurations')
      .select('*')
      .eq('organization_id', job.organization_id)
      .eq('enabled', true)
      .contains('events', [event])

    if (!webhooks || webhooks.length === 0) return

    // Send webhook to each configured URL
    const webhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data: application,
    }

    for (const webhook of webhooks) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': event,
            'X-Webhook-Signature': await generateWebhookSignature(webhookPayload, webhook.secret),
          },
          body: JSON.stringify(webhookPayload),
        })

        // Log webhook delivery
        await supabase
          .schema('core')
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhook.id,
            event,
            payload: webhookPayload,
            status: response.ok ? 'delivered' : 'failed',
            http_status: response.status,
            response_body: await response.text(),
            delivered_at: new Date().toISOString(),
          })
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, error)

        // Log failed delivery
        await supabase
          .schema('core')
          .from('webhook_deliveries')
          .insert({
            webhook_id: webhook.id,
            event,
            payload: webhookPayload,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            delivered_at: new Date().toISOString(),
          })
      }
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error)
  }
}

/**
 * Generate HMAC SHA-256 signature for webhook payload
 */
async function generateWebhookSignature(payload: unknown, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(JSON.stringify(payload))
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, data)
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * GET /v1/applications/:id/activity
 * Get activity feed for an application
 */
const activitySchema = z
  .object({
    id: z.string().uuid(),
    application_id: z.string().uuid(),
    event_type: z.string(),
    details: z.record(z.string(), z.unknown()).nullable(),
    created_at: z.string(),
  })
  .openapi('ApplicationActivity')

const getActivityRoute = createRoute({
  method: 'get',
  path: '/{id}/activity',
  tags: ['Applications'],
  summary: 'Get application activity feed',
  description: 'Get the activity timeline for a specific application.',
  middleware: requireAuth,
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Activity feed',
      content: {
        'application/json': {
          schema: z.object({ data: z.array(activitySchema) }),
        },
      },
    },
    401: { description: 'Unauthorized', content: { 'application/json': { schema: errorResponseSchema } } },
    403: { description: 'Forbidden', content: { 'application/json': { schema: errorResponseSchema } } },
    404: { description: 'Not found', content: { 'application/json': { schema: errorResponseSchema } } },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getActivityRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { id } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Verify user owns this application
  const { data: application, error: appError } = await supabase
    .schema('core')
    .from('applications')
    .select('id, user_id')
    .eq('id', id)
    .single()

  if (appError || !application) {
    return c.json({ error: 'Not Found', message: 'Application not found' }, 404)
  }

  if (application.user_id !== user.id) {
    return c.json({ error: 'Forbidden', message: 'You can only access your own applications' }, 403)
  }

  const { data: activity, error } = await supabase
    .schema('core')
    .from('application_activity')
    .select('id, application_id, event_type, details, created_at')
    .eq('application_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching activity:', error)
    return c.json({ error: 'Internal Server Error', message: error.message }, 500)
  }

  return c.json({ data: activity ?? [] }, 200)
})

// Generate OpenAPI documentation
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: {
    title: 'Scaffald Applications API',
    version: '1.0.0',
    description: 'Public API for job application management with webhook support',
  },
})

export default app
