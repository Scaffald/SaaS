/**
 * Public jobs list REST API — `GET /v1/jobs`.
 *
 * The job rows score each posting's requirements against the viewer's
 * profile (#1180), and the detail screen does the same. The list's select
 * names its columns one by one and left out `drivers_license_type`, so a row
 * could not tell a licence requirement that names a class from one that does
 * not, and the row's count disagreed with the detail's (#1282). These tests
 * pin the column on the wire, and the `organizationId` filter the map's
 * employer preview relies on (`/jobs/browse?org=`).
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient } from '../shared/setup.ts'

// `JOBS_LIST_TEST_API_BASE` points the suite at the api function run
// directly (`http://127.0.0.1:<port>/v1`), the same seam as
// OFFICE_JOBS_TEST_API_BASE: the shared edge runtime serves whichever
// checkout started the stack, not the one under test.
const REST_BASE = Deno.env.get('JOBS_LIST_TEST_API_BASE') ??
  `${TEST_SUPABASE_URL}/functions/v1/api/v1`

type JobRow = Record<string, unknown> & { id: string; organization_id: string }

async function listJobs(query: string) {
  const response = await fetch(`${REST_BASE}/jobs?${query}`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${TEST_SUPABASE_ANON_KEY}`,
    },
  })
  const body = await response.json().catch(() => null) as { data?: JobRow[] } | null
  return { status: response.status, jobs: body?.data ?? [] }
}

Deno.test({
  name: 'Jobs list REST - each row carries drivers_license_type',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    const { data: job, error } = await admin
      .schema('core')
      .from('jobs')
      .select('id, require_drivers_license, drivers_license_type')
      .eq('status', 'open')
      .not('is_confidential', 'is', true)
      .limit(1)
      .single()
    assertEquals(error, null, 'The seed should have an open, public job')
    assertExists(job)

    // Give one listed job a named class, so the assertion is about a real
    // value rather than a key that happens to be null on every row.
    await admin
      .schema('core')
      .from('jobs')
      .update({ require_drivers_license: true, drivers_license_type: 'CDL-A' })
      .eq('id', job.id)

    try {
      const listed = await listJobs('limit=100')
      assertEquals(listed.status, 200, 'Listing should succeed')
      for (const row of listed.jobs) {
        assertEquals(
          'drivers_license_type' in row,
          true,
          `Job ${row.id} should carry drivers_license_type so its row scores like its detail`,
        )
      }
      const ours = listed.jobs.find((row) => row.id === job.id)
      assertExists(ours, 'The updated job should be listed')
      assertEquals(ours.drivers_license_type, 'CDL-A')
    } finally {
      await admin
        .schema('core')
        .from('jobs')
        .update({
          require_drivers_license: job.require_drivers_license,
          drivers_license_type: job.drivers_license_type,
        })
        .eq('id', job.id)
    }
  },
})

Deno.test({
  name: "Jobs list REST - organizationId returns only that employer's jobs",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const all = await listJobs('limit=100')
    assertEquals(all.status, 200, 'Listing should succeed')
    const organizationId = all.jobs[0]?.organization_id
    assertExists(organizationId, 'The seed should list at least one job')

    const scoped = await listJobs(`limit=100&organizationId=${organizationId}`)
    assertEquals(scoped.status, 200, 'Listing one employer should succeed')
    assertEquals(scoped.jobs.length > 0, true, "That employer's job should be listed")
    for (const row of scoped.jobs) {
      assertEquals(row.organization_id, organizationId)
    }
  },
})
