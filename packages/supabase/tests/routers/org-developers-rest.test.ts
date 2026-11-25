/**
 * An organization's API keys and webhooks, managed by its own admins (#1440).
 *
 * Both belong to an organization, but the screens sat in Office, which admits
 * only the platform `office` role, and the api decided membership from one
 * source each: api-keys from teams only, webhooks from org-scoped role
 * assignments only. So the seeded orgAdmin — owner and `admin` of
 * apex-mechanical, on no team, no office role — was refused every API-key
 * call, and a team_admin with no org-scoped role could not create a webhook.
 *
 * Membership is now one rule (functions/api/lib/org-developer-roles.ts), and
 * every call can name its organization. These tests pin:
 *
 *   - the orgAdmin persona lists, creates and revokes its organization's keys
 *     and webhooks, and opens a webhook's detail and deliveries;
 *   - a team_admin of two organizations, without the office role or any
 *     org-scoped role, manages each one's keys and webhooks separately, and an
 *     unnamed create is refused rather than guessed;
 *   - a plain member sees the keys and webhooks but cannot create or revoke;
 *   - an outsider sees nothing, and a webhook id reads as not found.
 *
 * The two-organization case builds its own organizations, teams and
 * memberships with the service role and removes them afterwards.
 *
 * `ORG_DEVELOPERS_TEST_API_BASE` points the suite at the function run directly
 * when the shared edge runtime belongs to another checkout:
 *
 *     cd packages/supabase
 *     ORG_DEVELOPERS_TEST_API_BASE=http://127.0.0.1:8000/v1 deno test --allow-all \
 *       --no-check --config tests/deno.json tests/routers/org-developers-rest.test.ts
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import { disposePersonas, getPersonas, type Personas } from '../shared/personas.ts'
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient } from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const REST_BASE =
  Deno.env.get('ORG_DEVELOPERS_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${REST_BASE}${path}`, {
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

type Row = { id: string; organization_id?: string; is_active?: boolean }
const rows = (body: Record<string, unknown> | null) => (body?.data as Row[] | undefined) ?? []
// assertEquals here is Object.is, so compare id lists as joined strings.
const ids = (body: Record<string, unknown> | null) => rows(body).map((r) => r.id)

let personas: Personas | null = null
async function people() {
  await requireAuthSetup()
  personas ??= await getPersonas()
  return personas
}

async function orgIdBySlug(slug: string): Promise<string> {
  const { data, error } = await createAdminClient()
    .schema('core')
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()
  if (error || !data) throw new Error(`organization ${slug} should be seeded: ${error?.message}`)
  return data.id as string
}

async function teamRoleId(key: string): Promise<string> {
  const { data, error } = await createAdminClient()
    .schema('core')
    .from('team_roles')
    .select('id')
    .eq('key', key)
    .single()
  if (error || !data) throw new Error(`team role ${key} should be seeded: ${error?.message}`)
  return data.id as string
}

/** A throwaway organization with one team, and `members` on it in the given roles. */
async function orgWithTeam(label: string, members: { userId: string; role: string }[]) {
  const admin = createAdminClient().schema('core')
  const slug = `devtab-${label}-${crypto.randomUUID().slice(0, 8)}`
  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert({ name: `Developers tab ${label}`, slug })
    .select('id')
    .single()
  if (orgError || !org) throw new Error(`create org: ${orgError?.message}`)
  const memberRole = await teamRoleId('member')
  const { data: team, error: teamError } = await admin
    .from('teams')
    .insert({ organization_id: org.id, name: `${label} team`, default_role_id: memberRole })
    .select('id')
    .single()
  if (teamError || !team) throw new Error(`create team: ${teamError?.message}`)
  for (const m of members) {
    const { error } = await admin
      .from('team_members')
      .insert({ team_id: team.id, user_id: m.userId, role_id: await teamRoleId(m.role) })
    if (error) throw new Error(`add member: ${error.message}`)
  }
  return { id: org.id as string, slug, teamId: team.id as string }
}

async function dropOrg(orgId: string) {
  const admin = createAdminClient()
  await admin.from('webhooks').delete().eq('organization_id', orgId)
  await admin.schema('core').from('api_keys').delete().eq('organization_id', orgId)
  const { data: teams } = await admin.schema('core').from('teams').select('id').eq('organization_id', orgId)
  const teamIds = (teams ?? []).map((t) => t.id as string)
  if (teamIds.length) {
    await admin.schema('core').from('team_members').delete().in('team_id', teamIds)
    await admin.schema('core').from('teams').delete().in('id', teamIds)
  }
  await admin.schema('core').from('organizations').delete().eq('id', orgId)
}

