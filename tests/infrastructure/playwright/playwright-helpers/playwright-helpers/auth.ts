// @ts-nocheck

import type { Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { ensureAdminProfileComplete, ensureProfileComplete } from './profile'
import { readCachedToken, type TestPersona } from './tokens'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const APP_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081'
const STORAGE_KEY = `sb-${normaliseHost(SUPABASE_URL)}-auth-token`
const STORAGE_STATE_PATH = 'tests/.auth/user.json'

export const TEST_USERS = {
  regular: {
    email: 'lexis.salah@eths.education.com',
    password: 'password123',
  },
  admin: {
    email: 'ewongagent@gmail.com',
    password: 'password123',
  },
  superAdmin: {
    email: 'zach@unicorn.love',
    password: 'password123',
  },
} as const

type SupabaseSessionShape = {
  access_token: string
  refresh_token: string
  expires_at: number
  expires_in: number
  token_type: string
  user: Record<string, unknown>
}

function normaliseHost(url: string) {
  return new URL(url).host.replace(/[.:]/g, '-')
}

function buildUserStub(email: string, userId: string) {
  const timestamp = new Date().toISOString()
  return {
    id: userId,
    email,
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { email, email_verified: true },
    role: 'authenticated',
    aud: 'authenticated',
    created_at: timestamp,
    updated_at: timestamp,
    last_sign_in_at: timestamp,
    identities: [],
    confirmed_at: timestamp,
    email_confirmed_at: timestamp,
  }
}

async function injectSession(page: Page, session: SupabaseSessionShape) {
  const safeUser = JSON.parse(JSON.stringify(session.user))
  const safeSession: SupabaseSessionShape = {
    ...session,
    user: safeUser,
  }
  const payload = {
    currentSession: safeSession,
    expiresAt: safeSession.expires_at,
  }

  await page.addInitScript(
    ({ storageKey, payload, user }) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload))
        window.localStorage.setItem('supabase.auth.token', JSON.stringify(payload))
        window.localStorage.setItem('supabase.auth.user', JSON.stringify(user))
        console.log('[TEST AUTH] Stored Supabase session for', storageKey)
      } catch (error) {
        console.error('[TEST AUTH] Failed to populate localStorage', error)
      }
    },
    { storageKey: STORAGE_KEY, payload, user: safeUser }
  )

  await page.goto(`${APP_BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(1000)
  const keys = await page.evaluate(() => Object.keys(window.localStorage))
  console.log('[TEST AUTH] localStorage keys after injection:', keys)
  const tokenValue = await page.evaluate(() => window.localStorage.getItem('supabase.auth.token'))
  console.log('[TEST AUTH] supabase.auth.token value:', tokenValue)
}

async function confirmAuthenticated(page: Page) {
  try {
    await page.waitForURL('**/dashboard**', { timeout: 5000 })
    const signInVisible = await page
      .getByRole('heading', { name: /sign in/i })
      .isVisible({ timeout: 1000 })
      .catch(() => false)
    return !signInVisible
  } catch {
    return false
  }
}

async function tryCachedToken(page: Page, persona: TestPersona): Promise<boolean> {
  const cached = await readCachedToken(persona)
  if (!cached) {
    return false
  }

  const nowSeconds = Math.floor(Date.now() / 1000)
  const expiresSeconds = Math.floor(cached.expiresAt / 1000)
  const user = buildUserStub(cached.email, cached.userId)
  const session: SupabaseSessionShape = {
    access_token: cached.token,
    refresh_token: cached.token,
    expires_at: expiresSeconds,
    expires_in: Math.max(60, expiresSeconds - nowSeconds),
    token_type: 'bearer',
    user,
  }

  console.log(`[TEST AUTH] Injecting cached ${persona} session`)
  await injectSession(page, session)
  const authenticated = await confirmAuthenticated(page)
  if (!authenticated) {
    console.warn('[TEST AUTH] Cached token failed to authenticate, falling back to password')
  }
  return authenticated
}

async function signInViaPassword(email: string, password: string): Promise<SupabaseSessionShape> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Failed to sign in via password: ${error.message}`)
  }

  if (!data.session) {
    throw new Error('Supabase did not return a session')
  }

  const { session } = data
  const plainUser = JSON.parse(JSON.stringify(session.user))
  if (!session.expires_at) {
    session.expires_at = Math.floor(Date.now() / 1000) + (session.expires_in ?? 3600)
  }

  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token ?? session.access_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in ?? 3600,
    token_type: session.token_type ?? 'bearer',
    user: plainUser,
  }
}

export async function signInAsUser(page: Page, email: string, password: string): Promise<void> {
  const persona: TestPersona = email === TEST_USERS.admin.email ? 'admin' : 'regular'

  if (await tryCachedToken(page, persona)) {
    return
  }

  const session = await signInViaPassword(email, password)
  await injectSession(page, session)
}

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
 * Legacy helpers kept for API compatibility below this line
 */
export async function getAuthToken(email: string, password: string): Promise<string> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    throw new Error(`Failed to authenticate ${email}: ${error.message}`)
  }
  if (!data.session?.access_token) {
    throw new Error(`No access token received for ${email}`)
  }
  return data.session.access_token
}

export async function getSession(email: string, password: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
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

export async function createStorageState(
  email: string,
  password: string,
  outputPath = STORAGE_STATE_PATH
): Promise<void> {
  const session = await getSession(email, password)
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: new URL(APP_BASE_URL).origin,
        localStorage: [
          {
            name: STORAGE_KEY,
            value: JSON.stringify({
              currentSession: session.session,
              expiresAt: session.session.expires_at,
            }),
          },
          {
            name: 'supabase.auth.token',
            value: JSON.stringify({
              currentSession: session.session,
              expiresAt: session.session.expires_at,
            }),
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

export async function loadStorageState(path = STORAGE_STATE_PATH) {
  if (!existsSync(path)) {
    throw new Error(`Storage state file not found at ${path}. Run createStorageState() first.`)
  }
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export async function getBearerToken(email: string, password: string): Promise<string> {
  return getAuthToken(email, password)
}

export const getRegularUserToken = () =>
  getBearerToken(TEST_USERS.regular.email, TEST_USERS.regular.password)

export const getAdminToken = () => getBearerToken(TEST_USERS.admin.email, TEST_USERS.admin.password)

export const getSuperAdminToken = () =>
  getBearerToken(TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password)
