/**
 * One place where a Stripe payment intent's outcome becomes database state.
 *
 * `stripe-webhook` and `payments-reconcile` both answer the same question —
 * "Stripe says this intent is now X; what should the database say?" — and they
 * answer it about the same rows. Writing that twice is how a webhook and a
 * sweep come to disagree, so they share this module (#948 item 3 and 5).
 *
 * The rule it encodes: `payment_transactions` is the ledger, and every table
 * that keeps its own paid-state must be advanced in the same step. Before this,
 * the webhook updated the ledger alone, so a hire whose upfront fee Stripe had
 * taken could sit at `success_fees.status = 'pending'` forever — the two tables
 * disagreeing about whether the money arrived, with nothing to reconcile them.
 */

import type Stripe from 'stripe'

import type { Json } from '../database.types.ts'
import type { NotificationSupabaseClient } from '../notifications/types.ts'

/** The terminal states we record. Mirrors payment_transactions.status. */
export type SettlementStatus = 'succeeded' | 'failed' | 'cancelled'

export interface SettlementEvent {
  /** Recorded as metadata.settled_by, so a row says which path settled it. */
  source: 'stripe-webhook' | 'payments-reconcile'
  /** Stripe event id, when a webhook event drove this. */
  eventId?: string | null
  eventType?: string | null
  /** When Stripe emitted the event, ISO. Omitted by the sweep — it has none. */
  eventAtIso?: string | null
}

export interface SettlementOutcome {
  intentId: string
  /** null when no ledger row exists for the intent. */
  transactionId: string | null
  /**
   * 'applied' — the ledger moved. 'duplicate' — this exact Stripe event was
   * already recorded. 'unchanged' — the row already held this status.
   * 'not_found' — nothing in the ledger references this intent.
   */
  result: 'applied' | 'duplicate' | 'unchanged' | 'not_found'
  /** Paid-state columns this call advanced, e.g. 'success_fees.upfront_paid_at'. */
  advanced: string[]
}

/**
 * What a Stripe intent status means for the ledger, or null for "still open".
 *
 * `requires_payment_method` is both the pre-attempt state and the
 * after-a-decline state; only a recorded `last_payment_error` separates them.
 * `requires_capture` is an authorisation that has not been captured — money
 * has not moved, so it stays open rather than counting as succeeded.
 */
export function mapIntentStatus(intent: Stripe.PaymentIntent): SettlementStatus | null {
  switch (intent.status) {
    case 'succeeded':
      return 'succeeded'
    case 'canceled':
      return 'cancelled'
    case 'requires_payment_method':
      return intent.last_payment_error ? 'failed' : null
    default:
      return null
  }
}

function mergeMetadata(current: Json | null, updates: Record<string, unknown>): Json {
  const base = current && typeof current === 'object' && !Array.isArray(current) ? current : {}
  return { ...base, ...updates } as Json
}

/**
 * Record an intent's outcome on the ledger row and advance whatever paid-state
 * it points at. Safe to call repeatedly for the same intent: every write is
 * guarded on the state it is moving away from.
 */
