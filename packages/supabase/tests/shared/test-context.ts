/**
 * Test context utilities that hydrate Supabase clients for different roles.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  TEST_USERS,
  createTestClient,
  getAuthToken,
  getUserIdFromToken,
  isTokenExpired,
  loadCachedTokens,
  saveCachedTokens,
} from './setup.ts'

export interface TestContext {
  anon: SupabaseClient
  user: {
    client: SupabaseClient
    token: string
    email: string
    userId: string
  }
  admin: {
    client: SupabaseClient
    token: string
    email: string
    userId: string
  }
}

let cachedContext: TestContext | null = null

export async function getTestContext(): Promise<TestContext> {
  if (cachedContext) {
    return cachedContext
  }

  const tokens = await loadCachedTokens()

  if (!tokens) {
    throw new Error(
      'No cached auth tokens found. Run the auth router baseline tests to generate them.'
    )
  }

  if (isTokenExpired(tokens.regular.expiresAt)) {
    throw new Error(
      'Cached auth tokens have expired. Re-run the auth router baseline tests to refresh them.'
    )
  }

  cachedContext = {
    anon: createTestClient(),
    user: {
      client: createTestClient(tokens.regular.token),
      token: tokens.regular.token,
      email: tokens.regular.email,
      userId: tokens.regular.userId,
    },
    admin: {
      client: createTestClient(tokens.admin.token),
      token: tokens.admin.token,
      email: tokens.admin.email,
      userId: tokens.admin.userId,
    },
  }

  return cachedContext
}

export function clearTestContext(): void {
  cachedContext = null
}

export async function isAuthSetupComplete(): Promise<boolean> {
  const tokens = await loadCachedTokens()
  return tokens !== null && !isTokenExpired(tokens.regular.expiresAt)
}

/**
 * Ensure the cached token fixture exists, minting it if it does not.
 *
 * This used to throw "Auth setup is incomplete. Run auth.test.ts first" — an
 * ordering dependency between test FILES. `deno test` runs a directory
 * alphabetically, so `applications.test.ts` and everything else before the
 * letter A-U-T-H ran before the suite that writes the fixture, and failed for
 * no reason of their own. Running a single suite on its own failed the same
 * way, which made the tree hostile to work on one file at a time.
 *
 * Minting is cheap: password sign-in for the seeded accounts, no mailbox
 * round-trip. Suites that want the magic-link path still exercise it directly.
 */
export async function requireAuthSetup(): Promise<void> {
  if (await isAuthSetupComplete()) return

  const [regular, office] = await Promise.all([
    getAuthToken(TEST_USERS.regular.email, TEST_USERS.regular.password),
    getAuthToken(TEST_USERS.office.email, TEST_USERS.office.password),
  ])

  if (!regular) {
    throw new Error(
      `Could not mint a token for ${TEST_USERS.regular.email}. Is the local stack seeded?`
    )
  }

  const expiresAt = Date.now() + 3_600_000
  await saveCachedTokens({
    regular: {
      token: regular,
      email: TEST_USERS.regular.email,
      userId: (await getUserIdFromToken(regular)) ?? '',
      expiresAt,
    },
    // No seeded admin exists (#478); the regular token stands in, as it did
    // before. Suites needing real privilege should use `office`.
    admin: {
      token: regular,
      email: TEST_USERS.regular.email,
      userId: (await getUserIdFromToken(regular)) ?? '',
      expiresAt,
    },
    office: office
      ? {
          token: office,
          email: TEST_USERS.office.email,
          userId: (await getUserIdFromToken(office)) ?? '',
          expiresAt,
        }
      : undefined,
    cachedAt: Date.now(),
  })
}

/**
 * Resolve a user's id from their email using the service-role admin client.
 *
 * `admin.auth.admin.getUserByEmail()` does not exist — 30 call sites across the
 * work-logs suites used it, so those files never type-checked. GoTrue's admin
 * API offers `getUserById` and a paginated `listUsers`, with no email lookup,
 * so paging and matching is the supported route. Fine for a test database;
 * do not copy this into application code.
 *
 * Returns null when no user matches, so callers can distinguish "absent" from
 * "lookup failed" (which throws).
 */
/**
 * The slice of a service-role client this helper actually touches. Structural
 * rather than `SupabaseClient`, because the generic parameters vary per suite —
 * every instantiation satisfies this, so no `any` is needed.
 */
type AdminUserLister = {
  auth: {
    admin: {
      listUsers(params: { page: number; perPage: number }): Promise<{
        data?: { users?: Array<{ id: string; email?: string | null }> } | null
        error?: unknown
      }>
    }
  }
}

export async function getUserIdByEmail(
  admin: AdminUserLister,
  email: string
): Promise<string | null> {
  const target = email.toLowerCase()
  const perPage = 200

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) throw error

    const users = data?.users ?? []
    const match = users.find((u) => (u.email ?? '').toLowerCase() === target)
    if (match) return match.id

    if (users.length < perPage) return null
  }

  throw new Error(
    `getUserIdByEmail: gave up after 20 pages looking for ${email}. ` +
      'The test database has more users than expected; narrow the fixture set.'
  )
}
