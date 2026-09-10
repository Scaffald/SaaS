/**
 * #658 end to end against the local stack: the seven soft-skill and
 * profile-import endpoints that used to 500 on tables that never existed, and
 * the one nudge endpoint that was retired instead.
 *
 *   pnpm supa start && pnpm supa functions serve api
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/audit/test-658.mjs
 */
import { createClient } from '@supabase/supabase-js'

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const API = `${URL}/functions/v1/api`

const sb = createClient(URL, ANON)
const { data, error } = await sb.auth.signInWithPassword({
  email: 'zach@unicorn.love', password: 'password123',
})
if (error) throw error
const token = data.session.access_token
const svc = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const call = async (method, path, body) => {
  const res = await fetch(API + path, {
    method,
    headers: { authorization: `Bearer ${token}`, apikey: ANON, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const t = await res.text()
  let b; try { b = t ? JSON.parse(t) : null } catch { b = t }
  return { status: res.status, body: b }
}

const results = []
const check = (name, pass, detail = '') => {
  results.push(pass)
  console.log(`  ${pass ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`)
}

// Clean slate for this user, so reruns are deterministic.
await svc.schema('core').from('soft_skills_ratings').delete().eq('user_id', data.user.id)
await svc.schema('core').from('profile_import_data').delete().eq('user_id', data.user.id)

const { data: catalog } = await svc.schema('core').from('soft_skills').select('id').eq('is_active', true).limit(2)
if (!catalog || catalog.length < 2) { console.log('need 2 active soft skills seeded'); process.exit(2) }
const [s1, s2] = catalog.map((r) => r.id)

console.log('soft skills')
let r = await call('GET', '/v1/profiles/skills/soft')
check('GET /soft before any rating is 200, not 500', r.status === 200, `status ${r.status}`)

r = await call('PATCH', '/v1/profiles/skills/soft', { skills: [{ skill_id: s1, rating: 4 }, { skill_id: s2, rating: 2 }] })
check('PATCH /soft writes version 1', r.status === 200 && r.body?.version === 1, `status ${r.status} version ${r.body?.version}`)

r = await call('PATCH', '/v1/profiles/skills/soft', { skills: [{ skill_id: s1, rating: 5 }] })
check('a second PATCH is a NEW version, not an overwrite', r.body?.version === 2, `version ${r.body?.version}`)

r = await call('GET', '/v1/profiles/skills/soft/history')
const versions = (r.body?.history || r.body?.versions || []).map((v) => v.version)
check('GET /soft/history returns both versions', r.status === 200 && versions.includes(1) && versions.includes(2), `status ${r.status} versions ${JSON.stringify(versions)}`)

r = await call('GET', '/v1/profiles/skills/soft/comparison')
check('GET /soft/comparison is 200', r.status === 200, `status ${r.status}`)

r = await call('PATCH', '/v1/profiles/skills/soft', { skills: [{ skill_id: s1, rating: 9 }] })
check('rating outside 1..5 is rejected', r.status === 400, `status ${r.status}`)

console.log('\nprofile import')
r = await call('GET', '/v1/profiles/import/data')
check('GET /import/data with nothing staged is 200 null', r.status === 200 && r.body === null, `status ${r.status} body ${JSON.stringify(r.body)}`)

const payload = { general: [], experience: [], education: [], skills: [], certifications: [] }
r = await call('POST', '/v1/profiles/import/data', { source: 'resume', payload })
check('POST /import/data stages an import', r.status === 200 || r.status === 201, `status ${r.status}`)

r = await call('GET', '/v1/profiles/import/data')
check('GET /import/data returns it with an expiry', r.status === 200 && r.body?.source === 'resume' && !!r.body?.expiresAt, `source ${r.body?.source}`)

r = await call('POST', '/v1/profiles/import/data', { source: 'linkedin', payload })
check('a second POST replaces rather than duplicates', r.status === 200 || r.status === 201, `status ${r.status}`)
const { count } = await svc.schema('core').from('profile_import_data').select('*', { count: 'exact', head: true }).eq('user_id', data.user.id)
check('...and exactly one row exists for the user', count === 1, `${count} rows`)

r = await call('DELETE', '/v1/profiles/import/data')
check('DELETE /import/data clears it', r.status === 200 || r.status === 204, `status ${r.status}`)

console.log('\nretired')
r = await call('POST', '/v1/profiles/completion/nudges/dismiss', { nudgeId: 'x' })
check('POST /nudges/dismiss is gone (404)', r.status === 404, `status ${r.status}`)

r = await call('GET', '/v1/profiles/completion/status')
check('...and /completion/status still works', r.status === 200, `status ${r.status}`)

await svc.schema('core').from('soft_skills_ratings').delete().eq('user_id', data.user.id)
const failed = results.filter((x) => !x).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
