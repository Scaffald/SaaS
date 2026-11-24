/**
 * Office jobs REST — a job gets posted_at when it goes live (#1409).
 *
 * My Listings labelled live jobs "0d IN DRAFT": nothing set posted_at when a
 * job went live except the scheduled-publish cron. Migration 398 stamps it in
 * a BEFORE trigger, so the api's create and PATCH are covered along with every
 * other writer. These go through the api because that is the path Boris used.
 *
 * Users: zach@unicorn.love (office, seeds/002).
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

type Job = { id: string; status: string; posted_at: string | null }

async function call(token: string, path: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(`${REST_BASE}/office/jobs${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })
  const json = await response.json().catch(() => null)
  return { status: response.status, body: json, job: json?.data?.job as Job | undefined }
}

Deno.test({
  name: 'Office jobs REST - posting live stamps posted_at; a draft has none until it goes live (#1409)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const office = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(office, 'office user should sign in (seeded)')
    const admin = createAdminClient()
    const { data: orgs } = await admin.schema('core').from('organizations').select('id').limit(1)
    const orgId = orgs?.[0]?.id as string
    assertExists(orgId, 'an organization is seeded')
    const base = {
      organization_id: orgId,
      description: 'A probe job created by office-jobs-posted-at-rest.test.ts.',
    }
    const ids: string[] = []

    try {
      const live = await call(office!, '', 'POST', { ...base, title: 'Probe Live Posting', status: 'open' })
      assertEquals(live.status, 201, JSON.stringify(live.body))
      ids.push(live.job!.id)
      assert(live.job?.posted_at, 'a job created live has posted_at')

      const draft = await call(office!, '', 'POST', { ...base, title: 'Probe Draft Posting', status: 'draft' })
      assertEquals(draft.status, 201, JSON.stringify(draft.body))
      ids.push(draft.job!.id)
      assertEquals(draft.job?.posted_at, null, 'a draft has not been posted')

      const opened = await call(office!, `/${draft.job!.id}`, 'PATCH', { status: 'open' })
      assertEquals(opened.status, 200, JSON.stringify(opened.body))
      assert(opened.job?.posted_at, 'moving a draft to open stamps posted_at')

      // Pausing and re-opening keeps the first stamp.
      const first = opened.job!.posted_at
      await call(office!, `/${draft.job!.id}`, 'PATCH', { status: 'paused' })
      const reopened = await call(office!, `/${draft.job!.id}`, 'PATCH', { status: 'open' })
      assertEquals(reopened.job?.posted_at, first, 're-opening keeps the first posted_at')
    } finally {
      if (ids.length) await admin.schema('core').from('jobs').delete().in('id', ids)
    }
  },
})

Deno.test({
  name: 'Office jobs REST - no live job is left without posted_at (#1409 backfill)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    const { count, error } = await admin
      .schema('core')
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open')
      .is('posted_at', null)
    assertEquals(error, null)
    assertEquals(count, 0, 'every open job has a posted_at')
  },
})
