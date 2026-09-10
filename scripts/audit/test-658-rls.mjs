/**
 * RLS on migration 354's tables, asserted through PostgREST with real sessions
 * rather than by emulating JWT claims in psql (which is not how auth.uid()
 * reads them, and which reports "SET" instead of an answer).
 *
 * Two users: zach owns the rows, boris is anyone else.
 *
 *   soft_skills_ratings  — profile data; visible to others by default, like
 *                          user_skills and skill_snapshots
 *   profile_import_data  — transient staging; never visible to anyone else
 */
import { createClient } from '@supabase/supabase-js'

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const svc = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const signIn = async (email) => {
  const c = createClient(URL, ANON)
  const { data, error } = await c.auth.signInWithPassword({ email, password: 'password123' })
  if (error) throw new Error(`${email}: ${error.message}`)
  return { id: data.user.id, client: c }
}
const zach = await signIn('zach@unicorn.love')
const boris = await signIn('boris@unicorn.love')

const results = []
const check = (name, pass, detail = '') => {
  results.push(pass)
  console.log(`  ${pass ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`)
}

// Seed zach's rows via service role so the assertions are about RLS, not routes.
await svc.schema('core').from('soft_skills_ratings').delete().eq('user_id', zach.id)
await svc.schema('core').from('profile_import_data').delete().eq('user_id', zach.id)
const { data: skill } = await svc.schema('core').from('soft_skills').select('id').eq('is_active', true).limit(1).single()
await svc.schema('core').from('soft_skills_ratings').insert({ user_id: zach.id, skill_id: skill.id, rating: 4, version: 1 })
await svc.schema('core').from('profile_import_data').insert({ user_id: zach.id, source: 'manual', payload: {} })

const count = async (who, table) => {
  const { count, error } = await who.client.schema('core').from(table).select('*', { count: 'exact', head: true }).eq('user_id', zach.id)
  return error ? `error: ${error.message}` : count
}

console.log('soft_skills_ratings')
check('owner sees own rating', (await count(zach, 'soft_skills_ratings')) === 1)
check('another user sees it too (profile skills default visible)', (await count(boris, 'soft_skills_ratings')) === 1, `boris sees ${await count(boris, 'soft_skills_ratings')}`)
const { error: upd } = await boris.client.schema('core').from('soft_skills_ratings').update({ rating: 1 }).eq('user_id', zach.id)
const { data: after } = await svc.schema('core').from('soft_skills_ratings').select('rating').eq('user_id', zach.id).single()
check('another user cannot alter it', after.rating === 4, upd ? `denied: ${upd.message.slice(0, 40)}` : 'silently no-op (0 rows matched)')

console.log('\nprofile_import_data')
check('owner sees own staged import', (await count(zach, 'profile_import_data')) === 1)
check('another user sees NOTHING', (await count(boris, 'profile_import_data')) === 0, `boris sees ${await count(boris, 'profile_import_data')}`)

await svc.schema('core').from('soft_skills_ratings').delete().eq('user_id', zach.id)
await svc.schema('core').from('profile_import_data').delete().eq('user_id', zach.id)
const failed = results.filter((x) => !x).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
