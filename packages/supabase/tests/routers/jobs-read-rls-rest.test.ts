/**
 * Who can read which row of core.jobs, straight through PostgREST (#1317).
 *
 * `jobs_read` was `USING (true)` for anon and authenticated (005_policies.sql),
 * so the public anon key read every draft and confidential posting even though
 * the api filters them. Migration 392 narrows it to:
 *
 *   everyone          open or closed, and not confidential — what the api shows
 *   org owner/roles   every row of their organisation
 *   platform staff    every row (office, super_admin)
 *   applicant         the jobs they applied to, whatever their status now
 *
 * The fixture is a throwaway organisation owned by a fresh user, with the
 * seeded `orgAdmin` persona given an `admin` role in it, and four jobs: open,
 * draft, confidential-open and paused. A third fresh user applies to the
 * paused one.
 *
 * Also checks that the signed-out api paths the `/jobs` browse and job detail
 * screens use still work, since they read through the request (anon) client.
 */

import { assertEquals } from '../shared/assert.ts'
import { type Persona, disposePersonas, getPersonas } from '../shared/personas.ts'
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient, getAuthToken } from '../shared/setup.ts'

const API = Deno.env.get('JOBS_RLS_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function restJobIds(token: string, ids: string[]): Promise<Set<string>> {
  const res = await fetch(`${TEST_SUPABASE_URL}/rest/v1/jobs?select=id&id=in.(${ids.join(',')})`, {
    headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Accept-Profile': 'core' },
  })
  const body = await res.text()
  assertEquals(res.status, 200, `PostgREST jobs read: ${body.slice(0, 200)}`)
  return new Set((JSON.parse(body) as { id: string }[]).map((r) => r.id))
}

