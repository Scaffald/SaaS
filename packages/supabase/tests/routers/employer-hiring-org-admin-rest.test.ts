/// <reference lib="deno.ns" />

/**
 * The employer's hiring screens, as an organisation admin without the
 * platform office role (#1312).
 *
 * The pipeline, a candidate, their inquiry and the hire lived under /office,
 * whose layout admits only the `office` role — and every seeded named user
 * holds it, which is why no audit saw an ordinary employer bounced to the
 * dashboard. The screens moved to /hiring; this suite pins what the api gives
 * the people they moved for, using the `orgAdmin` persona (reviewer-employer,
 * seeds/010: owns Apex Mechanical, holds its org `admin` role, no office role).
 *
 *   - the pipeline, a candidate, the inquiry and the hire fee answer for the
 *     persona's own organisation and refuse another's;
 *   - the job list behind My Listings and the pipeline's job filter
 *     (`GET /v1/office/jobs`) answers an org admin, scoped to their
 *     organisations — it was office-only, so both were empty for them —
 *     while creating a job there stays office-only;
 *   - one rule across pipeline, inquiries and fees: the owner or an org
 *     `admin`. Inquiries and fees admitted *any* role scoped to the org, and
 *     looked it up with `.maybeSingle()`, which errors — and so refused — a
 *     person holding two roles in one organisation.
 *
 * Fixtures are made with the service role and removed at the end.
 *
 * `HIRING_TEST_API_BASE` points the suite at the function run directly
 * (`deno run functions/api/index.ts`) when the shared edge runtime belongs to
 * another checkout:
 *
 *     cd packages/supabase
 *     HIRING_TEST_API_BASE=http://127.0.0.1:8000/v1 deno test --allow-all \
 *       --no-check --config tests/deno.json tests/routers/employer-hiring-org-admin-rest.test.ts
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import { disposePersonas, getPersonas, type Personas } from '../shared/personas.ts'
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient, getAuthToken } from '../shared/setup.ts'

const API = Deno.env.get('HIRING_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`
const RUN = crypto.randomUUID().slice(0, 8)

// deno-lint-ignore no-explicit-any
const core = () => (createAdminClient() as any).schema('core')

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  const text = await response.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  return { status: response.status, body }
}

async function must<T>(label: string, query: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await query
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

async function roleId(name: string, scope: string): Promise<string> {
  const row = await must(
    `role ${name}/${scope}`,
    core().from('roles').select('id').eq('name', name).eq('scope', scope).single(),
  )
  return (row as { id: string }).id
}

interface Fixture {
  personas: Personas
  apexId: string
  otherOrgId: string
  apexJobId: string
  otherJobId: string
  apexAppId: string
  otherAppId: string
  applicantId: string
  /** Not the owner; holds both `admin` and `member` in Apex. */
  twoRoles: { id: string; token: string }
  /** Holds only `member` in Apex. */
  memberOnly: { id: string; token: string; email: string }
}

/** Everything setup made, recorded as it is made, so a half-built fixture is still removed. */
const made = { jobs: [] as string[], applications: [] as string[], assignments: [] as string[], users: [] as string[] }

// Built once for the whole file; a failure fails every test rather than
// rebuilding (and leaking) a fixture per test.
let setupOnce: Promise<Fixture> | null = null
const setup = () => (setupOnce ??= build())

