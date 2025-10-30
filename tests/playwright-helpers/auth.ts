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

// Supabase configuration from environment
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Test users from seed data
export const TEST_USERS = {
  regular: {
    email: 'testuser1@example.com',
    password: 'TestUser123!',
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

  // Navigate to the app
  await page.goto('/')

  // Set authentication state in the page
  await page.evaluate(
    ({ token, user }) => {
      // Store session in localStorage (matching your app's storage strategy)
      localStorage.setItem('supabase.auth.token', JSON.stringify(token))
      localStorage.setItem('supabase.auth.user', JSON.stringify(user))

      // Also set in sessionStorage for web compatibility
      sessionStorage.setItem('supabase.auth.token', JSON.stringify(token))
      
      // Emit storage event to trigger app listeners
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'supabase.auth.token',
        newValue: JSON.stringify(token),
      }))
    },
    { token: data.session, user: data.user },
  )

  // Wait for the app to process the auth state
  await page.waitForTimeout(500)
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
export const signInAsTestUser = (page: Page) => signInAsUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password)
export const signInAsAdmin = (page: Page) => signInAsUser(page, TEST_USERS.admin.email, TEST_USERS.admin.password)
export const signInAsSuperAdmin = (page: Page) => signInAsUser(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password)

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