Deno.test({
  name: 'Org developers REST - the org admin (owner, on no team, no office role) manages its API keys',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { orgAdmin } = await people()
    const apex = await orgIdBySlug('apex-mechanical')

    const created = await call('/api-keys', orgAdmin.token, {
      method: 'POST',
      body: JSON.stringify({ organization_id: apex, name: `devtab-${Date.now()}`, scopes: ['read:jobs'] }),
    })
    assertEquals(created.status, 201, `create should succeed, got ${JSON.stringify(created.body)}`)
    const key = created.body?.data as { id: string; key: string; organization_id: string }
    assertExists(key?.key, 'the full key is shown once, at creation')
    assertEquals(key.organization_id, apex, 'it belongs to the organization named')

    try {
      const listed = await call(`/api-keys?organization_id=${apex}`, orgAdmin.token)
      assertEquals(listed.status, 200, `list should succeed, got ${JSON.stringify(listed.body)}`)
      assert(ids(listed.body).includes(key.id), 'the new key is listed for its organization')
      assert(
        rows(listed.body).every((r) => r.organization_id === apex),
        'the organization filter returns only that organization’s keys'
      )

      const revoked = await call(`/api-keys/${key.id}`, orgAdmin.token, { method: 'DELETE' })
      assertEquals(revoked.status, 200, `the admin can revoke it, got ${JSON.stringify(revoked.body)}`)

      const after = await call(`/api-keys?organization_id=${apex}`, orgAdmin.token)
      assertEquals(
        rows(after.body).find((r) => r.id === key.id)?.is_active,
        false,
        'a revoked key is listed as inactive'
      )
    } finally {
      await createAdminClient().schema('core').from('api_keys').delete().eq('id', key.id)
    }
  },
})

Deno.test({
  name: 'Org developers REST - the org admin manages its webhooks and opens one’s detail and deliveries',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { orgAdmin } = await people()
    const apex = await orgIdBySlug('apex-mechanical')

    const created = await call('/webhooks', orgAdmin.token, {
      method: 'POST',
      body: JSON.stringify({
        organization_id: apex,
        url: 'https://example.com/devtab-webhook',
        events: ['job.created'],
      }),
    })
    assertEquals(created.status, 201, `create should succeed, got ${JSON.stringify(created.body)}`)
    const webhook = created.body?.data as { id: string; organization_id: string; secret: string }
    assertExists(webhook?.secret, 'the secret is shown once, at creation')
    assertEquals(webhook.organization_id, apex)

    try {
      const listed = await call(`/webhooks?organization_id=${apex}`, orgAdmin.token)
      assertEquals(listed.status, 200)
      assert(ids(listed.body).includes(webhook.id), 'the new webhook is listed for its organization')
      assert(
        rows(listed.body).every((r) => !('secret' in r)),
        'the list never carries the signing secret'
      )

      const detail = await call(`/webhooks/${webhook.id}`, orgAdmin.token)
      assertEquals(detail.status, 200, `detail should succeed, got ${JSON.stringify(detail.body)}`)
      const one = detail.body?.data as { id: string; url: string; secret?: string }
      assertEquals(one.id, webhook.id)
      assertEquals(one.url, 'https://example.com/devtab-webhook')
      assertEquals(one.secret, undefined, 'the detail never carries the signing secret')

      const deliveries = await call(`/webhooks/${webhook.id}/deliveries`, orgAdmin.token)
      assertEquals(deliveries.status, 200)
      assertEquals(rows(deliveries.body).length, 0, 'a new webhook has delivered nothing')
    } finally {
      const deleted = await call(`/webhooks/${webhook.id}`, orgAdmin.token, { method: 'DELETE' })
      assertEquals(deleted.status, 200, 'the org admin can delete it')
    }
  },
})

