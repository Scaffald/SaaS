import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { corsHeaders } from '../_shared/cors.ts'
import { createServiceSupabaseClient } from '../_shared/notifications/utils.ts'
import {
  type SettlementEvent,
  type SettlementStatus,
  settlePaymentIntent,
} from '../_shared/payments/settlement.ts'
import {
  createStripeApiClient,
  getStripeClass,
  type StripeSecrets,
  loadStripeSecrets,
} from '../_shared/payments/stripe-client.ts'

// Type-only, with the class pulled in lazily by _shared/payments/stripe-client
// — see the comment there for why. `stripe` resolves through
// packages/supabase/package.json ("stripe": "20.4.1"), which is how the
// deployed api function gets it. This file used to override that in its own
// deno.json with `"stripe": "npm:stripe@14.26.0"` — a version npm never
// published, so deno could not load the function at all (#923). That deno.json
// is gone rather than repointed: there is one Stripe version here now, and the
// function inherits functions/deno.json like its notify-* siblings.
import type Stripe from 'stripe'

type PaymentIntent = Stripe.PaymentIntent

// The ledger write and the paid-state advance both live in
// _shared/payments/settlement.ts (#948). This function used to update
// `payment_transactions` and stop there, so a successful upfront success-fee
// charge left `core.success_fees` at status 'pending' with `upfront_paid_at`
// null — the two tables disagreeing about whether the money arrived, with no
// path that would ever reconcile them. `payments-reconcile` shares the same
// module so a missed webhook settles identically to a delivered one.
async function handleStripeEvent(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  event: Stripe.Event
) {
  const settlementEvent: SettlementEvent = {
    source: 'stripe-webhook',
    eventId: event.id,
    eventType: event.type,
    eventAtIso: new Date(event.created * 1000).toISOString(),
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as PaymentIntent
      await settle(supabase, intent, 'succeeded', settlementEvent)
      break
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as PaymentIntent
      const failure = intent.last_payment_error?.message ?? 'Payment failed'
      await settle(supabase, intent, 'failed', settlementEvent, failure)
      break
    }
    case 'payment_intent.canceled': {
      const intent = event.data.object as PaymentIntent
      const failure = intent.cancellation_reason ?? 'cancelled'
      await settle(supabase, intent, 'cancelled', settlementEvent, failure)
      break
    }
    default:
      console.warn('[stripe-webhook] unhandled event type', event.type)
  }
}

async function settle(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  intent: PaymentIntent,
  status: SettlementStatus,
  event: SettlementEvent,
  failureReason?: string | null
) {
  const outcome = await settlePaymentIntent(supabase, intent, status, event, failureReason)

  if (outcome.result === 'not_found') {
    console.warn('[stripe-webhook] no ledger row for intent', { intentId: intent.id })
    return
  }

  console.info('[stripe-webhook] settled', {
    intentId: outcome.intentId,
    status,
    result: outcome.result,
    advanced: outcome.advanced,
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  const supabase = createServiceSupabaseClient()

  let secrets: StripeSecrets
  try {
    secrets = await loadStripeSecrets(supabase)
  } catch (error) {
    console.error('[stripe-webhook] failed to load secrets', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? 'secrets_unavailable' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  const stripe = await createStripeApiClient(secrets.apiKey)
  const cryptoProvider = (await getStripeClass()).createSubtleCryptoProvider()

  const signature = req.headers.get('Stripe-Signature')
  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature ?? '',
      secrets.webhookSecret,
      undefined,
      cryptoProvider
    )
  } catch (error) {
    console.error('[stripe-webhook] signature verification failed', error)
    return new Response(JSON.stringify({ error: 'invalid_signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }

  try {
    await handleStripeEvent(supabase, event)
  } catch (error) {
    console.error('[stripe-webhook] event handling error', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? 'event_handling_failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
})