export async function settlePaymentIntent(
  supabase: NotificationSupabaseClient,
  intent: Stripe.PaymentIntent,
  status: SettlementStatus,
  event: SettlementEvent,
  failureReason?: string | null
): Promise<SettlementOutcome> {
  const { data: existing, error: loadError } = await supabase
    .schema('core')
    .from('payment_transactions')
    .select('*')
    .eq('stripe_payment_intent_id', intent.id)
    .maybeSingle()

  if (loadError) {
    throw new Error(`Failed to load payment transaction: ${loadError.message}`)
  }

  if (!existing) {
    // Deliberately not an insert. A ledger row is written before the
    // client_secret is handed out (#949), so a missing row means an intent
    // created outside those paths — we do not know its transaction_type, which
    // org or user it belongs to, or what it was meant to pay for, and guessing
    // would put a wrong row in a financial ledger.
    return { intentId: intent.id, transactionId: null, result: 'not_found', advanced: [] }
  }

  const currentMetadata = existing.metadata ?? null
  const currentMetadataObject =
    currentMetadata && typeof currentMetadata === 'object' && !Array.isArray(currentMetadata)
      ? (currentMetadata as Record<string, unknown>)
      : {}

  if (event.eventId && currentMetadataObject.last_stripe_event_id === event.eventId) {
    return {
      intentId: intent.id,
      transactionId: existing.id,
      result: 'duplicate',
      advanced: [],
    }
  }

  const nowIso = new Date().toISOString()
  const paidAtIso = intent.created ? new Date(intent.created * 1000).toISOString() : nowIso

  const updates: Record<string, unknown> = {
    status,
    metadata: mergeMetadata(currentMetadata, {
      last_stripe_event_id: event.eventId ?? null,
      last_stripe_event_type: event.eventType ?? null,
      last_stripe_event_at: event.eventAtIso ?? null,
      settled_by: event.source,
      settled_at: nowIso,
    }),
  }

  if (status === 'succeeded') {
    updates.succeeded_at = paidAtIso
    updates.failed_at = null
    updates.failure_reason = null
  } else if (status === 'failed') {
    updates.failed_at = existing.failed_at ?? nowIso
    updates.failure_reason = failureReason ?? intent.last_payment_error?.message ?? null
  } else {
    updates.failed_at = existing.failed_at ?? nowIso
    updates.failure_reason = failureReason ?? intent.cancellation_reason ?? 'cancelled'
  }

  const { error: updateError } = await supabase
    .schema('core')
    .from('payment_transactions')
    .update(updates)
    .eq('id', existing.id)

  if (updateError) {
    throw new Error(`Failed to update payment transaction: ${updateError.message}`)
  }

  // Only a success moves the downstream paid-state. A decline is retryable —
  // Stripe emits payment_intent.payment_failed on every failed attempt and the
  // customer can pay with another card against the same intent — so marking
  // the hire's fee 'failed' on the first decline would end a sale that is
  // still live. Cancellation is terminal for the intent but not for the fee,
  // which can be issued a new one. Both are recorded on the ledger row above,
  // which is where the attempt history belongs.
  const advanced =
    status === 'succeeded' ? await advancePaidState(supabase, existing, intent, paidAtIso) : []

  return { intentId: intent.id, transactionId: existing.id, result: 'applied', advanced }
}

type TransactionRow = {
  id: string
  transaction_type: string
  success_fee_id: string | null
  background_check_id: string | null
  background_check_access_id: string | null
  id_verification_id: string | null
}

async function advancePaidState(
  supabase: NotificationSupabaseClient,
  transaction: TransactionRow,
  intent: Stripe.PaymentIntent,
  paidAtIso: string
): Promise<string[]> {
  const advanced: string[] = []

  if (transaction.success_fee_id) {
    advanced.push(...(await advanceSuccessFee(supabase, transaction, intent, paidAtIso)))
  }

  if (transaction.background_check_id) {
    // `.is(paid_at, null)` rather than a blind set, so a replay does not
    // rewrite the timestamp of a payment that landed days ago. 0 rows changed
    // therefore means "already paid", which is why it is not an error.
    const { data, error } = await supabase
      .schema('core')
      .from('background_checks')
      .update({ paid_at: paidAtIso })
      .eq('id', transaction.background_check_id)
      .is('paid_at', null)
      .select('id')

    if (error) {
      throw new Error(`Failed to advance background_checks.paid_at: ${error.message}`)
    }
    if ((data?.length ?? 0) > 0) advanced.push('background_checks.paid_at')
  }

  if (transaction.background_check_access_id) {
    const { data, error } = await supabase
      .schema('core')
      .from('background_check_access')
      .update({ paid_at: paidAtIso })
      .eq('id', transaction.background_check_access_id)
      .is('paid_at', null)
      .select('id')

    if (error) {
      throw new Error(`Failed to advance background_check_access.paid_at: ${error.message}`)
    }
    if ((data?.length ?? 0) > 0) advanced.push('background_check_access.paid_at')
  }

  // core.id_verifications has paid_at NOT NULL and is inserted only once the
  // payment has already succeeded, so there is no unpaid row to advance. An
  // id_verification transaction that succeeds with no verification row is a
  // different problem — a paid customer with no verification — and it is
  // visible as a succeeded ledger row with id_verification_id NULL.

  return advanced
}

