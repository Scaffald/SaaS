import * as fs from 'node:fs'
import { expect, test as setup } from '@playwright/test'
import { getSession } from '../../playwright-helpers/playwright-helpers/auth'

const authFile = 'tests/.auth/admin.json'
const userFile = 'tests/.auth/user.json'
const superAdminFile = 'tests/.auth/super-admin.json'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const APP_BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081'

/**
 * The localStorage key supabase-js stores its session under.
 *
 * supabase-js derives this from the *first hostname label* — the project ref
 * for a hosted URL (`abc123.supabase.co` -> `sb-abc123-auth-token`), and `127`
 * for local (`http://127.0.0.1:54321` -> `sb-127-auth-token`).
 *
 * This used to replace every `.` and `:` in the full host instead, producing
 * `sb-127-0-0-1-54321-auth-token`. That is a key the client never reads, so
 * every storage state written here held a perfectly valid session that the app
 * could not see — specs authenticated, then rendered the login screen (#577).
 */
function normaliseHost(url: string): string {
  return new URL(url).hostname.split('.')[0]
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

  // Navigate to the app first (like create-auth-states.ts does)
  await page.goto(`${APP_BASE_URL}/`)
  await page.waitForLoadState('domcontentloaded')

  // Set the session in localStorage directly (flat format, like create-auth-states.ts)
  // Find or create the correct storage key based on page hostname
  const storageResult = await page.evaluate(
    (sessionData) => {
      // Find existing Supabase auth key (like create-auth-states.ts does)
      const keys = Object.keys(localStorage)
      let authKey = keys.find((k) => k.includes('sb-') && k.includes('-auth-token'))

      if (!authKey) {
        // Create the key based on current hostname (matches create-auth-states.ts)
        // Use IP address format (127) instead of localhost for consistency with working files
        const hostname = window.location.hostname
        // Convert localhost to 127, or use hostname as-is
        const normalizedHost = hostname === 'localhost' ? '127' : hostname.split('.')[0]
        authKey = `sb-${normalizedHost}-auth-token`
      }

      // Store session in localStorage as flat object (not wrapped in currentSession)
      // This matches the format used by create-auth-states.ts which works
      localStorage.setItem(authKey, JSON.stringify(sessionData))
      // Also set the generic keys for compatibility
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          currentSession: sessionData,
          expiresAt: sessionData.expires_at,
        })
      )
      localStorage.setItem('supabase.auth.user', JSON.stringify(sessionData.user))

      // Verify it was set
      const stored = localStorage.getItem(authKey)
      const allKeys = Object.keys(localStorage)

      return {
        authKey,
        stored: stored ? 'yes' : 'no',
        storedLength: stored?.length || 0,
        allKeys,
      }
    },
    {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_at: session.session.expires_at,
      expires_in: session.session.expires_in,
      token_type: session.session.token_type,
      user: session.user,
    }
  )

  console.log('✓ Browser session initialized')
  console.log(`   Storage key: ${storageResult.authKey}`)
  console.log(`   Stored: ${storageResult.stored}, Length: ${storageResult.storedLength}`)

  // Verify localStorage still has the data before reload
  const beforeReload = await page.evaluate(() => {
    const keys = Object.keys(localStorage)
    const authKeys = keys.filter((k) => k.includes('auth') || k.includes('sb-'))
    return { keys, authKeys }
  })
  console.log(`   Before reload - localStorage keys: ${beforeReload.authKeys.join(', ')}`)

  // Reload to let Supabase read the session
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000) // Match create-auth-states.ts wait time

  // Verify localStorage still has the data after reload
  const afterReload = await page.evaluate(() => {
    const keys = Object.keys(localStorage)
    const authKeys = keys.filter((k) => k.includes('auth') || k.includes('sb-'))
    return { keys, authKeys }
  })
  console.log(`   After reload - localStorage keys: ${afterReload.authKeys.join(', ')}`)

  // Navigate to dashboard to verify auth works
  // Use waitForURL to wait for either dashboard or auth (to detect redirect)
  await page.goto(`${APP_BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // Wait a bit for Supabase to process the session
  await page.waitForTimeout(3000)

  // Check what URL we ended up at
  const currentUrl = page.url()
  console.log(`📍 Current URL after navigation: ${currentUrl}`)

  // Check localStorage on the current page (might be /auth if redirected)
  const localStorageOnCurrentPage = await page.evaluate(() => {
    const keys = Object.keys(localStorage)
    const authKeys = keys.filter((k) => k.includes('auth') || k.includes('sb-'))
    return { keys, authKeys }
  })
  console.log(`   localStorage on ${currentUrl}: ${localStorageOnCurrentPage.authKeys.join(', ')}`)

  // Verify we're authenticated (not redirected to /auth)
  if (currentUrl.includes('/auth')) {
    // Debug: Check what's in localStorage
    const localStorageCheck = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      const authKeys = keys.filter((k) => k.includes('auth') || k.includes('sb-'))
      return {
        allKeys: keys,
        authKeys,
        authValues: authKeys.map((k) => ({
          key: k,
          value: localStorage.getItem(k)?.substring(0, 100),
        })),
      }
    })
    console.log('🔍 localStorage debug:', JSON.stringify(localStorageCheck, null, 2))
    throw new Error(
      `Authentication failed - redirected to /auth. localStorage keys: ${localStorageCheck.authKeys.join(', ')}`
    )
  }

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

  // Navigate to the app first (like create-auth-states.ts does)
  await page.goto(`${APP_BASE_URL}/`)
  await page.waitForLoadState('domcontentloaded')

  // Set the session in localStorage directly (flat format, like create-auth-states.ts)
  // Find or create the correct storage key based on page hostname
  const storageResult = await page.evaluate(
    (sessionData) => {
      // Find existing Supabase auth key (like create-auth-states.ts does)
      const keys = Object.keys(localStorage)
      let authKey = keys.find((k) => k.includes('sb-') && k.includes('-auth-token'))

      if (!authKey) {
        // Create the key based on current hostname (matches create-auth-states.ts)
        // Use IP address format (127) instead of localhost for consistency with working files
        const hostname = window.location.hostname
        // Convert localhost to 127, or use hostname as-is
        const normalizedHost = hostname === 'localhost' ? '127' : hostname.split('.')[0]
        authKey = `sb-${normalizedHost}-auth-token`
      }

      // Store session in localStorage as flat object (not wrapped in currentSession)
      // This matches the format used by create-auth-states.ts which works
      localStorage.setItem(authKey, JSON.stringify(sessionData))
      // Also set the generic keys for compatibility
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          currentSession: sessionData,
          expiresAt: sessionData.expires_at,
        })
      )
      localStorage.setItem('supabase.auth.user', JSON.stringify(sessionData.user))

      // Verify it was set
      const stored = localStorage.getItem(authKey)
      const allKeys = Object.keys(localStorage)

      return {
        authKey,
        stored: stored ? 'yes' : 'no',
        storedLength: stored?.length || 0,
        allKeys,
      }
    },
    {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
      expires_at: session.session.expires_at,
      expires_in: session.session.expires_in,
      token_type: session.session.token_type,
      user: session.user,
    }
  )

  console.log('✓ Browser session initialized')
  console.log(`   Storage key: ${storageResult.authKey}`)
  console.log(`   Stored: ${storageResult.stored}, Length: ${storageResult.storedLength}`)

  // Verify localStorage still has the data before reload
  const beforeReload = await page.evaluate(() => {
    const keys = Object.keys(localStorage)
    const authKeys = keys.filter((k) => k.includes('auth') || k.includes('sb-'))
    return { keys, authKeys }
  })
  console.log(`   Before reload - localStorage keys: ${beforeReload.authKeys.join(', ')}`)

  // Reload to let Supabase read the session
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000) // Match create-auth-states.ts wait time

  // Verify localStorage still has the data after reload
  const afterReload = await page.evaluate(() => {
    const keys = Object.keys(localStorage)
    const authKeys = keys.filter((k) => k.includes('auth') || k.includes('sb-'))
    return { keys, authKeys }
  })
  console.log(`   After reload - localStorage keys: ${afterReload.authKeys.join(', ')}`)

  // Navigate to dashboard to verify auth works
  // Use waitForURL to wait for either dashboard or auth (to detect redirect)
  await page.goto(`${APP_BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 })

  // Wait a bit for Supabase to process the session
  await page.waitForTimeout(3000)

  // Check what URL we ended up at
  const currentUrl = page.url()
  console.log(`📍 Current URL after navigation: ${currentUrl}`)

  // Check localStorage on the current page (might be /auth if redirected)
  const localStorageOnCurrentPage = await page.evaluate(() => {
    const keys = Object.keys(localStorage)
    const authKeys = keys.filter((k) => k.includes('auth') || k.includes('sb-'))
    return { keys, authKeys }
  })
  console.log(`   localStorage on ${currentUrl}: ${localStorageOnCurrentPage.authKeys.join(', ')}`)

  // Verify we're authenticated (not redirected to /auth)
  if (currentUrl.includes('/auth')) {
    // Debug: Check what's in localStorage
    const localStorageCheck = await page.evaluate(() => {
      const keys = Object.keys(localStorage)
      const authKeys = keys.filter((k) => k.includes('auth') || k.includes('sb-'))
      return {
        allKeys: keys,
        authKeys,
        authValues: authKeys.map((k) => ({
          key: k,
          value: localStorage.getItem(k)?.substring(0, 100),
        })),
      }
    })
    console.log('🔍 localStorage debug:', JSON.stringify(localStorageCheck, null, 2))
    throw new Error(
      `Authentication failed - redirected to /auth. localStorage keys: ${localStorageCheck.authKeys.join(', ')}`
    )
  }

  await expect(page).toHaveURL(/dashboard/)

  console.log('✓ Authentication verified')

  // Wait a bit for Supabase to fully settle
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

  // Prepare session data (match format from auth.ts injectSession)
  // Convert getSession result to SupabaseSessionShape format
  const plainUser = JSON.parse(JSON.stringify(session.user))
  const safeSession = {
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token ?? session.session.access_token,
    expires_at:
      session.session.expires_at ??
      Math.floor(Date.now() / 1000) + (session.session.expires_in ?? 3600),
    expires_in: session.session.expires_in ?? 3600,
    token_type: session.session.token_type ?? 'bearer',
    user: plainUser,
  }
  const payload = {
    currentSession: safeSession,
    expiresAt: safeSession.expires_at,
  }

  // Navigate first, then write localStorage on that origin — the same shape
  // the admin and user setups use.
  //
  // This used to use addInitScript, which has two problems. It runs on *every*
  // origin the page loads, so the session landed in the Stripe iframes
  // (js.stripe.com, m.stripe.network) and not on localhost — the saved storage
  // state ended up with no `sb-*-auth-token` for the app's own origin at all.
  // And it wrote a wrapped `{ currentSession, expiresAt }` payload, where
  // supabase-js stores the session flat: access_token, token_type, expires_in,
  // expires_at, refresh_token, user. Either alone is enough to make the state
  // unusable (#577).
  const storageKey = getStorageKey()

  await page.goto(`${APP_BASE_URL}/`)
  await page.waitForLoadState('domcontentloaded')

  await page.evaluate(
    ({ storageKey, session, wrapped, user }) => {
      window.localStorage.setItem(storageKey, JSON.stringify(session))
      window.localStorage.setItem('supabase.auth.token', JSON.stringify(wrapped))
      window.localStorage.setItem('supabase.auth.user', JSON.stringify(user))
    },
    { storageKey, session: safeSession, wrapped: payload, user: plainUser }
  )

  console.log('✓ Browser session initialized')

  await page.goto(`${APP_BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 })

  // Verify we're authenticated (not redirected to /auth)
  await expect(page).toHaveURL(/dashboard/)

  console.log('✓ Authentication verified')

  // Wait a bit for Supabase to fully settle
  await page.waitForTimeout(2000)

  await page.context().storageState({ path: superAdminFile })

  console.log(`✅ Super admin authentication state saved to ${superAdminFile}`)
})
