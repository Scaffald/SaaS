import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'
import { Expo } from 'https://esm.sh/expo-server-sdk@4.9.1'

import { corsHeaders, createCorsResponse } from '../_shared/cors.ts'
import { NotificationChannel } from '../_shared/notifications/types.ts'
import {
  chunkArray,
  createServiceSupabaseClient,
  normalizeMetadata,
  recordDeliveryEvent,
} from '../_shared/notifications/utils.ts'

const expo = new Expo({
  accessToken: Deno.env.get('EXPO_ACCESS_TOKEN') ?? undefined,
})

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

  const { data, error } = await supabase
    .schema('core')
    .from('notification_deliveries')
    .select('id, notification_id, provider_msg_id, metadata, status')
    .eq('channel', 'push' satisfies NotificationChannel)
    .in('status', ['sent', 'sending'])
    .not('provider_msg_id', 'is', null)
    .lte('created_at', new Date(Date.now() - 5_000).toISOString())
    .limit(300)

  if (error) {
    console.error('Failed to fetch push deliveries', error)
    return jsonResponse({ error: 'Failed to fetch push receipts' }, 500)
  }

  const deliveries = data ?? []

  if (deliveries.length === 0) {
    return jsonResponse({ ok: true, processed: 0 })
  }

  const receiptMap = new Map<string, (typeof deliveries)[number]>()
  const ticketIds: string[] = []

  for (const delivery of deliveries) {
    const ticketId = delivery.provider_msg_id
    if (!ticketId) continue
    receiptMap.set(ticketId, delivery)
    ticketIds.push(ticketId)
  }

  const chunks = chunkArray(ticketIds, 300)
  let processed = 0
  let failures = 0

  for (const chunk of chunks) {
    try {
      const receipts = await expo.getPushNotificationReceiptsAsync(chunk)

      for (const [receiptId, receipt] of Object.entries(receipts)) {
        const delivery = receiptMap.get(receiptId)
        if (!delivery) continue

        processed += 1

        if (receipt.status === 'ok') {
          const { error: updateError } = await supabase
            .schema('core')
            .from('notification_deliveries')
            .update({
              status: 'delivered',
              updated_at: new Date().toISOString(),
            })
            .eq('id', delivery.id)

          if (updateError) {
            console.error('Failed to mark delivery as delivered', updateError)
          }

          await recordDeliveryEvent({
            supabase,
            notificationId: delivery.notification_id,
            deliveryId: delivery.id,
            channel: 'push',
            event: 'delivered',
            meta: { ticketId: receiptId },
          })
          continue
        }

        failures += 1
        const errorDetails = receipt.details ?? {}
        const errorMessage = receipt.message ?? 'Unknown push delivery failure'

        const { error: failUpdate } = await supabase
          .schema('core')
          .from('notification_deliveries')
          .update({
            status: 'failed',
            last_error: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', delivery.id)

        if (failUpdate) {
          console.error('Failed to mark delivery as failed', failUpdate)
        }

        await recordDeliveryEvent({
          supabase,
          notificationId: delivery.notification_id,
          deliveryId: delivery.id,
          channel: 'push',
          event: 'failed',
          meta: { receipt: receipt, ticketId: receiptId },
        })

        if (errorDetails.error === 'DeviceNotRegistered') {
          const metadata = normalizeMetadata(delivery.metadata)
          const token = typeof metadata.token === 'string' ? metadata.token : null

          if (token) {
            const { error: deleteError } = await supabase
              .schema('core')
              .from('notification_devices')
              .delete()
              .eq('token', token)

            if (deleteError) {
              console.error('Failed to remove invalid device token', deleteError)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch Expo receipts', error)
      return jsonResponse({ error: 'Failed to fetch Expo receipts' }, 500)
    }
  }

  return jsonResponse({ ok: true, processed, failures })
})
