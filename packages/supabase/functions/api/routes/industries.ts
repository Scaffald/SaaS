/**
 * Industries REST API
 * Lookup endpoints for industries (id, name, slug, description).
 * Migrated from: packages/supabase/functions/trpc/routers/industries.router.ts
 */

import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'
import { authMiddleware } from '../middleware/auth.ts'

const app = new OpenAPIHono()

app.use('*', authMiddleware)

const industrySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
  })
  .openapi('Industry')

const industriesListResponseSchema = z
  .object({
    data: z.array(industrySchema),
    total: z.number().int(),
  })
  .openapi('IndustriesListResponse')

const industryResponseSchema = z
  .object({
    data: industrySchema,
  })
  .openapi('IndustryResponse')

const errorResponseSchema = z
  .object({
    error: z.string(),
    message: z.string().optional(),
  })
  .openapi('ErrorResponse')

// GET / - List all industries
const listRoute = createRoute({
  method: 'get',
  path: '/',
  summary: 'List all industries',
  description: 'Returns all industries sorted alphabetically by name.',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: industriesListResponseSchema,
        },
      },
      description: 'List of industries',
    },
    401: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Unauthorized',
    },
  },
})

const SCHEMA_CACHE_MSG = 'Could not query the database for the schema cache'
const MAX_RETRIES = 3
const RETRY_MS = 150

app.openapi(listRoute, async (c) => {
  const supabase = c.get('supabase')
  let lastError: { message: string } | null = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await supabase
      .schema('core')
      .from('industries')
      .select('id, name, slug, description')
      .order('name', { ascending: true })

    if (!error) {
      const list = data ?? []
      return c.json({
        data: list,
        total: list.length,
      })
    }
    lastError = error
    const isSchemaCache = error.message.includes(SCHEMA_CACHE_MSG)
    if (!isSchemaCache || attempt === MAX_RETRIES) break
    await new Promise((r) => setTimeout(r, RETRY_MS))
  }

  return c.json(
    {
      error: 'Failed to fetch industries',
      message: lastError?.message ?? 'Unknown error',
    },
    500
  )
})

// GET /:slug - Get industry by slug
const getBySlugRoute = createRoute({
  method: 'get',
  path: '/{slug}',
  summary: 'Get industry by slug',
  description: 'Returns a single industry by slug, or 404 if not found.',
  request: {
    params: z.object({
      slug: z.string().min(1).openapi({ description: 'Industry slug', example: 'technology' }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: industryResponseSchema,
        },
      },
      description: 'Industry details',
    },
    404: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Industry not found',
    },
    401: {
      content: { 'application/json': { schema: errorResponseSchema } },
      description: 'Unauthorized',
    },
  },
})

app.openapi(getBySlugRoute, async (c) => {
  const slug = c.req.param('slug')
  const supabase = c.get('supabase')

  const { data, error } = await supabase
    .schema('core')
    .from('industries')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return c.json(
        {
          error: 'Not found',
          message: `Industry with slug "${slug}" not found`,
        },
        404
      )
    }
    return c.json(
      {
        error: 'Failed to fetch industry',
        message: error.message,
      },
      500
    )
  }

  return c.json({ data })
})

export default app
