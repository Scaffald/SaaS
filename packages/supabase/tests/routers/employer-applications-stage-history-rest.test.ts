/**
 * Employer applications REST API — who moved an application (#1414).
 *
 * `stage_history` carried only `actor_user_id`, so the office Activity tab
 * headed a stage move with a raw uuid where the mover's name belonged. Each
 * transition now carries `actor_name` (display name, else username), looked up
 * in one batched query.
 *
 * The test records one status change by the office user with the service role
 * (not the PATCH route, which would also move the application and notify the
 * candidate), reads it back over HTTP from both the list and the detail route,
 * and deletes the event.
 *
 * `EMPLOYER_APPS_TEST_API_BASE` points the suite at the function run directly
 * when the shared edge runtime belongs to another checkout:
 *
 *     cd packages/supabase
 *     EMPLOYER_APPS_TEST_API_BASE=http://127.0.0.1:8000/v1 deno test --allow-all \
 *       --no-check --config tests/deno.json tests/routers/employer-applications-stage-history-rest.test.ts
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

interface StageChange {
  from_status: string | null
  to_status: string
  actor_user_id: string | null
  actor_name?: string | null
  changed_at: string
}

interface EmployerApplication {
  id: string
  job_id: string
  stage_history?: StageChange[]
}

async function get<T>(path: string, authToken: string): Promise<{ status: number; body: T | null }> {
  const response = await fetch(`${REST_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${authToken}`,
    },
  })
  const body = (await response.json().catch(() => null)) as T | null
  return { status: response.status, body }
}

Deno.test({
  name: 'Employer applications REST - stage_history names who made each move (#1414)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    const office = tokens?.office
    assertExists(office, 'An office-role token is required')

    const list = await get<{ data?: EmployerApplication[] }>(
      '/employer/applications?limit=100',
      office.token,
    )
    assertEquals(list.status, 200, 'Listing should succeed')
    const target = list.body?.data?.[0]
    assertExists(target, 'The seeded office user should see a pipeline')

    const admin = createAdminClient()
    const officeUserId = office.userId || (await getUserIdByEmail(admin, office.email))
    assertExists(officeUserId, 'The office user should exist')

    const { data: officeUser } = await admin
      .schema('core')
      .from('users')
      .select('display_name, username')
      .eq('id', officeUserId)
      .single()
    const expectedName = officeUser?.display_name?.trim() || officeUser?.username?.trim() || null
    assert(expectedName, 'The seeded office user should have a display name or username')

    const { data: job } = await admin
      .schema('core')
      .from('jobs')
      .select('organization_id')
      .eq('id', target.job_id)
      .single()
    assertExists(job?.organization_id, "The application's job should belong to an organization")

    // A marker transition, so the assertion finds this event and not a seeded one.
    const marker = { from: 'pending', to: 'reviewing', reason: 'stage-history-actor-test' }
    const { data: event, error: insertError } = await admin
      .schema('core')
      .from('application_activity')
      .insert({
        application_id: target.id,
        organization_id: job.organization_id,
        actor_user_id: officeUserId,
        event_type: 'status_changed',
        details: marker,
        created_at: '2000-01-01T00:00:00Z',
      })
      .select('id')
      .single()
    assertEquals(insertError?.message ?? null, null, 'Recording the event should succeed')
    assertExists(event)

    const findMarker = (history: StageChange[] | undefined) =>
      (history ?? []).find((change) => change.changed_at.startsWith('2000-01-01'))

    try {
      const after = await get<{ data?: EmployerApplication[] }>(
        '/employer/applications?limit=100',
        office.token,
      )
      const row = after.body?.data?.find((r) => r.id === target.id)
      assertExists(row, 'The application should still be listed')
      const listed = findMarker(row.stage_history)
      assertExists(listed, 'The recorded move should be in stage_history')
      assertEquals(listed.actor_user_id, officeUserId)
      assertEquals(listed.actor_name, expectedName, 'The list should name the mover')

      const detail = await get<EmployerApplication>(
        `/employer/applications/${target.id}`,
        office.token,
      )
      assertEquals(detail.status, 200, 'The detail route should succeed')
      const detailed = findMarker(detail.body?.stage_history)
      assertExists(detailed, 'The detail route should carry the move too')
      assertEquals(detailed.actor_name, expectedName, 'The detail route should name the mover')

      for (const change of row.stage_history ?? []) {
        assert('actor_name' in change, 'Every transition carries actor_name, even when null')
      }
    } finally {
      await admin.schema('core').from('application_activity').delete().eq('id', event.id)
    }
  },
})
