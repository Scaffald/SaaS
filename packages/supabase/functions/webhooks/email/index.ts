import { serve } from 'https://deno.land/std@0.223.0/http/server'

import { corsHeaders, createCorsResponse } from '../../_shared/cors'
import type { NotificationChannel } from '../../_shared/notifications/types'
import {
  createServiceSupabaseClient,
  isValidDeliveryStatus,
  recordDeliveryEvent,
} from '../../_shared/notifications/utils.ts'

type SendGridEvent = {
  event?: string
  sg_message_id?: string
  email?: string
  timestamp?: number
  reason?: string
  response?: string
  [key: string]: unknown
}

const eventToStatusMap: Record<
  string,
  {
    status?: string
    event: 'accepted' | 'delivered' | 'opened' | 'clicked' | 'failed'
    severity?: 'error' | 'info'
  }
> = {
  processed: { status: 'sent', event: 'accepted' },
  delivered: { status: 'delivered', event: 'delivered' },
  open: { event: 'opened' },
  click: { event: 'clicked' },
  bounce: { status: 'failed', event: 'failed', severity: 'error' },
  dropped: { status: 'failed', event: 'failed', severity: 'error' },
  spamreport: { status: 'failed', event: 'failed', severity: 'error' },
}

function extractMessageId(raw?: string): string | null {
  if (!raw) return null
  return raw.split('.')[0] ?? raw
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return createCorsResponse('ok')
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  let payload: SendGridEvent[] = []

  try {
    const raw = await req.json()
    payload = Array.isArray(raw) ? (raw as SendGridEvent[]) : [raw as SendGridEvent]
  } catch (error) {
    return jsonResponse({ error: 'Invalid SendGrid payload', details: `${error}` }, 400)
  }

  const supabase = createServiceSupabaseClient()
  const handled: Array<{ messageId: string; event: string; status?: string; error?: string }> = []

  for (const event of payload) {
    const messageId = extractMessageId(event.sg_message_id)
    const eventName = event.event?.toLowerCase()

    if (!messageId || !eventName) {
      handled.push({
        messageId: messageId ?? 'unknown',
        event: eventName ?? 'unknown',
        error: 'Missing message id or event',
      })
      continue
    }

    const mapping = eventToStatusMap[eventName]
    if (!mapping) {
      handled.push({ messageId, event: eventName, error: 'Unsupported event' })
      continue
    }

    const { data, error } = await supabase
      .schema('core')
      .from('notification_deliveries')
      .select('id, notification_id, channel, status')
      .eq('provider_msg_id', messageId)
      .maybeSingle()

    if (error || !data) {
      handled.push({ messageId, event: eventName, error: error?.message ?? 'Delivery not found' })
      continue
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (mapping.status && isValidDeliveryStatus(mapping.status)) {
      updates.status = mapping.status
      updates.last_error =
        mapping.severity === 'error'
          ? (event.reason ?? event.response ?? 'SendGrid reported delivery failure')
          : null
    }

    const { error: updateError } = await supabase
      .schema('core')
      .from('notification_deliveries')
      .update(updates)
      .eq('id', data.id)

    if (updateError) {
      handled.push({ messageId, event: eventName, error: updateError.message })
      continue
    }

    await recordDeliveryEvent({
      supabase,
      notificationId: data.notification_id,
      deliveryId: data.id,
      channel: data.channel as NotificationChannel,
      event: mapping.event,
      meta: {
        provider: 'sendgrid',
        payload: event,
      },
    })

    handled.push({ messageId, event: eventName, status: updates.status as string | undefined })
  }

  return jsonResponse({ ok: true, handled })
})
