/// <reference lib="deno.ns" />

/**
 * ID verification REST coverage for the charge → record ordering (#948 item 2).
 *
 * The bug this pins down: `createPersonaInquiry` used to be called inside
 * `/confirm`, between a successful charge and the `id_verifications` insert
 * that records it. `core.id_verifications.persona_inquiry_id` is NOT NULL, so
 * Persona being down meant the row could not be written at all — a paid
 * customer with no verification, no way to retry once the client lost the
 * payment intent id, and nothing in the system that would notice.
 *
 * `/request` now creates the inquiry BEFORE the Stripe intent exists and
 * carries its id on the intent and on the ledger row, so `/confirm` makes no
 * network call to Persona on the normal path. That is what these tests assert:
 * not "an inquiry exists" but "the inquiry /confirm used is the one that
 * existed before the money could move".
 *
 * Runs against the real `api` function and the real database, with Stripe in
 * mock mode (`STRIPE_MOCK_MODE=1`) because no environment has Stripe keys and
 * the mock is the repo's existing seam for exactly this. Persona is
 * unconfigured, so `createPersonaInquiry` returns its synthetic id — fine
 * here, since the question is which id gets used and when, not who minted it.
 *
 * ## Why this is not in GATED.txt yet
 *
 * It needs `STRIPE_MOCK_MODE=1` inside the function's runtime, and nothing
 * gives it that today: `supabase start` has no `--env-file`, so the shared
 * edge runtime CI brings up cannot see it, and without it `loadStripeClient`
 * throws `Stripe API key is not configured.` before either route does anything
 * interesting. Listing it in the gate would list a file that cannot pass.
 *
 * Wiring that up is #937 (the REST payment routes have no HTTP coverage).
 * Until then, run it by hand — this is the exact command it was verified with,
 * and it needs only `pnpm supa start`, not the function server:
 *
 *     cd packages/supabase/functions/api
 *     SUPABASE_URL=http://127.0.0.1:54321 \
 *     SUPABASE_ANON_KEY=<local anon> SUPABASE_SERVICE_ROLE_KEY=<local service> \
 *     STRIPE_MOCK_MODE=1 deno run --allow-all --no-check --node-modules-dir=auto index.ts
 *
 *     cd packages/supabase
 *     IDV_TEST_API_BASE=http://127.0.0.1:8000/v1 deno test --allow-all \
 *       --no-check --config tests/deno.json tests/routers/id-verification-rest.test.ts
 *
 * Running the function directly rather than through `supabase functions serve`
 * also avoids taking the shared edge runtime away from whichever checkout
 * started it.
 *
 * Measured green on the fix, red on the code before it: without the change,
 * the first test fails with `ledger metadata carries no persona_inquiry_id`.
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import {
  createAdminClient,
  getAuthToken,
  loadCachedTokens,
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
} from '../shared/setup.ts'
import { getUserIdByEmail } from '../shared/test-context.ts'

/**
 * Normally the `api` function behind Kong, as every other suite here does.
 *
 * `IDV_TEST_API_BASE` overrides it so the suite can be pointed at the function
 * run directly (`deno run functions/api/index.ts`, which binds :8000). That is
 * how it gets verified on a machine where the shared edge runtime belongs to
 * another checkout, and how it gets run at all until the local stack passes
 * STRIPE_MOCK_MODE to the runtime — see the header note.
 */
const REST_BASE = Deno.env.get('IDV_TEST_API_BASE') ??
  `${TEST_SUPABASE_URL}/functions/v1/api/v1`
const RUN = crypto.randomUUID().slice(0, 8)

