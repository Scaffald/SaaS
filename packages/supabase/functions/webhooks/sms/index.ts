import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { corsHeaders, createCorsResponse } from '../../_shared/cors.ts'
import type { NotificationChannel } from '../../_shared/notifications/types.ts'
import {
  createServiceSupabaseClient,
  isValidDeliveryStatus,
  recordDeliveryEvent,
} from '../../_shared/notifications/utils.ts'

const STATUS_MAP: Record<string, { status?: string; event: 'accepted' | 'delivered' | 'failed' }> =
  {
    queued: { status: 'queued', event: 'accepted' },
    sending: { status: 'sending', event: 'accepted' },
    sent: { status: 'sent', event: 'accepted' },
    delivered: { status: 'delivered', event: 'delivered' },
    failed: { status: 'failed', event: 'failed' },
    undelivered: { status: 'failed', event: 'failed' },
  }

function parseForm(body: string): Record<string, string> {
  const params = new URLSearchParams(body)
  const result: Record<string, string> = {}
  params.forEach((value, key) => {
    result[key] = value
  })
  return result
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

  const rawBody = await req.text()

  let payload: Record<string, string>
  try {
    payload = parseForm(rawBody)
  } catch (error) {
    return jsonResponse({ error: 'Invalid Twilio payload', details: `${error}` }, 400)
  }

  const messageSid = payload.MessageSid
  const status = payload.MessageStatus?.toLowerCase()

  if (!messageSid || !status) {
    return jsonResponse({ error: 'Missing MessageSid or MessageStatus' }, 400)
  }

  const mapping = STATUS_MAP[status]
  if (!mapping) {
    return jsonResponse({ error: `Unsupported status ${status}` }, 400)
  }

  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .schema('core')
    .from('notification_deliveries')
    .select('id, notification_id, channel')
    .eq('provider_msg_id', messageSid)
    .maybeSingle()

  if (error || !data) {
    return jsonResponse({ error: error?.message ?? 'Delivery not found' }, 404)
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (mapping.status && isValidDeliveryStatus(mapping.status)) {
    updates.status = mapping.status
    updates.last_error =
      mapping.status === 'failed' ? (payload.ErrorCode ?? 'Twilio delivery failure') : null
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
      provider: 'twilio',
      payload,
    },
  })

  return jsonResponse({ ok: true })
})