async function build(): Promise<Fixture> {
  const personas = await getPersonas()

  const owned = await must(
    'orgAdmin organisation',
    core().from('organizations').select('id').eq('owner_user_id', personas.orgAdmin.id).limit(1).single(),
  )
  const apexId = (owned as { id: string }).id

  const other = await must(
    'another organisation',
    core().from('organizations').select('id').neq('id', apexId).neq('owner_user_id', personas.orgAdmin.id).limit(1)
      .single(),
  )
  const otherOrgId = (other as { id: string }).id

  const job = async (orgId: string, label: string) => {
    const { id } = await must(
      `job ${label}`,
      core().from('jobs').insert({ organization_id: orgId, title: `hiring-1312-${RUN}-${label}`, status: 'open' })
        .select('id').single(),
    ) as { id: string }
    made.jobs.push(id)
    return id
  }

  const apexJobId = await job(apexId, 'apex')
  const otherJobId = await job(otherOrgId, 'other')

  const applicantId = personas.userB.id
  const application = async (jobId: string, label: string) => {
    const { id } = await must(
      `application ${label}`,
      core().from('applications').insert({ job_id: jobId, user_id: applicantId, status: 'screen', submitted_at: new Date().toISOString() }).select('id')
        .single(),
    ) as { id: string }
    made.applications.push(id)
    return id
  }

  const apexAppId = await application(apexJobId, 'apex')
  const otherAppId = await application(otherJobId, 'other')

  const adminRole = await roleId('admin', 'organization')
  const memberRole = await roleId('member', 'organization')

  // A second fresh user for the member-only case; userA is the two-roles one.
  const admin = createAdminClient()
  const email = `persona-member-${RUN}@example.com`
  const password = `p-${crypto.randomUUID()}`
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (createError || !created.user) throw new Error(`member-only user: ${createError?.message}`)
  made.users.push(created.user.id)
  const memberToken = await getAuthToken(email, password)
  assertExists(memberToken, 'member-only user should sign in')

  const inserted = await must(
    'role assignments',
    core().from('role_assignments').insert([
      { user_id: personas.userA.id, role_id: adminRole, scope_org_id: apexId },
      { user_id: personas.userA.id, role_id: memberRole, scope_org_id: apexId },
      { user_id: created.user.id, role_id: memberRole, scope_org_id: apexId },
    ]).select('id'),
  )

  made.assignments.push(...(inserted as Array<{ id: string }>).map((r) => r.id))

  return {
    personas,
    apexId,
    otherOrgId,
    apexJobId,
    otherJobId,
    apexAppId,
    otherAppId,
    applicantId,
    twoRoles: { id: personas.userA.id, token: personas.userA.token },
    memberOnly: { id: created.user.id, token: memberToken, email },
  }
}

async function teardown() {
  await core().from('role_assignments').delete().in('id', made.assignments)
  await core().from('applications').delete().in('id', made.applications)
  await core().from('jobs').delete().in('id', made.jobs)
  for (const id of made.users) await createAdminClient().auth.admin.deleteUser(id)
  await disposePersonas()
}

const feeStatus = (f: Fixture, orgId: string, appId: string) =>
  `/success-fees/status?organizationId=${orgId}&applicationId=${appId}&workerUserId=${f.applicantId}`

type Row = { id: string; job?: { organization_id?: string | null } | null }
type JobRow = { id: string; organization?: { id?: string } | null }

const opts = { sanitizeResources: false, sanitizeOps: false }

Deno.test({
  name: "Hiring (#1312) - an org admin without the office role loads their own organisation's pipeline, and only it",
  ...opts,
  async fn() {
    const f = await setup()
    const { status, body } = await call('/employer/applications?limit=100', f.personas.orgAdmin.token)
    assertEquals(status, 200, `pipeline: ${JSON.stringify(body)}`)
    const rows = (body as { data?: Row[] }).data ?? []
    const ids = rows.map((r) => r.id)
    assert(ids.includes(f.apexAppId), "the persona's own organisation's application is listed")
    assert(!ids.includes(f.otherAppId), "another organisation's application is not")
    for (const row of rows) {
      assertEquals(row.job?.organization_id, f.apexId, `row ${row.id} belongs to the persona's organisation`)
    }

    const forOther = await call(`/employer/applications?organization_id=${f.otherOrgId}`, f.personas.orgAdmin.token)
    assertEquals(forOther.status, 403, "asking for another organisation's pipeline is refused")
  },
})

