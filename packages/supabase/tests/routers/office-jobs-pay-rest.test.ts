/**
 * Office jobs REST — pay range order and type (#1411, #1412).
 *
 * Boris, 23 Nov: Min above Max went live as "$90,000 – $50,000", and a range
 * saved without a pay type was invisible to workers. The api now refuses both
 * on create and on PATCH — the PATCH judged by the row it would leave, not the
 * body alone — and migration 399 holds the same rules as CHECK constraints.
 *
 * Users: zach@unicorn.love (office, seeds/002).
 * OFFICE_JOBS_TEST_API_BASE points the suite at a worktree's api run directly.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'
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
  return { status: response.status, body: json, job: json?.data?.job as { id: string } | undefined }
}

Deno.test({
  name: 'Office jobs REST - Min above Max, or pay without a type, is a 400 on create and on PATCH (#1411, #1412)',
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
      title: 'Probe Pay Rules',
      description: 'A probe job created by office-jobs-pay-rest.test.ts.',
    }
    const ids: string[] = []

    try {
      const reversed = await call(office!, '', 'POST', {
        ...base,
        pay_range_min_cents: 9_000_000,
        pay_range_max_cents: 5_000_000,
        pay_range_type: 'salary',
      })
      assertEquals(reversed.status, 400, `reversed range: ${JSON.stringify(reversed.body)}`)
      if (reversed.job) ids.push(reversed.job.id)

      const untyped = await call(office!, '', 'POST', { ...base, pay_range_min_cents: 4_000 })
      assertEquals(untyped.status, 400, `amount without a type: ${JSON.stringify(untyped.body)}`)
      if (untyped.job) ids.push(untyped.job.id)

      const good = await call(office!, '', 'POST', {
        ...base,
        pay_range_min_cents: 4_000,
        pay_range_max_cents: 5_000,
        pay_range_type: 'hourly',
      })
      assertEquals(good.status, 201, JSON.stringify(good.body))
      ids.push(good.job!.id)
      const path = `/${good.job!.id}`

      // Only Min in the body, but above the stored Max.
      const patchMin = await call(office!, path, 'PATCH', { pay_range_min_cents: 9_000 })
      assertEquals(patchMin.status, 400, `PATCH min above stored max: ${JSON.stringify(patchMin.body)}`)

      const clearType = await call(office!, path, 'PATCH', { pay_range_type: null })
      assertEquals(clearType.status, 400, `PATCH clearing the type: ${JSON.stringify(clearType.body)}`)

      const raise = await call(office!, path, 'PATCH', { pay_range_max_cents: 9_500 })
      assertEquals(raise.status, 200, JSON.stringify(raise.body))

      const clearAll = await call(office!, path, 'PATCH', {
        pay_range_min_cents: null,
        pay_range_max_cents: null,
        pay_range_type: null,
      })
      assertEquals(clearAll.status, 200, `clearing the pay: ${JSON.stringify(clearAll.body)}`)
    } finally {
      if (ids.length) await admin.schema('core').from('jobs').delete().in('id', ids)
    }
  },
})

Deno.test({
  name: 'Office jobs REST - the database refuses Min above Max and pay without a type (#1411, #1412)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    const { data: orgs } = await admin.schema('core').from('organizations').select('id').limit(1)
    const orgId = orgs?.[0]?.id as string
    const row = {
      organization_id: orgId,
      title: 'Probe Pay Constraint',
      description: 'Inserted directly by office-jobs-pay-rest.test.ts.',
      status: 'draft',
    }
    try {
      const reversed = await admin.schema('core').from('jobs').insert({
        ...row,
        pay_range_min_cents: 9_000,
        pay_range_max_cents: 5_000,
        pay_range_type: 'hourly',
      })
      assertEquals(reversed.error?.code, '23514', 'jobs_pay_range_order_check')

      const untyped = await admin.schema('core').from('jobs').insert({ ...row, pay_range_max_cents: 5_000 })
      assertEquals(untyped.error?.code, '23514', 'jobs_pay_range_type_required_check')
    } finally {
      await admin.schema('core').from('jobs').delete().eq('title', row.title)
    }
  },
})
