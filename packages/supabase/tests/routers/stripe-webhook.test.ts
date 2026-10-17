/// <reference lib="deno.ns" />

/**
 * stripe-webhook (#1259), against the real local database.
 *
 * The handler is imported directly, as payments-settlement.test.ts imports
 * settlement. Signatures are real: events are signed with Stripe's own test
 * helper and verified by the same `constructEventAsync` the function uses, so
 * nothing about verification is faked. What is injected is where the secrets
 * come from — Stripe is unconfigured locally — and the rows are fixtures.
 */

import { assert, assertEquals, assertExists } from 'std/assert'
import Stripe from 'stripe'

import { handleStripeWebhook, type WebhookDeps } from '../../functions/stripe-webhook/webhook.ts'
import { createAdminClient } from '../shared/setup.ts'

// deno-lint-ignore no-explicit-any
type AnyClient = any

const admin = createAdminClient() as AnyClient
const core = () => admin.schema('core')
const RUN = crypto.randomUUID().slice(0, 8)
const WEBHOOK_SECRET = `whsec_test_${RUN}`
const stripe = new Stripe('sk_test_local')
const crypto_ = Stripe.createSubtleCryptoProvider()

function deps(overrides: Partial<WebhookDeps> = {}): WebhookDeps & { secretsLoaded: () => number } {
  let loaded = 0
  return {
    supabase: admin,
    loadSecrets: () => {
      loaded++
      return Promise.resolve({ apiKey: 'sk_test_local', webhookSecret: WEBHOOK_SECRET })
    },
    createStripe: () => Promise.resolve(stripe),
    cryptoProvider: () => Promise.resolve(crypto_),
    secretsLoaded: () => loaded,
    ...overrides,
  }
}

async function signedRequest(event: Record<string, unknown>): Promise<Request> {
  const payload = JSON.stringify(event)
  const header = await stripe.webhooks.generateTestHeaderStringAsync({
    payload,
    secret: WEBHOOK_SECRET,
    cryptoProvider: crypto_,
  })
  return new Request('http://local/stripe-webhook', {
    method: 'POST',
    headers: { 'Stripe-Signature': header, 'Content-Type': 'application/json' },
    body: payload,
  })
}

const stripeEvent = (type: string, object: Record<string, unknown>) => ({
  id: `evt_${crypto.randomUUID().replaceAll('-', '')}`,
  object: 'event',
  type,
  created: Math.floor(Date.now() / 1000),
  data: { object },
  api_version: '2025-11-17.clover',
  livemode: false,
  pending_webhooks: 0,
  request: null,
})

/** A paid success fee: org, fee (completed), succeeded ledger row. */
async function paidFeeFixture(label: string) {
  const intentId = `pi_${RUN}_${label}`
  const { data: org } = await core()
    .from('organizations')
    .insert({ name: `webhook-${RUN}-${label}`, slug: `webhook-${RUN}-${label}` })
    .select('id')
    .single()
  const { data: fee, error: feeError } = await core()
    .from('success_fees')
    .insert({
      organization_id: org.id,
      total_hire_value_cents: 1_000_000,
      fee_percentage: 10,
      total_fee_cents: 100_000,
      payment_schedule: 'single',
      upfront_percentage: 100,
      upfront_amount_cents: 100_000,
      final_percentage: 0,
      final_amount_cents: 0,
      final_payment_due_date: '2026-11-01',
      hire_start_date: '2026-11-01',
      hire_confirmed_at: '2026-10-17T12:00:00Z',
      upfront_payment_intent_id: intentId,
      upfront_paid_at: '2026-10-17T12:00:00Z',
      status: 'completed',
    })
    .select('id')
    .single()
  if (feeError) throw new Error(`fee fixture: ${feeError.message}`)
  const { data: tx, error: txError } = await core()
    .from('payment_transactions')
    .insert({
      organization_id: org.id,
      amount_cents: 100_000,
      currency: 'usd',
      transaction_type: 'success_fee_upfront',
      success_fee_id: fee.id,
      stripe_payment_intent_id: intentId,
      status: 'succeeded',
      succeeded_at: '2026-10-17T12:00:00Z',
    })
    .select('id')
    .single()
  if (txError) throw new Error(`ledger fixture: ${txError.message}`)
  return {
    intentId,
    feeId: fee.id as string,
    txId: tx.id as string,
    cleanup: async () => {
      await core().from('payment_transactions').delete().eq('id', tx.id)
      await core().from('success_fees').delete().eq('id', fee.id)
      await core().from('organizations').delete().eq('id', org.id)
    },
  }
}

const readTx = async (id: string) =>
  (await core().from('payment_transactions').select('status, metadata').eq('id', id).single()).data
const readFee = async (id: string) =>
  (await core().from('success_fees').select('status').eq('id', id).single()).data

Deno.test('stripe-webhook refuses an unsigned request before reading any secret (#1259)', async () => {
  const d = deps()
  const res = await handleStripeWebhook(
    new Request('http://local/stripe-webhook', { method: 'POST', body: '{}' }),
    d
  )
  assertEquals(res.status, 400)
  assertEquals((await res.json()).error, 'missing_signature')
  assertEquals(d.secretsLoaded(), 0, 'no secret is read for an unsigned request')
})

