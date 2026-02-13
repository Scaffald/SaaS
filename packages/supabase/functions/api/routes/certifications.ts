/**
 * Certifications REST API
 * Manages user certifications and certification catalog
 * Supports hierarchical certification structure (depth 0, 1, 2)
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()
app.use('*', authMiddleware)

// ============================================================================
// Schemas
// ============================================================================

const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
}).openapi('ErrorResponse')

const certificationCatalogSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  depth: z.number(),
  parent_id: z.string().uuid().nullable(),
  hierarchy_path: z.string(),
  sort_order: z.number(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  parent_title: z.string().nullable().optional(),
  parent_slug: z.string().nullable().optional(),
})

const userCertificationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  certification_id: z.string().uuid(),
  issue_date: z.string().nullable().optional(),
  expiration_date: z.string().nullable().optional(),
  credential_id: z.string().nullable().optional(),
  credential_url: z.string().nullable().optional(),
  certificate_file_path: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  is_active: z.boolean(),
  verification_status: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

// ============================================================================
// Routes
// ============================================================================

/**
 * GET /v1/profiles/certifications/top-level
 * Get top-level certifications with search
 */
const getTopLevelRoute = createRoute({
  method: 'get',
  path: '/top-level',
  tags: ['Certifications'],
  summary: 'Get top-level certifications',
  request: {
    query: z.object({
      search: z.string().optional(),
      limit: z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Top-level certifications',
      content: {
        'application/json': {
          schema: z.object({
            certifications: z.array(certificationCatalogSchema),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getTopLevelRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { search, limit } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  let query = supabase
    .schema('core')
    .from('certification_catalog')
    .select('*')
    .eq('is_active', true)

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (limit) {
    query = query.limit(limit)
  }

  query = query.order('sort_order')

  const { data, error } = await query

  if (error) {
    return c.json({ error: 'Failed to fetch certifications', message: error.message }, 500)
  }

  return c.json({ certifications: data || [] })
})

/**
 * GET /v1/profiles/certifications/children
 * Get certification children by parent ID
 */
const getChildrenRoute = createRoute({
  method: 'get',
  path: '/children',
  tags: ['Certifications'],
  summary: 'Get certification children',
  request: {
    query: z.object({
      parent_id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Child certifications',
      content: {
        'application/json': {
          schema: z.object({
            certifications: z.array(certificationCatalogSchema),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getChildrenRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { parent_id } = c.req.valid('query')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('certification_catalog')
    .select('*')
    .eq('parent_id', parent_id)
    .eq('is_active', true)
    .order('sort_order')

  if (error) {
    return c.json({ error: 'Failed to fetch children', message: error.message }, 500)
  }

  return c.json({ certifications: data || [] })
})

/**
 * GET /v1/profiles/certifications/tree
 * Get user's certification tree
 */
const getUserTreeRoute = createRoute({
  method: 'get',
  path: '/tree',
  tags: ['Certifications'],
  summary: 'Get user certification tree',
  responses: {
    200: {
      description: 'User certification tree',
      content: {
        'application/json': {
          schema: z.object({
            depth0: z.array(userCertificationSchema),
            depth1ByParent: z.record(z.array(userCertificationSchema)),
            depth2ByParent: z.record(z.array(userCertificationSchema)),
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getUserTreeRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('user_certifications')
    .select('*, catalog:certification_catalog(*)')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) {
    return c.json({ error: 'Failed to fetch tree', message: error.message }, 500)
  }

  // Organize by depth
  const depth0: any[] = []
  const depth1ByParent: Record<string, any[]> = {}
  const depth2ByParent: Record<string, any[]> = {}

  for (const cert of data || []) {
    const catalog = (cert as any).catalog
    if (!catalog) continue

    if (catalog.depth === 0) {
      depth0.push(cert)
    } else if (catalog.depth === 1 && catalog.parent_id) {
      if (!depth1ByParent[catalog.parent_id]) {
        depth1ByParent[catalog.parent_id] = []
      }
      depth1ByParent[catalog.parent_id].push(cert)
    } else if (catalog.depth === 2 && catalog.parent_id) {
      if (!depth2ByParent[catalog.parent_id]) {
        depth2ByParent[catalog.parent_id] = []
      }
      depth2ByParent[catalog.parent_id].push(cert)
    }
  }

  return c.json({ depth0, depth1ByParent, depth2ByParent })
})

/**
 * POST /v1/profiles/certifications/add
 * Add certification
 */
const addCertificationRoute = createRoute({
  method: 'post',
  path: '/add',
  tags: ['Certifications'],
  summary: 'Add certification',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            certification_id: z.string().uuid(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Certification added',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            certification: userCertificationSchema,
          }),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(addCertificationRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')
  const { certification_id } = c.req.valid('json')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('user_certifications')
    .insert({
      user_id: user.id,
      certification_id,
      is_active: true,
      verification_status: 'unverified',
    })
    .select()
    .single()

  if (error) {
    return c.json({ error: 'Failed to add certification', message: error.message }, 500)
  }

  return c.json({ success: true, certification: data }, 201)
})

/**
 * GET /v1/profiles/certifications
 * Get user's certifications (legacy)
 */
const getCertificationsRoute = createRoute({
  method: 'get',
  path: '/',
  tags: ['Certifications'],
  summary: 'Get user certifications',
  responses: {
    200: {
      description: 'User certifications',
      content: {
        'application/json': {
          schema: z.array(userCertificationSchema),
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
})

app.openapi(getCertificationsRoute, async (c) => {
  const supabase = c.get('supabase')
  const user = c.get('user')

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { data, error } = await supabase
    .schema('core')
    .from('user_certifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (error) {
    return c.json({ error: 'Failed to fetch certifications', message: error.message }, 500)
  }

  return c.json(data || [])
})

export default app
