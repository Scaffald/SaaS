/**
 * A worker cannot verify their own certification (#1276).
 *
 * `POST /v1/profiles/certifications/save` copied `verification_status` from
 * the request body, and a signed-in user owns their rows under RLS, so a
 * worker could save "verified" — reproduced on the local stack before the
 * fix. Verified certifications are what employers are shown as trust.
 *
 * Two guards, both tested here with a fresh plain worker (userA):
 *   - the api route never writes the field from the request;
 *   - migration 381's trigger refuses it on any path that is not the service
 *     role, including PostgREST directly, and drops a verified row back to
 *     unverified when its owner changes what the certification is.
 */

import { assert, assertEquals, assertExists } from '../shared/assert.ts'
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient } from '../shared/setup.ts'
import { requireAuthSetup } from '../shared/test-context.ts'
import { disposePersonas, getPersonas } from '../shared/personas.ts'

const API = `${TEST_SUPABASE_URL}/functions/v1/api/v1`
const REST = `${TEST_SUPABASE_URL}/rest/v1`

type Cert = { id: string; name: string; verification_status: string }

const restHeaders = (token: string) => ({
  apikey: TEST_SUPABASE_ANON_KEY,
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Content-Profile': 'core',
  'Accept-Profile': 'core',
  Prefer: 'return=representation',
})

async function saveViaApi(token: string, cert: Record<string, unknown>): Promise<Response> {
  return await fetch(`${API}/profiles/certifications/save`, {
    method: 'POST',
    headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ certifications: [cert] }),
  })
}

async function statusOf(id: string): Promise<string | null> {
  const { data } = await createAdminClient()
    .schema('core')
    .from('user_certifications')
    .select('verification_status')
    .eq('id', id)
    .single()
  return (data as { verification_status: string } | null)?.verification_status ?? null
}

Deno.test({
  name: 'Certification verification guard (#1276)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    await requireAuthSetup()
    const personas = await getPersonas()
    const worker = personas.userA
    const admin = createAdminClient()
    try {
      await t.step('the api save route ignores verification_status on insert', async () => {
        const response = await saveViaApi(worker.token, {
          name: 'Guard probe — api insert',
          issuing_organization: 'Probe Board',
          is_active: true,
          verification_status: 'verified',
        })
        assertEquals(response.status, 200, await response.clone().text())
        const body = (await response.json()) as { certifications: Cert[] }
        const saved = body.certifications[0]
        assertExists(saved)
        assertEquals(await statusOf(saved.id), 'unverified')
      })

      await t.step('PostgREST refuses an insert that claims verified', async () => {
        const response = await fetch(`${REST}/user_certifications`, {
          method: 'POST',
          headers: restHeaders(worker.token),
          body: JSON.stringify({
            user_id: worker.id,
            name: 'Guard probe — rest insert',
            issuing_organization: 'Probe Board',
            verification_status: 'verified',
          }),
        })
        assert(!response.ok, `expected a refusal, got ${response.status}`)
        const { count } = await admin
          .schema('core')
          .from('user_certifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', worker.id)
          .eq('verification_status', 'verified')
        assertEquals(count, 0)
      })

      await t.step('an owner cannot raise the status of an existing row, by PostgREST or the api', async () => {
        const { data: row } = await admin
          .schema('core')
          .from('user_certifications')
          .insert({ user_id: worker.id, name: 'Guard probe — update', issuing_organization: 'Probe Board' })
          .select('id')
          .single()
        const id = (row as { id: string }).id

        const patch = await fetch(`${REST}/user_certifications?id=eq.${id}`, {
          method: 'PATCH',
          headers: restHeaders(worker.token),
          body: JSON.stringify({ verification_status: 'verified' }),
        })
        assert(!patch.ok, `expected a refusal, got ${patch.status}`)
        assertEquals(await statusOf(id), 'unverified')

        const viaApi = await saveViaApi(worker.token, {
          id,
          name: 'Guard probe — update',
          issuing_organization: 'Probe Board',
          is_active: true,
          verification_status: 'verified',
        })
        assertEquals(viaApi.status, 200, await viaApi.clone().text())
        assertEquals(await statusOf(id), 'unverified')
      })

      await t.step('renaming a verified certification drops it back to unverified', async () => {
        // Verification is the service role's to give.
        const { data: row, error } = await admin
          .schema('core')
          .from('user_certifications')
          .insert({
            user_id: worker.id,
            name: 'Guard probe — verified',
            issuing_organization: 'Probe Board',
            verification_status: 'verified',
          })
          .select('id')
          .single()
        assert(!error, `the service role may set verified: ${error?.message}`)
        const id = (row as { id: string }).id
        assertEquals(await statusOf(id), 'verified')

        const renamed = await saveViaApi(worker.token, {
          id,
          name: 'Something else entirely',
          issuing_organization: 'Probe Board',
          is_active: true,
        })
        assertEquals(renamed.status, 200, await renamed.clone().text())
        assertEquals(await statusOf(id), 'unverified')
      })
    } finally {
      await admin.schema('core').from('user_certifications').delete().eq('user_id', worker.id)
      await disposePersonas()
    }
  },
})
