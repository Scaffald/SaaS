/// <reference lib="deno.ns" />

/**
 * The settlement module against the real database.
 *
 * This is the behaviour #948 item 3 is about: when Stripe says a payment
 * intent succeeded, `payment_transactions` AND the table that keeps its own
 * paid-state both have to move. `stripe-webhook` used to advance the ledger
 * alone, so a paid hire could sit at `success_fees.status = 'pending'` with the
 * ledger saying 'succeeded' — the two disagreeing about whether money arrived.
 *
 * Real rows in the real local database, because the guards being tested are
 * the `.is(...)` / `.in(...)` filters on the UPDATE statements — a stubbed
 * client would assert that this file builds the queries it builds, which is
 * not the same claim. Stripe is the one thing faked: payment intents are
 * literals, since Stripe is a third party we do not own and there is no way to
 * drive a real declined card from a test.
 *
 * Unlike its neighbours this suite speaks to Postgres rather than to the `api`
 * edge function, so it does not need the function server — only a migrated
 * database. It cleans up everything it creates.
 */

import { assertEquals, assertExists } from 'std/assert'
import type { SupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

import {
  mapIntentStatus,
  settlePaymentIntent,
} from '../../functions/_shared/payments/settlement.ts'
import { createAdminClient } from '../shared/setup.ts'

// deno-lint-ignore no-explicit-any
type AnyClient = any

const admin = createAdminClient() as SupabaseClient
const core = () => (admin as AnyClient).schema('core')

const RUN = crypto.randomUUID().slice(0, 8)

function intent(id: string, overrides: Partial<Stripe.PaymentIntent> = {}): Stripe.PaymentIntent {
  return {
    id,
    object: 'payment_intent',
    amount: 50_000,
    currency: 'usd',
    created: Math.floor(Date.parse('2026-10-01T12:00:00Z') / 1000),
    status: 'succeeded',
    metadata: {},
    ...overrides,
  } as Stripe.PaymentIntent
}

interface Fixture {
  organizationId: string
  successFeeId: string
  intentId: string
  transactionId: string
}

/**
 * A hire whose upfront fee has an intent and a pending ledger row — exactly the
 * state `success-fees.ts` leaves behind after handing out a client_secret.
 */
async function createUpfrontFixture(label: string): Promise<Fixture> {
  const { data: org, error: orgError } = await core()
    .from('organizations')
    .insert({ name: `settlement-${RUN}-${label}`, slug: `settlement-${RUN}-${label}` })
    .select('id')
    .single()
  if (orgError) throw new Error(`fixture org: ${orgError.message}`)

  const { data: fee, error: feeError } = await core()
    .from('success_fees')
    .insert({
      organization_id: org.id,
      total_hire_value_cents: 1_000_000,
      fee_percentage: 10,
      total_fee_cents: 100_000,
      payment_schedule: 'standard',
      upfront_percentage: 50,
      upfront_amount_cents: 50_000,
      final_percentage: 50,
      final_amount_cents: 50_000,
      final_payment_due_date: '2026-12-01',
      hire_start_date: '2026-10-01',
      hire_confirmed_at: '2026-10-01T12:00:00Z',
      upfront_payment_intent_id: `pi_${RUN}_${label}`,
    })
    .select('id')
    .single()
  if (feeError) throw new Error(`fixture success fee: ${feeError.message}`)

  const { data: tx, error: txError } = await core()
    .from('payment_transactions')
    .insert({
      organization_id: org.id,
      amount_cents: 50_000,
      currency: 'usd',
      transaction_type: 'success_fee_upfront',
      success_fee_id: fee.id,
      stripe_payment_intent_id: `pi_${RUN}_${label}`,
      metadata: { stage: 'upfront' },
    })
    .select('id, status')
    .single()
  if (txError) throw new Error(`fixture transaction: ${txError.message}`)

  // The invariant the fixture depends on: nothing has settled it yet.
  assertEquals(tx.status, 'pending')

  return {
    organizationId: org.id,
    successFeeId: fee.id,
    intentId: `pi_${RUN}_${label}`,
    transactionId: tx.id,
  }
}

async function cleanup(fixture: Fixture): Promise<void> {
  await core().from('payment_transactions').delete().eq('id', fixture.transactionId)
  await core().from('success_fees').delete().eq('id', fixture.successFeeId)
  await core().from('organizations').delete().eq('id', fixture.organizationId)
}

async function readFee(id: string) {
  const { data, error } = await core()
    .from('success_fees')
    .select('status, upfront_paid_at, final_paid_at')
    .eq('id', id)
    .single()
  if (error) throw new Error(`read success fee: ${error.message}`)
  return data
}

async function readTransaction(id: string) {
  const { data, error } = await core()
    .from('payment_transactions')
    .select('status, succeeded_at, failed_at, failure_reason, metadata')
    .eq('id', id)
    .single()
  if (error) throw new Error(`read transaction: ${error.message}`)
  return data
}

Deno.test('mapIntentStatus only reports terminal Stripe states', () => {
  assertEquals(mapIntentStatus(intent('pi_a', { status: 'succeeded' })), 'succeeded')
  assertEquals(mapIntentStatus(intent('pi_b', { status: 'canceled' })), 'cancelled')
  assertEquals(mapIntentStatus(intent('pi_c', { status: 'processing' })), null)
  assertEquals(mapIntentStatus(intent('pi_d', { status: 'requires_confirmation' })), null)
  assertEquals(mapIntentStatus(intent('pi_e', { status: 'requires_action' })), null)

  // An authorisation is not a payment: money has not moved until capture.
  assertEquals(mapIntentStatus(intent('pi_f', { status: 'requires_capture' })), null)

  // requires_payment_method is both the pre-attempt state and the
  // after-a-decline state. Only last_payment_error separates them.
  assertEquals(mapIntentStatus(intent('pi_g', { status: 'requires_payment_method' })), null)
  assertEquals(
    mapIntentStatus(
      intent('pi_h', {
        status: 'requires_payment_method',
        last_payment_error: { message: 'card_declined' } as Stripe.PaymentIntent.LastPaymentError,
      })
    ),
    'failed'
  )
})

Deno.test('a succeeded intent advances both the ledger and the success fee', async () => {
  const fixture = await createUpfrontFixture('ok')
  try {
    const outcome = await settlePaymentIntent(
      admin as AnyClient,
      intent(fixture.intentId),
      'succeeded',
      { source: 'stripe-webhook', eventId: `evt_${RUN}_ok`, eventType: 'payment_intent.succeeded' }
    )

    assertEquals(outcome.result, 'applied')
    assertEquals(outcome.advanced, ['success_fees.upfront_paid_at'])

    const tx = await readTransaction(fixture.transactionId)
    assertEquals(tx.status, 'succeeded')
    assertExists(tx.succeeded_at)
    assertEquals((tx.metadata as Record<string, unknown>).settled_by, 'stripe-webhook')

    // The half that did not happen before #948.
    const fee = await readFee(fixture.successFeeId)
    assertEquals(fee.status, 'upfront_paid')
    assertExists(fee.upfront_paid_at)
  } finally {
    await cleanup(fixture)
  }
})

Deno.test('replaying the same Stripe event changes nothing', async () => {
  const fixture = await createUpfrontFixture('replay')
  try {
    const event = {
      source: 'stripe-webhook' as const,
      eventId: `evt_${RUN}_replay`,
      eventType: 'payment_intent.succeeded',
    }

    const first = await settlePaymentIntent(
      admin as AnyClient,
      intent(fixture.intentId),
      'succeeded',
      event
    )
    assertEquals(first.result, 'applied')

    const paidAt = (await readFee(fixture.successFeeId)).upfront_paid_at

    const second = await settlePaymentIntent(
      admin as AnyClient,
      intent(fixture.intentId),
      'succeeded',
      event
    )
    assertEquals(second.result, 'duplicate')
    assertEquals(second.advanced, [])

    // Specifically not rewritten — a replay must not move the paid timestamp.
    assertEquals((await readFee(fixture.successFeeId)).upfront_paid_at, paidAt)
  } finally {
    await cleanup(fixture)
  }
})

Deno.test('a reconciliation sweep over an already-settled row is a no-op', async () => {
  const fixture = await createUpfrontFixture('sweep')
  try {
    await settlePaymentIntent(admin as AnyClient, intent(fixture.intentId), 'succeeded', {
      source: 'stripe-webhook',
      eventId: `evt_${RUN}_sweep`,
      eventType: 'payment_intent.succeeded',
    })
    const paidAt = (await readFee(fixture.successFeeId)).upfront_paid_at

    // The sweep carries no event id, so the duplicate check cannot catch it —
    // idempotency has to come from the UPDATE guards instead. This is the case
    // that actually runs in production every 10 minutes.
    const outcome = await settlePaymentIntent(
      admin as AnyClient,
      intent(fixture.intentId),
      'succeeded',
      { source: 'payments-reconcile', eventType: 'reconcile.succeeded' }
    )

    assertEquals(outcome.result, 'applied')
    assertEquals(outcome.advanced, [])
    assertEquals((await readFee(fixture.successFeeId)).upfront_paid_at, paidAt)
    assertEquals((await readFee(fixture.successFeeId)).status, 'upfront_paid')
  } finally {
    await cleanup(fixture)
  }
})

Deno.test('a declined payment records on the ledger and leaves the fee payable', async () => {
  const fixture = await createUpfrontFixture('declined')
  try {
    const outcome = await settlePaymentIntent(
      admin as AnyClient,
      intent(fixture.intentId, {
        status: 'requires_payment_method',
        last_payment_error: { message: 'Your card was declined.' } as
          Stripe.PaymentIntent.LastPaymentError,
      }),
      'failed',
      {
        source: 'stripe-webhook',
        eventId: `evt_${RUN}_declined`,
        eventType: 'payment_intent.payment_failed',
      }
    )

    assertEquals(outcome.result, 'applied')
    assertEquals(outcome.advanced, [])

    const tx = await readTransaction(fixture.transactionId)
    assertEquals(tx.status, 'failed')
    assertEquals(tx.failure_reason, 'Your card was declined.')
    assertExists(tx.failed_at)

    // A decline is retryable — the customer can pay the same intent with
    // another card — so the fee must stay exactly where it was.
    const fee = await readFee(fixture.successFeeId)
    assertEquals(fee.status, 'pending')
    assertEquals(fee.upfront_paid_at, null)
  } finally {
    await cleanup(fixture)
  }
})

Deno.test('a success after a decline still advances the fee', async () => {
  const fixture = await createUpfrontFixture('retry')
  try {
    await settlePaymentIntent(
      admin as AnyClient,
      intent(fixture.intentId, { status: 'requires_payment_method' }),
      'failed',
      { source: 'stripe-webhook', eventId: `evt_${RUN}_retry_1`, eventType: 'payment_intent.payment_failed' }
    )

    const outcome = await settlePaymentIntent(
      admin as AnyClient,
      intent(fixture.intentId),
      'succeeded',
      { source: 'stripe-webhook', eventId: `evt_${RUN}_retry_2`, eventType: 'payment_intent.succeeded' }
    )

    assertEquals(outcome.advanced, ['success_fees.upfront_paid_at'])

    const tx = await readTransaction(fixture.transactionId)
    assertEquals(tx.status, 'succeeded')
    // The failure is cleared rather than left alongside a success.
    assertEquals(tx.failed_at, null)
    assertEquals(tx.failure_reason, null)

    assertEquals((await readFee(fixture.successFeeId)).status, 'upfront_paid')
  } finally {
    await cleanup(fixture)
  }
})

Deno.test('an intent with no ledger row is reported, not invented', async () => {
  const outcome = await settlePaymentIntent(
    admin as AnyClient,
    intent(`pi_${RUN}_orphan`),
    'succeeded',
    { source: 'payments-reconcile', eventType: 'reconcile.succeeded' }
  )

  assertEquals(outcome.result, 'not_found')
  assertEquals(outcome.transactionId, null)
  assertEquals(outcome.advanced, [])

  // And nothing was written: a guessed row in a financial ledger is worse than
  // a missing one.
  const { data } = await core()
    .from('payment_transactions')
    .select('id')
    .eq('stripe_payment_intent_id', `pi_${RUN}_orphan`)
  assertEquals(data?.length ?? 0, 0)
})

Deno.test('the final stage completes the fee, chosen by the fee’s own intent ids', async () => {
  const fixture = await createUpfrontFixture('final')
  try {
    const finalIntentId = `pi_${RUN}_final_stage`

    // The fee now has a distinct final intent, and a ledger row to match. The
    // transaction_type deliberately still says 'success_fee_upfront' — the
    // stage comes from the fee's intent ids, which are the authority on which
    // intent paid which half.
    await core()
      .from('success_fees')
      .update({
        upfront_paid_at: '2026-10-01T12:00:00Z',
        status: 'upfront_paid',
        final_payment_intent_id: finalIntentId,
      })
      .eq('id', fixture.successFeeId)

    const { data: tx, error } = await core()
      .from('payment_transactions')
      .insert({
        organization_id: fixture.organizationId,
        amount_cents: 50_000,
        currency: 'usd',
        transaction_type: 'success_fee_upfront',
        success_fee_id: fixture.successFeeId,
        stripe_payment_intent_id: finalIntentId,
        metadata: { stage: 'final' },
      })
      .select('id')
      .single()
    if (error) throw new Error(`final-stage fixture: ${error.message}`)

    try {
      const outcome = await settlePaymentIntent(
        admin as AnyClient,
        intent(finalIntentId),
        'succeeded',
        {
          source: 'stripe-webhook',
          eventId: `evt_${RUN}_final`,
          eventType: 'payment_intent.succeeded',
        }
      )

      assertEquals(outcome.advanced, ['success_fees.final_paid_at'])

      const fee = await readFee(fixture.successFeeId)
      assertEquals(fee.status, 'completed')
      assertExists(fee.final_paid_at)
    } finally {
      await core().from('payment_transactions').delete().eq('id', tx.id)
    }
  } finally {
    await cleanup(fixture)
  }
})

Deno.test('a late upfront event cannot walk a completed fee backwards', async () => {
  const fixture = await createUpfrontFixture('late')
  try {
    await core()
      .from('success_fees')
      .update({
        upfront_paid_at: '2026-10-01T12:00:00Z',
        final_paid_at: '2026-11-01T12:00:00Z',
        status: 'completed',
      })
      .eq('id', fixture.successFeeId)

    const outcome = await settlePaymentIntent(
      admin as AnyClient,
      intent(fixture.intentId),
      'succeeded',
      { source: 'stripe-webhook', eventId: `evt_${RUN}_late`, eventType: 'payment_intent.succeeded' }
    )

    // The ledger row still settles — that is correct, the money did arrive.
    assertEquals(outcome.result, 'applied')
    assertEquals(outcome.advanced, [])
    assertEquals((await readTransaction(fixture.transactionId)).status, 'succeeded')

    const fee = await readFee(fixture.successFeeId)
    assertEquals(fee.status, 'completed')
    assertEquals(fee.upfront_paid_at, '2026-10-01T12:00:00+00:00')
  } finally {
    await cleanup(fixture)
  }
})
