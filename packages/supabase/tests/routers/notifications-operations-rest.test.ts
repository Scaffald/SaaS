/**
 * Operational notifications stay out of the personal inbox (#1178).
 *
 * `core.notify_admins_of_cron_failure` writes `system.cron_failure` into each
 * super-admin's own feed, one row per failed run. The `api` list and unread
 * count now leave those rows out by default, and `scope=operations` returns
 * only them for Office's System alerts panel. Rows are inserted with the
 * service role and read back over HTTP as the user they belong to.
 */

import { assertEquals, assertExists } from '../shared/assert.ts'
import { getUserIdByEmail } from '../shared/test-context.ts'
import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
  createAdminClient,
  getAuthToken,
  loadCachedTokens,
} from '../shared/setup.ts'

// Override to point at the api function run directly (`…:8000/v1`) instead of
// the shared edge runtime, as id-verification-rest does.
const REST_BASE =
  Deno.env.get('NOTIFICATIONS_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`

async function get(path: string, authToken: string) {
  const response = await fetch(`${REST_BASE}${path}`, {
    headers: {
      apikey: TEST_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${authToken}`,
    },
  })
  const body = await response.json().catch(() => null)
  return { status: response.status, body }
}

async function auth() {
  const admin = createAdminClient()
  const cached = await loadCachedTokens()
  const token =
    cached?.regular?.token ??
    (await getAuthToken(TEST_USERS.regular.email, TEST_USERS.regular.password))
  assertExists(token, 'Authentication token required')
  const userId = cached?.regular?.userId ?? (await getUserIdByEmail(admin, TEST_USERS.regular.email))
  assertExists(userId, 'Unable to resolve test user id')
  return { admin, token, userId }
}

Deno.test({
  name: 'Notifications REST - cron failures are left out of the inbox and unread count, and listed under scope=operations (#1178)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const { admin, token, userId } = await auth()
    const job = `probe-${crypto.randomUUID().slice(0, 8)}`
    const cronIds = [crypto.randomUUID(), crypto.randomUUID()]
    const personalId = crypto.randomUUID()

    const unreadBefore = await get('/notifications/unread-count', token)
    assertEquals(unreadBefore.status, 200)

    const { error } = await admin
      .schema('core')
      .from('notifications')
      .insert([
        ...cronIds.map((id) => ({
          id,
          user_id: userId,
          type: 'system.cron_failure',
          severity: 'critical',
          title: `Cron Job Failed: ${job}`,
          message: 'Service role key not configured.',
          metadata: { job_name: job, error: 'Service role key not configured.' },
        })),
        {
          id: personalId,
          user_id: userId,
          type: 'job.match',
          // A bulk insert sends the union of keys, so an omitted column is
          // NULL rather than its default.
          severity: 'info',
          metadata: {},
          title: 'A job matches your profile',
          message: 'Probe',
        },
      ])
    assertEquals(error, null, `insert failed: ${error?.message}`)

    try {
      const inbox = await get('/notifications?limit=100', token)
      assertEquals(inbox.status, 200, JSON.stringify(inbox.body))
      const inboxIds = (inbox.body.data as { id: string }[]).map((n) => n.id)
      assertEquals(inboxIds.includes(personalId), true, 'personal row is in the inbox')
      assertEquals(
        cronIds.some((id) => inboxIds.includes(id)),
        false,
        'cron failures are not in the inbox'
      )

      const ops = await get('/notifications?scope=operations&limit=100', token)
      assertEquals(ops.status, 200, JSON.stringify(ops.body))
      const opsRows = ops.body.data as { id: string; type: string }[]
      assertEquals(
        cronIds.every((id) => opsRows.some((n) => n.id === id)),
        true,
        'cron failures are listed under scope=operations'
      )
      assertEquals(
        opsRows.every((n) => n.type === 'system.cron_failure'),
        true,
        'scope=operations returns only operational types'
      )

      // Only the personal row moves the badge.
      const unreadAfter = await get('/notifications/unread-count', token)
      assertEquals(unreadAfter.status, 200)
      assertEquals(
        unreadAfter.body.data.unread_count,
        unreadBefore.body.data.unread_count + 1,
        'unread count ignores cron failures'
      )
    } finally {
      await admin
        .schema('core')
        .from('notifications')
        .delete()
        .in('id', [...cronIds, personalId])
    }
  },
})
