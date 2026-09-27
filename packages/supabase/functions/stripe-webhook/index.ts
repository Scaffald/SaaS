import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { corsHeaders } from '../_shared/cors.ts'
import { createServiceSupabaseClient } from '../_shared/notifications/utils.ts'

// Type-only, with the class pulled in lazily below — the same shape
// api/routes/payments.ts uses, and for the same reason: a top-level runtime
// import is evaluated at module load, which is where this file used to call
// createFetchHttpClient() and createSubtleCryptoProvider().
//
// `stripe` resolves through packages/supabase/package.json ("stripe": "20.4.1"),
// which is how the deployed api function gets it. This file used to override
// that in its own deno.json with `"stripe": "npm:stripe@14.26.0"` — a version
// npm never published, so deno could not load the function at all (#923). That
// deno.json is gone rather than repointed: there is one Stripe version here now,
// and the function inherits functions/deno.json like its notify-* siblings.
import type Stripe from 'stripe'

type PaymentIntent = Stripe.PaymentIntent

// Matches api/routes/payments.ts and _shared/id-verification-api.ts. The old
// '2024-06-20' came with the stripe 14 pin.
const STRIPE_API_VERSION = '2025-11-17.clover' as Stripe.LatestApiVersion

let StripeClass: typeof import('stripe').default | null = null

async function getStripeClass(): Promise<typeof import('stripe').default> {
  if (!StripeClass) {
    const stripeModule = await import('stripe')
    StripeClass = stripeModule.default
  }
  return StripeClass
}

interface StripeSecrets {
  apiKey: string
  webhookSecret: string
}

async function loadStripeSecrets(): Promise<StripeSecrets> {
  const supabase = createServiceSupabaseClient()

  const { data: settings, error } = await supabase
    .schema('core')
    .from('stripe_settings')
    .select('api_key_secret_id, webhook_secret_id')
    .eq('settings_name', 'stripe')
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load stripe settings: ${error.message}`)
  }

  if (!settings?.api_key_secret_id) {
    throw new Error('Stripe API key is not configured')
  }

  if (!settings?.webhook_secret_id) {
    throw new Error('Stripe webhook secret is not configured')
  }

  const [{ data: apiKey, error: apiKeyError }, { data: webhookSecret, error: webhookError }] =
    await Promise.all([
      supabase.schema('core').rpc('get_secret_value', { p_secret_id: settings.api_key_secret_id }),
      supabase.schema('core').rpc('get_secret_value', { p_secret_id: settings.webhook_secret_id }),
    ])

  if (apiKeyError || !apiKey) {
    throw new Error(
      apiKeyError
        ? `Failed to read API key: ${apiKeyError.message}`
        : 'Stripe API key secret missing'
    )
  }

  if (webhookError || !webhookSecret) {
    throw new Error(
      webhookError
        ? `Failed to read webhook secret: ${webhookError.message}`
        : 'Stripe webhook secret missing'
    )
  }

  return {
    apiKey,
    webhookSecret,
  }
}

async function getTransactionByIntent(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  intentId: string
) {
  const { data, error } = await supabase
    .schema('core')
    .from('payment_transactions')
    .select('*')
    .eq('stripe_payment_intent_id', intentId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load payment transaction: ${error.message}`)
  }

  return data ?? null
}

function mergeMetadata(current: Record<string, unknown> | null, updates: Record<string, unknown>) {
  return {
    ...(current ?? {}),
    ...updates,
  }
}

async function updateTransaction(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  intent: PaymentIntent,
  event: Stripe.Event,
  status: 'succeeded' | 'failed' | 'cancelled',
  failureReason?: string | null
) {
  const existing = await getTransactionByIntent(supabase, intent.id)

  if (!existing) {
    console.warn('[stripe-webhook] payment transaction not found', { intentId: intent.id })
    return
  }

  const currentMetadata = (existing.metadata ?? {}) as Record<string, unknown>
  if (currentMetadata.last_stripe_event_id === event.id) {
    return
  }

  const nowIso = new Date().toISOString()
  const updates: Record<string, unknown> = {
    status,
    metadata: mergeMetadata(currentMetadata, {
      last_stripe_event_id: event.id,
      last_stripe_event_type: event.type,
      last_stripe_event_at: new Date(event.created * 1000).toISOString(),
    }),
  }

  if (status === 'succeeded') {
    updates.succeeded_at = new Date(intent.created * 1000).toISOString()
    updates.failed_at = null
    updates.failure_reason = null
  } else if (status === 'failed') {
    updates.failed_at = nowIso
    updates.failure_reason = failureReason ?? intent.last_payment_error?.message ?? null
  } else if (status === 'cancelled') {
    updates.failed_at = updates.failed_at ?? nowIso
    updates.failure_reason = failureReason ?? intent.cancellation_reason ?? 'cancelled'
  }

  const { error } = await supabase
    .schema('core')
    .from('payment_transactions')
    .update(updates)
    .eq('id', existing.id)

  if (error) {
    throw new Error(`Failed to update payment transaction: ${error.message}`)
  }
}

async function handleStripeEvent(
  supabase: ReturnType<typeof createServiceSupabaseClient>,
  event: Stripe.Event
) {
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const intent = event.data.object as PaymentIntent
      await updateTransaction(supabase, intent, event, 'succeeded')
      break
    }
    case 'payment_intent.payment_failed': {
      const intent = event.data.object as PaymentIntent
      const failure = intent.last_payment_error?.message ?? 'Payment failed'
      await updateTransaction(supabase, intent, event, 'failed', failure)
      break
    }
    case 'payment_intent.canceled': {
      const intent = event.data.object as PaymentIntent
      const failure = intent.cancellation_reason ?? 'cancelled'
      await updateTransaction(supabase, intent, event, 'cancelled', failure)
      break
    }
    default:
      console.warn('[stripe-webhook] unhandled event type', event.type)
  }
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

  let secrets: StripeSecrets
  try {
    secrets = await loadStripeSecrets()
  } catch (error) {
    console.error('[stripe-webhook] failed to load secrets', error)
    return new Response(
      JSON.stringify({ error: (error as Error).message ?? 'secrets_unavailable' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }

  const Stripe = await getStripeClass()
  const stripe = new Stripe(secrets.apiKey, {
    apiVersion: STRIPE_API_VERSION,
    httpClient: Stripe.createFetchHttpClient(),
  })
  const cryptoProvider = Stripe.createSubtleCryptoProvider()

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

  const supabase = createServiceSupabaseClient()

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
