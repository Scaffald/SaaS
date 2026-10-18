/**
 * Account deletion REST API (#1313).
 *
 * POST /v1/account-deletion/worker answered 401 to every signed-in user: the
 * route read `supabaseAdmin` from the context and nothing on its path set it.
 * So no request was ever recorded, and the processor (see
 * account-deletion-process.test.ts) had nothing to act on even once it existed.
 *
 * This covers the request, the status read on sign-in, the cancel during the
 * grace period, and the office list of requests that need a person.
 *
 * ACCOUNT_DELETION_TEST_API_BASE points the suite at the api function run
 * directly (`.../v1`); the shared edge runtime serves whichever checkout
 * started it.
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient } from '../shared/setup.ts'
import { disposePersonas, getPersonas, type Personas } from '../shared/personas.ts'

const API = Deno.env.get('ACCOUNT_DELETION_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`

// deno-lint-ignore no-explicit-any
const core = () => (createAdminClient() as any).schema('core')

let personas: Personas | null = null
async function who(): Promise<Personas> {
  personas ??= await getPersonas()
  return personas
}

async function call(path: string, token: string, init: RequestInit = {}) {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const text = await response.text()
  let body: Record<string, unknown> = {}
  try {
    body = JSON.parse(text)
  } catch {
    body = { raw: text }
  }
  return { status: response.status, body }
}

const DAY = 86_400_000

Deno.test({
  name: 'Account deletion REST - a worker can request deletion; it is scheduled 14 days out',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA } = await who()

    const first = await call('/account-deletion/worker', userA.token, {
      method: 'POST',
      body: JSON.stringify({ reason: 'test' }),
    })
    assertEquals(first.status, 200, `request should be recorded, got ${JSON.stringify(first.body)}`)
    assertEquals(first.body.status, 'pending')
    assertEquals(first.body.canCancel, true)
    const days =
      (Date.parse(first.body.scheduledFor as string) - Date.parse(first.body.requestedAt as string)) / DAY
    assertEquals(days, 14, 'scheduled for requested + 14 days')

    // A second tap answers with the same request rather than queueing another.
    const again = await call('/account-deletion/worker', userA.token, {
      method: 'POST',
      body: JSON.stringify({}),
    })
    assertEquals(again.status, 200)
    assertEquals(again.body.id, first.body.id)
  },
})

Deno.test({
  name: 'Account deletion REST - status shows the open request to its owner only',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA, userB } = await who()

    const mine = await call('/account-deletion/status', userA.token)
    assertEquals(mine.status, 200, JSON.stringify(mine.body))
    const request = mine.body.request as Record<string, unknown> | null
    assertExists(request, 'userA has an open request')
    assertEquals(request.status, 'pending')
    assertExists(request.scheduledFor)
    assertEquals(request.canCancel, true)

    const theirs = await call('/account-deletion/status', userB.token)
    assertEquals(theirs.status, 200)
    assertEquals(theirs.body.request, null, "userB does not see userA's request")
  },
})

Deno.test({
  name: "Account deletion REST - another user cannot cancel someone else's request",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA, userB } = await who()
    const response = await call('/account-deletion/cancel', userB.token, { method: 'POST' })
    assertEquals(response.status, 404)

    const still = await call('/account-deletion/status', userA.token)
    assertEquals((still.body.request as Record<string, unknown>).status, 'pending')
  },
})

Deno.test({
  name: 'Account deletion REST - the owner can cancel during the grace period',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA } = await who()

    const cancelled = await call('/account-deletion/cancel', userA.token, { method: 'POST' })
    assertEquals(cancelled.status, 200, JSON.stringify(cancelled.body))
    assertEquals(cancelled.body.status, 'cancelled')
    assertExists(cancelled.body.cancelledAt)

    const after = await call('/account-deletion/status', userA.token)
    assertEquals(after.body.request, null)

    const again = await call('/account-deletion/cancel', userA.token, { method: 'POST' })
    assertEquals(again.status, 404, 'nothing left to cancel')

    // The cancelled row is kept as the record and is never claimed.
    const { data } = await core()
      .from('account_deletions')
      .select('status, cancelled_at')
      .eq('id', cancelled.body.id)
      .single()
    assertEquals(data.status, 'cancelled')
    assertExists(data.cancelled_at)
  },
})

Deno.test({
  name: 'Account deletion REST - a deletion already under way cannot be cancelled',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userB } = await who()
    const created = await call('/account-deletion/worker', userB.token, { method: 'POST', body: '{}' })
    assertEquals(created.status, 200)
    // What the processor's claim writes.
    await core().from('account_deletions').update({ status: 'in_progress' }).eq('id', created.body.id)

    const response = await call('/account-deletion/cancel', userB.token, { method: 'POST' })
    assertEquals(response.status, 409, JSON.stringify(response.body))

    const status = await call('/account-deletion/status', userB.token)
    assertEquals((status.body.request as Record<string, unknown>).canCancel, false)

    await core().from('account_deletions').delete().eq('id', created.body.id)
  },
})

Deno.test({
  name: 'Account deletion REST - a signed-in client cannot write its own schedule',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userB } = await who()
    // The 130 insert policy lets a worker write their own row through
    // PostgREST. The trigger (390) must ignore the dates and status it sends.
    const response = await fetch(`${TEST_SUPABASE_URL}/rest/v1/account_deletions?select=id,status,scheduled_for,requested_at`, {
      method: 'POST',
      headers: {
        apikey: TEST_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${userB.token}`,
        'Content-Type': 'application/json',
        'Content-Profile': 'core',
        'Accept-Profile': 'core',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        deleted_user_id: userB.id,
        deletion_type: 'worker',
        status: 'completed',
        scheduled_for: '2000-01-01T00:00:00Z',
        requested_at: '2000-01-01T00:00:00Z',
      }),
    })
    const rows = (await response.json()) as Array<Record<string, string>>
    assertEquals(response.status, 201, JSON.stringify(rows))
    const row = rows[0]
    assertEquals(row.status, 'pending')
    const days = (Date.parse(row.scheduled_for) - Date.now()) / DAY
    assert(days > 13.9 && days <= 14, `scheduled ~14 days out, got ${days}`)

    await core().from('account_deletions').delete().eq('id', row.id)
  },
})

Deno.test({
  name: 'Account deletion REST - anon gets 401',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    for (const [path, method] of [
      ['/account-deletion/status', 'GET'],
      ['/account-deletion/cancel', 'POST'],
      ['/account-deletion/worker', 'POST'],
    ]) {
      const response = await call(path, TEST_SUPABASE_ANON_KEY, { method, body: method === 'POST' ? '{}' : undefined })
      assertEquals(response.status, 401, `${method} ${path}`)
    }
  },
})

Deno.test({
  name: 'Account deletion REST - office sees failed, overdue and organization requests',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { office, userA, userB } = await who()
    const longAgo = new Date(Date.now() - 40 * DAY).toISOString()

    // Seeded directly: a failed one (blocked), an overdue pending one, and a
    // finished one that must NOT appear under the default filter.
    const { data: rows, error } = await core()
      .from('account_deletions')
      .insert([
        { deleted_user_id: userA.id, deletion_type: 'worker', status: 'failed', error_message: 'blockers: test' },
        { deleted_user_id: userB.id, deletion_type: 'worker', status: 'pending', requested_at: longAgo },
        { deletion_type: 'worker', status: 'completed', requested_at: longAgo },
        // The processor never claims these (390); they wait for a person.
        { deletion_type: 'organization', status: 'pending' },
      ])
      .select('id')
    if (error) throw new Error(error.message)
    const [failed, overdue, done, organization] = (rows as Array<{ id: string }>).map((r) => r.id)

    try {
      const response = await call('/office/account-deletions', office.token)
      assertEquals(response.status, 200, JSON.stringify(response.body))
      const list = response.body.requests as Array<Record<string, unknown>>
      const byId = new Map(list.map((r) => [r.id as string, r]))

      assertEquals(byId.get(failed)?.status, 'failed')
      assertEquals(byId.get(failed)?.errorMessage, 'blockers: test')
      assertEquals(byId.get(overdue)?.overdue, true)
      assertEquals(byId.has(done), false, 'a completed request needs no attention')
      assertEquals(byId.get(organization)?.needsManualHandling, true)

      const all = await call('/office/account-deletions?filter=all&limit=200', office.token)
      assertEquals(all.status, 200)
      assert(
        (all.body.requests as Array<{ id: string }>).some((r) => r.id === done),
        'filter=all includes finished requests'
      )

      const denied = await call('/office/account-deletions', userA.token)
      assert(denied.status === 401 || denied.status === 403, `a worker is refused, got ${denied.status}`)
    } finally {
      await core().from('account_deletions').delete().in('id', [failed, overdue, done, organization])
    }
  },
})

Deno.test({
  name: 'Account deletion REST - cleanup',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    if (!personas) return
    await core()
      .from('account_deletions')
      .delete()
      .in('deleted_user_id', [personas.userA.id, personas.userB.id])
    await disposePersonas()
  },
})
