/**
 * Office user delete REST API — DELETE /v1/office/users/:id.
 *
 * Its blocker check, reference release and delete moved to
 * _shared/user-deletion.ts in #1313 so the account-deletion processor shares
 * them. This pins the route's behaviour over HTTP: content the user created
 * that others depend on answers 409 and names it, with nothing deleted; once
 * that is gone, the delete succeeds and the user is gone.
 *
 * OFFICE_USERS_TEST_API_BASE points the suite at the api function run
 * directly (`.../v1`).
 */

import { assert, assertEquals } from 'std/assert'
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL, createAdminClient } from '../shared/setup.ts'
import { disposePersonas, getPersonas } from '../shared/personas.ts'

const API = Deno.env.get('OFFICE_USERS_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`
const RUN = crypto.randomUUID().slice(0, 8)

Deno.test({
  name: 'Office users REST - delete answers 409 for a blocker, then deletes once it is gone',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()
    // deno-lint-ignore no-explicit-any
    const core = () => (admin as any).schema('core')
    const { office } = await getPersonas()

    const email = `office-delete-${RUN}@example.com`
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: `p-${crypto.randomUUID()}`,
      email_confirm: true,
    })
    if (createError || !created.user) throw new Error(createError?.message)
    const uid = created.user.id

    const { data: org } = await core()
      .from('organizations')
      .insert({ name: `office-delete-${RUN}`, slug: `office-delete-${RUN}` })
      .select('id')
      .single()
    const { data: task } = await core()
      .from('tasks')
      .insert({ organization_id: org.id, title: 'blocker', created_by_user_id: uid })
      .select('id')
      .single()

    const del = () =>
      fetch(`${API}/office/users/${uid}`, {
        method: 'DELETE',
        headers: { apikey: TEST_SUPABASE_ANON_KEY, Authorization: `Bearer ${office.token}` },
      })

    try {
      const blocked = await del()
      const blockedBody = await blocked.json()
      assertEquals(blocked.status, 409, JSON.stringify(blockedBody))
      assertEquals(blockedBody.blockedBy, [{ table: 'tasks', count: 1 }])
      const { data: still } = await admin.auth.admin.getUserById(uid)
      assert(still.user, 'nothing deleted while blocked')

      await core().from('tasks').delete().eq('id', task.id)

      const ok = await del()
      const okBody = await ok.json()
      assertEquals(ok.status, 200, JSON.stringify(okBody))
      assertEquals(okBody.success, true)
      const { error: goneError } = await admin.auth.admin.getUserById(uid)
      assert(goneError, 'the user is gone')

      // Deleting it again is the error an operator always got.
      const again = await del()
      await again.body?.cancel()
      assertEquals(again.status, 500)
    } finally {
      await core().from('organizations').delete().eq('id', org.id)
      await admin.auth.admin.deleteUser(uid).catch(() => {})
      await disposePersonas()
    }
  },
})
