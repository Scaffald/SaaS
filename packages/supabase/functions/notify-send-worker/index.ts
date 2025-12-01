import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { corsHeaders, createCorsResponse } from '../_shared/cors.ts'
import { getAdapter } from '../_shared/notifications/adapters/index.ts'
import {
  NotificationChannel,
  NotificationDeliveryRow,
  NotificationRow,
} from '../_shared/notifications/types.ts'
import {
  calculateNextAttempt,
  createServiceSupabaseClient,
  isValidDeliveryStatus,
  recordDeliveryEvent,
} from '../_shared/notifications/utils.ts'

interface DeliveryRecord extends NotificationDeliveryRow {
  notification: NotificationRow
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

  const supabase = createServiceSupabaseClient()
  const nowIso = new Date().toISOString()

  const { data, error } = await supabase
    .schema('core')
    .from('notification_deliveries')
    .select('*, notification:notifications(*)')
    .in('status', ['queued', 'sending'])
    .or(`next_attempt_at.is.null,next_attempt_at.lte.${nowIso}`)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) {
    console.error('Failed to load pending deliveries', error)
    return jsonResponse({ error: 'Failed to load deliveries' }, 500)
  }

  const deliveries = (data ?? []) as unknown as DeliveryRecord[]
  const results: Array<{ id: number; status: string; error?: string | null }> = []

  for (const delivery of deliveries) {
    if (!delivery.notification) {
      console.warn(`Skipping delivery ${delivery.id} with missing notification reference`)
      await supabase
        .schema('core')
        .from('notification_deliveries')
        .update({
          status: 'failed',
          last_error: 'Missing notification reference',
        })
        .eq('id', delivery.id)
      results.push({ id: delivery.id, status: 'failed', error: 'Missing notification' })
      continue
    }

    const channel = delivery.channel as NotificationChannel
    const adapter = getAdapter(channel)

    const attempts = (delivery.attempts ?? 0) + 1
    const sendTimestamp = new Date().toISOString()

    const { error: updateError } = await supabase
      .schema('core')
      .from('notification_deliveries')
      .update({
        status: 'sending',
        attempts,
        updated_at: sendTimestamp,
      })
      .eq('id', delivery.id)

    if (updateError) {
      console.error('Failed to mark delivery as sending', updateError)
      results.push({
        id: delivery.id,
        status: delivery.status,
        error: updateError.message,
      })
      continue
    }

    if (!adapter) {
      console.warn(`No adapter configured for channel ${channel}`)
      await supabase
        .schema('core')
        .from('notification_deliveries')
        .update({
          status: 'failed',
          last_error: `No adapter configured for channel ${channel}`,
        })
        .eq('id', delivery.id)

      await recordDeliveryEvent({
        supabase,
        notificationId: delivery.notification_id,
        deliveryId: delivery.id,
        channel,
        event: 'failed',
        meta: { reason: 'adapter_missing' },
      })

      results.push({
        id: delivery.id,
        status: 'failed',
        error: `No adapter for ${channel}`,
      })
      continue
    }

    const adapterResult = await adapter.send({
      supabase,
      delivery: {
        ...delivery,
        attempts,
        status: 'sending',
        updated_at: sendTimestamp,
      },
      notification: delivery.notification,
    })

    const nextAttemptDate = adapterResult.status === 'retry' ? calculateNextAttempt(attempts) : null

    let finalStatus: NotificationDeliveryRow['status'] = 'sent'
    let lastError: string | null = null

    if (adapterResult.status === 'retry') {
      if (nextAttemptDate) {
        finalStatus = 'queued'
      } else {
        finalStatus = 'failed'
        lastError = adapterResult.error ?? 'Maximum retries reached'
      }
    } else if (adapterResult.status === 'failed') {
      finalStatus = 'failed'
      lastError = adapterResult.error ?? 'Unknown delivery failure'
    } else {
      finalStatus = 'sent'
    }

    if (!isValidDeliveryStatus(finalStatus)) {
      finalStatus = 'failed'
    }

    const { error: finalizeError } = await supabase
      .schema('core')
      .from('notification_deliveries')
      .update({
        status: finalStatus,
        provider_msg_id: adapterResult.providerMessageId ?? undefined,
        last_error: lastError ?? null,
        next_attempt_at: nextAttemptDate ? nextAttemptDate.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', delivery.id)

    if (finalizeError) {
      console.error('Failed to update delivery status', finalizeError)
      results.push({
        id: delivery.id,
        status: 'error',
        error: finalizeError.message,
      })
      continue
    }

    if (adapterResult.events) {
      for (const eventRecord of adapterResult.events) {
        await recordDeliveryEvent({
          supabase,
          notificationId: delivery.notification_id,
          deliveryId: delivery.id,
          channel,
          event: eventRecord.kind,
          meta: eventRecord.meta ?? null,
        })
      }
    }

    if (finalStatus === 'failed') {
      await recordDeliveryEvent({
        supabase,
        notificationId: delivery.notification_id,
        deliveryId: delivery.id,
        channel,
        event: 'failed',
        meta: lastError ? { message: lastError } : null,
      })
    }

    results.push({ id: delivery.id, status: finalStatus, error: lastError })
  }

  return jsonResponse({ ok: true, processed: results.length, results })
})
