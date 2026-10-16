/**
 * Database access hardening — what a client token can reach through PostgREST
 * directly, without going through the `api` function (#1155, Wave 0).
 *
 * These go straight at `/rest/v1`, because that is the path an attacker uses:
 * the anon key ships in every web bundle.
 *
 * 1. #1143 — SECURITY DEFINER functions that read Vault secrets, reconfigure
 *    Stripe, mint/revoke OAuth tokens or read webhook secrets must not be
 *    executable by anon or a signed-in user (migration 364). Every call here is
 *    a GET, which PostgREST runs in a READ ONLY transaction, so even when the
 *    function IS executable (the red run) nothing is written or dropped: a
 *    permitted call fails with 25006 or returns data, a refused one fails with
 *    42501 before the body runs.
 * 2. #1144 — one user cannot read, rewrite or delete another user's
 *    notification devices or preferences (migration 365 — 303 never ran
 *    remotely; locally it did, so prove red with DISABLE ROW LEVEL SECURITY).
 * 3. #1145 — nine service-only tables return nothing to anon or a signed-in
 *    user (migration 366). Locally they carry no client GRANT, as on prod; to
 *    reproduce dev's drift, grant anon SELECT by hand — the test must stay
 *    green once RLS is on.
 *
 * Users (seeds): the cached `regular` token (test@example.com) and
 * nikola@unicorn.love / password123.
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_SERVICE_KEY,
  TEST_SUPABASE_URL,
  createAdminClient,
  getAuthToken,
  loadCachedTokens,
} from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'

const REST = `${TEST_SUPABASE_URL}/rest/v1`
const ZERO = '00000000-0000-0000-0000-000000000000'

interface RestResult {
  status: number
  body: unknown
}

async function rest(
  path: string,
  opts: { token?: string; schema?: string; method?: string; body?: unknown; prefer?: string } = {},
): Promise<RestResult> {
  const schema = opts.schema ?? 'core'
  const response = await fetch(`${REST}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${opts.token ?? TEST_SUPABASE_ANON_KEY}`,
      'Accept-Profile': schema,
      'Content-Profile': schema,
      'Content-Type': 'application/json',
      ...(opts.prefer ? { Prefer: opts.prefer } : {}),
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  const text = await response.text()
  let body: unknown = text
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    // keep raw text
  }
  return { status: response.status, body }
}

const errorCode = (r: RestResult) => (r.body as { code?: string } | null)?.code

async function signIn() {
  await requireAuthSetup()
  const tokens = await loadCachedTokens()
  assertExists(tokens, 'Cached tokens should exist')
  const nikola = await getAuthToken('nikola@unicorn.love', 'password123')
  assertExists(nikola, 'nikola@unicorn.love should sign in (seeded)')
  return { userA: tokens!.regular.token, userAId: tokens!.regular.userId, userB: nikola! }
}

// ---------------------------------------------------------------------------
// 1. #1143 — definer RPCs
// ---------------------------------------------------------------------------

const DEFINER_RPCS: { schema: string; fn: string; query: string }[] = [
  { schema: 'core', fn: 'get_secret_value', query: `p_secret_id=${ZERO}` },
  { schema: 'core', fn: 'rotate_stripe_secret', query: 'p_secret=x&p_secret_type=probe' },
  { schema: 'core', fn: 'configure_stripe_server', query: `p_api_key_secret_id=${ZERO}&p_api_version=2024-06-20` },
  { schema: 'core', fn: 'refresh_stripe_schema', query: '' },
  {
    schema: 'core',
    fn: 'generate_oauth_token',
    query: `p_oauth_app_id=${ZERO}&p_user_id=${ZERO}&p_scopes=${encodeURIComponent('{read:jobs}')}`,
  },
  { schema: 'core', fn: 'revoke_oauth_app_tokens', query: `p_oauth_app_id=${ZERO}` },
  { schema: 'public', fn: 'get_pending_webhook_deliveries', query: '' },
  { schema: 'public', fn: 'get_webhooks_for_event', query: `p_organization_id=${ZERO}&p_event_type=probe` },
  {
    schema: 'public',
    fn: 'create_auth_session',
    query:
      `p_scaffald_user_id=probe&p_supabase_user_id=${ZERO}&p_access_token=x&p_refresh_token=x` +
      `&p_token_expires_at=2030-01-01T00:00:00Z&p_user_agent=probe&p_ip_address=127.0.0.1`,
  },
  { schema: 'public', fn: 'get_auth_session', query: `p_session_id=${ZERO}` },
  {
    schema: 'public',
    fn: 'update_auth_session_tokens',
    query: `p_session_id=${ZERO}&p_access_token=x&p_refresh_token=x&p_token_expires_at=2030-01-01T00:00:00Z`,
  },
  { schema: 'public', fn: 'delete_auth_session', query: `p_session_id=${ZERO}` },
  { schema: 'public', fn: 'get_encryption_key', query: '' },
]

Deno.test({
  name: 'DB hardening - secret, Stripe, OAuth and webhook definer RPCs refuse anon and signed-in callers (#1143)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA } = await signIn()
    const failures: string[] = []
    for (const { schema, fn, query } of DEFINER_RPCS) {
      const path = `/rpc/${fn}${query ? `?${query}` : ''}`
      for (const [who, token] of [['anon', undefined], ['user', userA]] as const) {
        const r = await rest(path, { schema, token })
        if (errorCode(r) !== '42501') {
          failures.push(`${who} ${schema}.${fn} -> ${r.status} ${JSON.stringify(r.body).slice(0, 120)}`)
        }
      }
    }
    assertEquals(failures.join('\n'), '', 'expected permission denied (42501) for every call')
  },
})

Deno.test({
  // get_secret_value itself can't be the control: locally `vault.get_secret`
  // does not exist, so it 404s for every caller. Same migration, same grant.
  name: 'DB hardening - the service role keeps EXECUTE on the revoked RPCs (the api function depends on it)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const r = await rest(`/rpc/get_webhooks_for_event?p_organization_id=${ZERO}&p_event_type=probe`, {
      schema: 'public',
      token: TEST_SUPABASE_SERVICE_KEY,
    })
    assertEquals(r.status, 200, `service role should execute it, got ${r.status} ${JSON.stringify(r.body)}`)
  },
})

// ---------------------------------------------------------------------------
// 2. #1144 — notification devices and preferences are per-user
// ---------------------------------------------------------------------------

Deno.test({
  name: "DB hardening - a signed-in user cannot read, rewrite or delete another user's notification devices (#1144)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA, userAId, userB } = await signIn()
    assertExists(userAId, 'user A id (cached token)')
    const token = `probe-${crypto.randomUUID()}`

    // Devices are registered by the server (clients hold no USAGE on the id
    // sequence), so seed user A's row the same way.
    const created = await createAdminClient()
      .schema('core')
      .from('notification_devices')
      .insert({ user_id: userAId, platform: 'ios', token })
      .select('id')
      .single()
    assertExists(created.data, `seed user A's device: ${JSON.stringify(created.error)}`)
    const id = created.data.id

    try {
      const own = await rest(`/notification_devices?id=eq.${id}`, { token: userA })
      assertEquals((own.body as unknown[]).length, 1, 'user A sees own device')

      const read = await rest(`/notification_devices?id=eq.${id}`, { token: userB })
      assertEquals((read.body as unknown[]).length, 0, "user B must not see user A's device")

      const all = await rest('/notification_devices?select=user_id', { token: userB })
      const foreign = (all.body as { user_id: string }[]).filter((d) => d.user_id === userAId)
      assertEquals(foreign.length, 0, "user B's unfiltered list must not include user A's devices")

      const update = await rest(`/notification_devices?id=eq.${id}`, {
        token: userB,
        method: 'PATCH',
        prefer: 'return=representation',
        body: { token: 'hijacked' },
      })
      assertEquals((update.body as unknown[]).length, 0, "user B must not rewrite user A's device")

      await rest(`/notification_devices?id=eq.${id}`, { token: userB, method: 'DELETE' })

      const after = await createAdminClient().schema('core').from('notification_devices').select('token').eq('id', id).single()
      assertEquals(after.data?.token, token, "user A's device is untouched")

      const anon = await rest(`/notification_devices?id=eq.${id}`)
      assert(
        anon.status === 401 || (Array.isArray(anon.body) && anon.body.length === 0),
        `anon must see nothing, got ${anon.status} ${JSON.stringify(anon.body)}`,
      )
    } finally {
      await createAdminClient().schema('core').from('notification_devices').delete().eq('id', id)
    }
  },
})

Deno.test({
  name: "DB hardening - a signed-in user cannot read another user's notification preferences (#1144)",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA, userAId, userB } = await signIn()
    assertExists(userAId, 'user A id (cached token)')

    // The api route creates the row on first read; it reads with the caller's
    // own token, so this is also the regression check that RLS does not break it.
    const viaApi = await fetch(`${TEST_SUPABASE_URL}/functions/v1/api/v1/notifications/preferences`, {
      headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${userA}` },
    })
    const viaApiBody = await viaApi.text()
    assertEquals(viaApi.status, 200, `GET /v1/notifications/preferences as user A, got ${viaApiBody}`)

    const own = await rest(`/notification_preferences?user_id=eq.${userAId}`, { token: userA })
    assertEquals((own.body as unknown[]).length, 1, 'user A sees own preferences row')

    const other = await rest(`/notification_preferences?user_id=eq.${userAId}`, { token: userB })
    assertEquals((other.body as unknown[]).length, 0, "user B must not see user A's preferences")

    const update = await rest(`/notification_preferences?user_id=eq.${userAId}`, {
      token: userB,
      method: 'PATCH',
      prefer: 'return=representation',
      body: { updated_at: new Date().toISOString() },
    })
    assertEquals((update.body as unknown[]).length, 0, "user B must not rewrite user A's preferences")
  },
})

// ---------------------------------------------------------------------------
// 3. #1145 — service-only tables
// ---------------------------------------------------------------------------

const SERVICE_ONLY_TABLES: { schema: string; table: string }[] = [
  { schema: 'core', table: 'stripe_settings' },
  { schema: 'core', table: 'system_config' },
  { schema: 'core', table: 'success_fee_jobs' },
  { schema: 'core', table: 'construction_projects' },
  { schema: 'core', table: 'application_assignment_history' },
  { schema: 'core', table: 'archived_external_jobs' },
  { schema: 'core', table: 'archived_notifications' },
  { schema: 'core', table: 'vanity_url_analytics' },
  { schema: 'public', table: 'audit_log_archive_index' },
]

Deno.test({
  name: 'DB hardening - service-only tables return nothing to anon or a signed-in user (#1145)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { userA } = await signIn()
    const failures: string[] = []
    for (const { schema, table } of SERVICE_ONLY_TABLES) {
      for (const [who, token] of [['anon', undefined], ['user', userA]] as const) {
        const r = await rest(`/${table}?limit=1`, { schema, token })
        const closed = r.status === 401 || r.status === 403 || (Array.isArray(r.body) && r.body.length === 0)
        if (!closed) failures.push(`${who} ${schema}.${table} -> ${r.status} ${JSON.stringify(r.body).slice(0, 120)}`)
      }
    }
    assertEquals(failures.join('\n'), '', 'expected no rows')
  },
})

Deno.test({
  name: 'DB hardening - the service role still reads the service-only tables (#1145)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const failures: string[] = []
    for (const { schema, table } of SERVICE_ONLY_TABLES) {
      const r = await rest(`/${table}?limit=1`, { schema, token: TEST_SUPABASE_SERVICE_KEY })
      if (r.status !== 200) failures.push(`${schema}.${table} -> ${r.status} ${JSON.stringify(r.body).slice(0, 120)}`)
    }
    assertEquals(failures.join('\n'), '', 'service role should read every table')
  },
})
