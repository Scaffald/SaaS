/**
 * Office users list REST API.
 *
 * `GET /v1/office/users` returned names from `core.profile` and nothing else
 * that identifies a person, so in the CMS workers table every user without a
 * profile name showed "-" twice and a truncated UUID (#1116). Email lives in
 * `auth.users`, out of PostgREST's reach; the route now reads it through the
 * shared `emailsByUserId` helper. The test checks the returned email against
 * auth itself, for real rows, rather than against a fixture.
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  createAdminClient,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

// Set OFFICE_TEST_API_BASE=http://127.0.0.1:8000 to test a worktree's api run
// directly instead of the shared edge runtime.
const API = `${Deno.env.get('OFFICE_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api`}/v1`

type ListedUser = { id: string; email?: string | null; display_name?: string | null }

Deno.test({
  name: 'Office users REST - the list carries each user’s email from auth',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const office = tokens.office?.token ?? ''
    assertExists(office || null, 'An office-role token is required')

    const response = await fetch(`${API}/office/users`, {
      headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${office}` },
    })
    const body = await response.json()
    assertEquals(response.status, 200, `the list should load, got ${JSON.stringify(body)}`)
    const users = (body.users as ListedUser[] | undefined) ?? []
    assert(users.length > 0, 'the seeded stack has users')

    for (const user of users) {
      assert('email' in user, `user ${user.id} carries an email field`)
    }

    const admin = createAdminClient()
    for (const user of users.slice(0, 5)) {
      const { data } = await admin.auth.admin.getUserById(user.id)
      assertEquals(user.email ?? null, data.user?.email ?? null, `email for ${user.id} matches auth`)
    }
  },
})

Deno.test({
  name: 'Office users REST - a regular user cannot list users',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    const regular = tokens?.regular?.token ?? ''
    assertExists(regular || null, 'A regular token is required')
    const response = await fetch(`${API}/office/users`, {
      headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${regular}` },
    })
    await response.body?.cancel()
    assert(response.status === 401 || response.status === 403, `got ${response.status}`)
  },
})

Deno.test({
  name: 'Office users REST - search finds a user outside the newest 50, by name, "First Last" or username (#1343)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // UserSearch (hiring manager / recruiter) filtered the first page — the 50
    // newest users — in the browser, so anyone older could never be found.
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    const office = tokens?.office?.token ?? ''
    assertExists(office || null, 'An office-role token is required')
    const admin = createAdminClient()
    const tag = crypto.randomUUID().slice(0, 8)
    const email = `search-probe-${tag}@example.com`
    const created = await admin.auth.admin.createUser({ email, password: crypto.randomUUID(), email_confirm: true })
    const id = created.data.user?.id
    assertExists(id, `create probe user: ${JSON.stringify(created.error)}`)

    try {
      // Old enough to sit behind every recently created test user.
      await admin.schema('core').from('users').update({ created_at: '2001-01-01T00:00:00Z', username: `zz_probe_${tag}` }).eq('id', id)
      const profile = await admin
        .schema('core')
        .from('profile')
        .upsert({ user_id: id, first_name: `Quillon${tag}`, last_name: `Marbury${tag}` }, { onConflict: 'user_id' })
      assert(!profile.error, `profile: ${JSON.stringify(profile.error)}`)

      const search = async (term: string) => {
        const res = await fetch(`${API}/office/users?search=${encodeURIComponent(term)}`, {
          headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${office}` },
        })
        const body = await res.json()
        assertEquals(res.status, 200, `search ${term}: ${JSON.stringify(body)}`)
        return ((body.users ?? body.data?.users ?? []) as ListedUser[]).map((u) => u.id)
      }

      const firstPage = await fetch(`${API}/office/users`, {
        headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${office}` },
      }).then((r) => r.json())
      const pageIds = ((firstPage.users ?? firstPage.data?.users ?? []) as ListedUser[]).map((u) => u.id)
      assert(!pageIds.includes(id), 'the probe is not on the unfiltered first page')

      assert((await search(`quillon${tag}`)).includes(id), 'found by first name, case-insensitive')
      assert((await search(`Quillon${tag} Marbury${tag}`)).includes(id), 'found by "First Last"')
      assert((await search(`zz_probe_${tag}`)).includes(id), 'found by username')
      assertEquals((await search(`nobody-${tag}`)).length, 0, 'an unmatched term returns nobody')
      // PostgREST filter syntax in the term must not become a filter of its own.
      assertEquals((await search(`x),id.eq.${id}`)).includes(id), false, 'filter syntax in the term is inert')
    } finally {
      await admin.auth.admin.deleteUser(id)
    }
  },
})