Deno.test({
  name: 'Org developers REST - a team_admin of two organizations manages each one separately, and an unnamed create is refused',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA, userB, orgAdmin } = await people()
    // userA: team_admin in both, no office role, no org-scoped role.
    // userB: a plain member of the first.
    const first = await orgWithTeam('first', [
      { userId: userA.id, role: 'team_admin' },
      { userId: userB.id, role: 'member' },
    ])
    const second = await orgWithTeam('second', [{ userId: userA.id, role: 'team_admin' }])

    try {
      const guessKey = await call('/api-keys', userA.token, {
        method: 'POST',
        body: JSON.stringify({ name: 'which org?', scopes: ['read:jobs'] }),
      })
      assertEquals(guessKey.status, 400, 'a member of two organizations must name one for a key')
      const guessHook = await call('/webhooks', userA.token, {
        method: 'POST',
        body: JSON.stringify({ url: 'https://example.com/which', events: ['job.created'] }),
      })
      assertEquals(guessHook.status, 400, 'and for a webhook')

      const made: Record<string, { key: string; hook: string }> = {}
      for (const org of [first, second]) {
        const key = await call('/api-keys', userA.token, {
          method: 'POST',
          body: JSON.stringify({ organization_id: org.id, name: `key ${org.slug}`, scopes: ['read:jobs'] }),
        })
        assertEquals(key.status, 201, `key in ${org.slug}: ${JSON.stringify(key.body)}`)
        const hook = await call('/webhooks', userA.token, {
          method: 'POST',
          body: JSON.stringify({
            organization_id: org.id,
            url: `https://example.com/${org.slug}`,
            events: ['job.created'],
          }),
        })
        assertEquals(hook.status, 201, `webhook in ${org.slug}: ${JSON.stringify(hook.body)}`)
        made[org.id] = {
          key: (key.body?.data as { id: string }).id,
          hook: (hook.body?.data as { id: string }).id,
        }
      }

      for (const [org, other] of [
        [first, second],
        [second, first],
      ]) {
        const keys = await call(`/api-keys?organization_id=${org.id}`, userA.token)
        assertEquals(keys.status, 200)
        assertEquals(ids(keys.body).join(','), made[org.id].key, `${org.slug} lists only its own key`)
        const hooks = await call(`/webhooks?organization_id=${org.id}`, userA.token)
        assertEquals(hooks.status, 200)
        assertEquals(ids(hooks.body).join(','), made[org.id].hook, `${org.slug} lists only its own webhook`)
        assert(!ids(hooks.body).includes(made[other.id].hook))
      }

      // A plain member of the first sees its keys and webhooks, changes nothing.
      const memberKeys = await call(`/api-keys?organization_id=${first.id}`, userB.token)
      assertEquals(memberKeys.status, 200)
      assertEquals(ids(memberKeys.body).join(','), made[first.id].key, 'a member sees the organization’s keys')
      const memberHooks = await call(`/webhooks?organization_id=${first.id}`, userB.token)
      assertEquals(ids(memberHooks.body).join(','), made[first.id].hook, 'and its webhooks')
      const memberCreate = await call('/api-keys', userB.token, {
        method: 'POST',
        body: JSON.stringify({ organization_id: first.id, name: 'member key', scopes: ['read:jobs'] }),
      })
      assertEquals(memberCreate.status, 403, 'a member cannot create a key')
      const memberHook = await call('/webhooks', userB.token, {
        method: 'POST',
        body: JSON.stringify({ organization_id: first.id, url: 'https://example.com/m', events: ['job.created'] }),
      })
      assertEquals(memberHook.status, 403, 'or a webhook')
      const memberRevoke = await call(`/api-keys/${made[first.id].key}`, userB.token, { method: 'DELETE' })
      assertEquals(memberRevoke.status, 403, 'or revoke a key')
      const memberDelete = await call(`/webhooks/${made[first.id].hook}`, userB.token, { method: 'DELETE' })
      assertEquals(memberDelete.status, 403, 'or delete a webhook')

      // Someone outside both — the seeded orgAdmin of another organization.
      const outsiderKeys = await call(`/api-keys?organization_id=${first.id}`, orgAdmin.token)
      assertEquals(outsiderKeys.status, 403, 'naming an organization you are not in is refused')
      const outsiderHooks = await call(`/webhooks?organization_id=${first.id}`, orgAdmin.token)
      assertEquals(ids(outsiderHooks.body).join(','), '', 'and lists no webhooks')
      const outsiderDetail = await call(`/webhooks/${made[first.id].hook}`, orgAdmin.token)
      assertEquals(outsiderDetail.status, 404, 'another organization’s webhook reads as not found')
      const outsiderDeliveries = await call(`/webhooks/${made[first.id].hook}/deliveries`, orgAdmin.token)
      assertEquals(outsiderDeliveries.status, 404)

      // And the team_admin revokes and deletes in each.
      for (const org of [first, second]) {
        const revoked = await call(`/api-keys/${made[org.id].key}`, userA.token, { method: 'DELETE' })
        assertEquals(revoked.status, 200, `revoke in ${org.slug}`)
        const deleted = await call(`/webhooks/${made[org.id].hook}`, userA.token, { method: 'DELETE' })
        assertEquals(deleted.status, 200, `delete in ${org.slug}`)
      }
    } finally {
      await dropOrg(first.id)
      await dropOrg(second.id)
    }
  },
})

Deno.test({
  name: 'Org developers REST - dispose personas',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    if (!personas) return
    await disposePersonas()
  },
})
