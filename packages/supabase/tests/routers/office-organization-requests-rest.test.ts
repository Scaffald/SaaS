/**
 * Office organization requests REST API.
 *
 * `GET /v1/office/organizations/requests` selected `message, personal_note,
 * viewed_at, resent_count` — columns of `core.invites` (migration 120), not of
 * `core.organization_requests`. Every call answered 500, on production too, and
 * the office review panel settled on "No pending organization requests. Check
 * back soon!" while real requests waited unreviewed (#1017).
 *
 * The test drives the whole path a request takes: a regular user submits one
 * through the real submission route, and the office caller must see it in the
 * pending list with the notes the requester wrote. Cleanup uses the service
 * client, because there is no route that deletes a request.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  createAdminClient,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const API = `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
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

type RequestRow = { id: string; name: string; notes: string | null; status: string }

Deno.test({
  name: 'Office organization requests REST - a submitted request appears in the pending list with its notes',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const office = tokens.office?.token ?? ''
    const regular = tokens.regular?.token ?? ''
    assertExists(office || null, 'An office-role token is required')
    assertExists(regular || null, 'A regular token is required')

    const slug = `org-request-test-${Date.now()}`
    const notes = 'We run three crews in the Portland metro.'
    const submitted = await call('/organizations/requests', regular, {
      method: 'POST',
      body: JSON.stringify({ name: 'Request Test Co', slug, notes }),
    })
    assertEquals(submitted.status, 201, `submission should succeed, got ${JSON.stringify(submitted.body)}`)
    const id = (submitted.body?.request as { id: string } | undefined)?.id
    assertExists(id, 'the submitted request comes back with an id')

    try {
      const listed = await call('/office/organizations/requests?status=pending&limit=100', office)
      assertEquals(listed.status, 200, `the pending list should load, got ${JSON.stringify(listed.body)}`)
      const rows = (listed.body?.requests as RequestRow[] | undefined) ?? []
      const row = rows.find((r) => r.id === id)
      assertExists(row, 'the new request is in the pending list')
      assertEquals(row?.status, 'pending')
      assertEquals(row?.notes, notes, 'the requester’s notes reach the reviewer')
      const counts = listed.body?.counts as { pending: number } | undefined
      assertEquals((counts?.pending ?? 0) >= 1, true, 'the pending count includes it')
    } finally {
      await createAdminClient().schema('core').from('organization_requests').delete().eq('id', id)
    }
  },
})

Deno.test({
  name: 'Office organization requests REST - a caller without the office role is refused',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const { status } = await call('/office/organizations/requests?status=pending', tokens.regular.token)
    assertEquals(status, 403, 'the review queue is office-only')
  },
})
