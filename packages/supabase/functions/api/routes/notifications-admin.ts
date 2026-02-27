/**
 * Notifications Admin REST API
 * Office role required. Monitor deliveries and digest queue.
 * Migrated from tRPC notifications.admin.deliveries / digestQueue.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { requireRole } from '../middleware/auth.ts'

const notificationSelection = `
  id,
  user_id,
  type,
  severity,
  title,
  message,
  preview,
  body,
  metadata,
  read,
  read_at,
  archived_at,
  routed_channels,
  cta_label,
  cta_url,
  created_at,
  updated_at
`

const app = new Hono()
app.use('*', requireRole('office', 'platform'))

app.get(
  '/deliveries',
  zValidator(
    'query',
    z.object({
      status: z
        .enum(['all', 'queued', 'sending', 'sent', 'delivered', 'failed', 'bounce', 'blocked'])
        .default('queued'),
      limit: z.coerce.number().int().min(1).max(200).default(100),
    })
  ),
  async (c) => {
    const supabase = c.get('supabase')
    if (!supabase) return c.json({ error: 'Unauthorized' }, 401)

    const { status, limit } = c.req.valid('query')

    let query = supabase
      .schema('core')
      .from('notification_deliveries')
      .select(
        `
        id,
        notification_id,
        channel,
        provider,
        provider_msg_id,
        status,
        attempts,
        last_error,
        next_attempt_at,
        metadata,
        created_at,
        updated_at,
        notification:notifications(${notificationSelection})
      `
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      return c.json({ error: `Failed to load deliveries: ${error.message}` }, 500)
    }

    return c.json(data ?? [])
  }
)

app.get(
  '/digest-queue',
  zValidator(
    'query',
    z.object({
      limit: z.coerce.number().int().min(1).max(200).default(100),
    })
  ),
  async (c) => {
    const supabase = c.get('supabase')
    if (!supabase) return c.json({ error: 'Unauthorized' }, 401)

    const { limit } = c.req.valid('query')

    const { data, error } = await supabase
      .schema('core')
      .from('notification_digest_queue')
      .select(
        'id, user_id, type, bucket, count, channels, examples, last_event_at, processed_at, updated_at'
      )
      .order('last_event_at', { ascending: false })
      .limit(limit)

    if (error) {
      return c.json({ error: `Failed to load digest queue: ${error.message}` }, 500)
    }

    return c.json(data ?? [])
  }
)

export default app
