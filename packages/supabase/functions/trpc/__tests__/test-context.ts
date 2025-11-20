/**
 * Test Context Manager
 * Provides pre-authenticated Supabase clients for testing
 *
 * This module loads cached auth tokens from auth.test.ts and provides
 * ready-to-use authenticated clients for other test suites.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { createTestClient, isTokenExpired, loadCachedTokens } from './setup.ts'

/**
 * Test context with pre-authenticated clients
 */
export interface TestContext {
  /** Anonymous/unauthenticated client */
  anon: SupabaseClient
  /** Authenticated regular user client */
  user: {
    client: SupabaseClient
    token: string
    email: string
    userId: string
  }
  /** Authenticated admin user client */
  admin: {
    client: SupabaseClient
    token: string
    email: string
    userId: string
  }
}

let _cachedContext: TestContext | null = null

/**
 * Get or create test context with pre-authenticated clients
 *
 * This function:
 * 1. Loads cached tokens from auth.test.ts
 * 2. Validates tokens are not expired
 * 3. Creates authenticated Supabase clients
 * 4. Caches the context for reuse
 *
 * @throws Error if auth tests haven't run or tokens are expired
 */
export async function getTestContext(): Promise<TestContext> {
  // Return cached context if available
  if (_cachedContext) {
    return _cachedContext
  }

  // Load cached tokens
  const tokens = await loadCachedTokens()

  if (!tokens) {
    throw new Error(
      'No cached auth tokens found. Please run auth tests first:\n' +
        '  deno test --allow-all packages/supabase/functions/trpc/__tests__/auth.test.ts'
    )
  }

  // Check if tokens are expired
  if (isTokenExpired(tokens.regular.expiresAt)) {
    throw new Error(
      'Cached auth tokens have expired. Please re-run auth tests:\n' +
        '  deno test --allow-all packages/supabase/functions/trpc/__tests__/auth.test.ts'
    )
  }

  // Create authenticated clients
  _cachedContext = {
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

  return _cachedContext
}

/**
 * Clear cached context (useful for testing)
 */
export function clearTestContext(): void {
  _cachedContext = null
}

/**
 * Check if auth setup has been completed
 */
export async function isAuthSetupComplete(): Promise<boolean> {
  const tokens = await loadCachedTokens()
  return tokens !== null && !isTokenExpired(tokens.regular.expiresAt)
}

/**
 * Require auth setup to be complete
 * Throws error if not, providing helpful instructions
 */
export async function requireAuthSetup(): Promise<void> {
  const isComplete = await isAuthSetupComplete()

  if (!isComplete) {
    throw new Error(
      'Auth setup is not complete. Please run auth tests first:\n' +
        '  deno test --allow-all packages/supabase/functions/trpc/__tests__/auth.test.ts\n\n' +
        'Or run all tests in order:\n' +
        '  ./packages/supabase/functions/trpc/__tests__/run-tests.sh'
    )
  }
}
