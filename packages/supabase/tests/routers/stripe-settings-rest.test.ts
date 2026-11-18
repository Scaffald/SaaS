/// <reference lib="deno.ns" />

/**
 * Stripe settings REST — the webhook signing secret (2026-11-18).
 *
 * PUT /v1/stripe-settings/webhook-secret ran the API-key check (sk_/rk_
 * only), so every real signing secret (`whsec_…`) was refused with 400, and
 * the page showed only "Error storing webhook secret" because the SDK found
 * no `message` in `{ error }`. Found setting up the dev sandbox.
 *
 * Real api function and real database (Vault), as an office user. Run the
 * same way as background-checks-rest.test.ts (BGC_TEST_API_BASE).
 */
import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import {
  createAdminClient,
  getAuthToken,
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
} from '../shared/setup.ts'

const REST_BASE = Deno.env.get('BGC_TEST_API_BASE') ??
  `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function put(path: string, token: string, body: unknown) {
  const res = await fetch(`${REST_BASE}${path}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json: Record<string, unknown> | null = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { status: res.status, body: json }
}

Deno.test({
  name: 'stripe settings REST - a whsec_ signing secret is stored; an API key in its place is refused with a readable message',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = (admin as any).schema('core')
    const token = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(token, 'no office token')

    const { data: before } = await core.from('stripe_settings').select('webhook_secret_id')
      .eq('settings_name', 'stripe').maybeSingle()
    assertExists(before, 'no stripe_settings row seeded')

    try {
      const wrong = await put('/stripe-settings/webhook-secret', token, { secret: 'sk_test_' + 'x'.repeat(30) })
      assertEquals(wrong.status, 400)
      assert(
        typeof wrong.body?.message === 'string' && (wrong.body.message as string).includes('whsec_'),
        `the refusal must carry a message the page can show: ${JSON.stringify(wrong.body)}`,
      )

      const ok = await put('/stripe-settings/webhook-secret', token, { secret: 'whsec_' + 'A1b2C3d4'.repeat(4) })
      assertEquals(ok.status, 200, `store failed: ${JSON.stringify(ok.body)}`)
      assertEquals(ok.body?.hasWebhookSecret, true)

      const { data: after } = await core.from('stripe_settings').select('webhook_secret_id')
        .eq('settings_name', 'stripe').single()
      assertExists(after.webhook_secret_id)
      assert(after.webhook_secret_id !== before.webhook_secret_id, 'the new secret was not linked')
    } finally {
      await core.from('stripe_settings').update({ webhook_secret_id: before.webhook_secret_id })
        .eq('settings_name', 'stripe')
    }
  },
})
