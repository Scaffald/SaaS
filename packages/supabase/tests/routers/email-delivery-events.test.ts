/// <reference lib="deno.ns" />

/**
 * NevarMail delivery events → notification deliveries (#1389), against the
 * real local database. The webhook's signature check and routing are covered
 * by the invite tests; this is the mapping from an `email.*` event to the
 * delivery whose provider_msg_id is the event's `email_id`.
 */
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { disposePersonas, getPersonas } from '../shared/personas.ts'
import { createAdminClient } from '../shared/setup.ts'
import { applyDeliveryEvent } from '../../functions/webhooks/email/nevarmail-events.ts'
import type { NevarMailEmailEvent } from '../../functions/_shared/nevarmail.ts'

Deno.test({
  name: 'NevarMail delivery events (#1389) - status, events, never downgraded, unknown ids ignored',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA } = await getPersonas()
    const service = createAdminClient()
    const core = service.schema('core')
    const msgId = `nm-test-${crypto.randomUUID()}`
    try {
      const { data: notification, error } = await core.from('notifications')
        .insert({ user_id: userA.id, title: 'test', message: 'test' }).select('id').single()
      assertEquals(error, null)
      const { data: delivery, error: dError } = await core.from('notification_deliveries')
        .insert({ notification_id: notification!.id, channel: 'email', provider: 'nevarmail', provider_msg_id: msgId, status: 'sending' })
        .select('id').single()
      assertEquals(dError, null)

      const event = (type: NevarMailEmailEvent['type'], extra: Partial<NevarMailEmailEvent> = {}): NevarMailEmailEvent => ({
        type,
        email_id: msgId,
        occurred_at: new Date().toISOString(),
        project_id: 'p',
        campaign_send_id: null,
        recipient: 'jo@example.com',
        send_mode: 'transactional',
        ...extra,
      })
      const row = async () =>
        (await core.from('notification_deliveries').select('status, last_error').eq('id', delivery!.id).single()).data

      assertEquals(await applyDeliveryEvent(service, event('email.sent')), { matched: true, deliveryId: delivery!.id, status: 'sent' })
      assertEquals(await row(), { status: 'sent', last_error: null })

      assertEquals((await applyDeliveryEvent(service, event('email.delivered'))).matched, true)
      assertEquals((await row())?.status, 'delivered')

      // A late `sent` and an open leave `delivered` alone.
      assertEquals(await applyDeliveryEvent(service, event('email.sent')), { matched: true, deliveryId: delivery!.id, status: null })
      assertEquals(await applyDeliveryEvent(service, event('email.opened')), { matched: true, deliveryId: delivery!.id, status: null })
      await applyDeliveryEvent(service, event('email.clicked', { url: 'https://scaffald.com/jobs' }))
      assertEquals((await row())?.status, 'delivered')

      const { data: events } = await core.from('notification_events')
        .select('event, channel, meta').eq('delivery_id', delivery!.id).order('id')
      assertEquals(events?.map((e) => e.event), ['accepted', 'delivered', 'accepted', 'opened', 'clicked'])
      assertEquals(events?.[4].channel, 'email')
      assertEquals(events?.[4].meta, { provider: 'nevarmail', type: 'email.clicked', url: 'https://scaffald.com/jobs' })

      // Not ours, or not modelled: nothing written, acknowledged by the caller.
      assertEquals(await applyDeliveryEvent(service, event('email.opened', { email_id: 'nm-unknown' })), { matched: false })
      assertEquals(await applyDeliveryEvent(service, event('email.opened', { email_id: null })), { matched: false })
      assertEquals(await applyDeliveryEvent(service, event('email.unsubscribed')), { matched: false, ignored: true })

      // A second delivery that bounces: failure status and reason recorded.
      const bounceId = `${msgId}-b`
      const { data: bounced } = await core.from('notification_deliveries')
        .insert({ notification_id: notification!.id, channel: 'email', provider: 'nevarmail', provider_msg_id: bounceId, status: 'sent' })
        .select('id').single()
      await applyDeliveryEvent(service, event('email.bounced', { email_id: bounceId, reason: '550 mailbox unavailable' }))
      const { data: b } = await core.from('notification_deliveries').select('status, last_error').eq('id', bounced!.id).single()
      assertEquals(b, { status: 'bounce', last_error: '550 mailbox unavailable' })
      const { data: bEvents } = await core.from('notification_events').select('event').eq('delivery_id', bounced!.id)
      assertEquals(bEvents?.map((e) => e.event), ['bounce'])
    } finally {
      await core.from('notifications').delete().eq('user_id', userA.id)
      await disposePersonas()
    }
  },
})
