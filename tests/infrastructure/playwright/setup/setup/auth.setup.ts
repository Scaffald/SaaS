import { test as setup, expect } from '@playwright/test'
import * as fs from 'node:fs'
import { getSession } from '../../playwright-helpers/playwright-helpers/auth'

const authFile = 'tests/.auth/admin.json'
const userFile = 'tests/.auth/user.json'
const superAdminFile = 'tests/.auth/super-admin.json'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const APP_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081'

/**
 * Normalize hostname for localStorage key (matches auth.ts helper)
 */
function normaliseHost(url: string): string {
  return new URL(url).host.replace(/[.:]/g, '-')
}

/**
 * Get the storage key for Supabase auth token
 */
function getStorageKey(): string {
  return `sb-${normaliseHost(SUPABASE_URL)}-auth-token`
}

/**
 * Check if auth file exists and is recent (less than 7 days old)
 */
export function authFileIsValid(filePath: string): boolean {
  try {
    const stat = fs.statSync(filePath)
    const ageInDays = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24)
    return ageInDays < 7
  } catch {
    return false
  }
}

/**
 * Setup: Authenticate as admin and save storage state
 * This runs once before all tests to create a reusable authentication state
 *
 * NOTE: Skips if auth file already exists and is recent (< 7 days old)
 */
setup('authenticate as admin', async ({ page }) => {
  // Skip if auth file already exists and is valid
  if (authFileIsValid(authFile)) {
    console.log(`✅ Using existing admin auth file: ${authFile}`)
    console.log('   (File is less than 7 days old, skipping setup)')
    return
  }

  console.log('🔐 Setting up admin authentication...')

  // Get session via API (no CDN dependency)
  const email = 'ewongagent@gmail.com'
  const password = 'password123'
  const session = await getSession(email, password)

  console.log('✓ API authentication successful')

  // Prepare session data (match format from auth.ts injectSession)
  const safeUser = JSON.parse(JSON.stringify(session.user))
  const safeSession = {
    ...session.session,
    user: safeUser,
  }
  const payload = {
    currentSession: safeSession,
    expiresAt: safeSession.expires_at,
  }

  // Set localStorage BEFORE page loads using addInitScript (like injectSession does)
  const storageKey = getStorageKey()
  await page.addInitScript(
    ({ storageKey, payload, user }) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload))
        window.localStorage.setItem('supabase.auth.token', JSON.stringify(payload))
        window.localStorage.setItem('supabase.auth.user', JSON.stringify(user))
        console.log('[SETUP] Browser session initialized in localStorage')
      } catch (error) {
        console.error('[SETUP] Failed to populate localStorage', error)
      }
    },
    { storageKey, payload, user: safeUser }
  )

  console.log('✓ Browser session initialized')

  // Navigate to dashboard (localStorage will be set before page loads)
  await page.goto(`${APP_BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // Navigate to dashboard to verify auth works
  await page.goto(`${APP_BASE_URL}/dashboard`)
  await page.waitForLoadState('networkidle', { timeout: 30000 })

  // Verify we're authenticated (not redirected to /auth)
  await expect(page).toHaveURL(/dashboard/)

  console.log('✓ Authentication verified')

  // Wait a bit for Supabase to fully settle
  await page.waitForTimeout(2000)

  // Save the authenticated state
  await page.context().storageState({ path: authFile })

  console.log(`✅ Admin authentication state saved to ${authFile}`)
})

/**
 * Setup: Authenticate as regular user and save storage state
 *
 * NOTE: Skips if auth file already exists and is recent (< 7 days old)
 */
setup('authenticate as user', async ({ page }) => {
  // Skip if auth file already exists and is valid
  if (authFileIsValid(userFile)) {
    console.log(`✅ Using existing user auth file: ${userFile}`)
    console.log('   (File is less than 7 days old, skipping setup)')
    return
  }

  console.log('🔐 Setting up user authentication...')

  // Get session via API (no CDN dependency)
  const email = 'lexis.salah@eths.education.com'
  const password = 'password123'
  const session = await getSession(email, password)

  console.log('✓ API authentication successful')

  // Navigate to app and set session in localStorage
  await page.goto(`${APP_BASE_URL}/`)
  await page.waitForLoadState('domcontentloaded')

  // Set the session in localStorage directly
  const storageKey = getStorageKey()
  await page.evaluate(
    ({ storageKey, sessionData }) => {
      localStorage.setItem(storageKey, JSON.stringify({
        currentSession: sessionData,
        expiresAt: sessionData.expires_at,
      }))
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: sessionData,
        expiresAt: sessionData.expires_at,
      }))
      localStorage.setItem('supabase.auth.user', JSON.stringify(sessionData.user))
      console.log('[SETUP] Browser session initialized in localStorage')
    },
    { storageKey, sessionData: session.session }
  )

  console.log('✓ Browser session initialized')

  // Reload page to let Supabase read the session
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // Navigate to dashboard to verify auth works
  await page.goto(`${APP_BASE_URL}/dashboard`)
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await expect(page).toHaveURL(/dashboard/)
  await page.waitForTimeout(2000)

  await page.context().storageState({ path: userFile })

  console.log(`✅ User authentication state saved to ${userFile}`)
})

/**
 * Setup: Authenticate as super admin and save storage state
 *
 * NOTE: Skips if auth file already exists and is recent (< 7 days old)
 */
setup('authenticate as super admin', async ({ page }) => {
  // Skip if auth file already exists and is valid
  if (authFileIsValid(superAdminFile)) {
    console.log(`✅ Using existing super admin auth file: ${superAdminFile}`)
    console.log('   (File is less than 7 days old, skipping setup)')
    return
  }

  console.log('🔐 Setting up super admin authentication...')

  // Get session via API (no CDN dependency)
  const email = 'zach@unicorn.love'
  const password = 'password123'
  const session = await getSession(email, password)

  console.log('✓ API authentication successful')

  // Navigate to app and set session in localStorage
  await page.goto(`${APP_BASE_URL}/`)
  await page.waitForLoadState('domcontentloaded')

  // Set the session in localStorage directly
  const storageKey = getStorageKey()
  await page.evaluate(
    ({ storageKey, sessionData }) => {
      localStorage.setItem(storageKey, JSON.stringify({
        currentSession: sessionData,
        expiresAt: sessionData.expires_at,
      }))
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        currentSession: sessionData,
        expiresAt: sessionData.expires_at,
      }))
      localStorage.setItem('supabase.auth.user', JSON.stringify(sessionData.user))
      console.log('[SETUP] Browser session initialized in localStorage')
    },
    { storageKey, sessionData: session.session }
  )

  console.log('✓ Browser session initialized')

  // Reload page to let Supabase read the session
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // Navigate to dashboard to verify auth works
  await page.goto(`${APP_BASE_URL}/dashboard`)
  await page.waitForLoadState('networkidle', { timeout: 30000 })
  await expect(page).toHaveURL(/dashboard/)
  await page.waitForTimeout(2000)

  await page.context().storageState({ path: superAdminFile })

  console.log(`✅ Super admin authentication state saved to ${superAdminFile}`)
})