async function advanceSuccessFee(
  supabase: NotificationSupabaseClient,
  transaction: TransactionRow,
  intent: Stripe.PaymentIntent,
  paidAtIso: string
): Promise<string[]> {
  const feeId = transaction.success_fee_id
  if (!feeId) return []

  const { data: fee, error } = await supabase
    .schema('core')
    .from('success_fees')
    .select(
      'id, status, upfront_paid_at, final_paid_at, upfront_payment_intent_id, final_payment_intent_id'
    )
    .eq('id', feeId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to load success fee ${feeId}: ${error.message}`)
  }

  if (!fee) {
    console.warn('[payments/settlement] transaction references a missing success fee', {
      transactionId: transaction.id,
      successFeeId: feeId,
    })
    return []
  }

  // The fee's own intent ids decide the stage. transaction_type is the
  // fallback, not the authority: it is set by whoever created the row, and the
  // fee is the thing that knows which intent paid which half.
  const stage =
    fee.final_payment_intent_id === intent.id
      ? 'final'
      : fee.upfront_payment_intent_id === intent.id
        ? 'upfront'
        : transaction.transaction_type === 'success_fee_final'
          ? 'final'
          : transaction.transaction_type === 'success_fee_upfront'
            ? 'upfront'
            : null

  if (!stage) {
    console.warn('[payments/settlement] cannot tell which success fee stage an intent paid', {
      transactionId: transaction.id,
      successFeeId: feeId,
      intentId: intent.id,
      transactionType: transaction.transaction_type,
    })
    return []
  }

  // Both branches are guarded on the paid-at column being null, so a replayed
  // event is a no-op rather than a rewritten timestamp, and on the status being
  // one a payment can legitimately move forward from — a late upfront event
  // must not walk a completed fee back to 'upfront_paid'. 'failed' is included
  // because a previous decline does not stop a later attempt from paying;
  // 'cancelled' is not, because that is a deliberate termination, and a payment
  // against a cancelled fee is a thing a human needs to look at.
  if (stage === 'upfront') {
    const { data, error: updateError } = await supabase
      .schema('core')
      .from('success_fees')
      .update({ upfront_paid_at: paidAtIso, status: 'upfront_paid' })
      .eq('id', feeId)
      .is('upfront_paid_at', null)
      .in('status', ['pending', 'failed'])
      .select('id')

    if (updateError) {
      throw new Error(
        `Failed to advance success fee ${feeId} to upfront_paid: ${updateError.message}`
      )
    }

    if ((data?.length ?? 0) > 0) return ['success_fees.upfront_paid_at']
    warnUnadvanced(transaction, fee, 'upfront', fee.upfront_paid_at)
    return []
  }

  const { data, error: updateError } = await supabase
    .schema('core')
    .from('success_fees')
    .update({ final_paid_at: paidAtIso, status: 'completed' })
    .eq('id', feeId)
    .is('final_paid_at', null)
    .in('status', ['pending', 'upfront_paid', 'failed'])
    .select('id')

  if (updateError) {
    throw new Error(`Failed to advance success fee ${feeId} to completed: ${updateError.message}`)
  }

  if ((data?.length ?? 0) > 0) return ['success_fees.final_paid_at']
  warnUnadvanced(transaction, fee, 'final', fee.final_paid_at)
  return []
}

/**
 * 0 rows updated is usually benign — the stage was already paid, which is what
 * idempotency looks like. It is not benign when the paid-at column is still
 * null: then the status guard blocked the write and a payment has landed
 * against a fee nobody expected to be payable. Say which it was.
 */
function warnUnadvanced(
  transaction: TransactionRow,
  fee: { id: string; status: string },
  stage: 'upfront' | 'final',
  paidAt: string | null
): void {
  if (paidAt) return

  console.warn('[payments/settlement] success fee not advanced; status blocked the write', {
    transactionId: transaction.id,
    successFeeId: fee.id,
    stage,
    feeStatus: fee.status,
  })
}
