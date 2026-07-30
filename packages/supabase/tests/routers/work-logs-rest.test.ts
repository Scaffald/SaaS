/**
 * Work logs REST API coverage.
 *
 * Exercises the create → submit cycle through the real REST handler at
 * `packages/supabase/functions/api/routes/work-logs.ts`. This is the path
 * `scripts/dogfood-log.ts` and the mobile/web client take, and it's the
 * path that broke in May 2026 (the `total_hours` insert and the missing
 * `/projects` route) — neither of which the existing MSW-mocked SDK tests
 * or the tRPC-only `work-logs.test.ts` would have caught.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'
import { getUserIdByEmail } from '../shared/test-context.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
  createAdminClient,
  getAuthToken,
  loadCachedTokens,
} from '../shared/setup.ts'

const REST_BASE = `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function callREST(
  path: string,
  init: RequestInit & { authToken?: string | null } = {},
) {
  const { authToken, headers: extraHeaders, ...rest } = init
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: TEST_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${authToken && authToken.length > 0 ? authToken : TEST_SUPABASE_ANON_KEY}`,
    ...(extraHeaders as Record<string, string> | undefined),
  }
  const response = await fetch(`${REST_BASE}${path}`, { ...rest, headers })
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: response.status, body }
}

Deno.test({
  name: 'Work logs REST - GET /projects requires auth (401 anon)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { status } = await callREST('/work-logs/projects')
    assertEquals(status, 401, 'Anonymous projects request should be 401')
  },
})

Deno.test({
  name: 'Work logs REST - create → submit cycle via SDK shape',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    const cachedTokens = await loadCachedTokens()

    let authToken = cachedTokens?.regular?.token ?? null
    if (!authToken) {
      authToken = await getAuthToken(
        TEST_USERS.regular.email,
        TEST_USERS.regular.password,
      )
    }
    assertExists(authToken, 'Authentication token required for REST test')

    let userId = cachedTokens?.regular?.userId ?? null
    if (!userId) {
      userId = await getUserIdByEmail(admin, TEST_USERS.regular.email)
    }
    assertExists(userId, 'Unable to resolve test user id')

    const suffix = crypto.randomUUID().slice(0, 8)
    const organizationId = crypto.randomUUID()
    const projectId = crypto.randomUUID()

    try {
      await admin
        .schema('core')
        .from('users')
        .upsert({
          id: userId,
          username: `rest-test-${suffix}`,
          slug: `rest-test-${suffix}`,
          display_name: 'REST Test User',
        })

      await admin
        .schema('core')
        .from('organizations')
        .insert({
          id: organizationId,
          owner_user_id: userId,
          name: `REST Test Org ${suffix}`,
          slug: `rest-test-org-${suffix}`,
          visibility: 'public',
        })

      await admin
        .schema('core')
        .from('construction_projects')
        .insert({
          id: projectId,
          organization_id: organizationId,
          name: `REST Test Project ${suffix}`,
          project_number: `REST-${suffix}`,
          status: 'active',
        })

      // === 1. POST /v1/work-logs via the SDK-shaped payload the dogfood
      //        script and mobile/web clients send.
      const createBody = {
        projectId,
        entryType: 'single_day',
        logDate: '2026-05-24',
        timeEntries: [{ start_time: '09:00', end_time: '13:30' }],
        workDescription: '[team:frontend] REST integration smoke',
        tasksCompleted: ['verify create', 'verify total_hours computed'],
        visibility: 'private',
        showOnProfile: false,
      }

      const create = await callREST('/work-logs', {
        method: 'POST',
        body: JSON.stringify(createBody),
        authToken,
      })

      assertEquals(
        create.status,
        201,
        `Expected 201 from POST /v1/work-logs, got ${create.status}: ${JSON.stringify(create.body)}`,
      )

      const created = create.body as {
        id: string
        status: string
        total_hours: number | string | null
      }
      assertExists(created.id, 'Response should include created work log id')
      assertEquals(created.status, 'draft', 'New work logs should be draft')
      assertExists(
        created.total_hours,
        'total_hours should be auto-computed by the GENERATED column',
      )
      assertEquals(
        Number(created.total_hours),
        4.5,
        'total_hours should compute to 4.5 from 09:00→13:30',
      )

      // === 2. POST /v1/work-logs/:id/submit transitions to pending_verification.
      const submit = await callREST(`/work-logs/${created.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({}),
        authToken,
      })

      assertEquals(
        submit.status,
        200,
        `Expected 200 from submit, got ${submit.status}: ${JSON.stringify(submit.body)}`,
      )
      const submitted = submit.body as { status: string }
      assertEquals(
        submitted.status,
        'pending_verification',
        'Submitted work log should transition to pending_verification',
      )

      // Cleanup the work log row; ON DELETE CASCADE handles audit + collab rows.
      await admin
        .schema('core')
        .from('work_logs')
        .delete()
        .eq('id', created.id)
    } finally {
      await admin
        .schema('core')
        .from('construction_projects')
        .delete()
        .eq('id', projectId)

      await admin
        .schema('core')
        .from('organizations')
        .delete()
        .eq('id', organizationId)
    }
  },
})
