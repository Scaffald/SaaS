/**
 * Test context utilities that hydrate Supabase clients for different roles.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createTestClient, isTokenExpired, loadCachedTokens } from './setup';

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
