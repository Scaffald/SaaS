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

const API = `${TEST_SUPABASE_URL}/functions/v1/api/v1`

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
