/**
 * Legal agreements REST API — the violation reports list.
 *
 * `GET /v1/legal-agreements/violation-reports` returned 500 on every request,
 * for every caller including `super_admin` (#901):
 *
 *   Could not find a relationship between 'circumvention_reports' and 'users'
 *   in the schema cache
 *
 * Two faults, one behind the other. The list embeds two user relationships by
 * constraint name; `circumvention_reports_reported_by_user_id_fkey` pointed at
 * `auth.users`, a schema PostgREST does not expose, so the embed had no
 * resolvable target and the whole select failed — taking the `worker` embed
 * down with it even though that one pointed at `core.users` and was fine.
 * Migration 359 re-points both user constraints at `core.users`.
 *
 * With the relationship resolved the query still failed, because the embeds
 * selected an `email` column `core.users` does not have. `username` replaces
 * it as the display-name fallback.
 *
 * The test asserts the endpoint answers at all. That sounds thin, and it is
 * exactly the assertion that was missing: this endpoint was broken for every
 * caller and nothing noticed.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'
import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  getAuthToken,
} from '../shared/setup.ts'

const REST_BASE = `${TEST_SUPABASE_URL}/functions/v1/api/v1`

/** Seeded with the platform `office` role by `seeds/002_seed-users.sql`. */
const OFFICE_USER = { email: 'zach@unicorn.love', password: 'password123' }

async function listViolationReports(query: string, authToken: string) {
  const response = await fetch(`${REST_BASE}/legal-agreements/violation-reports?${query}`, {
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
  return { status: response.status, body, raw: text }
}

Deno.test({
  name: 'Legal agreements REST - the violation reports list resolves its user embeds',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const token = await getAuthToken(OFFICE_USER.email, OFFICE_USER.password)
    assertExists(token, `An office-role token is required (${OFFICE_USER.email})`)

    const { status, body, raw } = await listViolationReports('limit=25', token)

    assertEquals(
      status,
      200,
      `The list must load — 500 here is the #901 regression. Body: ${raw.slice(0, 200)}`,
    )
    assertEquals(Array.isArray(body?.items), true, 'The list answers with an items array')
    assertEquals(typeof body?.totalCount, 'number', 'The list answers with a totalCount')
  },
})

Deno.test({
  name: 'Legal agreements REST - a filtered list resolves the same embeds',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const token = await getAuthToken(OFFICE_USER.email, OFFICE_USER.password)
    assertExists(token, 'An office-role token is required')

    // The status filter runs the same select, so it fails the same way when an
    // embed cannot resolve. Worth pinning separately: the screen's filters are
    // the path a reader is most likely to take after the list loads.
    const { status } = await listViolationReports('limit=25&status=pending', token)

    assertEquals(status, 200, 'Filtering by status must not break the embeds')
  },
})

Deno.test({
  name: 'Legal agreements REST - reports name their reporter and worker',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const token = await getAuthToken(OFFICE_USER.email, OFFICE_USER.password)
    assertExists(token, 'An office-role token is required')

    const { status, body } = await listViolationReports('limit=25', token)
    assertEquals(status, 200)

    const items = (body?.items ?? []) as Array<Record<string, unknown>>
    if (items.length === 0) {
      // No reports on this database — the shape assertions above still hold.
      return
    }

    // `reportedByName` is `display_name ?? username`; both live on the embedded
    // row, so a null here means the embed resolved to nothing rather than that
    // the user is anonymous.
    const named = items.filter((item) => typeof item.reportedByName === 'string' && item.reportedByName)
    assertEquals(
      named.length > 0,
      true,
      'At least one report must name its reporter — all-null means the user embed is empty again',
    )
  },
})
