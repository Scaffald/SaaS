/**
 * Employer applications REST API — the assignee embed (#1198).
 *
 * `GET /v1/employer/applications` returned `assigned_to` as a bare user id, so
 * the pipeline's assignee cell could only say "Assigned" — which names nobody.
 * The list now embeds `assignee` ({ id, display_name, username }) through the
 * `assigned_to` foreign key, and the office UI shows the person.
 *
 * The seed assigns nobody, so the test assigns one application to the caller
 * with the service role (not the PATCH route, which would also send an
 * assignment notification), reads the list over HTTP, and puts the row back.
 *
 * `EMPLOYER_APPS_TEST_API_BASE` points the suite at the function run directly
 * (`deno run functions/api/index.ts`) when the shared edge runtime belongs to
 * another checkout:
 *
 *     cd packages/supabase
 *     EMPLOYER_APPS_TEST_API_BASE=http://127.0.0.1:8000/v1 deno test --allow-all \
 *       --no-check --config tests/deno.json tests/routers/employer-applications-assignee-rest.test.ts
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  createAdminClient,
  loadCachedTokens,
} from '../shared/setup.ts'
import { getUserIdByEmail, requireAuthSetup } from '../shared/test-context.ts'

const REST_BASE = Deno.env.get('EMPLOYER_APPS_TEST_API_BASE') ??
  `${TEST_SUPABASE_URL}/functions/v1/api/v1`

interface ListedApplication {
  id: string
  assigned_to: string | null
  assignee?: { id: string; display_name: string | null; username: string | null } | null
}

async function listEmployerApplications(authToken: string) {
  const response = await fetch(`${REST_BASE}/employer/applications?limit=100`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${authToken}`,
    },
  })
  const body = (await response.json().catch(() => null)) as
    | { data?: ListedApplication[] }
    | null
  return { status: response.status, rows: body?.data ?? [] }
}

Deno.test({
  name: 'Employer applications REST - an unassigned row carries a null assignee',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    const token = tokens?.office?.token ?? ''
    assert(token, 'An office-role token is required')

    const { status, rows } = await listEmployerApplications(token)
    assertEquals(status, 200, 'Listing should succeed')
    assert(rows.length > 0, 'The seeded office user should see a pipeline')

    for (const row of rows.filter((r) => r.assigned_to == null)) {
      assertEquals(row.assignee ?? null, null, `row ${row.id} has no assignee to embed`)
    }
  },
})

Deno.test({
  name: 'Employer applications REST - an assigned row names its assignee',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    const office = tokens?.office
    assertExists(office, 'An office-role token is required')

    const before = await listEmployerApplications(office.token)
    assertEquals(before.status, 200, 'Listing should succeed')
    const target = before.rows[0]
    assertExists(target, 'The seeded office user should see a pipeline')

    const admin = createAdminClient()
    // The cached token's `userId` can be empty on an older fixture; the email
    // is the stable handle.
    const officeUserId = office.userId || (await getUserIdByEmail(admin, office.email))
    assertExists(officeUserId, 'The office user should exist')

    const { error: assignError } = await admin
      .schema('core')
      .from('applications')
      .update({ assigned_to: officeUserId })
      .eq('id', target.id)
    assertEquals(
      assignError?.message ?? null,
      null,
      'Assigning through the service role should succeed',
    )

    try {
      const after = await listEmployerApplications(office.token)
      const row = after.rows.find((r) => r.id === target.id)
      assertExists(row, 'The assigned row should still be listed')
      assertEquals(row.assigned_to, officeUserId)
      assertExists(row.assignee, 'The row should embed who it is assigned to')
      assertEquals(row.assignee.id, officeUserId)
      assert(
        Boolean(row.assignee.display_name || row.assignee.username),
        'The embed should carry something to call the assignee by',
      )
    } finally {
      // Put the row back exactly as the seed left it.
      await admin
        .schema('core')
        .from('applications')
        .update({ assigned_to: target.assigned_to })
        .eq('id', target.id)
    }
  },
})