Deno.test('stripe-webhook answers 503 when Stripe is not configured (#1259)', async () => {
  const res = await handleStripeWebhook(
    await signedRequest(stripeEvent('payment_intent.succeeded', { id: 'pi_x', object: 'payment_intent' })),
    deps({ loadSecrets: () => Promise.reject(new Error('Stripe API key is not configured')) })
  )
  assertEquals(res.status, 503)
})

Deno.test('stripe-webhook rejects a bad signature (#1259)', async () => {
  const res = await handleStripeWebhook(
    new Request('http://local/stripe-webhook', {
      method: 'POST',
      headers: { 'Stripe-Signature': 't=1,v1=deadbeef' },
      body: JSON.stringify(stripeEvent('charge.refunded', {})),
    }),
    deps()
  )
  assertEquals(res.status, 400)
  assertEquals((await res.json()).error, 'invalid_signature')
})

Deno.test('a full refund refunds the ledger row and cancels the success fee (#1259)', async () => {
  const f = await paidFeeFixture('refund')
  try {
    const res = await handleStripeWebhook(
      await signedRequest(
        stripeEvent('charge.refunded', {
          id: `ch_${RUN}`,
          object: 'charge',
          payment_intent: f.intentId,
          refunded: true,
          amount_refunded: 100_000,
        })
      ),
      deps()
    )
    assertEquals(res.status, 200)
    const tx = await readTx(f.txId)
    assertEquals(tx.status, 'refunded')
    assertEquals(tx.metadata.amount_refunded_cents, 100_000)
    assertEquals((await readFee(f.feeId)).status, 'cancelled', 'a refunded fee no longer unlocks contact')
  } finally {
    await f.cleanup()
  }
})

Deno.test('a partial refund is recorded and changes nothing else (#1259)', async () => {
  const f = await paidFeeFixture('partial')
  try {
    const res = await handleStripeWebhook(
      await signedRequest(
        stripeEvent('charge.refunded', {
          id: `ch_${RUN}_p`,
          object: 'charge',
          payment_intent: f.intentId,
          refunded: false,
          amount_refunded: 10_000,
        })
      ),
      deps()
    )
    assertEquals(res.status, 200)
    const tx = await readTx(f.txId)
    assertEquals(tx.status, 'succeeded')
    assertEquals(tx.metadata.amount_refunded_cents, 10_000)
    assertEquals((await readFee(f.feeId)).status, 'completed')
  } finally {
    await f.cleanup()
  }
})

Deno.test('a dispute is recorded; a lost dispute reverses the payment (#1259)', async () => {
  const f = await paidFeeFixture('dispute')
  try {
    const dispute = (status: string) => ({
      id: `dp_${RUN}`,
      object: 'dispute',
      payment_intent: f.intentId,
      status,
      reason: 'fraudulent',
      amount: 100_000,
    })
    let res = await handleStripeWebhook(
      await signedRequest(stripeEvent('charge.dispute.created', dispute('needs_response'))),
      deps()
    )
    assertEquals(res.status, 200)
    let tx = await readTx(f.txId)
    assertEquals(tx.status, 'succeeded', 'an open dispute does not move money yet')
    assertEquals(tx.metadata.dispute_status, 'needs_response')

    res = await handleStripeWebhook(
      await signedRequest(stripeEvent('charge.dispute.closed', dispute('lost'))),
      deps()
    )
    assertEquals(res.status, 200)
    tx = await readTx(f.txId)
    assertEquals(tx.status, 'refunded')
    assertEquals((await readFee(f.feeId)).status, 'cancelled')
  } finally {
    await f.cleanup()
  }
})

Deno.test('a refunded ID check loses its badge (#1259)', async () => {
  const intentId = `pi_${RUN}_idv`
  const { data: worker } = await core().from('users').select('id').limit(1).single()
  assertExists(worker, 'a seeded user')
  const { data: idv, error: idvError } = await core()
    .from('id_verifications')
    .insert({
      worker_user_id: worker.id,
      payment_intent_id: intentId,
      price_cents: 2_500,
      paid_at: '2026-10-17T12:00:00Z',
      persona_inquiry_id: `inq_${RUN}`,
      badge_status: 'active',
    })
    .select('id')
    .single()
  if (idvError) throw new Error(`idv fixture: ${idvError.message}`)
  const { data: tx } = await core()
    .from('payment_transactions')
    .insert({
      user_id: worker.id,
      amount_cents: 2_500,
      currency: 'usd',
      transaction_type: 'id_verification',
      id_verification_id: idv.id,
      stripe_payment_intent_id: intentId,
      status: 'succeeded',
    })
    .select('id')
    .single()
  try {
    const res = await handleStripeWebhook(
      await signedRequest(
        stripeEvent('charge.refunded', {
          id: `ch_${RUN}_idv`,
          object: 'charge',
          payment_intent: intentId,
          refunded: true,
          amount_refunded: 2_500,
        })
      ),
      deps()
    )
    assertEquals(res.status, 200)
    const { data: badge } = await core()
      .from('id_verifications')
      .select('badge_status, revoked_at')
      .eq('id', idv.id)
      .single()
    assertEquals(badge.badge_status, 'revoked')
    assert(badge.revoked_at, 'revocation is timestamped')
  } finally {
    await core().from('payment_transactions').delete().eq('id', tx.id)
    await core().from('id_verifications').delete().eq('id', idv.id)
  }
})