Deno.test({
  name: "Hiring (#1312) - candidate, inquiry and hire fee open for the org admin's own application and refuse another's",
  ...opts,
  async fn() {
    const f = await setup()
    const token = f.personas.orgAdmin.token

    assertEquals((await call(`/employer/applications/${f.apexAppId}`, token)).status, 200, 'own candidate')
    assertEquals((await call(`/employer/applications/${f.otherAppId}`, token)).status, 404, "another's candidate")

    assertEquals((await call(`/inquiries/by-application/${f.apexAppId}`, token)).status, 200, 'own inquiry')
    assertEquals((await call(`/inquiries/by-application/${f.otherAppId}`, token)).status, 403, "another's inquiry")

    assertEquals((await call(feeStatus(f, f.apexId, f.apexAppId), token)).status, 200, 'own hire fee')
    assertEquals((await call(feeStatus(f, f.otherOrgId, f.otherAppId), token)).status, 403, "another's hire fee")
  },
})

Deno.test({
  name: "Hiring (#1312) - the employer job list answers an org admin with their own postings; creating stays office-only",
  ...opts,
  async fn() {
    const f = await setup()
    const token = f.personas.orgAdmin.token

    const listed = await call('/office/jobs?limit=100', token)
    assertEquals(listed.status, 200, `job list: ${JSON.stringify(listed.body)}`)
    const jobs = (listed.body as { data?: { jobs?: JobRow[] } }).data?.jobs ?? []
    const ids = jobs.map((j) => j.id)
    assert(ids.includes(f.apexJobId), "the persona's own posting is listed")
    assert(!ids.includes(f.otherJobId), "another organisation's posting is not")
    for (const job of jobs) {
      assertEquals(job.organization?.id, f.apexId, `job ${job.id} belongs to the persona's organisation`)
    }

    const scoped = await call(`/office/jobs?organization_id=${f.apexId}&status=open`, token)
    assertEquals(scoped.status, 200, 'filtering to their own organisation')
    assertEquals((await call(`/office/jobs?organization_id=${f.otherOrgId}`, token)).status, 403, 'another org')

    const create = await call('/office/jobs', token, { method: 'POST', body: JSON.stringify({}) })
    assertEquals(create.status, 403, 'creating a job through the Office CMS stays office-only')

    // Office staff keep their list.
    assertEquals((await call('/office/jobs?limit=5', f.personas.office.token)).status, 200, 'office staff')
    // And a person with no organisation gets an empty list, not someone else's.
    const stranger = await call('/office/jobs?limit=100', f.personas.userB.token)
    assertEquals(stranger.status, 200, 'a plain worker')
    assertEquals((stranger.body as { data?: { jobs?: unknown[] } }).data?.jobs?.length ?? 0, 0, 'with no postings')
  },
})

Deno.test({
  name: 'Hiring (#1312) - an org admin holding a second role in the same organisation is still admitted',
  ...opts,
  async fn() {
    const f = await setup()
    const token = f.twoRoles.token

    assertEquals((await call(`/employer/applications/${f.apexAppId}`, token)).status, 200, 'candidate')
    const inquiry = await call(`/inquiries/by-application/${f.apexAppId}`, token)
    assertEquals(inquiry.status, 200, `inquiry: ${JSON.stringify(inquiry.body)}`)
    const fee = await call(feeStatus(f, f.apexId, f.apexAppId), token)
    assertEquals(fee.status, 200, `hire fee: ${JSON.stringify(fee.body)}`)
  },
})

Deno.test({
  name: 'Hiring (#1312) - one rule: a plain org member is refused by pipeline, inquiries and fees alike',
  ...opts,
  async fn() {
    const f = await setup()
    const token = f.memberOnly.token

    const list = await call('/employer/applications?limit=100', token)
    assertEquals(list.status, 200, 'the pipeline list answers')
    const ids = ((list.body as { data?: Row[] }).data ?? []).map((r) => r.id)
    assert(!ids.includes(f.apexAppId), 'but holds none of the organisation’s applications')

    assertEquals((await call(`/employer/applications/${f.apexAppId}`, token)).status, 404, 'candidate')
    assertEquals((await call(`/inquiries/by-application/${f.apexAppId}`, token)).status, 403, 'inquiry')
    assertEquals((await call(feeStatus(f, f.apexId, f.apexAppId), token)).status, 403, 'hire fee')
  },
})

Deno.test({
  name: 'Hiring (#1312) - teardown',
  ...opts,
  async fn() {
    await teardown()
  },
})