async function api(path: string, token: string) {
  const res = await fetch(`${API}${path}`, {
    headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  const text = await res.text()
  let body: Record<string, unknown> | null = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  return { status: res.status, body }
}

Deno.test({
  name: 'core.jobs RLS - drafts, paused and confidential jobs reach only their org, platform staff and applicants (#1317)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    const personas = await getPersonas()
    const tag = crypto.randomUUID().slice(0, 8)
    const cleanup: Array<() => Promise<unknown>> = []

    // A third fresh user, the applicant. Same path as personas.ts freshUser().
    const applicantEmail = `persona-applicant-${tag}@example.com`
    const applicantPassword = `p-${crypto.randomUUID()}`
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: applicantEmail,
      password: applicantPassword,
      email_confirm: true,
    })
    if (createErr || !created.user) throw new Error(`create applicant: ${createErr?.message}`)
    const applicantId = created.user.id
    cleanup.push(() => admin.auth.admin.deleteUser(applicantId))

    try {
      const applicantToken = await getAuthToken(applicantEmail, applicantPassword)
      if (!applicantToken) throw new Error('applicant should sign in')
      const applicant: Persona = { name: 'userB', token: applicantToken, id: applicantId }
      // userB owns the fixture organisation; userA is the unrelated worker.
      const owner = personas.userB
      const stranger = personas.userA

      const { data: org, error: orgErr } = await admin
        .schema('core')
        .from('organizations')
        .insert({ name: `Jobs RLS ${tag}`, slug: `jobs-rls-${tag}`, owner_user_id: owner.id })
        .select('id')
        .single()
      if (orgErr) throw new Error(`fixture org: ${orgErr.message}`)
      cleanup.unshift(() => admin.schema('core').from('organizations').delete().eq('id', org.id))

      const { data: role, error: roleErr } = await admin
        .schema('core')
        .from('roles')
        .select('id')
        .eq('name', 'admin')
        .eq('scope', 'organization')
        .single()
      if (roleErr) throw new Error(`admin role: ${roleErr.message}`)
      const { data: ra, error: raErr } = await admin
        .schema('core')
        .from('role_assignments')
        .insert({ role_id: role.id, user_id: personas.orgAdmin.id, scope_org_id: org.id })
        .select('id')
        .single()
      if (raErr) throw new Error(`fixture role assignment: ${raErr.message}`)
      cleanup.unshift(() => admin.schema('core').from('role_assignments').delete().eq('id', ra.id))

      const job = (title: string, extra: Record<string, unknown>) => ({
        organization_id: org.id,
        title: `${title} ${tag}`,
        employment_type: 'full_time',
        ...extra,
      })
      const { data: jobs, error: jobsErr } = await admin
        .schema('core')
        .from('jobs')
        .insert([
          job('Open', { status: 'open', is_confidential: false }),
          job('Draft', { status: 'draft', is_confidential: false }),
          job('Confidential', { status: 'open', is_confidential: true }),
          job('Paused', { status: 'paused', is_confidential: false }),
        ])
        .select('id, title')
      if (jobsErr) throw new Error(`fixture jobs: ${jobsErr.message}`)
      const byTitle = (prefix: string) => jobs.find((j: { title: string }) => j.title.startsWith(prefix))!.id as string
      const openId = byTitle('Open')
      const draftId = byTitle('Draft')
      const confidentialId = byTitle('Confidential')
      const pausedId = byTitle('Paused')
      const all = [openId, draftId, confidentialId, pausedId]
      cleanup.unshift(() => admin.schema('core').from('jobs').delete().in('id', all))

      const { data: application, error: appErr } = await admin
        .schema('core')
        .from('applications')
        // The column default is 'pending', which applications_status_check rejects.
        .insert({ job_id: pausedId, user_id: applicantId, status: 'new' })
        .select('id')
        .single()
      if (appErr) throw new Error(`fixture application: ${appErr.message}`)
      cleanup.unshift(() => admin.schema('core').from('applications').delete().eq('id', application.id))

      const expectations: Array<[string, string, string[]]> = [
        ['anon', personas.anon.token, [openId]],
        ['unrelated worker', stranger.token, [openId]],
        ['applicant', applicant.token, [openId, pausedId]],
        ['org owner', owner.token, all],
        ['org admin', personas.orgAdmin.token, all],
        ['platform office', personas.office.token, all],
      ]
      const failures: string[] = []
      for (const [who, token, want] of expectations) {
        const seen = await restJobIds(token, all)
        const name = (id: string) => jobs.find((j: { id: string }) => j.id === id)!.title.split(' ')[0]
        const got = all.filter((id) => seen.has(id)).map(name).sort().join(',')
        const expected = want.map(name).sort().join(',')
        if (got !== expected) failures.push(`${who}: expected [${expected}], got [${got}]`)
      }
      assertEquals(failures.join('\n'), '', 'core.jobs read mismatches')

      // The applicant's own applications list embeds the job (applications.ts).
      const embed = await fetch(
        `${TEST_SUPABASE_URL}/rest/v1/applications?select=id,job:jobs!job_id(id,status)&id=eq.${application.id}`,
        { headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${applicant.token}`, 'Accept-Profile': 'core' } }
      )
      const embedRows = (await embed.json()) as Array<{ job: { id: string } | null }>
      assertEquals(embedRows[0]?.job?.id, pausedId, 'applicant still sees the paused job they applied to')

      // Signed-out api paths: the /jobs browse list and job detail.
      const list = await api(`/jobs?organizationId=${org.id}`, personas.anon.token)
      assertEquals(list.status, 200, `signed-out job list: ${JSON.stringify(list.body)}`)
      const listed = ((list.body?.data as { id: string }[]) ?? []).map((j) => j.id)
      assertEquals(listed.join(','), openId, 'signed-out browse lists the open, non-confidential job only')

      const detail = await api(`/jobs/${openId}`, personas.anon.token)
      assertEquals(detail.status, 200, 'signed-out job detail of an open job')

      for (const [label, id] of [
        ['draft', draftId],
        ['confidential', confidentialId],
      ] as const) {
        const hidden = await api(`/jobs/${id}`, personas.anon.token)
        assertEquals(hidden.status, 404, `signed-out job detail of a ${label} job is not found`)
        const ownerView = await api(`/jobs/${id}`, owner.token)
        assertEquals(ownerView.status, 200, `org owner opens their own ${label} job`)
      }
    } finally {
      // PostgREST builders are thenables without .catch, so await each in a try.
      for (const step of cleanup) {
        try {
          await step()
        } catch {
          // best effort; the next run uses fresh names
        }
      }
      await disposePersonas()
    }
  },
})
