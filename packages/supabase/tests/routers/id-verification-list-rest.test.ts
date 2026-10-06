/**
 * Office ID-verification list — `GET /v1/id-verification/list`.
 *
 * The list embedded `users(…, email, …)`, and `core.users` has no email column
 * (it lives in `auth.users`). PostgREST failed the whole request with
 * `column users_1.email does not exist`, on production too, and the office
 * screen settled on "No ID verifications found for this filter" (#1020). The
 * admin background-check routes had the identical bug once (#635); both now
 * resolve emails through `_shared/user-emails.ts`.
 *
 * The existing id-verification-rest suite covers /request and /confirm only,
 * and is not gated — nothing exercised this route.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  createAdminClient,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const ENDPOINT = `${TEST_SUPABASE_URL}/functions/v1/api/v1/id-verification/list`

async function list(token: string, query = '') {
  const response = await fetch(`${ENDPOINT}${query}`, {
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

const claims = (token: string) => JSON.parse(atob(token.split('.')[1])) as { sub: string; email: string }

Deno.test({
  name: 'ID verification list - the office sees a verification with the worker’s name and email',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens?.office, 'An office-role token is required')
    const admin = createAdminClient()
    // The cached `regular` token is not always test@example.com (other suites
    // reseed it), so the JWT is the source of truth for who the worker is.
    const worker = claims(tokens!.regular.token)
    const workerId = worker.sub
    const stamp = Date.now()

    const { data: row, error } = await admin
      .schema('core')
      .from('id_verifications')
      .insert({
        worker_user_id: workerId,
        payment_intent_id: `pi_test_idv_list_${stamp}`,
        persona_inquiry_id: `inq_test_idv_list_${stamp}`,
        price_cents: 1500,
        paid_at: new Date().toISOString(),
        badge_status: 'active',
      })
      .select('id')
      .single()
    assertEquals(error, null, `seeding a verification failed: ${error?.message}`)
    const id = row!.id as string

    try {
      const { status, body } = await list(tokens!.office!.token, '?limit=200&offset=0&status=all')
      assertEquals(status, 200, `the list should load, got ${JSON.stringify(body)}`)
      const items = (body?.data as { items?: { id: string; workerEmail: string | null }[] } | undefined)?.items
      assertExists(items, `the list answers { data: { items } }, got ${JSON.stringify(body)?.slice(0, 200)}`)
      const item = items!.find((v) => v.id === id)
      assertExists(item, 'the seeded verification is listed')
      assertEquals(item?.workerEmail, worker.email, 'the worker’s email comes from auth.users')
    } finally {
      await admin.schema('core').from('id_verifications').delete().eq('id', id)
    }
  },
})

Deno.test({
  name: 'ID verification list - a caller without the office role is refused',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const { status } = await list(tokens.regular.token)
    assertEquals(status, 403, 'the office list is office-only')
  },
})
