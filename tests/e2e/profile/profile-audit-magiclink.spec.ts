/**
 * Profile pages audit: sign in via magic link (Mailpit), then visit every profile route
 * and record console errors, load status, and basic a11y.
 *
 * Prerequisites:
 * - App running (e.g. pnpm web on 8081)
 * - Supabase local (pnpm supa start)
 * - Mailpit (part of Supabase, port 54324)
 * - API function served (pnpm supa functions serve api)
 * - Test user exists and can receive magic link (e.g. test@example.com from seed)
 *
 * Run: pnpm exec playwright test tests/e2e/profile/profile-audit-magiclink.spec.ts --project=chromium
 */

import { expect, type Page, test } from '@playwright/test'
import {
  getLatestEmailFromMailpit,
  extractMagicLinkFromEmailHtml,
} from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/mailpit'
import { ensureProfileComplete } from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/profile'

const MAGIC_LINK_TEST_EMAIL = process.env.PROFILE_AUDIT_EMAIL || 'test@example.com'

/** All dashboard profile routes to audit (path only, baseURL applied by Playwright) */
const PROFILE_ROUTES = [
  '/profile',
  '/profile/resume',
  '/profile/resume',
  '/profile/skills',
  '/profile/skills',
  '/profile/resume',
  '/profile/experience',
  '/profile/experience',
  '/profile/verification',
  '/profile/resume',
  '/profile/resume/review',
  '/profile/background-check',
  '/profile/background-check/initiate',
  '/dashboard/settings',
  '/dashboard/settings/general',
  '/dashboard/settings/security',
  '/dashboard/settings/notifications',
] as const

type ProfileAuditResult = {
  path: string
  url: string
  status: 'ok' | 'error' | 'redirect'
  statusCode?: number
  consoleErrors: string[]
  loadTimeMs?: number
  bodyTextSnippet?: string
}

/**
 * Sign in via magic link: request on /auth, poll Mailpit, navigate to link, wait for dashboard.
 */
async function signInWithMagicLink(page: Page, email: string): Promise<boolean> {
  await page.goto('/auth', { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle').catch(() => {})

  const emailInput = page.getByPlaceholder(/email/i).or(page.getByRole('textbox')).first()
  await expect(emailInput).toBeVisible({ timeout: 10000 })
  await emailInput.fill(email)

  const submitButton = page.getByRole('button', { name: /send magic link|sending/i })
  await submitButton.click()

  // Wait for verify page or success state
  await page.waitForURL(/\/(auth\/verify|auth\/success)|dashboard/, { timeout: 8000 }).catch(() => {})

  const emailData = await getLatestEmailFromMailpit(email, 20000)
  if (!emailData?.body?.html) {
    console.error('No magic link email received from Mailpit for', email)
    return false
  }

  const magicLink = extractMagicLinkFromEmailHtml(emailData.body.html)
  if (!magicLink) {
    console.error('Could not extract magic link from email HTML')
    return false
  }

  await page.goto(magicLink, { waitUntil: 'domcontentloaded', timeout: 15000 })
  await page.waitForTimeout(2000)

  // Supabase may redirect to app with hash or query; app may then redirect to dashboard
  await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 15000 }).catch(() => {})

  if (page.url().includes('/onboarding')) {
    await ensureProfileComplete(page)
    await page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {})
  }

  const onDashboard = page.url().includes('/dashboard')
  return onDashboard
}

/**
 * Visit a single route and collect audit info (console errors, status).
 */
async function auditPage(
  page: Page,
  path: string
): Promise<ProfileAuditResult> {
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    const type = msg.type()
    if (type === 'error') {
      const text = msg.text()
      consoleErrors.push(text)
    }
  })

  const start = Date.now()
  const response = await page.goto(path, {
    waitUntil: 'domcontentloaded',
    timeout: 15000,
  }).catch(() => null)
  const loadTimeMs = Date.now() - start

  await page.waitForTimeout(800)

  const url = page.url()
  const statusCode = response?.status()
  let status: ProfileAuditResult['status'] = 'ok'
  if (!response) status = 'error'
  else if (statusCode && statusCode >= 400) status = 'error'
  else if (statusCode === 301 || statusCode === 302) status = 'redirect'

  const bodyTextSnippet = (await page.locator('body').textContent())?.slice(0, 200) ?? ''

  return {
    path,
    url,
    status,
    statusCode,
    consoleErrors,
    loadTimeMs,
    bodyTextSnippet,
  }
}

test.describe('Profile audit (magic link + Mailpit)', () => {
  test('sign in with magic link then audit all profile pages', async ({ page }: { page: Page }) => {
    test.setTimeout(120_000)
    const signedIn = await signInWithMagicLink(page, MAGIC_LINK_TEST_EMAIL)
    expect(signedIn, 'Should reach dashboard after magic link sign-in').toBe(true)

    const results: ProfileAuditResult[] = []

    for (const route of PROFILE_ROUTES) {
      const result = await auditPage(page, route)
      results.push(result)
    }

    // Log summary for plan
    const failed = results.filter((r) => r.status !== 'ok' || r.consoleErrors.length > 0)
    const ok = results.filter((r) => r.status === 'ok' && r.consoleErrors.length === 0)

    console.log('\n--- Profile audit summary ---')
    console.log(`OK (${ok.length}): ${ok.map((r) => r.path).join(', ')}`)
    if (failed.length > 0) {
      console.log(`Issues (${failed.length}):`)
      for (const r of failed) {
        console.log(`  ${r.path} status=${r.status} statusCode=${r.statusCode} errors=${r.consoleErrors.length}`)
        if (r.consoleErrors.length > 0) {
          for (const e of r.consoleErrors.slice(0, 3)) {
            console.log(`    - ${e.slice(0, 120)}`)
          }
        }
      }
    }
    console.log('--- End audit ---\n')

    expect(
      failed.length,
      `Profile audit: ${failed.length} route(s) had issues. See console for details.`
    ).toBe(0)
  })
})
