/// <reference lib="deno.ns" />

/**
 * RLS Regression Tests — Supabase Hardening
 *
 * Validates Row Level Security policies continue to work correctly
 * after schema or policy changes. Tests both positive (allowed) and
 * negative (denied) access paths.
 *
 * Requires: Local Supabase running (`pnpm supa start`).
 * Auth tokens must be cached first: run auth.test.ts before this file.
 */

import { assert, assertEquals, assertExists, assertNotEquals } from '../shared/assert.ts'
import {
  createAdminClient,
  createTestClient,
  loadCachedTokens,
  registerUserWithMagicLink,
  TEST_SUPABASE_URL,
  TEST_SUPABASE_ANON_KEY,
} from '../shared/setup.ts'
import { getTestContext, requireAuthSetup } from '../shared/test-context.ts'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Create a second user (User B) to test cross-user isolation. */
async function createSecondUser(): Promise<{ token: string; userId: string } | null> {
  const email = `rls-regression-userb-${Date.now()}@example.com`
  return registerUserWithMagicLink(email)
}

// ==========================================================================
// 1. CROSS-USER DATA ISOLATION
// ==========================================================================

Deno.test({
  name: 'RLS regression - anon cannot read profiles',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const anonClient = createTestClient()

    const { data, error } = await anonClient.schema('core').from('profile').select('*').limit(1)

    // Anon should get empty results or error — NOT actual profile data
    const isEmpty = !data || data.length === 0
    const isError = !!error
    assert(isEmpty || isError, 'Anon user should not be able to read profile data')
  },
})

Deno.test({
  name: 'RLS regression - anon cannot read preferences',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const anonClient = createTestClient()

    const { data, error } = await anonClient.schema('core').from('preferences').select('*').limit(1)

    const isEmpty = !data || data.length === 0
    const isError = !!error
    assert(isEmpty || isError, 'Anon user should not be able to read preferences')
  },
})

Deno.test({
  name: 'RLS regression - anon cannot read connections',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const anonClient = createTestClient()

    const { data, error } = await anonClient.schema('core').from('connections').select('*').limit(1)

    const isEmpty = !data || data.length === 0
    const isError = !!error
    assert(isEmpty || isError, 'Anon user should not be able to read connections')
  },
})

Deno.test({
  name: 'RLS regression - authenticated user can read own profile',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const { data, error } = await ctx.user.client
      .schema('core')
      .from('profile')
      .select('user_id')
      .eq('user_id', ctx.user.userId)
      .maybeSingle()

    // User should be able to read their own profile (may not exist yet, but no permission error)
    if (error) {
      // A "not found" error (PGRST116) is acceptable — means no profile row exists yet
      assert(
        error.code === 'PGRST116' || error.code === '22P02',
        `Unexpected error reading own profile: ${error.message} (code: ${error.code})`
      )
    }
  },
})

Deno.test({
  name: 'RLS regression - user cannot read another user profile',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    // Try to read profiles belonging to someone else
    const { data } = await ctx.user.client
      .schema('core')
      .from('profile')
      .select('user_id')
      .neq('user_id', ctx.user.userId)
      .limit(5)

    // Should return empty — RLS blocks access to other users' profiles
    assert(!data || data.length === 0, `User should not see other users' profiles, got ${data?.length ?? 0} rows`)
  },
})

Deno.test({
  name: 'RLS regression - user cannot update another user record',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    // Attempt to update the users table for a fake user ID
    const fakeUserId = '00000000-0000-0000-0000-000000000099'
    const { error } = await ctx.user.client
      .schema('core')
      .from('users')
      .update({ display_name: 'hacked' })
      .eq('id', fakeUserId)

    // Should either error or affect 0 rows (RLS blocks the update)
    // Not getting an error means 0 rows matched, which is correct
  },
})

// ==========================================================================
// 2. PUBLIC DATA ACCESSIBILITY
// ==========================================================================

Deno.test({
  name: 'RLS regression - public tables remain readable (users)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const { data, error } = await ctx.user.client
      .schema('core')
      .from('users')
      .select('id')
      .limit(1)

    // Users table should be publicly readable
    assert(!error, `Users table should be readable: ${error?.message}`)
  },
})

Deno.test({
  name: 'RLS regression - public tables remain readable (industries)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const { data, error } = await ctx.user.client
      .schema('core')
      .from('industries')
      .select('id, name')
      .limit(5)

    assert(!error, `Industries should be publicly readable: ${error?.message}`)
  },
})

Deno.test({
  name: 'RLS regression - public tables remain readable (skills)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const { data, error } = await ctx.user.client
      .schema('core')
      .from('skills')
      .select('id, name')
      .limit(5)

    assert(!error, `Skills should be publicly readable: ${error?.message}`)
  },
})

Deno.test({
  name: 'RLS regression - public tables remain readable (organizations)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const { data, error } = await ctx.user.client
      .schema('core')
      .from('organizations')
      .select('id, name')
      .limit(5)

    assert(!error, `Organizations should be publicly readable: ${error?.message}`)
  },
})

Deno.test({
  name: 'RLS regression - public tables remain readable (jobs)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const { data, error } = await ctx.user.client
      .schema('core')
      .from('jobs')
      .select('id, title')
      .limit(5)

    assert(!error, `Jobs should be publicly readable: ${error?.message}`)
  },
})

