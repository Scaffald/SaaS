/**
 * Background Checks REST API
 * Manages background check packages, requests, and disputes
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()
app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const _errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
}).openapi('ErrorResponse')

const backgroundCheckSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  organization_id: z.string().uuid().optional(),
  package_id: z.string().uuid(),
  tier: z.string(),
  status: z.string(),
  paid_by: z.enum(['worker', 'employer']),
  cost_cents: z.number(),
  consent_signature: z.string().optional(),
  consent_given_at: z.string().optional(),
  initiated_at: z.string(),
  completed_at: z.string().optional(),
  expires_at: z.string().optional(),
  privacy_level: z.string().optional(),
  results: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/background-checks/packages
 * List available background check packages
 */
const listPackagesRoute = createRoute({
  method: 'get',
  path: '/packages',
  tags: ['Background Checks'],
  summary: 'List packages',
  responses: {
    200: {
      description: 'Background check packages',
      content: {
        'application/json': {
          schema: z.array(z.object({
            id: z.string().uuid(),
            slug: z.string(),
            display_name: z.string(),
            description: z.string().optional(),
            retail_cost_cents: z.number(),
            check_types: z.array(z.string()),
            turnaround_days: z.number().optional(),
            is_active: z.boolean(),
            created_at: z.string(),
            updated_at: z.string(),
          })),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(listPackagesRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('background_check_packages')
    .select('*')
    .eq('is_active', true)
    .order('retail_cost_cents')

  if (error) {
    return c.json({ error: 'Failed to fetch packages', message: error.message }, 500)
  }

  return c.json(data || [])
})

/**
 * GET /v1/background-checks
 * List user's background checks
 */
const listChecksRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Background Checks'],
  summary: 'List background checks',
  responses: {
    200: {
      description: 'Background checks',
      content: {
        'application/json': {
          schema: z.array(backgroundCheckSchema),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(listChecksRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('background_checks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return c.json({ error: 'Failed to fetch checks', message: error.message }, 500)
  }

  return c.json(data || [])
})

/**
 * GET /v1/background-checks/:checkId
 * Get background check by ID
 */
const getCheckRoute = createRoute({
  method: 'get',
  path: '/{checkId}',
  tags: ['Background Checks'],
  summary: 'Get background check',
  request: {
    params: z.object({
      checkId: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Background check',
      content: {
        'application/json': {
          schema: backgroundCheckSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getCheckRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { checkId } = c.req.valid('param')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('background_checks')
    .select('*')
    .eq('id', checkId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return c.json({ error: 'Background check not found' }, 404)
  }

  return c.json(data)
})

/**
 * POST /v1/background-checks/request
 * Request a new background check
 */
const requestCheckRoute = createRoute({
  method: 'post',
  path: '/request',
  tags: ['Background Checks'],
  summary: 'Request background check',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            package_id: z.string().uuid(),
            tier: z.string(),
            paid_by: z.enum(['worker', 'employer']),
            consent: z.object({
              consent_signature: z.string(),
              consent_given_at: z.string(),
              consent_ip_address: z.string().optional(),
              consent_user_agent: z.string().optional(),
              disclosure_provided_at: z.string(),
              summary_of_rights_provided_at: z.string(),
            }),
            metadata: z.record(z.any()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Background check requested',
      content: {
        'application/json': {
          schema: z.object({
            backgroundCheckId: z.string().uuid(),
            paymentIntentId: z.string(),
            clientSecret: z.string(),
            amountCents: z.number(),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(requestCheckRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const body = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Get package details
  const { data: pkg } = await supabase
    .schema('core')
    .from('background_check_packages')
    .select('*')
    .eq('id', body.package_id)
    .single()

  if (!pkg) {
    return c.json({ error: 'Package not found' }, 404)
  }

  // Create background check record
  const { data: check, error } = await supabase
    .schema('core')
    .from('background_checks')
    .insert({
      user_id: user.id,
      package_id: body.package_id,
      tier: body.tier,
      paid_by: body.paid_by,
      cost_cents: pkg.retail_cost_cents,
      status: 'pending_payment',
      consent_signature: body.consent.consent_signature,
      consent_given_at: body.consent.consent_given_at,
      initiated_at: new Date().toISOString(),
      metadata: body.metadata,
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: 'Failed to create check', message: error.message }, 500)
  }

  // In production, create Stripe payment intent here
  return c.json({
    backgroundCheckId: check.id,
    paymentIntentId: 'pi_mock',
    clientSecret: 'cs_mock',
    amountCents: pkg.retail_cost_cents,
  }, 201)
})

/**
 * PATCH /v1/background-checks/:checkId/privacy
 * Update privacy settings
 */
const updatePrivacyRoute = createRoute({
  method: 'patch',
  path: '/{checkId}/privacy',
  tags: ['Background Checks'],
  summary: 'Update privacy',
  request: {
    params: z.object({
      checkId: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            privacy_level: z.enum(['public', 'connections_only', 'private']),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Privacy updated',
      content: {
        'application/json': {
          schema: backgroundCheckSchema,
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(updatePrivacyRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { checkId } = c.req.valid('param')
  const { privacy_level } = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('background_checks')
    .update({ privacy_level })
    .eq('id', checkId)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error || !data) {
    return c.json({ error: 'Failed to update privacy' }, 500)
  }

  return c.json(data)
})

export default app
