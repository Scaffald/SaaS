/**
 * Supabase Hardening Regression — E2E Tests
 *
 * Browser-based regression tests that verify the app continues to work
 * after Supabase database hardening (RLS, auth, schema changes).
 *
 * Tests critical user paths that depend on Supabase:
 * - Auth page renders and accepts input
 * - Authenticated dashboard loads with data
 * - Profile page loads user data
 * - Discover pages load public data (jobs, workers, employers)
 * - No auth errors in console
 * - API calls return 200 (not 401/403/500)
 *
 * Run: pnpm exec playwright test tests/e2e/auth/test-supabase-hardening-regression.spec.ts
 */

import { expect, test, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081'
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const ADMIN_EMAIL = 'ewongagent@gmail.com'
const ADMIN_PASSWORD = 'password123'

// Supabase v2 storage key: sb-{hostname_first_segment}-auth-token
function supabaseStorageKey(url: string) {
  return `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
}
const STORAGE_KEY = supabaseStorageKey(SUPABASE_URL)

// ---------------------------------------------------------------------------
// Auth helper — injects session in Supabase v2 format
// ---------------------------------------------------------------------------

// Cache the session across tests to avoid repeated password auth calls
// and prevent Supabase client auto-refresh timers from blocking the event loop.
let cachedSessionPayload: Record<string, unknown> | null = null

async function getSessionPayload(): Promise<Record<string, unknown>> {
  if (cachedSessionPayload) return cachedSessionPayload

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  const { data, error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })
  if (error) throw new Error(`Failed to sign in: ${error.message}`)
  if (!data.session) throw new Error('No session returned')

  const session = data.session
  cachedSessionPayload = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    token_type: session.token_type,
    user: JSON.parse(JSON.stringify(session.user)),
  }

  return cachedSessionPayload
}

/**
 * Inject the cached session into localStorage and navigate to dashboard.
 * Uses the correct Supabase v2 storage format (raw Session object).
 */
async function signInAndInject(page: Page): Promise<void> {
  const sessionPayload = await getSessionPayload()

  await page.addInitScript(
    ({ storageKey, payload }) => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(payload))
      } catch (err) {
        console.error('[TEST AUTH] Failed to set session', err)
      }
    },
    { storageKey: STORAGE_KEY, payload: sessionPayload }
  )

  // Navigate to dashboard and wait for app to pick up the session
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // Dismiss cookie banner if it appears
  await dismissCookieBanner(page)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ApiError {
  url: string
  status: number
  method: string
}

/** Dismiss cookie consent banner if present */
async function dismissCookieBanner(page: Page): Promise<void> {
  try {
    const rejectBtn = page.getByRole('button', { name: /reject/i })
    if (await rejectBtn.isVisible({ timeout: 2000 })) {
      await rejectBtn.click()
      await page.waitForTimeout(500)
    }
  } catch {
    // Banner not present, continue
  }
}

async function collectApiErrors(page: Page, action: () => Promise<void>): Promise<ApiError[]> {
  const errors: ApiError[] = []

  const handler = (response: { url: () => string; status: () => number; request: () => { method: () => string } }) => {
    const status = response.status()
    const url = response.url()
    if (status >= 400 && !url.includes('favicon') && !url.startsWith('data:')) {
      errors.push({ url, status, method: response.request().method() })
    }
  }

  page.on('response', handler)
  await action()
  page.removeListener('response', handler)

  return errors
}

async function collectConsoleErrors(page: Page, action: () => Promise<void>): Promise<string[]> {
  const errors: string[] = []

  const handler = (msg: { type: () => string; text: () => string }) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Filter known noise
      if (/HMR|\[vite\]|React DevTools|useNativeDriver|shadow\*|pointerEvents|resizeMode/i.test(text)) return
      if (/Failed to load resource|PGRST002/i.test(text)) return
      errors.push(text)
    }
  }

  page.on('console', handler)
  await action()
  page.removeListener('console', handler)

  return errors
}

// Authenticated tests need extra time for password sign-in + session injection
test.setTimeout(90_000)

// ==========================================================================
// 1. PUBLIC AUTH PAGE
// ==========================================================================

test.describe('Supabase Hardening Regression — Public', () => {
  test('auth page renders without Supabase errors', async ({ page }) => {
    const errors = await collectConsoleErrors(page, async () => {
      await page.goto('/auth', { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000)
    })

    await dismissCookieBanner(page)

    // Auth page should load — heading is "Login"
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible()

    // No auth-related console errors
    const authErrors = errors.filter((e) =>
      /auth|unauthorized|forbidden|session|token/i.test(e)
    )
    expect(authErrors).toHaveLength(0)
  })

  test('auth page API calls succeed', async ({ page }) => {
    const apiErrors = await collectApiErrors(page, async () => {
      await page.goto('/auth', { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000)
    })

    // Filter to Supabase API errors only (not static assets)
    const supabaseErrors = apiErrors.filter(
      (e) => e.url.includes('supabase') || e.url.includes('/rest/') || e.url.includes('/auth/')
    )

    expect(supabaseErrors).toHaveLength(0)
  })

  test('email input and submit button work', async ({ page }) => {
    await page.goto('/auth', { waitUntil: 'networkidle' })
    await dismissCookieBanner(page)

    const emailInput = page.getByPlaceholder(/email/i).or(page.getByRole('textbox')).first()
    await expect(emailInput).toBeVisible()
    await emailInput.fill('regression-test@example.com')

    // Submit button text is "Login / Register"
    const submitButton = page.getByRole('button', { name: /login|register|send magic link/i })
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()
  })
})

// ==========================================================================
// 2. AUTHENTICATED DASHBOARD
// ==========================================================================

test.describe('Supabase Hardening Regression — Dashboard', () => {
  test('dashboard loads for authenticated user', async ({ page }) => {
    await signInAndInject(page)

    // signInAndInject navigates to /dashboard — verify we stayed there
    expect(page.url()).toContain('/dashboard')

    // Page should have content (not blank/error)
    const bodyText = (await page.locator('body').textContent()) || ''
    expect(bodyText.length).toBeGreaterThan(100)
  })

  test('dashboard content is visible', async ({ page }) => {
    await signInAndInject(page)

    // Dashboard should show the Activity heading in the sidebar panel
    await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible({ timeout: 15_000 })
  })

  test('no RLS errors on dashboard load', async ({ page }) => {
    // Collect console errors during sign-in (which navigates to dashboard)
    const consoleErrors: string[] = []
    const handler = (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (/HMR|\[vite\]|React DevTools|useNativeDriver|shadow\*|pointerEvents|resizeMode/i.test(text)) return
        if (/Failed to load resource|PGRST002/i.test(text)) return
        consoleErrors.push(text)
      }
    }
    page.on('console', handler)

    await signInAndInject(page)
    await page.waitForTimeout(2000)

    page.removeListener('console', handler)

    // Filter for RLS-related errors
    const rlsErrors = consoleErrors.filter((e) =>
      /row.level.security|permission denied|violates.*policy|insufficient_privilege/i.test(e)
    )
    expect(rlsErrors).toHaveLength(0)
  })
})

// ==========================================================================
// 3. PROFILE DATA LOADING
// ==========================================================================

test.describe('Supabase Hardening Regression — Profile', () => {
  test('profile page loads user data', async ({ page }) => {
    await signInAndInject(page)

    await page.goto('/dashboard/profile/general', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2000)

    // Should not be redirected to auth
    expect(page.url()).not.toContain('/auth')

    // Profile page should show form fields (RN Web uses Views, not <form> elements)
    await expect(page.getByPlaceholder(/first name/i)).toBeVisible({ timeout: 10_000 })
  })

  test('profile sub-pages load without errors', async ({ page }) => {
    await signInAndInject(page)

    const subPages = [
      '/dashboard/profile/general',
      '/dashboard/profile/education',
      '/dashboard/profile/skills',
      '/dashboard/profile/experience',
      '/dashboard/profile/employment',
    ]

    for (const subPage of subPages) {
      const apiErrors = await collectApiErrors(page, async () => {
        await page.goto(subPage, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(1500)
      })

      const serverErrors = apiErrors.filter((e) => e.status >= 500)
      expect(
        serverErrors,
        `${subPage} should not have server errors`
      ).toHaveLength(0)
    }
  })
})

// ==========================================================================
// 4. DISCOVER — PUBLIC DATA ACCESS
// ==========================================================================

test.describe('Supabase Hardening Regression — Discover', () => {
  test('discover/jobs loads public job data', async ({ page }) => {
    await signInAndInject(page)

    const apiErrors = await collectApiErrors(page, async () => {
      await page.goto('/dashboard/discover/jobs', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
    })

    const bodyText = (await page.locator('body').textContent()) || ''
    expect(bodyText.length).toBeGreaterThan(50)

    // No auth errors on public data
    const authErrors = apiErrors.filter((e) => e.status === 401 || e.status === 403)
    expect(authErrors).toHaveLength(0)
  })

  test('discover/workers loads without RLS errors', async ({ page }) => {
    await signInAndInject(page)

    const consoleErrors = await collectConsoleErrors(page, async () => {
      await page.goto('/dashboard/discover/workers', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
    })

    const rlsErrors = consoleErrors.filter((e) =>
      /permission denied|violates.*policy|insufficient_privilege/i.test(e)
    )
    expect(rlsErrors).toHaveLength(0)
  })

  test('discover/employers loads without errors', async ({ page }) => {
    await signInAndInject(page)

    const apiErrors = await collectApiErrors(page, async () => {
      await page.goto('/dashboard/discover/employers', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2000)
    })

    const serverErrors = apiErrors.filter((e) => e.status >= 500)
    expect(serverErrors).toHaveLength(0)
  })
})

// ==========================================================================
// 5. SETTINGS & CONNECTIONS
// ==========================================================================

test.describe('Supabase Hardening Regression — Protected Routes', () => {
  test('settings page loads user preferences', async ({ page }) => {
    await signInAndInject(page)

    const apiErrors = await collectApiErrors(page, async () => {
      await page.goto('/dashboard/settings', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)
    })

    const bodyText = (await page.locator('body').textContent()) || ''
    expect(bodyText.length).toBeGreaterThan(50)

    const authErrors = apiErrors.filter(
      (e) => (e.status === 401 || e.status === 403) &&
        (e.url.includes('supabase') || e.url.includes('/rest/'))
    )
    expect(authErrors).toHaveLength(0)
  })

  test('connections page loads without RLS errors', async ({ page }) => {
    await signInAndInject(page)

    const consoleErrors = await collectConsoleErrors(page, async () => {
      await page.goto('/dashboard/connections', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)
    })

    const rlsErrors = consoleErrors.filter((e) =>
      /permission denied|violates.*policy|insufficient_privilege/i.test(e)
    )
    expect(rlsErrors).toHaveLength(0)
  })

  test('work logs page loads without auth errors', async ({ page }) => {
    await signInAndInject(page)

    const apiErrors = await collectApiErrors(page, async () => {
      await page.goto('/dashboard/work-logs', { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)
    })

    const authErrors = apiErrors.filter(
      (e) => (e.status === 401 || e.status === 403) &&
        (e.url.includes('supabase') || e.url.includes('/rest/'))
    )
    expect(authErrors).toHaveLength(0)
  })
})

// ==========================================================================
// 6. SESSION PERSISTENCE
// ==========================================================================

test.describe('Supabase Hardening Regression — Session', () => {
  test('session persists across navigation', async ({ page }) => {
    await signInAndInject(page)
    await dismissCookieBanner(page)

    // Navigate to multiple pages and verify session holds
    const pages = ['/dashboard', '/dashboard/profile/general', '/dashboard/discover/jobs', '/dashboard']

    for (const path of pages) {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(1500)

      // Should not be redirected to auth
      const url = page.url()
      expect(url).not.toContain('/auth')
    }
  })

  test('unauthenticated user is redirected to auth', async ({ page }) => {
    // Navigate to protected route without auth
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    const url = page.url()
    const bodyText = (await page.locator('body').textContent()) || ''

    // Should either redirect to auth or show login page
    const isOnAuth = url.includes('/auth')
    const showsLogin = /sign in|login/i.test(bodyText)
    expect(isOnAuth || showsLogin).toBe(true)
  })
})
