/**
 * Office jobs REST API — the `myTeamsOnly` filter.
 *
 * `GET /v1/office/jobs` validated `myTeamsOnly` with `z.coerce.boolean()`,
 * which is `Boolean(value)`. A query string carries only strings, so
 * `Boolean("false")` is `true` and every value of the flag read as on. A
 * truthy `myTeamsOnly` then switches the `job_team_assignments` embed to an
 * inner join and filters to the caller's own team memberships, so the office
 * Jobs screen — which always sends the param, defaulting to `false` — showed
 * "No jobs found" against thirteen seeded jobs.
 *
 * The regression these tests pin is the equivalence: sending the flag off
 * must return what omitting it returns.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const REST_BASE = `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function listOfficeJobs(query: string, authToken: string) {
  const response = await fetch(`${REST_BASE}/office/jobs?${query}`, {
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
  // The office routes wrap in `{ data }`; tolerate either shape so the test
  // asserts the filter, not the envelope.
  const payload = (body?.data ?? body) as { jobs?: unknown[]; total?: number } | null
  return { status: response.status, jobs: payload?.jobs ?? [], total: payload?.total }
}

Deno.test({
  name: 'Office jobs REST - myTeamsOnly=false returns the same jobs as omitting it',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const token = tokens.admin.token ?? tokens.regular.token
    assertExists(token, 'An office-role token is required')

    const omitted = await listOfficeJobs('limit=100', token)
    assertEquals(omitted.status, 200, 'Listing without the flag should succeed')

    const off = await listOfficeJobs('limit=100&myTeamsOnly=false', token)
    assertEquals(off.status, 200, 'Listing with the flag off should succeed')

    assertEquals(
      off.jobs.length,
      omitted.jobs.length,
      'myTeamsOnly=false must not filter anything — this is the bug that emptied the office Jobs screen',
    )
  },
})

Deno.test({
  name: 'Office jobs REST - myTeamsOnly=true narrows the result, or leaves it unchanged',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const token = tokens.admin.token ?? tokens.regular.token
    assertExists(token, 'An office-role token is required')

    const all = await listOfficeJobs('limit=100', token)
    const mine = await listOfficeJobs('limit=100&myTeamsOnly=true', token)

    assertEquals(mine.status, 200, 'Listing with the flag on should succeed')
    assertEquals(
      mine.jobs.length <= all.jobs.length,
      true,
      'The team filter can only ever narrow the unfiltered list',
    )
  },
})

Deno.test({
  name: 'Office jobs REST - an unparseable myTeamsOnly is a validation error, not a silent true',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const token = tokens.admin.token ?? tokens.regular.token
    assertExists(token, 'An office-role token is required')

    const bogus = await listOfficeJobs('limit=100&myTeamsOnly=yes', token)
    assertEquals(
      bogus.status,
      400,
      'An unrecognised boolean should be rejected rather than read as true',
    )
  },
})
