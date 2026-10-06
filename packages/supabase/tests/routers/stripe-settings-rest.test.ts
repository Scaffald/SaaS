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

const ENDPOINT = `${TEST_SUPABASE_URL}/functions/v1/api/v1/stripe-settings`

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
