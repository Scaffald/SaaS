/**
 * The stripe-webhook handler, apart from `serve` so it can be tested (#1259).
 *
 * Order matters, and it changed in #1259:
 *   1. No `Stripe-Signature` header → 400, before any secret is read. It used
 *      to load secrets first, so an unsigned request answered 500 whenever
 *      Stripe was unconfigured, which reads as an outage, not a bad request.
 *   2. Secrets unavailable → 503 (not configured), not 500.
 *   3. Signature verified with the stored webhook secret → 400 if it fails.
 *   4. The event is applied through _shared/payments/settlement.ts, which the
 *      reconcile sweep shares (#948).
 *
 * New in #1259: refunds (`charge.refunded`) and disputes (`charge.dispute.*`).
 * Before, a refunded success fee kept the candidate's contact unlocked and a
 * refunded ID check kept its badge.
 */

import type Stripe from 'stripe'

import { corsHeaders } from '../_shared/cors.ts'
import type { NotificationSupabaseClient } from '../_shared/notifications/types.ts'
import {
  recordDispute,
  reversePaymentIntent,
  type SettlementEvent,
  type SettlementStatus,
  settlePaymentIntent,
} from '../_shared/payments/settlement.ts'
import type { StripeSecrets } from '../_shared/payments/stripe-client.ts'

export interface WebhookDeps {
  supabase: NotificationSupabaseClient
  loadSecrets: () => Promise<StripeSecrets>
  /** A Stripe client for signature verification. */
  createStripe: (apiKey: string) => Promise<Stripe>
  cryptoProvider: () => Promise<Stripe.CryptoProvider>
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })

export async function handleStripeWebhook(req: Request, deps: WebhookDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const signature = req.headers.get('Stripe-Signature')
  if (!signature) return json({ error: 'missing_signature' }, 400)

  let secrets: StripeSecrets
  try {
    secrets = await deps.loadSecrets()
  } catch (error) {
    console.error('[stripe-webhook] Stripe is not configured', error)
    return json({ error: 'stripe_not_configured' }, 503)
  }

  const rawBody = await req.text()
  let event: Stripe.Event
  try {
    const stripe = await deps.createStripe(secrets.apiKey)
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      secrets.webhookSecret,
      undefined,
      await deps.cryptoProvider()
    )
  } catch (error) {
    console.error('[stripe-webhook] signature verification failed', error)
    return json({ error: 'invalid_signature' }, 400)
  }

  try {
    await applyEvent(deps.supabase, event)
  } catch (error) {
    console.error('[stripe-webhook] event handling error', error)
    return json({ error: (error as Error).message ?? 'event_handling_failed' }, 500)
  }
  return json({ received: true }, 200)
}

function intentIdOf(value: string | Stripe.PaymentIntent | null): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}

export async function applyEvent(supabase: NotificationSupabaseClient, event: Stripe.Event) {
  const settlementEvent: SettlementEvent = {
    source: 'stripe-webhook',
    eventId: event.id,
    eventType: event.type,
    eventAtIso: new Date(event.created * 1000).toISOString(),
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
    case 'payment_intent.payment_failed':
    case 'payment_intent.canceled': {
      const intent = event.data.object as Stripe.PaymentIntent
      const status: SettlementStatus =
        event.type === 'payment_intent.succeeded'
          ? 'succeeded'
          : event.type === 'payment_intent.canceled'
            ? 'cancelled'
            : 'failed'
      const failure =
        status === 'failed'
          ? (intent.last_payment_error?.message ?? 'Payment failed')
          : status === 'cancelled'
            ? (intent.cancellation_reason ?? 'cancelled')
            : null
      const outcome = await settlePaymentIntent(supabase, intent, status, settlementEvent, failure)
      log(outcome.result, { intentId: intent.id, status, advanced: outcome.advanced })
      return
    }
    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge
      const intentId = intentIdOf(charge.payment_intent)
      if (!intentId) return log('not_found', { chargeId: charge.id })
      const outcome = await reversePaymentIntent(
        supabase,
        {
          intentId,
          full: charge.refunded === true,
          amountRefundedCents: charge.amount_refunded ?? 0,
          reason: 'refunded',
        },
        settlementEvent
      )
      log(outcome.result, { intentId, refunded: charge.refunded, reverted: outcome.reverted })
      return
    }
    case 'charge.dispute.created':
    case 'charge.dispute.updated':
    case 'charge.dispute.closed': {
      const dispute = event.data.object as Stripe.Dispute
      const intentId = intentIdOf(dispute.payment_intent)
      if (!intentId) return log('not_found', { disputeId: dispute.id })
      const outcome = await recordDispute(
        supabase,
        {
          intentId,
          disputeId: dispute.id,
          status: dispute.status,
          reason: dispute.reason,
          amountCents: dispute.amount,
        },
        settlementEvent
      )
      log(outcome.result, { intentId, disputeStatus: dispute.status, reverted: outcome.reverted })
      return
    }
    default:
      console.warn('[stripe-webhook] unhandled event type', event.type)
  }
}

function log(result: string, details: Record<string, unknown>) {
  if (result === 'not_found') console.warn('[stripe-webhook] no ledger row', details)
  else console.info('[stripe-webhook] applied', { result, ...details })
}
