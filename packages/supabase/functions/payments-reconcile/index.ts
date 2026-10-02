/**
 * Settle payment_transactions rows that Stripe has already finished with.
 *
 * Webhooks get missed. Stripe retries a failing endpoint for days and then
 * stops, the function can be down for a deploy, a signing secret can be
 * rotated mid-flight — none of that is exotic, and #948 item 5 is the
 * observation that the system had no answer for any of it. A row inserted
 * before the client_secret is handed out (#949) stays 'pending' forever if the
 * `payment_intent.succeeded` that was meant to advance it never arrives, and
 * the hire's `success_fees` row stays 'pending' with it.
 *
 * So this sweep asks Stripe directly about every ledger row that has been
 * pending longer than the threshold and applies the answer through the same
 * module the webhook uses (`_shared/payments/settlement.ts`) — the point being
 * that a reconciled payment and a webhook-settled payment cannot end up in
 * different states.
 *
 * It is a mirror, not a decision-maker: non-terminal intents are left alone
 * and counted. It never creates, confirms or cancels anything at Stripe.
 *
 * Driven by pg_cron (migration 362). POST, service-role bearer only.
 */

import { serve } from 'https://deno.land/std@0.223.0/http/server.ts'

import { corsHeaders, createCorsResponse } from '../_shared/cors.ts'
import { requireServiceAuth } from '../_shared/notifications/auth.ts'
import { createServiceSupabaseClient } from '../_shared/notifications/utils.ts'
import { mapIntentStatus, settlePaymentIntent } from '../_shared/payments/settlement.ts'
import { createStripeApiClient, loadStripeApiKey } from '../_shared/payments/stripe-client.ts'

/**
 * Long enough that the sweep is not racing the normal flow: an intent is
 * created, the customer confirms it in the client, and the webhook lands —
 * typically seconds. 15 minutes means anything this touches has genuinely
 * stalled.
 */
const DEFAULT_OLDER_THAN_MINUTES = 15

/** A cron slot gets 55s (migration 337's timeout). Leave room to answer. */
const TIME_BUDGET_MS = 45_000

const DEFAULT_LIMIT = 100
const MAX_LIMIT = 500

interface ReconcileRequest {
  olderThanMinutes?: number
  limit?: number
}

interface Summary {
  scanned: number
  settled: number
  stillOpen: number
  notFoundInLedger: number
  missingAtStripe: number
  errors: number
  truncated: boolean
  /** Paid-state column -> how many rows it advanced, e.g. success_fees.upfront_paid_at. */
  advanced: Record<string, number>
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(Math.trunc(value), min), max)
}

/** Stripe's answer for "that intent does not exist on this account". */
function isResourceMissing(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code
  return code === 'resource_missing'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return createCorsResponse('ok')
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  // Internal infrastructure driven by pg_cron, and it reads payment state for
  // every organization. See _shared/notifications/auth.ts for why verify_jwt
  // is not a substitute.
  const authError = requireServiceAuth(req)
  if (authError) return authError

  // pg_cron posts {source, timestamp}; an empty or unparseable body is normal.
  let body: ReconcileRequest = {}
  try {
    body = (await req.json()) as ReconcileRequest
  } catch {
    body = {}
  }

  const olderThanMinutes = clampNumber(body.olderThanMinutes, DEFAULT_OLDER_THAN_MINUTES, 1, 10_080)
  const limit = clampNumber(body.limit, DEFAULT_LIMIT, 1, MAX_LIMIT)
  const cutoffIso = new Date(Date.now() - olderThanMinutes * 60_000).toISOString()

  const supabase = createServiceSupabaseClient()

  const { data: pending, error: queryError } = await supabase
    .schema('core')
    .from('payment_transactions')
    .select('id, stripe_payment_intent_id, transaction_type, created_at')
    .eq('status', 'pending')
    .lte('created_at', cutoffIso)
    // Oldest first: a backlog drains in the order it accumulated, and each run
    // makes progress on the same end of the queue rather than re-reading the
    // newest rows.
    .order('created_at', { ascending: true })
    .limit(limit)

  if (queryError) {
    console.error('[payments-reconcile] failed to load pending transactions', queryError)
    return jsonResponse(
      { error: `Failed to load pending transactions: ${queryError.message}` },
      500
    )
  }

  const rows = pending ?? []

  const summary: Summary = {
    scanned: 0,
    settled: 0,
    stillOpen: 0,
    notFoundInLedger: 0,
    missingAtStripe: 0,
    errors: 0,
    truncated: false,
    advanced: {},
  }

  if (rows.length === 0) {
    return jsonResponse({ cutoff: cutoffIso, olderThanMinutes, limit, ...summary })
  }

  let stripe: Awaited<ReturnType<typeof createStripeApiClient>>
  try {
    stripe = await createStripeApiClient(await loadStripeApiKey(supabase))
  } catch (error) {
    // Loaded only once there is something to reconcile, so an unconfigured
    // Stripe (#928) does not make every tick a 500 — with no pending rows the
    // sweep returned above. Reaching here means rows are waiting and we cannot
    // ask about them, which is worth the 500: the failure is then visible in
    // net._http_response rather than swallowed into a 200.
    console.error('[payments-reconcile] stripe is not configured', error)
    return jsonResponse({ error: (error as Error).message ?? 'stripe_unavailable' }, 500)
  }

  const startedAt = Date.now()

  // Sequential on purpose: Stripe rate-limits, and the budget check below only
  // means anything if work is not already in flight when it trips. The
  // remainder is picked up by the next run, oldest-first.
  for (const row of rows) {
    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      summary.truncated = true
      break
    }

    summary.scanned += 1

    try {
      const intent = await stripe.paymentIntents.retrieve(row.stripe_payment_intent_id)
      const status = mapIntentStatus(intent)

      if (!status) {
        summary.stillOpen += 1
        continue
      }

      const outcome = await settlePaymentIntent(supabase, intent, status, {
        source: 'payments-reconcile',
        eventType: `reconcile.${intent.status}`,
      })

      if (outcome.result === 'not_found') {
        // The select above found the row, so this is a concurrent delete —
        // rare, and nothing to do about it here.
        summary.notFoundInLedger += 1
        continue
      }

      summary.settled += 1
      for (const column of outcome.advanced) {
        summary.advanced[column] = (summary.advanced[column] ?? 0) + 1
      }

      console.info('[payments-reconcile] settled a stalled transaction', {
        transactionId: row.id,
        intentId: row.stripe_payment_intent_id,
        transactionType: row.transaction_type,
        createdAt: row.created_at,
        stripeStatus: intent.status,
        status,
        advanced: outcome.advanced,
      })
    } catch (error) {
      if (isResourceMissing(error)) {
        // The ledger references an intent this Stripe account does not have —
        // the signature of a key swap between test and live, or of a row
        // written against a different account. Left pending deliberately:
        // writing a terminal status from an absent intent would be inventing
        // a financial fact.
        summary.missingAtStripe += 1
        console.warn('[payments-reconcile] intent does not exist at stripe', {
          transactionId: row.id,
          intentId: row.stripe_payment_intent_id,
        })
        continue
      }

      // One bad row must not strand the rest of the sweep.
      summary.errors += 1
      console.error('[payments-reconcile] failed to reconcile a transaction', {
        transactionId: row.id,
        intentId: row.stripe_payment_intent_id,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  console.info('[payments-reconcile] sweep complete', { cutoff: cutoffIso, ...summary })

  return jsonResponse({ cutoff: cutoffIso, olderThanMinutes, limit, ...summary })
})
