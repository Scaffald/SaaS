/**
 * GET /v1/stripe-config — what a paying user's card form needs (#1258).
 *
 * The publishable key was served only by /v1/stripe-settings, which is
 * office-only, so PaymentIntentForm showed "Stripe publishable key is missing"
 * to every worker and employer — everyone who actually pays. This route gives
 * any signed-in user the two values Stripe.js needs and nothing else: no
 * secret ids, no webhook URL, no test results.
 *
 * API_BASE defaults to the local edge runtime; set STRIPE_CONFIG_TEST_API_BASE
 * to run against a worktree's api on :8000.
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
  createAdminClient,
  getAuthToken,
} from '../shared/setup.ts'

const API = Deno.env.get('STRIPE_CONFIG_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`

// deno-lint-ignore no-explicit-any
const core = () => (createAdminClient() as any).schema('core')

async function call(token: string | null) {
  const res = await fetch(`${API}/stripe-config`, {
    headers: { apikey: TEST_SUPABASE_ANON_KEY, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const text = await res.text()
  let body: Record<string, unknown> | null = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  return { status: res.status, body }
}

Deno.test({
  name: 'Stripe config REST - a worker can read the publishable key and nothing secret (#1258)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const worker = await getAuthToken(TEST_USERS.regular.email, TEST_USERS.regular.password)
    assertExists(worker, 'test@example.com should sign in')

    const { data: before } = await core()
      .from('stripe_settings')
      .select('publishable_key, test_mode')
      .eq('settings_name', 'stripe')
      .single()
    const probeKey = `pk_test_probe_${crypto.randomUUID().slice(0, 8)}`
    await core().from('stripe_settings').update({ publishable_key: probeKey }).eq('settings_name', 'stripe')
    try {
      const res = await call(worker)
      assertEquals(res.status, 200, `worker should read the config, got ${res.status} ${JSON.stringify(res.body)}`)
      assertEquals(res.body?.publishableKey, probeKey)
      assertEquals(typeof res.body?.testMode, 'boolean')
      assertEquals(Object.keys(res.body ?? {}).sort().join(','), 'publishableKey,testMode', 'no other fields leak')
    } finally {
      await core()
        .from('stripe_settings')
        .update({ publishable_key: before.publishable_key, test_mode: before.test_mode })
        .eq('settings_name', 'stripe')
    }
  },
})

Deno.test({
  name: 'Stripe config REST - anonymous callers are refused (#1258)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const res = await call(null)
    assert(res.status === 401 || res.status === 403, `expected 401/403, got ${res.status}`)
  },
})
