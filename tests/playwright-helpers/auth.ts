/**
 * Playwright Authentication Helpers for Supabase
 *
 * Provides utilities to authenticate users in Playwright tests using Supabase
 * Similar to Clerk's @clerk/playwright but for Supabase
 */

import { createClient } from '@supabase/supabase-js'
import type { Page } from '@playwright/test'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { ensureProfileComplete, ensureAdminProfileComplete } from './profile'

// Supabase configuration from environment
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Test users from seed data
export const TEST_USERS = {
  regular: {
    email: 'lexis.salah@eths.education.com',
    password: 'password123',
  },
  admin: {
    email: 'ewongagent@gmail.com', // From seed data
    password: 'password123',
  },
  superAdmin: {
    email: 'zach@unicorn.love',
    password: 'password123',
  },
} as const

/**
 * Get authentication token for a user
 */
export async function getAuthToken(email: string, password: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(`Failed to authenticate ${email}: ${error.message}`)
  }

  if (!data.session?.access_token) {
    throw new Error(`No access token received for ${email}`)
  }

  return data.session.access_token
}

/**
 * Get full session data including user info
 */
export async function getSession(email: string, password: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(`Failed to authenticate ${email}: ${error.message}`)
  }

  if (!data.session) {
    throw new Error(`No session received for ${email}`)
  }

  return {
    token: data.session.access_token,
    user: data.user,
    session: data.session,
  }
}

/**
 * Login a user in Playwright and set authentication state
 * Similar to Clerk's `signInAsUser` helper
 * Uses Supabase's localStorage pattern for React Native Web
 */
export async function signInAsUser(page: Page, email: string, password: string): Promise<void> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  // Sign in via Supabase API
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(`Failed to sign in: ${error.message}`)
  }

  if (!data.session) {
    throw new Error('No session created')
  }

  // Navigate to the app first
  await page.goto('/')
  
  // Wait for page to load
  await page.waitForLoadState('networkidle')

  // Set authentication state using Supabase's storage key pattern
  // The key format is: sb-{hostname-with-dashes}-auth-token
  await page.evaluate(
    ({ session, user, url }) => {
      const hostname = new URL(url).hostname.replace(/\./g, '-').replace(/:/g, '-')
      const storageKey = `sb-${hostname}-auth-token`
      
      // Store the full session object (matching Supabase-js format)
      localStorage.setItem(storageKey, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: user,
      }))
      
      // Also set the shorter key (Supabase sometimes uses both)
      const shortKey = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
      if (shortKey !== storageKey) {
        localStorage.setItem(shortKey, JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: user,
        }))
      }
    },
    { session: data.session, user: data.user, url: SUPABASE_URL },
  )

  // Navigate to dashboard to trigger auth state processing
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  // Wait a bit for auth to initialize, but don't wait for networkidle (pages may be loading indefinitely)
  await page.waitForTimeout(2000)
}

/**
 * Create a storage state file for authenticated tests
 * This allows Playwright to reuse authentication across tests
 */
export async function createStorageState(
  email: string,
  password: string,
  outputPath = 'tests/.auth/user.json',
): Promise<void> {
  const session = await getSession(email, password)

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: new URL(process.env.EXPO_PUBLIC_URL || 'http://localhost:8081').origin,
        localStorage: [
          {
            name: 'supabase.auth.token',
            value: JSON.stringify(session.session),
          },
          {
            name: 'supabase.auth.user',
            value: JSON.stringify(session.user),
          },
        ],
      },
    ],
  }

  writeFileSync(outputPath, JSON.stringify(storageState, null, 2))
  console.log(`✅ Storage state saved to ${outputPath}`)
}

/**
 * Load storage state from file
 */
export async function loadStorageState(path = 'tests/.auth/user.json') {
  if (!existsSync(path)) {
    throw new Error(
      `Storage state file not found at ${path}. Run createStorageState() first.`,
    )
  }

  return JSON.parse(readFileSync(path, 'utf-8'))
}

/**
 * Login with test users (convenience shortcuts)
 */
export const signInAsTestUser = async (page: Page) => {
  await signInAsUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password)
  await ensureProfileComplete(page)
}

export const signInAsAdmin = async (page: Page) => {
  await signInAsUser(page, TEST_USERS.admin.email, TEST_USERS.admin.password)
  await ensureAdminProfileComplete(page)
}

export const signInAsSuperAdmin = async (page: Page) => {
  await signInAsUser(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password)
  await ensureAdminProfileComplete(page)
}

/**
 * Get auth token for API requests (useful for fetch/mocking)
 */
export async function getBearerToken(email: string, password: string): Promise<string> {
  return getAuthToken(email, password)
}

// Convenience exports
export const getRegularUserToken = () => getBearerToken(TEST_USERS.regular.email, TEST_USERS.regular.password)
export const getAdminToken = () => getBearerToken(TEST_USERS.admin.email, TEST_USERS.admin.password)
export const getSuperAdminToken = () => getBearerToken(TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password)

