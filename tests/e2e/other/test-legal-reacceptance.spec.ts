import { expect, type Page, test } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import {
  signInAsUser,
  TEST_USERS,
} from '../../infrastructure/playwright/playwright-helpers/playwright-helpers/auth'

/**
 * Legal Re-acceptance Flow (versioned terms, migration 342)
 *
 * When a new legal document version is published after a user onboarded,
 * /v1/prerequisites/check reports needsLegalAcceptance and the (protected)
 * layout blocks the app behind the lightweight /legal-update screen.
 *
 * The spec simulates a version bump by SQL-staling the seeded user's accepted
 * terms version (service-role update), which is exactly what a real publish
 * does from the user's perspective: their accepted version no longer equals
 * the current one.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  // Local-stack default service key (supabase-demo); never a real secret.
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function getUserIdByEmail(email: string): Promise<string> {
  // core.users carries no email column; resolve through the GoTrue admin API.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw new Error(`Could not list users: ${error.message}`)
  const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!match) throw new Error(`Could not resolve user id for ${email}`)
  return match.id
}

async function setTermsVersion(userId: string, version: string | null): Promise<void> {
  const { error } = await admin
    .schema('core')
    .from('preferences')
    .update({ terms_of_service_version: version })
    .eq('user_id', userId)
  if (error) throw new Error(`Failed to set terms version: ${error.message}`)
}

async function getCurrentTermsVersion(): Promise<string> {
  const { data, error } = await admin
    .schema('core')
    .from('legal_documents')
    .select('version')
    .eq('doc_type', 'terms_of_service')
    .eq('is_current', true)
    .single()
  if (error || !data) throw new Error(`Could not read current terms version: ${error?.message}`)
  return data.version
}

async function dismissCookieBanner(page: Page): Promise<void> {
  try {
    await page.getByRole('button', { name: /^reject$/i }).click({ timeout: 2000 })
  } catch {}
}

test.describe('Legal Re-acceptance', () => {
  let userId: string
  let currentVersion: string

  test.beforeAll(async () => {
    userId = await getUserIdByEmail(TEST_USERS.regular.email)
    currentVersion = await getCurrentTermsVersion()
  })

  test.afterEach(async () => {
    // Restore the user to the current version so other specs see a
    // fully-onboarded user regardless of how this spec exits.
    await setTermsVersion(userId, currentVersion)
  })

  test('stale terms version blocks the app at /legal-update until accepted', async ({ page }) => {
    await setTermsVersion(userId, 'v0.0-e2e-stale')

    await signInAsUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password)
    await dismissCookieBanner(page)

    // Blocked: the protected layout routes to the lightweight accept screen,
    // not the full onboarding form.
    await expect(page).toHaveURL(/\/legal-update/, { timeout: 15000 })
    await expect(page.getByTestId('legal-update-accept-button')).toBeVisible()
    await expect(page.getByTestId('legal-update-terms-link')).toBeVisible()

    // Deep links into the app bounce back while stale.
    await page.goto('/dashboard/settings')
    await expect(page).toHaveURL(/\/legal-update/, { timeout: 15000 })

    // Accept → lands on the dashboard.
    await page.getByTestId('legal-update-accept-button').click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

    // Reload → no interstitial; acceptance was stamped at the current version.
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })

    const { data: prefs } = await admin
      .schema('core')
      .from('preferences')
      .select('terms_of_service_version')
      .eq('user_id', userId)
      .single()
    expect(prefs?.terms_of_service_version).toBe(currentVersion)
  })

  test('direct navigation to /legal-update with current acceptance bounces to dashboard', async ({
    page,
  }) => {
    await signInAsUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password)
    await dismissCookieBanner(page)

    await page.goto('/legal-update')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 })
  })
})
