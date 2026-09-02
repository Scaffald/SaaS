/**
 * Exercise /v1/moderation end to end against the local stack, as two real
 * signed-in users. Checks behaviour, not just the happy path (#690).
 *
 *   pnpm supa start && pnpm supa functions serve api
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=... node scripts/audit/test-moderation.mjs
 *
 * The section that matters is 'enforcement'. A block that is merely recorded
 * is worse than no block: the user believes they are unreachable and they are
 * not. It is asserted from BOTH sides, including the direction RLS hides.
 */
import { createClient } from '@supabase/supabase-js'

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const API = `${URL}/functions/v1/api`

const signIn = async (email) => {
  const sb = createClient(URL, ANON)
  const { data, error } = await sb.auth.signInWithPassword({ email, password: 'password123' })
  if (error) throw new Error(`${email}: ${error.message}`)
  return { token: data.session.access_token, id: data.user.id }
}

const call = async (token, method, path, body) => {
  const res = await fetch(API + path, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      apikey: ANON,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  const text = await res.text()
  try { json = text ? JSON.parse(text) : null } catch { json = text }
  return { status: res.status, body: json }
}

const results = []
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail })
  console.log(`  ${pass ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`)
}

const alice = await signIn('zach@unicorn.love')
const bob = await signIn('boris@unicorn.love').catch(() => null)
if (!bob) { console.log('second seed user unavailable; aborting'); process.exit(2) }

console.log(`alice ${alice.id.slice(0, 8)}  bob ${bob.id.slice(0, 8)}\n`)

// --- clean slate -----------------------------------------------------------
// Reports are deliberately not deletable through the API (a reporter cannot
// withdraw one), so a rerun would otherwise trip the one-open-report index.
// Resolve the previous run's rows straight in the database instead.
const { execSync } = await import('node:child_process')
try {
  execSync(
    `docker exec supabase_db_scaffald psql -U postgres -d postgres -c ` +
    `"update core.content_reports set status='dismissed' where reporter_id='${alice.id}';"`,
    { stdio: 'ignore' },
  )
} catch { /* not fatal — the assertions below will say so */ }
await call(alice.token, 'DELETE', `/v1/moderation/blocks/${bob.id}`)

console.log('reports')
const SUBJ = '11111111-1111-1111-1111-111111111111'

let r = await call(alice.token, 'POST', '/v1/moderation/reports', {
  subjectType: 'community_post', subjectId: SUBJ, reason: 'spam',
})
check('files a report', r.status === 201, `status ${r.status}`)
const reportId = r.body?.id

r = await call(alice.token, 'POST', '/v1/moderation/reports', {
  subjectType: 'community_post', subjectId: SUBJ, reason: 'harassment',
})
check('refuses a second open report on the same subject', r.status === 409, `status ${r.status}`)

r = await call(alice.token, 'POST', '/v1/moderation/reports', {
  subjectType: 'user', subjectId: alice.id, reason: 'spam',
})
check('refuses reporting yourself', r.status === 400, `status ${r.status}`)

r = await call(alice.token, 'POST', '/v1/moderation/reports', {
  subjectType: 'user', subjectId: bob.id, reason: 'other',
})
check('refuses reason=other with no details', r.status === 400, `status ${r.status}`)

r = await call(alice.token, 'POST', '/v1/moderation/reports', {
  subjectType: 'user', subjectId: bob.id, reason: 'other', details: 'kept messaging after I asked them to stop',
})
check('accepts reason=other WITH details', r.status === 201, `status ${r.status}`)
check('attributes the report to the reported user',
  r.body?.reported_user_id === bob.id, `got ${String(r.body?.reported_user_id).slice(0, 8)}`)

r = await call(alice.token, 'GET', '/v1/moderation/reports')
check('lists own reports', r.status === 200 && Array.isArray(r.body?.data), `${r.body?.total} total`)

const asBob = await call(bob.token, 'GET', '/v1/moderation/reports')
const bobSeesAlices = (asBob.body?.data || []).some((x) => x.id === reportId)
check('another user cannot see your reports', !bobSeesAlices)

console.log('\nblocks')
r = await call(alice.token, 'POST', '/v1/moderation/blocks', { userId: bob.id })
check('blocks a user', r.status === 201, `status ${r.status}`)

r = await call(alice.token, 'POST', '/v1/moderation/blocks', { userId: bob.id })
check('blocking twice is idempotent, not an error', r.status === 200, `status ${r.status}`)

r = await call(alice.token, 'POST', '/v1/moderation/blocks', { userId: alice.id })
check('refuses blocking yourself', r.status === 400, `status ${r.status}`)

r = await call(alice.token, 'GET', '/v1/moderation/blocks')
check('lists blocks', r.status === 200 && r.body?.total >= 1, `${r.body?.total} total`)

const bobBlocks = await call(bob.token, 'GET', '/v1/moderation/blocks')
check('block list is per-user', (bobBlocks.body?.total ?? 0) === 0, `bob sees ${bobBlocks.body?.total}`)

r = await call(alice.token, 'DELETE', `/v1/moderation/blocks/${bob.id}`)
check('unblocks', r.status === 204, `status ${r.status}`)

r = await call(alice.token, 'GET', '/v1/moderation/blocks')
check('block is gone after unblock', (r.body?.total ?? 0) === 0, `${r.body?.total} total`)

console.log('\nenforcement — the half that matters')

// A block that is only recorded is worse than none: the user believes they are
// unreachable and they are not. This asserts the RPC that drives the feed and
// thread filtering, including the direction RLS deliberately hides.
const rpc = async (token, fn, args) => {
  const res = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      apikey: ANON,
      'content-type': 'application/json',
      'accept-profile': 'core',
      'content-profile': 'core',
    },
    body: JSON.stringify(args),
  })
  return { status: res.status, body: await res.json().catch(() => null) }
}
const ids = (body) => (body || []).map((x) => (typeof x === 'string' ? x : Object.values(x)[0]))

await call(alice.token, 'POST', '/v1/moderation/blocks', { userId: bob.id })

let e = await rpc(alice.token, 'blocked_user_ids', { for_user: alice.id })
check('blocker gets the blocked user in their filter list',
  ids(e.body).includes(bob.id), `status ${e.status}`)

// The asymmetry that forces a SECURITY DEFINER function: bob cannot SELECT the
// block row, but the filter must still hide alice from him.
e = await rpc(bob.token, 'blocked_user_ids', { for_user: bob.id })
check('BLOCKED user is filtered too — symmetric',
  ids(e.body).includes(alice.id), `status ${e.status}`)

const bobRows = await call(bob.token, 'GET', '/v1/moderation/blocks')
check('...while still unable to see the block row itself',
  (bobRows.body?.total ?? 0) === 0, `bob sees ${bobRows.body?.total}`)

await call(alice.token, 'DELETE', `/v1/moderation/blocks/${bob.id}`)
e = await rpc(bob.token, 'blocked_user_ids', { for_user: bob.id })
check('unblocking restores delivery both ways', !ids(e.body).includes(alice.id))

console.log('\nauth')
const noAuth = await fetch(`${API}/v1/moderation/reports`, { headers: { apikey: ANON } })
check('rejects unauthenticated', noAuth.status === 401 || noAuth.status === 403, `status ${noAuth.status}`)

const failed = results.filter((x) => !x.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
process.exit(failed.length ? 1 : 0)
