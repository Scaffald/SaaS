/**
 * Office Certifications REST API
 * Office role required. Manages certification catalog (create/update/deactivate).
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth.ts'

const app = new Hono()
app.use('*', authMiddleware)
app.use('*', requireRole('office', 'platform'))

const createBodySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  issuing_organization: z.string().optional(),
  category: z.enum(['safety', 'trade', 'equipment', 'license', 'management', 'other']),
  description: z.string().optional(),
  typical_duration_days: z.number().int().positive().optional(),
  requires_renewal: z.boolean().default(false),
  renewal_period_months: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const updateBodySchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  issuing_organization: z.string().optional(),
  category: z.enum(['safety', 'trade', 'equipment', 'license', 'management', 'other']).optional(),
  description: z.string().optional(),
  typical_duration_days: z.number().int().positive().optional(),
  requires_renewal: z.boolean().optional(),
  renewal_period_months: z.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// POST / - Create certification
app.post('/', zValidator('json', createBodySchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')

  if (!supabaseAdmin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const input = c.req.valid('json')

  const { data, error } = await supabaseAdmin
    .from('certifications')
    .insert({ ...input, is_active: true })
    .select()
    .single()

  if (error) {
    return c.json({ error: 'Failed to create certification', message: error.message }, 500)
  }

  return c.json({ certification: data }, 201)
})

// PATCH /:id - Update certification
app.patch('/:id', zValidator('json', updateBodySchema), async (c) => {
  const supabaseAdmin = c.get('supabaseAdmin')
  const { id } = c.req.param()

  if (!supabaseAdmin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const input = c.req.valid('json')

  const { data, error } = await supabaseAdmin
    .from('certifications')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return c.json({ error: 'Failed to update certification', message: error.message }, 500)
  }

  return c.json({ certification: data })
})

export default app
