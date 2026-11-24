/**
 * Office jobs REST — a resent create returns the first job (#1408).
 *
 * Two quick presses of Post (or Save draft then Post) both reached
 * `POST /v1/office/jobs`, which inserted blindly, so Boris got two identical
 * jobs. The form now sends a client-generated `id`, once per form; the route
 * inserts with it and answers a repeat with the row it already made. An
 * `Idempotency-Key` header is not an option: Kong's CORS allow-list drops it.
 *
 * Users: zach@unicorn.love (office, seeds/002); the cached `regular` token.
 * OFFICE_JOBS_TEST_API_BASE points the suite at a worktree's api run directly.
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
  createAdminClient,
  getAuthToken,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const REST_BASE = Deno.env.get('OFFICE_JOBS_TEST_API_BASE') ??
  `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function post(token: string, body: Record<string, unknown>) {
  const response = await fetch(`${REST_BASE}/office/jobs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let json: Record<string, unknown> | null = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = null
  }
  const job = (json?.data as { job?: { id: string; status: string } } | undefined)?.job
  return { status: response.status, body: json, job }
}

async function anyOrganization() {
  const admin = createAdminClient()
  const { data, error } = await admin.schema('core').from('organizations').select('id').limit(1)
  assertExists(data?.[0], `an organization is seeded: ${JSON.stringify(error)}`)
  return { admin, orgId: data[0].id as string }
}

Deno.test({
  name: 'Office jobs REST - the same id posted twice makes one job and returns it both times (#1408)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const office = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(office, 'office user should sign in (seeded)')
    const { admin, orgId } = await anyOrganization()
    const id = crypto.randomUUID()
    const body = {
      id,
      organization_id: orgId,
      title: `Probe Idempotent Welder ${id.slice(0, 8)}`,
      description: 'A probe job created by office-jobs-idempotent-rest.test.ts.',
      status: 'draft',
    }

    try {
      // Fired together, the way a double click sends them.
      const [a, b] = await Promise.all([post(office!, body), post(office!, body)])
      assertEquals(
        [a.status, b.status].sort().join(','),
        '200,201',
        `one insert and one replay: ${JSON.stringify([a.body, b.body])}`,
      )
      assertEquals(a.job?.id, id)
      assertEquals(b.job?.id, id)

      // Save draft then Post: the second request is a replay, not a twin.
      const again = await post(office!, { ...body, status: 'open' })
      assertEquals(again.status, 200)
      assertEquals(again.job?.id, id)

      const { count } = await admin
        .schema('core')
        .from('jobs')
        .select('id', { count: 'exact', head: true })
        .eq('title', body.title)
        .eq('organization_id', orgId)
      assertEquals(count, 1, 'exactly one row for the repeated id')
    } finally {
      // By title too: a run against an api without this fix makes twins.
      await admin.schema('core').from('jobs').delete().eq('title', body.title)
    }
  },
})

Deno.test({
  name: 'Office jobs REST - a create without an id still gets a server id (#1408)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const office = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(office)
    const { admin, orgId } = await anyOrganization()
    const created = await post(office!, {
      organization_id: orgId,
      title: 'Probe Server Id',
      description: 'A probe job created by office-jobs-idempotent-rest.test.ts.',
    })
    try {
      assertEquals(created.status, 201, JSON.stringify(created.body))
      assert(created.job?.id, 'a server-generated id')
    } finally {
      if (created.job?.id) await admin.schema('core').from('jobs').delete().eq('id', created.job.id)
    }
  },
})

Deno.test({
  name: "Office jobs REST - someone else's job id is a 409, not that job (#1408)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const office = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(office)
    const { admin, orgId } = await anyOrganization()
    // A job created by someone else (no creator), with a known id.
    const id = crypto.randomUUID()
    const { error } = await admin.schema('core').from('jobs').insert({
      id,
      organization_id: orgId,
      title: 'Probe Foreign Job',
      description: 'Inserted directly by office-jobs-idempotent-rest.test.ts.',
      status: 'draft',
    })
    assertEquals(error, null)
    try {
      const replay = await post(office!, {
        id,
        organization_id: orgId,
        title: 'Probe Foreign Job',
        description: 'A probe job created by office-jobs-idempotent-rest.test.ts.',
      })
      assertEquals(replay.status, 409, JSON.stringify(replay.body))
      assertEquals(replay.job, undefined, 'the other job is not returned')
    } finally {
      await admin.schema('core').from('jobs').delete().eq('id', id)
    }
  },
})
