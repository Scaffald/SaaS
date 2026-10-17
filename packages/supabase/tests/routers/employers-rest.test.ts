/**
 * Employers REST API — what a worker reads an employer by (#1185, #1186).
 *
 * `GET /v1/employers` and `GET /v1/employers/{id}` returned `select *` from
 * core.organizations, which carries `industry_id` but no industry name, so the
 * directory could not say what trade an employer was in, and the open-role
 * count took a request per employer. Both now ride along: `industries` is
 * embedded and `open_roles_count` counts jobs with status 'open' — the same
 * rule as GET /v1/organizations/{id}/open-jobs-count, so drafts and closed
 * postings must not count.
 *
 * The list's `industry` filter compared a column the table does not have
 * (`industry`), which failed the whole request; it filters on `industry_id`.
 *
 * Run against the function directly (it binds :8000) when the shared edge
 * runtime belongs to another checkout:
 *
 *     cd packages/supabase
 *     EMPLOYERS_TEST_API_BASE=http://127.0.0.1:8000/v1 deno test --allow-all \
 *       --no-check --config tests/deno.json tests/routers/employers-rest.test.ts
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  createAdminClient,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const REST_BASE = Deno.env.get('EMPLOYERS_TEST_API_BASE') ??
  `${TEST_SUPABASE_URL}/functions/v1/api/v1`
const RUN = crypto.randomUUID().slice(0, 8)

async function getJson(path: string, token: string) {
  const response = await fetch(`${REST_BASE}${path}`, {
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

/** One organization with two open roles, a draft and a closed one. */
async function seedEmployer() {
  const admin = createAdminClient()
  const { data: industry } = await admin
    .schema('core')
    .from('industries')
    .select('id, name')
    .limit(1)
    .maybeSingle()

  const name = `Employers REST ${RUN}`
  const { data: org, error } = await admin
    .schema('core')
    .from('organizations')
    .insert({
      name,
      slug: `employers-rest-${RUN}`,
      industry_id: industry?.id ?? null,
      visibility: 'public',
      address: { street: '1 Test Street', city: 'Davison', state: 'MI', postal: '48423' },
    })
    .select('id')
    .single()
  if (error || !org) throw new Error(`Could not seed organization: ${error?.message}`)

  const { error: jobsError } = await admin.schema('core').from('jobs').insert([
    { organization_id: org.id, title: `Open A ${RUN}`, status: 'open' },
    { organization_id: org.id, title: `Open B ${RUN}`, status: 'open' },
    { organization_id: org.id, title: `Draft ${RUN}`, status: 'draft' },
    { organization_id: org.id, title: `Closed ${RUN}`, status: 'closed' },
  ])
  if (jobsError) throw new Error(`Could not seed jobs: ${jobsError.message}`)

  return {
    id: org.id as string,
    name,
    industry: industry as { id: string; name: string } | null,
    cleanup: async () => {
      // core.jobs cascades from the organization.
      await admin.schema('core').from('organizations').delete().eq('id', org.id)
    },
  }
}

async function workerToken() {
  await requireAuthSetup()
  const tokens = await loadCachedTokens()
  assertExists(tokens, 'Cached tokens should exist')
  return tokens.regular.token
}

Deno.test({
  name: 'Employers REST - detail carries the industry, the address and the open-role count',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const token = await workerToken()
    const seeded = await seedEmployer()
    try {
      const { status, body } = await getJson(`/employers/${seeded.id}`, token)
      assertEquals(status, 200, `Detail should succeed: ${JSON.stringify(body)}`)
      assertExists(body)

      assertEquals(body.open_roles_count, 2, 'Only status = open counts, not drafts or closed')
      assertEquals('open_jobs' in body, false, 'The raw count embed is flattened')
      const address = body.address as { city?: string; state?: string }
      assertEquals(address.city, 'Davison')
      assertEquals(address.state, 'MI')
      if (seeded.industry) {
        const industries = body.industries as { name?: string } | null
        assertEquals(industries?.name, seeded.industry.name)
      }
    } finally {
      await seeded.cleanup()
    }
  },
})

Deno.test({
  name: 'Employers REST - list rows carry the open-role count and the industry filter works',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const token = await workerToken()
    const seeded = await seedEmployer()
    try {
      const search = encodeURIComponent(seeded.name)
      const listed = await getJson(`/employers?search=${search}`, token)
      assertEquals(listed.status, 200, `List should succeed: ${JSON.stringify(listed.body)}`)
      const employers = (listed.body?.employers ?? []) as Array<Record<string, unknown>>
      const row = employers.find((employer) => employer.id === seeded.id)
      assertExists(row, 'The seeded employer should be listed')
      assertEquals(row.open_roles_count, 2)

      if (seeded.industry) {
        const filtered = await getJson(
          `/employers?search=${search}&industry=${seeded.industry.id}`,
          token,
        )
        assertEquals(
          filtered.status,
          200,
          'Filtering by industry used a column that does not exist and failed the request',
        )
        const ids = ((filtered.body?.employers ?? []) as Array<{ id: string }>).map((e) => e.id)
        assertEquals(ids.includes(seeded.id), true, 'The industry filter keeps a matching employer')
      }
    } finally {
      await seeded.cleanup()
    }
  },
})
