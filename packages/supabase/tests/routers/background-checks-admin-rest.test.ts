/**
 * Background checks admin REST API — `/v1/background-checks/admin/*`.
 *
 * The admin screening list loaded, but opening any check answered 500:
 * `column background_checks.metadata does not exist` (production too). The
 * detail select named a column the table has never had (#1043). No HTTP test
 * covered these routes, which also carry the subject's email resolved from
 * auth.users (#635, now `_shared/user-emails.ts`).
 *
 * Relies on the seeded checks in seeds/015_seed-background-checks.sql.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, loadCachedTokens } from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const API = `${TEST_SUPABASE_URL}/functions/v1/api/v1/background-checks/admin`

async function get(path: string, token: string) {
  const response = await fetch(`${API}${path}`, {
    headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
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
  name: 'Background checks admin REST - the office lists checks and opens one, with the subject’s email',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens?.office, 'An office-role token is required')
    const office = tokens!.office!.token

    const list = await get('/checks?limit=5', office)
    assertEquals(list.status, 200, `the list should load, got ${JSON.stringify(list.body)?.slice(0, 200)}`)
    const raw = list.body?.data as unknown
    const rows = (Array.isArray(raw) ? raw : (raw as { items?: unknown[] })?.items) as { id: string }[] | undefined
    assertExists(rows?.[0]?.id, 'the seeded checks should be listed')

    const detail = await get(`/checks/${rows![0].id}`, office)
    assertEquals(detail.status, 200, `the detail should load, got ${JSON.stringify(detail.body)?.slice(0, 200)}`)
    const check = (detail.body?.data as { check?: Record<string, unknown> } | undefined)?.check
    assertEquals(check?.id, rows![0].id)
    assertEquals(typeof check?.metadata, 'object', 'metadata is still part of the shape, defaulted')
    const worker = check?.worker as { email?: string | null } | undefined
    assertEquals(typeof worker?.email, 'string', 'the subject’s email comes from auth.users')
  },
})

Deno.test({
  name: 'Background checks admin REST - a caller without the office role is refused',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const { status } = await get('/checks', tokens.regular.token)
    assertEquals(status, 403, 'the admin screening queue is office-only')
  },
})
