/**
 * Personas for access tests (#1147): who is asking, as a real JWT.
 *
 * The seeds give nearly every named account the platform `office` role (and
 * the Unicorn team `super_admin`), so none of them can stand in for an
 * ordinary user. `userA` / `userB` are therefore created fresh through the
 * Auth admin API — the real signup path, including the `handle_new_user`
 * trigger that assigns `worker/platform` — and deleted by `disposePersonas()`.
 *
 *   anon         the anon key, no session
 *   userA/userB  fresh plain workers, no organization
 *   orgAdmin     reviewer-employer@scaffald.com — admin of one organization,
 *                no platform office/super_admin role (seeds/010)
 *   office       zach@unicorn.love — platform office (seeds/002)
 *   service      the service-role key
 */

import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_SERVICE_KEY, createAdminClient, getAuthToken } from './setup.ts'

export type PersonaName = 'anon' | 'userA' | 'userB' | 'orgAdmin' | 'office' | 'service'

export interface Persona {
  name: PersonaName
  token: string
  /** auth.uid() for this persona; empty for anon and service. */
  id: string
}

export type Personas = Record<PersonaName, Persona>

const created: string[] = []

async function freshUser(label: string): Promise<Persona & { email: string }> {
  const email = `persona-${label}-${crypto.randomUUID().slice(0, 8)}@example.com`
  const password = `p-${crypto.randomUUID()}`
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true })
  if (error || !data.user) throw new Error(`create persona ${label}: ${error?.message}`)
  created.push(data.user.id)
  const token = await getAuthToken(email, password)
  if (!token) throw new Error(`sign in persona ${label}`)
  return { name: label as PersonaName, token, id: data.user.id, email }
}

async function seeded(name: PersonaName, email: string, password: string): Promise<Persona> {
  const token = await getAuthToken(email, password)
  if (!token) throw new Error(`${email} should sign in (seeded)`)
  return { name, token, id: JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).sub }
}

export async function getPersonas(): Promise<Personas> {
  const [userA, userB, orgAdmin, office] = await Promise.all([
    freshUser('userA'),
    freshUser('userB'),
    seeded('orgAdmin', 'reviewer-employer@scaffald.com', 'Scaffald2026!'),
    seeded('office', 'zach@unicorn.love', 'password123'),
  ])
  return {
    anon: { name: 'anon', token: TEST_SUPABASE_ANON_KEY, id: '' },
    userA: { ...userA, name: 'userA' },
    userB: { ...userB, name: 'userB' },
    orgAdmin,
    office,
    service: { name: 'service', token: TEST_SUPABASE_SERVICE_KEY, id: '' },
  }
}

export async function disposePersonas(): Promise<void> {
  const admin = createAdminClient()
  while (created.length) {
    const id = created.pop()!
    await admin.auth.admin.deleteUser(id)
  }
}
