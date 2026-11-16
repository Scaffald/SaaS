/**
 * Office jobs REST — the whole job form is saved and read back (#1342).
 *
 * POST/PATCH /v1/office/jobs validated against schemas that listed ten fields,
 * and zod strips unknown keys, so the address, screening, hiring team,
 * metadata, compensation, skills, certificates and teams on the job form were
 * dropped without an error. core.job_certifications also pointed at an empty
 * table (fixed by migration 394), so no certificate could have been saved.
 *
 * Users: zach@unicorn.love (platform office + super_admin, seeds/002); the
 * cached `regular` token (worker only). Probe certifications are inserted and
 * removed here, because the local catalog is empty.
 *
 * OFFICE_JOBS_TEST_API_BASE points the suite at a worktree's api run directly
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

const REST_BASE = Deno.env.get('OFFICE_JOBS_TEST_API_BASE') ??
  `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${REST_BASE}/office/jobs${path}`, {
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

type Job = Record<string, unknown> & {
  id: string
  skills?: Array<{ id: string; name: string; is_required: boolean }>
  certifications?: Array<{ id: string; name: string }>
  team_ids?: string[]
  primary_team_id?: string | null
}

const jobOf = (body: Record<string, unknown> | null) =>
  (body?.data as { job?: Job } | undefined)?.job

async function fixtures() {
  const admin = createAdminClient()
  const { data: teams } = await admin
    .schema('core')
    .from('teams')
    .select('id, organization_id')
    .limit(50)
  const byOrg = new Map<string, string[]>()
  for (const t of (teams ?? []) as Array<{ id: string; organization_id: string }>) {
    byOrg.set(t.organization_id, [...(byOrg.get(t.organization_id) ?? []), t.id])
  }
  const [orgId, orgTeams] = [...byOrg.entries()].sort((a, b) => b[1].length - a[1].length)[0]
  const otherTeam = [...byOrg.entries()].find(([org]) => org !== orgId)?.[1][0]

  const { data: skills } = await admin
    .schema('data')
    .from('masterformat')
    .select('id, name')
    .eq('active', true)
    .limit(3)

  const tag = crypto.randomUUID().slice(0, 8)
  const { data: certs, error: certError } = await admin
    .schema('data')
    .from('certifications')
    .insert([
      { slug: `probe-cert-a-${tag}`, title: `Probe Cert A ${tag}`, depth: 2, hierarchy_path: `probe-a-${tag}` },
      { slug: `probe-cert-b-${tag}`, title: `Probe Cert B ${tag}`, depth: 2, hierarchy_path: `probe-b-${tag}` },
    ])
    .select('id, title')
  assertExists(certs, `seed probe certifications: ${JSON.stringify(certError)}`)

  return {
    admin,
    orgId,
    orgTeams,
    otherTeam,
    skills: (skills ?? []) as Array<{ id: string; name: string }>,
    certs: certs as Array<{ id: string; title: string }>,
  }
}

Deno.test({
  name: 'Office jobs REST - the job form round-trips: details, skills, certificates, teams (#1342)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const office = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(office, 'office user should sign in (seeded)')
    const f = await fixtures()
    assert(f.skills.length >= 3, 'needs three MasterFormat skills seeded')
    assert(f.orgTeams.length >= 1, 'needs a team')
    let jobId: string | undefined

    try {
      const created = await call('', office!, {
        method: 'POST',
        body: JSON.stringify({
          organization_id: f.orgId,
          title: 'Probe Pipefitter',
          description: 'A probe job created by office-jobs-fields-rest.test.ts.',
          status: 'draft',
          address: { city: 'Grand Rapids', state: 'MI', country: 'United States', latitude: 42.96, longitude: -85.67 },
          require_work_authorization: true,
          minimum_years_experience: 3,
          enable_auto_reject: true,
          auto_reject_criteria: { score_minimum: 40, require_all_skills: true },
          minimum_score: 40,
          internal_job_code: 'PROBE-001',
          number_of_openings: 2,
          priority_level: 'high',
          application_deadline: '2027-01-31T17:00:00.000Z',
          target_start_date: '2027-02-15',
          minimum_education_level: 'high_school',
          require_drivers_license: true,
          travel_percentage: 20,
          has_bonus_structure: true,
          bonus_details: 'Quarterly safety bonus',
          pay_frequency: 'weekly',
          seo_keywords: ['pipefitter', 'welding'],
          skill_ids: [f.skills[0].id, f.skills[1].id],
          optional_skill_ids: [f.skills[2].id],
          certification_ids: f.certs.map((c) => c.id),
          team_ids: f.orgTeams.slice(0, 2),
          primary_team_id: f.orgTeams[0],
        }),
      })
      assertEquals(created.status, 201, `create: ${JSON.stringify(created.body)}`)
      jobId = jobOf(created.body)?.id
      assertExists(jobId, 'created job id')

      const read = await call(`/${jobId}`, office!)
      assertEquals(read.status, 200, `read: ${JSON.stringify(read.body)}`)
      const job = jobOf(read.body)!
      assertEquals((job.address as { city?: string }).city, 'Grand Rapids', 'address saved')
      assertEquals(job.require_work_authorization, true, 'screening saved')
      assertEquals(job.minimum_years_experience, 3, 'experience saved')
      assertEquals((job.auto_reject_criteria as { score_minimum?: number }).score_minimum, 40, 'auto-reject saved')
      assertEquals(job.internal_job_code, 'PROBE-001', 'metadata saved')
      assertEquals(job.priority_level, 'high', 'priority saved')
      assertEquals(job.target_start_date, '2027-02-15', 'date saved')
      assertEquals(job.pay_frequency, 'weekly', 'compensation saved')
      assertEquals(JSON.stringify(job.seo_keywords), JSON.stringify(['pipefitter', 'welding']), 'keywords saved')

      const skills = job.skills ?? []
      assertEquals(skills.filter((s) => s.is_required).map((s) => s.id).sort().join(), [f.skills[0].id, f.skills[1].id].sort().join(), 'required skills saved')
      assertEquals(skills.filter((s) => !s.is_required).map((s) => s.id).join(), f.skills[2].id, 'optional skill saved')
      assertEquals(skills.find((s) => s.id === f.skills[0].id)?.name, f.skills[0].name, 'skills come back named')
      assertEquals((job.certifications ?? []).map((c) => c.name).sort().join(), f.certs.map((c) => c.title).sort().join(), 'certificates saved and named')
      assertEquals([...(job.team_ids ?? [])].sort().join(), f.orgTeams.slice(0, 2).sort().join(), 'teams saved')
      assertEquals(job.primary_team_id, f.orgTeams[0], 'primary team saved')

      // Edit: clear some fields, drop a certificate and the optional skill.
      const patched = await call(`/${jobId}`, office!, {
        method: 'PATCH',
        body: JSON.stringify({
          internal_job_code: null,
          travel_percentage: null,
          address: null,
          certification_ids: [f.certs[0].id],
          skill_ids: [f.skills[0].id],
          optional_skill_ids: [],
        }),
      })
      assertEquals(patched.status, 200, `patch: ${JSON.stringify(patched.body)}`)
      const after = jobOf((await call(`/${jobId}`, office!)).body)!
      assertEquals(after.internal_job_code, null, 'cleared')
      assertEquals(after.travel_percentage, null, 'cleared')
      assertEquals(after.address, null, 'cleared')
      assertEquals(after.priority_level, 'high', 'untouched fields keep their value')
      assertEquals((after.certifications ?? []).map((c) => c.id).join(), f.certs[0].id, 'certificates replaced')
      assertEquals((after.skills ?? []).map((s) => s.id).join(), f.skills[0].id, 'skills replaced')
      assertEquals([...(after.team_ids ?? [])].sort().join(), f.orgTeams.slice(0, 2).sort().join(), 'teams untouched when not sent')
    } finally {
      if (jobId) await f.admin.schema('core').from('jobs').delete().eq('id', jobId)
      await f.admin.schema('data').from('certifications').delete().in('id', f.certs.map((c) => c.id))
    }
  },
})

Deno.test({
  name: 'Office jobs REST - unknown skills, certificates, or another org\'s team are a 400, and nothing is saved (#1342)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const office = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(office, 'office user should sign in (seeded)')
    const f = await fixtures()
    const base = {
      organization_id: f.orgId,
      title: 'Probe Rejected Job',
      description: 'This probe job must never be created.',
    }
    try {
      const badSkill = await call('', office!, {
        method: 'POST',
        body: JSON.stringify({ ...base, skill_ids: [crypto.randomUUID()] }),
      })
      assertEquals(badSkill.status, 400, `unknown skill: ${JSON.stringify(badSkill.body)}`)

      const badCert = await call('', office!, {
        method: 'POST',
        body: JSON.stringify({ ...base, certification_ids: [crypto.randomUUID()] }),
      })
      assertEquals(badCert.status, 400, `unknown certificate: ${JSON.stringify(badCert.body)}`)

      if (f.otherTeam) {
        const badTeam = await call('', office!, {
          method: 'POST',
          body: JSON.stringify({ ...base, team_ids: [f.otherTeam] }),
        })
        assertEquals(badTeam.status, 400, `another org's team: ${JSON.stringify(badTeam.body)}`)
      }

      const { data: leaked } = await f.admin
        .schema('core')
        .from('jobs')
        .select('id')
        .eq('title', 'Probe Rejected Job')
      assertEquals(leaked?.length ?? 0, 0, 'a rejected create writes no job')
    } finally {
      await f.admin.schema('core').from('jobs').delete().eq('title', 'Probe Rejected Job')
      await f.admin.schema('data').from('certifications').delete().in('id', f.certs.map((c) => c.id))
    }
  },
})

Deno.test({
  name: 'Office jobs REST - a worker cannot read a job through the office route (#1342)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const { data: anyJob } = await createAdminClient().schema('core').from('jobs').select('id').limit(1).single()
    assertExists(anyJob, 'a seeded job')
    const res = await call(`/${anyJob.id}`, tokens!.regular.token)
    assertEquals(res.status, 403, `worker: ${JSON.stringify(res.body)}`)
  },
})
