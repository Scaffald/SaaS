/// <reference lib="deno.ns" />

/**
 * Who may request an organisation's deletion (#1321).
 *
 * POST /v1/account-deletion/organization checked "office" by filtering
 * core.role_assignments on a `role` column it does not have. That query errored
 * on every call, the error was dropped, and the fallback admitted the owner or
 * ANY role scoped to the organisation, looked up with `.maybeSingle()`. So:
 *
 *   - any member, in any role, could file the request;
 *   - platform office staff were refused unless they owned the organisation;
 *   - someone holding two roles in the organisation was refused, because
 *     `.maybeSingle()` errors on two rows.
 *
 * The rule now: platform office staff, the owner, or an org `admin` — the same
 * owner-or-admin helper the hiring routes use (#1312).
 *
 * Fixtures (an organisation and four fresh users) are made with the service
 * role; every account_deletions row written against the organisation, and the
 * fixtures, are removed at the end.
 *
 * ACCOUNT_DELETION_TEST_API_BASE points the suite at the api function run
 * directly (`.../v1`); the shared edge runtime serves whichever checkout
 * started it.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'
import { disposePersonas, getPersonas, type Personas } from '../shared/personas.ts'
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient, getAuthToken } from '../shared/setup.ts'

const API = Deno.env.get('ACCOUNT_DELETION_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`
const RUN = crypto.randomUUID().slice(0, 8)

// deno-lint-ignore no-explicit-any
const core = () => (createAdminClient() as any).schema('core')

async function call(path: string, token: string, body: unknown) {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  const text = await response.text()
  let parsed: unknown = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }
  return { status: response.status, body: parsed as Record<string, unknown> | null }
}

async function must<T>(label: string, query: PromiseLike<{ data: T; error: { message: string } | null }>) {
  const { data, error } = await query
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

async function roleId(name: string, scope: string): Promise<string> {
  const row = await must(
    `role ${name}/${scope}`,
    core().from('roles').select('id').eq('name', name).eq('scope', scope).single()
  )
  return (row as { id: string }).id
}

interface User {
  id: string
  token: string
}

interface Fixture {
  personas: Personas
  orgId: string
  owner: User
  /** Holds only `admin` in the organisation. */
  admin: User
  /** Holds only `member` in the organisation. */
  member: User
  /** Holds both `admin` and `member` in the organisation. */
  twoRoles: User
}

const made = { users: [] as string[], orgs: [] as string[] }

let setupOnce: Promise<Fixture> | null = null
const setup = () => (setupOnce ??= build())

async function freshUser(label: string): Promise<User> {
  const email = `org-deletion-${label}-${RUN}@example.com`
  const password = `p-${crypto.randomUUID()}`
  const { data, error } = await createAdminClient().auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw new Error(`${label} user: ${error?.message}`)
  made.users.push(data.user.id)
  const token = await getAuthToken(email, password)
  assertExists(token, `${label} user should sign in`)
  return { id: data.user.id, token }
}

async function build(): Promise<Fixture> {
  const personas = await getPersonas()
  const [owner, admin, member, twoRoles] = await Promise.all([
    freshUser('owner'),
    freshUser('admin'),
    freshUser('member'),
    freshUser('two-roles'),
  ])

  const org = (await must(
    'organisation',
    core()
      .from('organizations')
      .insert({ name: `Org deletion 1321 ${RUN}`, slug: `org-deletion-1321-${RUN}`, owner_user_id: owner.id })
      .select('id')
      .single()
  )) as { id: string }
  made.orgs.push(org.id)

  const adminRole = await roleId('admin', 'organization')
  const memberRole = await roleId('member', 'organization')
  await must(
    'role assignments',
    core()
      .from('role_assignments')
      .insert([
        { user_id: admin.id, role_id: adminRole, scope_org_id: org.id },
        { user_id: member.id, role_id: memberRole, scope_org_id: org.id },
        { user_id: twoRoles.id, role_id: adminRole, scope_org_id: org.id },
        { user_id: twoRoles.id, role_id: memberRole, scope_org_id: org.id },
      ])
      .select('id')
  )

  return { personas, orgId: org.id, owner, admin, member, twoRoles }
}

