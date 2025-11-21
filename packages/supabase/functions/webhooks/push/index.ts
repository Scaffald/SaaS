import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { corsHeaders, createCorsResponse } from '../../_shared/cors.ts'
import type { NotificationChannel } from '../../_shared/notifications/types.ts'
import {
  createServiceSupabaseClient,
  isValidDeliveryStatus,
  recordDeliveryEvent,
} from '../../_shared/notifications/utils.ts'

interface PushWebhookPayload {
  provider?: string
  ticketId?: string
  status?: string
  error?: string
  details?: Record<string, unknown>
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

  let payload: PushWebhookPayload

  try {
    payload = (await req.json()) as PushWebhookPayload
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON payload', details: `${error}` }, 400)
  }

  if (!payload.ticketId || !payload.status) {
    return jsonResponse({ error: 'Missing ticketId or status' }, 400)
  }

  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .schema('core')
    .from('notification_deliveries')
    .select('id, notification_id, channel')
    .eq('provider_msg_id', payload.ticketId)
    .maybeSingle()

  if (error || !data) {
    return jsonResponse({ error: error?.message ?? 'Delivery not found' }, 404)
  }

  const normalisedStatus = payload.status.toLowerCase()
  const statusMap: Record<string, { status?: string; event: 'accepted' | 'delivered' | 'failed' }> =
    {
      sent: { status: 'sent', event: 'accepted' },
      delivered: { status: 'delivered', event: 'delivered' },
      failed: { status: 'failed', event: 'failed' },
    }

  const mapping = statusMap[normalisedStatus]
  if (!mapping) {
    return jsonResponse({ error: `Unsupported status ${payload.status}` }, 400)
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (mapping.status && isValidDeliveryStatus(mapping.status)) {
    updates.status = mapping.status
    updates.last_error =
      mapping.status === 'failed' ? (payload.error ?? 'Push delivery failed') : null
  }

  const { error: updateError } = await supabase
    .schema('core')
    .from('notification_deliveries')
    .update(updates)
    .eq('id', data.id)

  if (updateError) {
    return jsonResponse({ error: updateError.message }, 500)
  }

  await recordDeliveryEvent({
    supabase,
    notificationId: data.notification_id,
    deliveryId: data.id,
    channel: data.channel as NotificationChannel,
    event: mapping.event,
    meta: {
      provider: payload.provider ?? 'push',
      details: payload.details,
      error: payload.error,
    },
  })

  return jsonResponse({ ok: true })
})
