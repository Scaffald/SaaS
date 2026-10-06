/**
 * API keys REST — who may manage a key.
 *
 * Every handler resolved "your organization" and "your role" from ONE team
 * membership row (`.limit(1).single()`, no order). clay@unicorn.love is
 * `team_admin` in four Unicorn teams and a plain `member` in three, so he
 * could create and list keys but was refused when revoking one, depending on
 * row order (#1037). The rule now: update/delete need team_admin in any team
 * of the KEY's organization; a non-member of that organization gets 404.
 *
 * Users (seeds/011, password123): clay@unicorn.love — mixed admin/member;
 * nikola@unicorn.love — plain member of the same organization; the cached
 * `regular` token — in no organization.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  createAdminClient,
  getAuthToken,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const API = `${TEST_SUPABASE_URL}/functions/v1/api/v1/api-keys`

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
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

Deno.test({
  name: 'API keys REST - an org admin who is also a member elsewhere in the org can manage keys; members and outsiders cannot',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const tokens = await loadCachedTokens()
    assertExists(tokens, 'Cached tokens should exist')
    const clay = await getAuthToken('clay@unicorn.love', 'password123')
    const nikola = await getAuthToken('nikola@unicorn.love', 'password123')
    assertExists(clay, 'clay@unicorn.love should sign in (seeded)')
    assertExists(nikola, 'nikola@unicorn.love should sign in (seeded)')

    const created = await call('', clay!, {
      method: 'POST',
      body: JSON.stringify({ name: `org-authz-${Date.now()}`, scopes: ['read:jobs'] }),
    })
    assertEquals(created.status, 201, `create should succeed, got ${JSON.stringify(created.body)}`)
    const id = (created.body?.data as { id: string }).id

    try {
      const member = await call(`/${id}`, nikola!, { method: 'DELETE' })
      assertEquals(member.status, 403, 'a plain member of the organization cannot revoke a key')

      const renamed = await call(`/${id}`, clay!, {
        method: 'PATCH',
        body: JSON.stringify({ name: 'renamed by an admin' }),
      })
      assertEquals(renamed.status, 200, `the admin can update it, got ${JSON.stringify(renamed.body)}`)

      const revoked = await call(`/${id}`, clay!, { method: 'DELETE' })
      assertEquals(revoked.status, 200, `the admin can revoke it, got ${JSON.stringify(revoked.body)}`)

      const outsider = await call(`/${id}`, tokens!.regular.token, { method: 'DELETE' })
      assertEquals(outsider.status, 404, 'outside the organization the key reads as not found')

      const listed = await call('', clay!)
      const key = (listed.body?.data as { id: string; is_active: boolean }[]).find((k) => k.id === id)
      assertEquals(key?.is_active, false, 'revoked keys are listed as inactive')
    } finally {
      await createAdminClient().schema('core').from('api_keys').delete().eq('id', id)
    }
  },
})
