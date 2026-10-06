/**
 * Webhooks REST API.
 *
 * `public.webhooks` belongs to an organization (`organization_id NOT NULL`,
 * `created_by`) and has no `user_id`, but every handler filtered or inserted on
 * `user_id` — list, create and delete all answered 500 on production, and the
 * office screen rendered that as "No webhooks configured" (#1016).
 *
 * The tests pin the organization scoping the table's RLS already expresses: an
 * org member creates into their organization and sees it listed; a caller in no
 * organization sees nothing, cannot create, and cannot delete someone else's
 * webhook (404, which does not confirm it exists).
 *
 * Users: `office` is zach@unicorn.love, an admin of the seeded Unicorn org
 * (seeds/004); `regular` is test@example.com, in no organization.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'

import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, loadCachedTokens } from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const ENDPOINT = `${TEST_SUPABASE_URL}/functions/v1/api/v1/webhooks`

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${ENDPOINT}${path}`, {
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

async function tokens() {
  await requireAuthSetup()
  const cached = await loadCachedTokens()
  assertExists(cached, 'Cached tokens should exist')
  const office = cached.office?.token ?? ''
  const regular = cached.regular?.token ?? ''
  assertExists(office || null, 'An office token (an org member) is required')
  assertExists(regular || null, 'A regular token (no organization) is required')
  return { office, regular }
}

const listIds = (body: Record<string, unknown> | null) =>
  ((body?.data as { id: string }[] | undefined) ?? []).map((w) => w.id)

Deno.test({
  name: 'Webhooks REST - an org member creates, lists and deletes a webhook in their organization',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { office } = await tokens()

    const created = await call('', office, {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/webhooks-rest-test', events: ['job.created'] }),
    })
    assertEquals(created.status, 201, `create should succeed, got ${JSON.stringify(created.body)}`)
    const webhook = created.body?.data as { id: string; organization_id: string; secret: string }
    assertExists(webhook?.id, 'the created webhook comes back')
    assertExists(webhook?.organization_id, 'it is stored against an organization')
    assertExists(webhook?.secret, 'the secret is shown once, at creation')

    try {
      const listed = await call('', office)
      assertEquals(listed.status, 200, `list should succeed, got ${JSON.stringify(listed.body)}`)
      assertEquals(listIds(listed.body).includes(webhook.id), true, 'the new webhook is listed')
    } finally {
      const deleted = await call(`/${webhook.id}`, office, { method: 'DELETE' })
      assertEquals(deleted.status, 200, 'the creator’s organization can delete it')
    }

    const after = await call('', office)
    assertEquals(listIds(after.body).includes(webhook.id), false, 'it is gone after delete')
    const again = await call(`/${webhook.id}`, office, { method: 'DELETE' })
    assertEquals(again.status, 404, 'deleting it twice is a 404, not a silent success')
  },
})

Deno.test({
  name: 'Webhooks REST - a caller in no organization sees nothing, cannot create, and cannot delete another org’s webhook',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { office, regular } = await tokens()

    const created = await call('', office, {
      method: 'POST',
      body: JSON.stringify({ url: 'https://example.com/webhooks-rest-isolation', events: ['job.created'] }),
    })
    assertEquals(created.status, 201)
    const id = (created.body?.data as { id: string }).id

    let cleanup = 0
    try {
      const listed = await call('', regular)
      assertEquals(listed.status, 200)
      assertEquals(listIds(listed.body).includes(id), false, 'another organization’s webhook is not visible')

      const refused = await call('', regular, {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com/nope', events: ['job.created'] }),
      })
      assertEquals(refused.status, 403, 'no organization, no webhook')

      const notFound = await call(`/${id}`, regular, { method: 'DELETE' })
      assertEquals(notFound.status, 404, 'a webhook outside the caller’s organizations reads as not found')
    } finally {
      cleanup = (await call(`/${id}`, office, { method: 'DELETE' })).status
    }
    assertEquals(cleanup, 200, 'the owner could still delete it, so the other caller’s DELETE removed nothing')
  },
})
