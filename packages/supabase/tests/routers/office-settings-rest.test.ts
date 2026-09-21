/**
 * Office settings REST API.
 *
 * `core.system_config` has RLS off and grants nothing to `authenticated`, so
 * reading it through PostgREST answers 42501. The admin geographic-settings
 * screen did that on every load, and its error path re-triggered the read —
 * about 35,000 requests per visit, never settling (Scaffald/SaaS#852, #856).
 *
 * The fix routes the read through the service role behind `requireRole`,
 * rather than widening the grant. These tests pin both halves: an office
 * caller gets the value, and the endpoint is genuinely role-gated.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const ENDPOINT = `${TEST_SUPABASE_URL}/functions/v1/api/v1/office/settings/geographic`

async function callGeographic(
  init: RequestInit & { authToken?: string | null } = {},
) {
  const { authToken, ...rest } = init
  const response = await fetch(ENDPOINT, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${authToken && authToken.length > 0 ? authToken : TEST_SUPABASE_ANON_KEY}`,
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
  name: 'Office settings REST - an office caller reads the site-overlap threshold',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const token = tokens.admin.token ?? tokens.regular.token
    assertExists(token, 'An office-role token is required')

    const { status, body } = await callGeographic({ authToken: token })
    assertEquals(status, 200, 'Office caller should be able to read the setting')
    assertEquals(
      typeof body?.siteOverlapThresholdPercent,
      'number',
      'The threshold should come back as a number, whatever jsonb stored',
    )
  },
})

Deno.test({
  name: 'Office settings REST - an anonymous caller is refused',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const { status } = await callGeographic({ authToken: null })
    assertEquals(
      status === 401 || status === 403,
      true,
      'The endpoint must be role-gated — the point of not widening the table grant',
    )
  },
})

Deno.test({
  name: 'Office settings REST - a threshold outside 0.1-10 is rejected',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const token = tokens.admin.token ?? tokens.regular.token
    assertExists(token, 'An office-role token is required')

    const { status } = await callGeographic({
      authToken: token,
      method: 'PUT',
      body: JSON.stringify({ siteOverlapThresholdPercent: 99 }),
    })
    assertEquals(status, 400, 'Out-of-range values should fail validation')
  },
})

Deno.test({
  name: 'Office settings REST - a saved threshold reads back',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const token = tokens.admin.token ?? tokens.regular.token
    assertExists(token, 'An office-role token is required')

    const original = await callGeographic({ authToken: token })
    const previous = (original.body?.siteOverlapThresholdPercent as number) ?? 2.0

    try {
      const saved = await callGeographic({
        authToken: token,
        method: 'PUT',
        body: JSON.stringify({ siteOverlapThresholdPercent: 3.5 }),
      })
      assertEquals(saved.status, 200, 'Saving a valid threshold should succeed')

      const reread = await callGeographic({ authToken: token })
      assertEquals(
        reread.body?.siteOverlapThresholdPercent,
        3.5,
        'The saved value should read back, whichever way jsonb stored it',
      )
    } finally {
      // Leave the setting as found — other suites read this table.
      await callGeographic({
        authToken: token,
        method: 'PUT',
        body: JSON.stringify({ siteOverlapThresholdPercent: previous }),
      })
    }
  },
})
