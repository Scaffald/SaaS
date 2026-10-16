/**
 * Office universities REST — the catalog's create / rename / delete (#1230).
 *
 * The three writes went through the caller's own JWT, and `authenticated`
 * holds only SELECT on data.universities on every project, so each answered
 * `permission denied for table universities` — to office users too. The
 * delete's "still in use" guard counted core.user_education with the same JWT,
 * so RLS hid every other user's rows and it always counted 0.
 *
 * Users: zach@unicorn.love (platform office, seeds/002); the cached `regular`
 * token (worker only).
 *
 * API_BASE defaults to the local edge runtime. To test a worktree's api code
 * without taking the shared runtime, run the function directly (it binds
 * :8000) and set OFFICE_TEST_API_BASE=http://127.0.0.1:8000.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'
import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
  createAdminClient,
  getAuthToken,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const API_BASE = Deno.env.get('OFFICE_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api`
const API = `${API_BASE}/v1/office/universities`

async function call(path: string, token: string | null, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: TEST_SUPABASE_ANON_KEY,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

const slug = () => `probe-${crypto.randomUUID().slice(0, 8)}`

Deno.test({
  name: 'Office universities REST - office can create, rename and delete; others cannot (#1230)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const office = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(office, 'office user should sign in (seeded)')

    const body = { name: 'Probe University', slug: slug(), country: 'United States', alpha_two_code: 'us' }

    assertEquals((await call('', null, { method: 'POST', body: JSON.stringify(body) })).status, 401, 'anon is refused')
    assertEquals(
      (await call('', tokens!.regular.token, { method: 'POST', body: JSON.stringify(body) })).status,
      403,
      'a worker is refused',
    )

    const created = await call('', office!, { method: 'POST', body: JSON.stringify(body) })
    assertEquals(created.status, 201, `office creates it, got ${JSON.stringify(created.body)}`)
    const id = (created.body?.university as { id: string }).id

    try {
      const renamed = await call(`/${id}`, office!, { method: 'PATCH', body: JSON.stringify({ name: 'Probe U' }) })
      assertEquals(renamed.status, 200, `office renames it, got ${JSON.stringify(renamed.body)}`)
      assertEquals((renamed.body?.university as { name: string }).name, 'Probe U', 'rename persisted')

      const removed = await call(`/${id}`, office!, { method: 'DELETE' })
      assertEquals(removed.status, 200, `office deletes it, got ${JSON.stringify(removed.body)}`)
      const gone = await createAdminClient().schema('data').from('universities').select('id').eq('id', id)
      assertEquals(gone.data?.length, 0, 'the row is gone')
    } finally {
      await createAdminClient().schema('data').from('universities').delete().eq('id', id)
    }
  },
})

Deno.test({
  name: "Office universities REST - delete refuses a university in someone else's education history (#1230)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const office = await getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password)
    assertExists(office, 'office user should sign in (seeded)')
    const admin = createAdminClient()

    const created = await call('', office!, {
      method: 'POST',
      body: JSON.stringify({ name: 'In-use University', slug: slug(), country: 'United States', alpha_two_code: 'US' }),
    })
    assertEquals(created.status, 201, `office creates it, got ${JSON.stringify(created.body)}`)
    const id = (created.body?.university as { id: string }).id

    // Another user's education row — the office user's JWT cannot see it.
    const sub = JSON.parse(atob(tokens!.regular.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub
    const edu = await admin
      .schema('core')
      .from('user_education')
      .insert({ user_id: sub, university_id: id, institution_name: 'In-use University' })
      .select('id')
      .single()
    assertExists(edu.data, `seed an education row: ${JSON.stringify(edu.error)}`)

    try {
      const refused = await call(`/${id}`, office!, { method: 'DELETE' })
      assertEquals(refused.status, 400, `delete must be refused while in use, got ${refused.status} ${JSON.stringify(refused.body)}`)
    } finally {
      await admin.schema('core').from('user_education').delete().eq('id', edu.data.id)
      await admin.schema('data').from('universities').delete().eq('id', id)
    }
  },
})
