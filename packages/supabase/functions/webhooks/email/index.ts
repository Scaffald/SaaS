import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { corsHeaders, createCorsResponse } from '../../_shared/cors.ts'
import type { NotificationChannel } from '../../_shared/notifications/types.ts'
import {
  createServiceSupabaseClient,
  isValidDeliveryStatus,
  recordDeliveryEvent,
} from '../../_shared/notifications/utils.ts'
import {
  type NevarMailEmailEvent,
  nevarMailWebhookHeaders,
  verifyNevarMailWebhook,
} from '../../_shared/nevarmail.ts'
import { applyDeliveryEvent, applyInviteEvent } from './nevarmail-events.ts'

/**
 * Email delivery-event webhook: NevarMail (X-Webhook-* headers, epic #1399)
 * and, until #1391 removes it, Resend (svix-* headers).
 *
 * NevarMail events are matched to a worker invite (#1393), else to a
 * notification delivery by provider_msg_id (#1389).
 *
 * Resend delivery events:
 *
 * Resend posts one event object per request (SendGrid batched an array), and
 * identifies the message as `data.email_id` — the same id the send call returns
 * and that we store as `provider_msg_id`.
 */
type ResendEvent = {
  type?: string
  created_at?: string
  data?: {
    email_id?: string
    to?: string[]
    // Present on bounce/complaint.
    bounce?: { message?: string; type?: string }
    reason?: string
    [key: string]: unknown
  }
}

const eventToStatusMap: Record<
  string,
  {
    status?: string
    event: 'accepted' | 'delivered' | 'opened' | 'clicked' | 'failed'
    severity?: 'error' | 'info'
  }
> = {
  'email.sent': { status: 'sent', event: 'accepted' },
  'email.delivered': { status: 'delivered', event: 'delivered' },
  'email.opened': { event: 'opened' },
  'email.clicked': { event: 'clicked' },
  'email.bounced': { status: 'failed', event: 'failed', severity: 'error' },
  'email.complained': { status: 'failed', event: 'failed', severity: 'error' },
  // Delayed is not yet a failure — Resend retries — so status is left alone.
  'email.delivery_delayed': { event: 'accepted', severity: 'info' },
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

/**
 * Verify the Svix signature Resend sends.
 *
 * The SendGrid version of this handler took delivery statuses from anyone who
 * could find the URL. Signed content is `${id}.${timestamp}.${body}`, and the
 * header carries space-separated `v1,<base64>` pairs so keys can be rotated.
 */
async function isValidSignature(req: Request, rawBody: string): Promise<boolean> {
  const secret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  if (!secret) {
    console.warn('[webhooks/email] RESEND_WEBHOOK_SECRET is not set; refusing unverified event')
    return false
  }

  const id = req.headers.get('svix-id')
  const timestamp = req.headers.get('svix-timestamp')
  const signature = req.headers.get('svix-signature')
  if (!id || !timestamp || !signature) return false

  // Reject anything older than five minutes so a captured request cannot be
  // replayed indefinitely.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  // The portion after `whsec_` is base64; the raw bytes are the HMAC key.
  const keyBytes = Uint8Array.from(atob(secret.replace(/^whsec_/, '')), (c) => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${id}.${timestamp}.${rawBody}`)
  )
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)))

  return signature
    .split(' ')
    .map((part) => part.split(',')[1])
    .some((candidate) => candidate === expected)
}

/** NevarMail: Standard Webhooks signature keyed by the secret's text (see _shared/nevarmail.ts). */
async function handleNevarMail(req: Request, rawBody: string): Promise<Response> {
  const secret = Deno.env.get('NEVARMAIL_WEBHOOK_SECRET')
  if (!secret) {
    console.warn('[webhooks/email] NEVARMAIL_WEBHOOK_SECRET is not set; refusing unverified event')
    return jsonResponse({ error: 'Invalid signature' }, 401)
  }
  if (!(await verifyNevarMailWebhook(secret, nevarMailWebhookHeaders(req.headers), rawBody))) {
    return jsonResponse({ error: 'Invalid signature' }, 401)
  }

  let event: NevarMailEmailEvent
  try {
    event = JSON.parse(rawBody) as NevarMailEmailEvent
  } catch (error) {
    return jsonResponse({ error: 'Invalid NevarMail payload', details: `${error}` }, 400)
  }
  if (!event.type?.startsWith('email.')) {
    // contact.* / domain.* — acknowledged so NevarMail does not retry.
    return jsonResponse({ ok: true, ignored: event.type ?? null })
  }

  const supabase = createServiceSupabaseClient()
  try {
    const invite = await applyInviteEvent(supabase, event)
    if (invite.matched) {
      return jsonResponse({ ok: true, event: event.type, invitationId: invite.invitationId, changed: invite.changed })
    }
    const delivery = await applyDeliveryEvent(supabase, event)
    if (delivery.matched) {
      return jsonResponse({ ok: true, event: event.type, deliveryId: delivery.deliveryId, status: delivery.status })
    }
  } catch (error) {
    console.error('[webhooks/email] NevarMail event failed:', (error as Error).message)
    return jsonResponse({ ok: false, error: 'Could not record event' }, 500)
  }
  // Neither ours nor an id we know: acknowledged (200) so NevarMail does not retry.
  return jsonResponse({ ok: true, event: event.type, matched: false })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return createCorsResponse('ok')
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // Read the body as text: the signature covers the exact bytes, so it has to
  // be verified before parsing.
  const rawBody = await req.text()

  if (req.headers.get('x-webhook-id')) {
    return await handleNevarMail(req, rawBody)
  }

  if (!(await isValidSignature(req, rawBody))) {
    return jsonResponse({ error: 'Invalid signature' }, 401)
  }

  let event: ResendEvent
  try {
    event = JSON.parse(rawBody) as ResendEvent
  } catch (error) {
    return jsonResponse({ error: 'Invalid Resend payload', details: `${error}` }, 400)
  }

  const messageId = event.data?.email_id
  const eventName = event.type?.toLowerCase()

  if (!messageId || !eventName) {
    return jsonResponse({ error: 'Missing message id or event type' }, 400)
  }

  const mapping = eventToStatusMap[eventName]
  if (!mapping) {
    // Acknowledge so Resend does not retry an event we simply do not model.
    return jsonResponse({ ok: true, ignored: eventName })
  }

  const supabase = createServiceSupabaseClient()

  const { data, error } = await supabase
    .schema('core')
    .from('notification_deliveries')
    .select('id, notification_id, channel, status')
    .eq('provider_msg_id', messageId)
    .maybeSingle()

  if (error || !data) {
    return jsonResponse(
      { ok: false, messageId, event: eventName, error: error?.message ?? 'Delivery not found' },
      404
    )
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (mapping.status && isValidDeliveryStatus(mapping.status)) {
    updates.status = mapping.status
    updates.last_error =
      mapping.severity === 'error'
        ? (event.data?.bounce?.message ?? event.data?.reason ?? 'Resend reported delivery failure')
        : null
  }

  const { error: updateError } = await supabase
    .schema('core')
    .from('notification_deliveries')
    .update(updates)
    .eq('id', data.id)

  if (updateError) {
    return jsonResponse({ ok: false, messageId, event: eventName, error: updateError.message }, 500)
  }

  await recordDeliveryEvent({
    supabase,
    notificationId: data.notification_id,
    deliveryId: data.id,
    channel: data.channel as NotificationChannel,
    event: mapping.event,
    meta: {
      provider: 'resend',
      payload: event,
    },
  })

  return jsonResponse({ ok: true, messageId, event: eventName, status: updates.status })
})
