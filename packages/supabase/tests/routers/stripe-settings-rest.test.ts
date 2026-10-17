/**
 * Stripe settings REST API.
 *
 * `core.stripe_settings` is granted to service_role only — correct for payment
 * configuration — but every handler read and wrote it with the caller's client,
 * so each answered `permission denied for table stripe_settings` (production
 * too) and /office/settings/stripe showed a blank "not configured" form (#1018).
 *
 * The test reads the settings, saves a publishable key and reads it back as
 * the office, then restores the original row through the service client. It
 * does not touch the secret handlers: those write to Vault, and #948 says not
 * to populate Stripe keys yet.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  createAdminClient,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

// STRIPE_SETTINGS_TEST_API_BASE points the suite at a worktree's api on :8000.
const ENDPOINT = `${Deno.env.get('STRIPE_SETTINGS_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`}/stripe-settings`

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${ENDPOINT}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
  })
  const text = await response.text()
  let body: Record<string, unknown> | null = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  return { status: response.status, body }
}

Deno.test({
  name: 'Stripe settings REST - the office reads the settings and a saved publishable key reads back',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens?.office, 'An office-role token is required')
    const office = tokens!.office!.token
    const admin = createAdminClient()

    const { data: before } = await admin
      .schema('core')
      .from('stripe_settings')
      .select('publishable_key, updated_by')
      .eq('settings_name', 'stripe')
      .single()

    try {
      const read = await call('', office)
      assertEquals(read.status, 200, `the settings should load, got ${JSON.stringify(read.body)}`)
      assertEquals(typeof read.body?.hasApiKey, 'boolean')
      assertEquals(typeof read.body?.testMode, 'boolean')

      const key = `pk_test_stripe_settings_rest_${Date.now()}`
      const saved = await call('/publishable-key', office, {
        method: 'PUT',
        body: JSON.stringify({ publishableKey: key }),
      })
      assertEquals(saved.status, 200, `saving should succeed, got ${JSON.stringify(saved.body)}`)

      const after = await call('', office)
      assertEquals(after.body?.publishableKey, key, 'the saved key is what the settings now report')
    } finally {
      await admin
        .schema('core')
        .from('stripe_settings')
        .update({ publishable_key: before?.publishable_key ?? null, updated_by: before?.updated_by ?? null })
        .eq('settings_name', 'stripe')
    }
  },
})

Deno.test({
  name: 'Stripe settings REST - a caller without the office role is refused',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const { status } = await call('', tokens.regular.token)
    assertEquals(status, 403, 'payment configuration is office-only')
  },
})

/**
 * #1259: test_mode was only a stored flag. Nothing stopped a live secret key
 * being saved while the platform said "test mode" (real charges from a
 * screen labelled test), or a test key in live mode (charges that never
 * settle). Saving a key now requires its prefix to match the mode, and the
 * mode cannot be switched away from the stored key's.
 */
// deno-lint-ignore no-explicit-any
const core = () => (createAdminClient() as any).schema('core')
const fakeKey = (mode: 'live' | 'test') => `sk_${mode}_${'x'.repeat(40)}`

Deno.test({
  name: 'Stripe settings REST - a live key is refused in test mode, and a non-secret key always (#1259)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens?.office, 'An office-role token is required')
    const { data: before } = await core()
      .from('stripe_settings')
      .select('api_key_secret_id, test_mode')
      .eq('settings_name', 'stripe')
      .single()
    await core().from('stripe_settings').update({ test_mode: true }).eq('settings_name', 'stripe')
    try {
      for (const secret of [fakeKey('live'), `pk_test_${'x'.repeat(40)}`]) {
        const res = await call('/api-key', tokens!.office!.token, {
          method: 'PUT',
          body: JSON.stringify({ secret }),
        })
        assertEquals(res.status, 400, `${secret.slice(0, 8)}… must be refused, got ${res.status} ${JSON.stringify(res.body)}`)
      }
      const { data: after } = await core()
        .from('stripe_settings')
        .select('api_key_secret_id')
        .eq('settings_name', 'stripe')
        .single()
      assertEquals(after.api_key_secret_id, before.api_key_secret_id, 'no refused key was linked')
    } finally {
      await core()
        .from('stripe_settings')
        .update({ api_key_secret_id: before.api_key_secret_id, test_mode: before.test_mode })
        .eq('settings_name', 'stripe')
    }
  },
})

Deno.test({
  name: "Stripe settings REST - the mode cannot be switched away from the stored key's (#1259)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens?.office, 'An office-role token is required')
    const { data: before } = await core()
      .from('stripe_settings')
      .select('api_key_secret_id, test_mode')
      .eq('settings_name', 'stripe')
      .single()
    const { data: secretId, error } = await core().rpc('rotate_stripe_secret', {
      p_secret: fakeKey('test'),
      p_secret_type: 'api_key',
    })
    if (error) throw new Error(`store a test key: ${error.message}`)
    await core()
      .from('stripe_settings')
      .update({ api_key_secret_id: secretId, test_mode: true })
      .eq('settings_name', 'stripe')
    try {
      const res = await call('/test-mode', tokens!.office!.token, {
        method: 'PUT',
        body: JSON.stringify({ testMode: false }),
      })
      assertEquals(res.status, 409, `live mode over a test key must be refused, got ${res.status} ${JSON.stringify(res.body)}`)
      const { data: mode } = await core().from('stripe_settings').select('test_mode').eq('settings_name', 'stripe').single()
      assertEquals(mode.test_mode, true)
    } finally {
      await core()
        .from('stripe_settings')
        .update({ api_key_secret_id: before.api_key_secret_id, test_mode: before.test_mode })
        .eq('settings_name', 'stripe')
    }
  },
})
