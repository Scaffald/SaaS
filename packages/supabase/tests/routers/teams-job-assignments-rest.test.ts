/**
 * Teams REST — assigning jobs to a team (#1348).
 *
 * The SDK calls /v1/teams/:id/jobs; the API served /{id}/job-assignments,
 * wrote with the caller's JWT (which has only SELECT on
 * core.job_team_assignments), left out the NOT NULL organization_id, and
 * answered raw snake_case rows. No call through the SDK could work.
 *
 * Users: zach@unicorn.love (platform super_admin, seeds/002); the cached
 * `regular` token (worker, not a team manager).
 *
 * TEAMS_TEST_API_BASE points the suite at a worktree's api run directly
 * (http://127.0.0.1:8000/v1) instead of the shared edge runtime.
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
  createAdminClient,
  getAuthToken,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const REST_BASE = Deno.env.get('TEAMS_TEST_API_BASE') ??
  `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${REST_BASE}/teams${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
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

type Assignment = {
  id: string
  teamId: string
  jobId: string
  isPrimary: boolean
  assignedBy: string | null
  job: { id: string; title: string; organizationId: string } | null
}

Deno.test({
  name: 'Teams REST - a manager assigns, lists and removes a team\'s jobs through the SDK paths (#1348)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const office = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(office, 'office user should sign in (seeded)')
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const admin = createAdminClient()

    // Two teams in one organisation, and a job in another.
    const { data: teams } = await admin.schema('core').from('teams').select('id, organization_id').limit(100)
    const byOrg = new Map<string, string[]>()
    for (const t of (teams ?? []) as Array<{ id: string; organization_id: string }>) {
      byOrg.set(t.organization_id, [...(byOrg.get(t.organization_id) ?? []), t.id])
    }
    const [orgId, orgTeams] = [...byOrg.entries()].sort((a, b) => b[1].length - a[1].length)[0]
    assert(orgTeams.length >= 1, 'needs a seeded team')
    const otherOrg = [...byOrg.keys()].find((o) => o !== orgId)

    const tag = crypto.randomUUID().slice(0, 8)
    const { data: job, error: jobError } = await admin
      .schema('core')
      .from('jobs')
      .insert({ organization_id: orgId, title: `Probe team job ${tag}`, status: 'draft' })
      .select('id')
      .single()
    assertExists(job, `seed a job: ${JSON.stringify(jobError)}`)
    let foreignJobId: string | undefined
    if (otherOrg) {
      const { data } = await admin
        .schema('core')
        .from('jobs')
        .insert({ organization_id: otherOrg, title: `Probe foreign job ${tag}`, status: 'draft' })
        .select('id')
        .single()
      foreignJobId = data?.id
    }

    const team = orgTeams[0]
    try {
      const refused = await call(`/${team}/jobs`, tokens!.regular.token, {
        method: 'POST',
        body: JSON.stringify({ jobId: job.id }),
      })
      assertEquals(refused.status, 403, `a worker is refused: ${JSON.stringify(refused.body)}`)

      const created = await call(`/${team}/jobs`, office!, {
        method: 'POST',
        body: JSON.stringify({ jobId: job.id }),
      })
      assertEquals(created.status, 200, `assign: ${JSON.stringify(created.body)}`)
      const assignment = (created.body?.assignment ?? {}) as Assignment
      assertEquals(assignment.teamId, team, 'camelCase teamId')
      assertEquals(assignment.jobId, job.id, 'camelCase jobId')
      assertEquals(assignment.isPrimary, true, 'the first assignment is primary')
      assertEquals(assignment.job?.organizationId, orgId, 'the job is embedded')

      const dup = await call(`/${team}/jobs`, office!, { method: 'POST', body: JSON.stringify({ jobId: job.id }) })
      assertEquals(dup.status, 409, `duplicate: ${JSON.stringify(dup.body)}`)

      if (foreignJobId) {
        const cross = await call(`/${team}/jobs`, office!, {
          method: 'POST',
          body: JSON.stringify({ jobId: foreignJobId }),
        })
        assertEquals(cross.status, 400, `another org's job: ${JSON.stringify(cross.body)}`)
      }

      const { data: synced } = await admin.schema('core').from('jobs').select('team_ids, assigned_team_id').eq('id', job.id).single()
      assertEquals((synced?.team_ids ?? []).join(), team, 'jobs.team_ids kept in step')
      assertEquals(synced?.assigned_team_id, team, 'jobs.assigned_team_id kept in step')

      const listed = await call(`/${team}/jobs`, office!)
      assertEquals(listed.status, 200, `list: ${JSON.stringify(listed.body)}`)
      const ids = ((listed.body?.assignments ?? []) as Assignment[]).map((a) => a.jobId)
      assert(ids.includes(job.id), 'the listed assignments include the job')

      if (orgTeams.length > 1) {
        // An assignment id that belongs to another team is not deletable here.
        const other = await call(`/${orgTeams[1]}/jobs/${assignment.id}`, office!, { method: 'DELETE' })
        assertEquals(other.status, 404, `another team's row: ${JSON.stringify(other.body)}`)
      }

      // Delete by job id, as the SDK documents ("assignment ID (or job ID)").
      const removed = await call(`/${team}/jobs/${job.id}`, office!, { method: 'DELETE' })
      assertEquals(removed.status, 200, `remove: ${JSON.stringify(removed.body)}`)
      const { data: left } = await admin.schema('core').from('job_team_assignments').select('id').eq('job_id', job.id)
      assertEquals(left?.length ?? 0, 0, 'the assignment is gone')
      const { data: cleared } = await admin.schema('core').from('jobs').select('team_ids, assigned_team_id').eq('id', job.id).single()
      assertEquals((cleared?.team_ids ?? []).length, 0, 'jobs.team_ids cleared')
      assertEquals(cleared?.assigned_team_id ?? null, null, 'jobs.assigned_team_id cleared')
    } finally {
      await admin.schema('core').from('jobs').delete().eq('id', job.id)
      if (foreignJobId) await admin.schema('core').from('jobs').delete().eq('id', foreignJobId)
    }
  },
})
