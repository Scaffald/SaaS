/**
 * Test context utilities that hydrate Supabase clients for different roles.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createTestClient, isTokenExpired, loadCachedTokens } from './setup.ts'

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

export async function requireAuthSetup(): Promise<void> {
  const complete = await isAuthSetupComplete()

  if (!complete) {
    throw new Error(
      'Auth setup is incomplete. Run `deno test --allow-all packages/supabase/tests/routers/auth.test.ts` first.'
    )
  }
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