const request = (f: Fixture, user: User) =>
  call('/account-deletion/organization', user.token, { organizationId: f.orgId, reason: `test ${RUN}` })

/** Whether a request row exists for the fixture organisation filed by this user. */
async function filedBy(f: Fixture, userId: string): Promise<boolean> {
  const rows = await must(
    'requests',
    core()
      .from('account_deletions')
      .select('id')
      .eq('deleted_organization_id', f.orgId)
      .eq('requested_by_user_id', userId)
  )
  return (rows as unknown[]).length > 0
}

const opts = { sanitizeResources: false, sanitizeOps: false }

Deno.test({
  name: 'Organisation deletion (#1321) - a plain org member is refused and nothing is recorded',
  ...opts,
  async fn() {
    const f = await setup()
    const response = await request(f, f.member)
    assertEquals(response.status, 403, JSON.stringify(response.body))
    assertEquals(await filedBy(f, f.member.id), false)
  },
})

Deno.test({
  name: 'Organisation deletion (#1321) - a user with no role in the organisation is refused',
  ...opts,
  async fn() {
    const f = await setup()
    const response = await request(f, f.personas.userB)
    assertEquals(response.status, 403, JSON.stringify(response.body))
  },
})

Deno.test({
  name: 'Organisation deletion (#1321) - the owner may request it',
  ...opts,
  async fn() {
    const f = await setup()
    const response = await request(f, f.owner)
    assertEquals(response.status, 200, JSON.stringify(response.body))
    assertEquals(response.body?.status, 'pending')
    assertEquals(await filedBy(f, f.owner.id), true)
  },
})

Deno.test({
  name: 'Organisation deletion (#1321) - an org admin who is not the owner may request it',
  ...opts,
  async fn() {
    const f = await setup()
    const response = await request(f, f.admin)
    assertEquals(response.status, 200, JSON.stringify(response.body))
    assertEquals(await filedBy(f, f.admin.id), true)
  },
})

Deno.test({
  name: 'Organisation deletion (#1321) - a member holding two roles, one of them admin, may request it',
  ...opts,
  async fn() {
    const f = await setup()
    const response = await request(f, f.twoRoles)
    assertEquals(response.status, 200, JSON.stringify(response.body))
    assertEquals(await filedBy(f, f.twoRoles.id), true)
  },
})

Deno.test({
  name: "Organisation deletion (#1321) - platform office staff may request it for an organisation they don't own",
  ...opts,
  async fn() {
    const f = await setup()
    const office = f.personas.office
    // The persona must have no standing in the fixture organisation, or this
    // would pass through the owner/admin path instead.
    const own = await must(
      'office assignments',
      core().from('role_assignments').select('id').eq('user_id', office.id).eq('scope_org_id', f.orgId)
    )
    assertEquals((own as unknown[]).length, 0)

    const response = await request(f, office)
    assertEquals(response.status, 200, JSON.stringify(response.body))
    assertEquals(await filedBy(f, office.id), true)
  },
})

Deno.test({
  name: 'Organisation deletion (#1321) - an unknown organisation is 404',
  ...opts,
  async fn() {
    const f = await setup()
    const response = await call('/account-deletion/organization', f.owner.token, {
      organizationId: crypto.randomUUID(),
    })
    assertEquals(response.status, 404, JSON.stringify(response.body))
  },
})

Deno.test({
  name: 'Organisation deletion (#1321) - cleanup',
  ...opts,
  async fn() {
    if (made.orgs.length) {
      await core().from('account_deletions').delete().in('deleted_organization_id', made.orgs)
      await core().from('role_assignments').delete().in('scope_org_id', made.orgs)
      await core().from('organizations').delete().in('id', made.orgs)
    }
    for (const id of made.users) await createAdminClient().auth.admin.deleteUser(id)
    if (setupOnce) await disposePersonas()
  },
})