async function callREST(
  path: string,
  init: RequestInit & { authToken?: string | null } = {}
) {
  const { authToken, headers: extraHeaders, ...rest } = init
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: TEST_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${authToken && authToken.length > 0 ? authToken : TEST_SUPABASE_ANON_KEY}`,
    ...(extraHeaders as Record<string, string> | undefined),
  }
  const response = await fetch(`${REST_BASE}${path}`, { ...rest, headers })
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: response.status, body }
}

async function workerToken(): Promise<string> {
  const cached = await loadCachedTokens()
  const token =
    cached?.regular?.token ??
    (await getAuthToken(TEST_USERS.regular.email, TEST_USERS.regular.password))
  assertExists(token, 'could not obtain a token for the seeded worker')
  return token
}

/**
 * `/request` 400s without an active id_verification price, and nothing seeds
 * one. Named per test — `service_pricing_unique_idx` is
 * (service_type, coalesce(tier,''), name), so two tests sharing a name
 * collide.
 */
// deno-lint-ignore no-explicit-any
async function ensurePricing(core: any, label: string): Promise<string> {
  const { data, error } = await core
    .from('service_pricing')
    .insert({
      service_type: 'id_verification',
      name: `idv-test-${RUN}-${label}`,
      price_cents: 2500,
      is_active: true,
      display_order: 0,
    })
    .select('id')
    .single()
  if (error) throw new Error(`pricing fixture: ${error.message}`)
  return data.id as string
}

Deno.test({
  name: 'ID verification REST - /request mints the Persona inquiry before the charge exists',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = (admin as any).schema('core')
    const token = await workerToken()
    const workerUserId = await getUserIdByEmail(admin, TEST_USERS.regular.email)
    assertExists(workerUserId, 'seeded worker has no auth user')

    // Inside the try from here on, so a failure still cleans up.
    const pricingId = await ensurePricing(core, 'request')
    let intentId: string | null = null
    try {
      const { status, body } = await callREST('/id-verification/request', {
        method: 'POST',
        authToken: token,
        body: JSON.stringify({ workerUserId, pricingId }),
      })

      assertEquals(status, 200, `request failed: ${JSON.stringify(body)}`)
      const data = (body as { data?: Record<string, unknown> }).data ?? {}
      intentId = data.paymentIntentId as string
      assertExists(intentId, 'no payment intent returned')
      assertExists(data.clientSecret, 'no client secret returned')

      // The invariant. The ledger row exists before the client can pay, and it
      // already names the inquiry — so the inquiry predates any possible
      // charge, which is the whole point of #948 item 2.
      const { data: ledger, error } = await core
        .from('payment_transactions')
        .select('status, metadata')
        .eq('stripe_payment_intent_id', intentId)
        .single()
      if (error) throw new Error(`ledger read: ${error.message}`)

      assertEquals(ledger.status, 'pending')
      const metadata = ledger.metadata as Record<string, unknown>
      const inquiryId = metadata.persona_inquiry_id
      assert(
        typeof inquiryId === 'string' && inquiryId.length > 0,
        `ledger metadata carries no persona_inquiry_id: ${JSON.stringify(metadata)}`
      )
    } finally {
      if (intentId) {
        await core.from('payment_transactions').delete().eq('stripe_payment_intent_id', intentId)
      }
      await core.from('service_pricing').delete().eq('id', pricingId)
    }
  },
})

Deno.test({
  name: 'ID verification REST - /confirm reuses that inquiry rather than minting a new one',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = (admin as any).schema('core')
    const token = await workerToken()
    const workerUserId = await getUserIdByEmail(admin, TEST_USERS.regular.email)
    assertExists(workerUserId, 'seeded worker has no auth user')

    const pricingId = await ensurePricing(core, 'confirm')
    let intentId: string | null = null
    let verificationId: string | null = null
    try {
      const requested = await callREST('/id-verification/request', {
        method: 'POST',
        authToken: token,
        body: JSON.stringify({ workerUserId, pricingId }),
      })
      assertEquals(requested.status, 200, `request failed: ${JSON.stringify(requested.body)}`)
      intentId = ((requested.body as { data: Record<string, unknown> }).data
        .paymentIntentId) as string

      const { data: ledgerBefore } = await core
        .from('payment_transactions')
        .select('metadata')
        .eq('stripe_payment_intent_id', intentId)
        .single()
      const expectedInquiryId = (ledgerBefore.metadata as Record<string, unknown>)
        .persona_inquiry_id as string
      assertExists(expectedInquiryId, 'nothing to compare against')

      const confirmed = await callREST('/id-verification/confirm', {
        method: 'POST',
        authToken: token,
        body: JSON.stringify({ paymentIntentId: intentId }),
      })
      assertEquals(confirmed.status, 200, `confirm failed: ${JSON.stringify(confirmed.body)}`)
      verificationId = ((confirmed.body as { data: Record<string, unknown> }).data.id) as string
      assertExists(verificationId, 'no verification returned')

      const { data: verification, error } = await core
        .from('id_verifications')
        .select('persona_inquiry_id, persona_status, payment_intent_id, badge_status')
        .eq('id', verificationId)
        .single()
      if (error) throw new Error(`verification read: ${error.message}`)

      // The assertion that would have failed before this change: /confirm used
      // to call Persona itself, so the stored id could not have come from
      // /request. Equality here means no network call happened after payment.
      assertEquals(
        verification.persona_inquiry_id,
        expectedInquiryId,
        'confirm minted a new Persona inquiry instead of using the pre-charge one'
      )
      assertEquals(verification.payment_intent_id, intentId)
      assertEquals(verification.badge_status, 'active')

      // And the ledger was advanced to point at the verification.
      const { data: ledgerAfter } = await core
        .from('payment_transactions')
        .select('status, id_verification_id')
        .eq('stripe_payment_intent_id', intentId)
        .single()
      assertEquals(ledgerAfter.status, 'succeeded')
      assertEquals(ledgerAfter.id_verification_id, verificationId)
    } finally {
      if (intentId) {
        await core.from('payment_transactions').delete().eq('stripe_payment_intent_id', intentId)
      }
      if (verificationId) {
        await core.from('id_verifications').delete().eq('id', verificationId)
      }
      await core.from('service_pricing').delete().eq('id', pricingId)
    }
  },
})