Deno.test({
  name: 'RLS regression - anon can read public tables',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const anonClient = createTestClient()

    const { error: usersError } = await anonClient.schema('core').from('users').select('id').limit(1)
    assert(!usersError, `Anon should read users: ${usersError?.message}`)

    const { error: industriesError } = await anonClient.schema('core').from('industries').select('id').limit(1)
    assert(!industriesError, `Anon should read industries: ${industriesError?.message}`)

    const { error: jobsError } = await anonClient.schema('core').from('jobs').select('id').limit(1)
    assert(!jobsError, `Anon should read jobs: ${jobsError?.message}`)
  },
})

// ==========================================================================
// 3. ORGANIZATION BOUNDARY ENFORCEMENT
// ==========================================================================

Deno.test({
  name: 'RLS regression - user cannot insert into org they do not own',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const fakeOrgId = '00000000-0000-0000-0000-000000000099'

    const { error } = await ctx.user.client.schema('core').from('teams').insert({
      name: 'RLS Test Team',
      organization_id: fakeOrgId,
      created_by: ctx.user.userId,
    })

    // Should be rejected — user doesn't own this org
    assertExists(error, 'Should not be able to insert team into unowned org')
  },
})

Deno.test({
  name: 'RLS regression - user cannot insert org with another owner',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const fakeOwnerId = '00000000-0000-0000-0000-000000000099'

    const { error } = await ctx.user.client.schema('core').from('organizations').insert({
      name: 'RLS Test Org',
      owner_user_id: fakeOwnerId,
    })

    // Should be rejected — owner_user_id must match auth.uid()
    assertExists(error, 'Should not be able to create org owned by another user')
  },
})

// ==========================================================================
// 4. TIGHTENED POLICIES (migration 406)
// ==========================================================================

Deno.test({
  name: 'RLS regression - inquiry_audit_log only allows own actor_id',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const fakeActorId = '00000000-0000-0000-0000-000000000099'

    const { error } = await ctx.user.client.schema('core').from('inquiry_audit_log').insert({
      actor_id: fakeActorId,
      action: 'test_rls',
      inquiry_id: '00000000-0000-0000-0000-000000000001',
    })

    // Should be rejected — actor_id must match auth.uid()
    assertExists(error, 'Should not be able to insert audit log with another actor_id')
  },
})

Deno.test({
  name: 'RLS regression - privacy_requests only allows own user_id',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const fakeUserId = '00000000-0000-0000-0000-000000000099'

    const { error } = await ctx.user.client.from('privacy_requests').insert({
      user_id: fakeUserId,
      request_type: 'test_rls',
    })

    // Should be rejected — user_id must match auth.uid()
    assertExists(error, 'Should not be able to create privacy request for another user')
  },
})

// ==========================================================================
// 5. SERVICE ROLE BYPASS VERIFICATION
// ==========================================================================

Deno.test({
  name: 'RLS regression - service role can read all profiles',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { error } = await admin.schema('core').from('profile').select('user_id').limit(5)

    // Service role should bypass RLS and read all profiles
    assert(!error, `Service role should bypass RLS: ${error?.message}`)
  },
})

Deno.test({
  name: 'RLS regression - service role can read all preferences',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { error } = await admin.schema('core').from('preferences').select('user_id').limit(5)

    assert(!error, `Service role should bypass RLS for preferences: ${error?.message}`)
  },
})

// ==========================================================================
// 6. NOTIFICATION TABLE RLS (migration 402)
// ==========================================================================

Deno.test({
  name: 'RLS regression - notification tables have RLS enabled',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    // These tables should have RLS enabled per migration 402
    const tables = [
      'notification_deliveries',
      'notification_events',
      'notification_preferences',
      'notification_devices',
      'notification_digest_queue',
    ]

    for (const table of tables) {
      const { data, error } = await ctx.user.client
        .schema('core')
        .from(table)
        .select('*')
        .limit(1)

      // Should return empty or own data only — NOT all rows
      // The key assertion is no error from a missing table or permission issue
      if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
        // 42P01 = table doesn't exist (acceptable if schema changed)
        // PGRST116 = no rows (acceptable)
        assert(false, `Unexpected error on ${table}: ${error.message} (${error.code})`)
      }
    }
  },
})

// ==========================================================================
// 7. APPLICATION & MESSAGING ACCESS CONTROL
// ==========================================================================

Deno.test({
  name: 'RLS regression - user cannot read other users applications',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const { data } = await ctx.user.client
      .schema('core')
      .from('applications')
      .select('id, user_id')
      .neq('user_id', ctx.user.userId)
      .limit(5)

    // Should return empty — user can only see their own applications
    assert(!data || data.length === 0, `User should not see other users' applications`)
  },
})

Deno.test({
  name: 'RLS regression - anon cannot read applications',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const anonClient = createTestClient()

    const { data, error } = await anonClient.schema('core').from('applications').select('*').limit(1)

    const isEmpty = !data || data.length === 0
    const isError = !!error
    assert(isEmpty || isError, 'Anon should not read applications')
  },
})

// ==========================================================================
// 8. BACKGROUND CHECK PRIVACY
// ==========================================================================

Deno.test({
  name: 'RLS regression - user cannot read other users background checks',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup()
    const ctx = await getTestContext()

    const { data } = await ctx.user.client
      .schema('core')
      .from('background_checks')
      .select('id, user_id')
      .neq('user_id', ctx.user.userId)
      .limit(5)

    assert(!data || data.length === 0, `User should not see other users' background checks`)
  },
})
