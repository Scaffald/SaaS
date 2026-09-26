/**
 * Office communities REST API — the office gate on the verification queue.
 *
 * Every endpoint behind `/office/communities/verification` answered
 * `403 {"error":"Office role required"}` to every caller, including holders of
 * `super_admin`, `admin` and `office` (#900). The gate was a local helper:
 *
 *   const { data: user } = await supabase
 *     .schema("core").from("users").select("role").eq("id", userId).maybeSingle();
 *   return user?.role === "office" || user?.role === "admin";
 *
 * `core.users` has no `role` column. The select errored, only `data` was
 * destructured so the error was discarded, `user?.role` was `undefined`, and
 * the helper returned false unconditionally. Roles live in
 * `core.role_assignments` joined to `core.roles`.
 *
 * These tests pin both directions, because a gate that is wrong in either is
 * equally broken: an office user must get in, and a worker must not. The old
 * code would have passed a "denies a worker" test on its own.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'
import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
  getAuthToken,
} from '../shared/setup.ts'

const REST_BASE = `${TEST_SUPABASE_URL}/functions/v1/api/v1`

/**
 * Seeded by `seeds/002_seed-users.sql`, which grants the platform `office`
 * role to the core team addresses. `TEST_USERS.admin` cannot stand in here —
 * it carries `worker/platform` only (#478).
 */
const OFFICE_USER = { email: 'zach@unicorn.love', password: 'password123' }

async function getVerificationQueue(authToken: string) {
  const response = await fetch(`${REST_BASE}/office/communities/verification-queue?limit=5`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${authToken}`,
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
  name: 'Office communities REST - an office user can read the verification queue',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const token = await getAuthToken(OFFICE_USER.email, OFFICE_USER.password)
    assertExists(token, `An office-role token is required (${OFFICE_USER.email})`)

    const { status, body } = await getVerificationQueue(token)

    assertEquals(
      status,
      200,
      'An office user must reach the queue — 403 here is the #900 regression',
    )
    assertEquals(
      Array.isArray(body?.data),
      true,
      'The queue answers with a data array',
    )
    assertEquals(
      typeof body?.total,
      'number',
      'The queue answers with a total',
    )
  },
})

Deno.test({
  name: 'Office communities REST - a worker is refused the verification queue',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const token = await getAuthToken(TEST_USERS.regular.email, TEST_USERS.regular.password)
    assertExists(token, 'A worker token is required')

    const { status } = await getVerificationQueue(token)

    assertEquals(status, 403, 'A user without the office role must still be refused')
  },
})

Deno.test({
  name: 'Office communities REST - queue rows name the person waiting',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const token = await getAuthToken(OFFICE_USER.email, OFFICE_USER.password)
    assertExists(token, 'An office-role token is required')

    const { status, body } = await getVerificationQueue(token)
    assertEquals(status, 200)

    const rows = (body?.data ?? []) as Array<Record<string, unknown>>
    if (rows.length === 0) {
      // Nothing pending on this database. The shape assertions above still
      // hold; there is nothing here to name.
      return
    }

    /**
     * The enrichment used to select `id, display_name, email` from
     * `core.users`, which has no `email` column — so the query errored, its
     * error was discarded, and every row came back with a null name. A queue
     * of "Unknown User" is not a queue anyone can act on.
     */
    const named = rows.filter((row) => typeof row.display_name === 'string' && row.display_name)
    assertEquals(
      named.length > 0,
      true,
      'At least one pending row must carry a display name — all-null means the user enrichment is failing again',
    )
  },
})
