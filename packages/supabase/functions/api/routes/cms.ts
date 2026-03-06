/**
 * CMS REST API - Welcome slides
 * Migrated from: packages/supabase/functions/trpc/routers/cms.router.ts
 */

import { createClient } from '@supabase/supabase-js'
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth.ts'

const app = new Hono()
app.use('*', authMiddleware)

// ============================================================================
// GET /active - Public, active slides only
// Uses service role to avoid anon RLS and schema-cache flakiness; data is public.
// ============================================================================

const SCHEMA_CACHE_MSG = 'Could not query the database for the schema cache'
const MAX_RETRIES = 3
const RETRY_MS = 150

app.get('/welcome-slides/active', async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  const url = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const client = supabaseAdmin ?? (url && serviceKey ? createClient(url, serviceKey) : c.get('supabase'))

  let lastError: { message: string } | null = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { data, error } = await client
      .schema('cms')
      .from('welcome_slides')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (!error) {
      return c.json({ data: { slides: data } })
    }
    lastError = error
    const isSchemaCache = error.message.includes(SCHEMA_CACHE_MSG)
    if (!isSchemaCache || attempt === MAX_RETRIES) break
    await new Promise((r) => setTimeout(r, RETRY_MS))
  }

  return c.json(
    {
      error: 'Internal Server Error',
      message: `Failed to fetch welcome slides: ${lastError?.message ?? 'Unknown error'}`,
    },
    500
  )
})

// ============================================================================
// Office-protected routes (require office role + platform scope)
// ============================================================================

const officeApp = new Hono()
officeApp.use('*', requireRole('office', 'platform'))

const getSlideSchema = z.object({ id: z.string().uuid() })

officeApp.get('/welcome-slides/:id', zValidator('param', getSlideSchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  const { id } = c.req.valid('param')

  if (!supabaseAdmin) {
    return c.json({ error: 'Admin client not available' }, 500)
  }

  const { data, error } = await supabaseAdmin
    .schema('cms')
    .from('welcome_slides')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return c.json({ error: 'Welcome slide not found' }, 404)
  }

  return c.json({ data: { slide: data } })
})

const createSlideSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  icon_name: z.string(),
  background_image_url: z.string().url().or(z.literal('')),
  display_order: z.number().int().positive(),
  is_active: z.boolean().default(true),
})

officeApp.post('/welcome-slides', zValidator('json', createSlideSchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  const input = c.req.valid('json')

  if (!supabaseAdmin) {
    return c.json({ error: 'Admin client not available' }, 500)
  }

  const { data, error } = await supabaseAdmin
    .schema('cms')
    .from('welcome_slides')
    .insert(input)
    .select()
    .single()

  if (error) {
    return c.json({ error: 'Failed to create slide', message: error.message }, 500)
  }

  return c.json({ data: { slide: data } }, 201)
})

const updateSlideBodySchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  icon_name: z.string().optional(),
  background_image_url: z.string().url().or(z.literal('')).optional(),
  display_order: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
})

officeApp.patch('/welcome-slides/:id', zValidator('param', getSlideSchema), zValidator('json', updateSlideBodySchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  const { id } = c.req.valid('param')
  const body = c.req.valid('json')

  if (!supabaseAdmin) {
    return c.json({ error: 'Admin client not available' }, 500)
  }

  const { data, error } = await supabaseAdmin
    .schema('cms')
    .from('welcome_slides')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return c.json({ error: 'Failed to update slide', message: error.message }, 500)
  }

  return c.json({ data: { slide: data } })
})

officeApp.delete('/welcome-slides/:id', zValidator('param', getSlideSchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  const { id } = c.req.valid('param')

  if (!supabaseAdmin) {
    return c.json({ error: 'Admin client not available' }, 500)
  }

  const { error } = await supabaseAdmin
    .schema('cms')
    .from('welcome_slides')
    .delete()
    .eq('id', id)

  if (error) {
    return c.json({ error: 'Failed to delete slide', message: error.message }, 500)
  }

  return c.json({ data: { success: true } })
})

const reorderSchema = z.object({
  slides: z.array(z.object({ id: z.string().uuid(), display_order: z.number().int().positive() })),
})

officeApp.post('/welcome-slides/reorder', zValidator('json', reorderSchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  const { slides } = c.req.valid('json')

  if (!supabaseAdmin) {
    return c.json({ error: 'Admin client not available' }, 500)
  }

  const updates = slides.map((s: { id: string; display_order: number }) =>
    supabaseAdmin
      .schema('cms')
      .from('welcome_slides')
      .update({ display_order: s.display_order })
      .eq('id', s.id)
  )

  const results = await Promise.all(updates)
  const err = results.find((r: { error?: unknown }) => r.error)
  if (err?.error) {
    return c.json({ error: 'Failed to reorder', message: (err as { error: { message?: string } }).error?.message }, 500)
  }

  return c.json({ data: { success: true } })
})

const listSchema = z.object({
  include_inactive: z.coerce.boolean().optional().default(false),
})

officeApp.get('/welcome-slides', zValidator('query', listSchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  const input = c.req.valid('query')

  if (!supabaseAdmin) {
    return c.json({ error: 'Admin client not available' }, 500)
  }

  let query = supabaseAdmin
    .schema('cms')
    .from('welcome_slides')
    .select('*')
    .order('display_order', { ascending: true })

  if (!input.include_inactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    return c.json({ error: 'Internal Server Error', message: error.message }, 500)
  }

  return c.json({ data: { slides: data } })
})

// Mount office routes
app.route('/', officeApp)

export default app
