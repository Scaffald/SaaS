/**
 * POST /v1/personality-assessment/luscher/session — the weekly pulse pays out
 * nothing (#1246).
 *
 * Saving a pulse used to add +5 to core.users.frequency_xp every run, and the
 * results rail announced it. The pulse is a reflective colour exercise that is
 * "never scored or ranked", so the award went. This checks the session still
 * saves and that frequency_xp does not move.
 *
 * API_BASE defaults to the local edge runtime; set LUSCHER_TEST_API_BASE to run
 * against a worktree's api on :8000 (http://127.0.0.1:8000/v1).
 */

import { assertEquals, assertExists } from '../shared/assert.ts'
import {
  TEST_SUPABASE_ANON_KEY,
  TEST_SUPABASE_URL,
  TEST_USERS,
  createAdminClient,
  getAuthToken,
} from '../shared/setup.ts'
import { getUserIdByEmail } from '../shared/test-context.ts'

const API = Deno.env.get('LUSCHER_TEST_API_BASE') ?? `${TEST_SUPABASE_URL}/functions/v1/api/v1`

// deno-lint-ignore no-explicit-any
const core = () => (createAdminClient() as any).schema('core')

Deno.test({
  name: 'Luscher session REST - saving a weekly pulse awards no XP (#1246)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const token = await getAuthToken(TEST_USERS.regular.email, TEST_USERS.regular.password)
    assertExists(token, 'test@example.com should sign in')
    const userId = await getUserIdByEmail(createAdminClient(), TEST_USERS.regular.email)
    assertExists(userId, 'Unable to resolve test user id')

    const { data: userBefore } = await core().from('users').select('frequency_xp').eq('id', userId).single()
    const { data: assessmentBefore } = await core()
      .from('personality_assessments')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    const startedAt = new Date().toISOString()

    try {
      const res = await fetch(`${API}/personality-assessment/luscher/session`, {
        method: 'POST',
        headers: {
          apikey: TEST_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          luscher1Choices: [0, 1, 2, 3, 4, 5, 6, 7],
          luscher2Choices: [7, 6, 5, 4, 3, 2, 1, 0],
        }),
      })
      const body = await res.json().catch(() => null)
      assertEquals(res.status, 200, `session should save, got ${res.status} ${JSON.stringify(body)}`)
      assertEquals(body?.success, true)

      const { data: userAfter } = await core().from('users').select('frequency_xp').eq('id', userId).single()
      assertEquals(userAfter?.frequency_xp, userBefore?.frequency_xp, 'frequency_xp must not change')
    } finally {
      // Put the user back as found: the assessment row, the XP column, and the
      // session record this run wrote.
      await core().from('users').update({ frequency_xp: userBefore?.frequency_xp ?? 0 }).eq('id', userId)
      await core()
        .from('assessment_sessions')
        .delete()
        .eq('user_id', userId)
        .gte('completed_at', startedAt)
      if (assessmentBefore) {
        await core().from('personality_assessments').update(assessmentBefore).eq('user_id', userId)
      } else {
        await core().from('personality_assessments').delete().eq('user_id', userId)
      }
    }
  },
})
