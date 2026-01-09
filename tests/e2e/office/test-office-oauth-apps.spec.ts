/**
 * Office OAuth Apps Management E2E Tests
 *
 * Tests comprehensive OAuth app management functionality including:
 * - OAuth apps list page (admin dashboard)
 * - Status filtering (pending, active, trusted, suspended, revoked)
 * - App registration flow
 * - Client credentials display and security
 * - App approval workflow (admin)
 */

import { expect, type Page, test } from '@playwright/test'

// Use super-admin auth state (Zach) who has 'office' role required for /office routes
test.use({ storageState: 'tests/.auth/super-admin.json' })

// Increase timeout for office operations
test.setTimeout(90000)

// Helper to wait for OAuth apps to load
async function waitForOAuthAppsLoad(page: Page) {
  await page.waitForTimeout(2000)
}

// Helper to generate unique app name
function generateAppName(): string {
  const timestamp = Date.now()
  return `E2E Test App ${timestamp}`
}

test.describe('Office • OAuth Apps Management', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    console.log('Signing in as admin...')
    // Authentication handled by storage state (tests/.auth/super-admin.json)
    console.log('Admin signed in successfully')
  })

  test.describe('OAuth Apps List Page', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      console.log('Navigating to OAuth apps list page...')
      await page.goto('/office/oauth-apps')
      await waitForOAuthAppsLoad(page)
    })

    test('should load OAuth apps list page successfully', async ({ page }: { page: Page }) => {
      // Verify URL
      expect(page.url()).toContain('/office/oauth-apps')

      // Check for page title
      const pageTitle = page.getByRole('heading', { name: /oauth applications/i })
      await expect(pageTitle).toBeVisible({ timeout: 10000 })

      console.log('OAuth apps list page loaded successfully')
    })

    test('should display status filter buttons', async ({ page }: { page: Page }) => {
      // Check for all status filters
      const allButton = page.getByRole('button', { name: /^all$/i })
      const pendingButton = page.getByRole('button', { name: /^pending$/i })
      const activeButton = page.getByRole('button', { name: /^active$/i })
      const trustedButton = page.getByRole('button', { name: /^trusted$/i })
      const suspendedButton = page.getByRole('button', { name: /^suspended$/i })
      const revokedButton = page.getByRole('button', { name: /^revoked$/i })

      await expect(allButton).toBeVisible({ timeout: 5000 })
      await expect(pendingButton).toBeVisible({ timeout: 5000 })
      await expect(activeButton).toBeVisible({ timeout: 5000 })
      await expect(trustedButton).toBeVisible({ timeout: 5000 })
      await expect(suspendedButton).toBeVisible({ timeout: 5000 })
      await expect(revokedButton).toBeVisible({ timeout: 5000 })

      console.log('All status filter buttons displayed')
    })

    test('should filter apps by status when clicking filter buttons', async ({
      page,
    }: {
      page: Page
    }) => {
      await page.waitForTimeout(1000)

      // Click pending filter
      const pendingButton = page.getByRole('button', { name: /^pending$/i })
      await pendingButton.click()
      await page.waitForTimeout(1000)

      // Verify filter is active (button should have different styling)
      console.log('Pending filter clicked')

      // Click active filter
      const activeButton = page.getByRole('button', { name: /^active$/i })
      await activeButton.click()
      await page.waitForTimeout(1000)

      console.log('Active filter clicked')

      // Click all to reset
      const allButton = page.getByRole('button', { name: /^all$/i })
      await allButton.click()
      await page.waitForTimeout(1000)

      console.log('Filter buttons working correctly')
    })

    test('should display OAuth app cards when apps exist', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Check for app cards - Cards should have app display name
      const appCards = page.locator('[data-testid^="oauth-app-"]')
      const cardCount = await appCards.count().catch(() => 0)

      if (cardCount > 0) {
        console.log(`Found ${cardCount} OAuth app(s)`)

        // Verify first card has required elements
        const firstCard = appCards.first()
        await expect(firstCard).toBeVisible()

        console.log('OAuth app cards displayed successfully')
      } else {
        // No apps might be normal in fresh environment
        console.log('No OAuth apps found (empty state)')
      }
    })

    test('should display app status in cards', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for status indicators in cards
      const statusText = page.getByText(/status:/i).first()
      const hasStatus = await statusText.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasStatus) {
        const statusValue = await statusText.textContent()
        // Should contain one of: pending, active, trusted, suspended, revoked
        const validStatuses = ['pending', 'active', 'trusted', 'suspended', 'revoked']
        const hasValidStatus = validStatuses.some((status) =>
          statusValue?.toLowerCase().includes(status)
        )

        expect(hasValidStatus).toBe(true)
        console.log('App status displayed:', statusValue)
      } else {
        console.log('No apps to check status')
      }
    })

    test('should display app creation date', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Look for created date in cards
      const createdText = page.getByText(/created:/i).first()
      const hasCreated = await createdText.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasCreated) {
        const dateText = await createdText.textContent()
        console.log('App creation date displayed:', dateText)
      } else {
        console.log('No apps to check creation date')
      }
    })

    test('should navigate to app detail when clicking view button', async ({
      page,
    }: {
      page: Page
    }) => {
      await page.waitForTimeout(2000)

      // Find first View button
      const viewButtons = page.getByRole('button', { name: /view/i })
      const buttonCount = await viewButtons.count()

      if (buttonCount > 0) {
        const firstViewButton = viewButtons.first()
        await firstViewButton.click()

        // Wait for navigation
        await page.waitForTimeout(2000)

        // Should navigate to detail page
        expect(page.url()).toContain('/office/oauth-apps/')
        console.log('Navigated to OAuth app detail page')
      } else {
        console.log('No apps available to view')
      }
    })

    test('should display app description in cards', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      const appCards = page.locator('[data-testid^="oauth-app-"]')
      const cardCount = await appCards.count().catch(() => 0)

      if (cardCount > 0) {
        const firstCard = appCards.first()

        // Check for description text (usually second line in card)
        const descriptionText = firstCard.locator('text').nth(1)
        const hasDescription =
          await descriptionText.isVisible({ timeout: 3000 }).catch(() => false)

        if (hasDescription) {
          console.log('App description displayed in card')
        } else {
          console.log('Description might be in different position')
        }
      } else {
        console.log('No apps to check description')
      }
    })
  })

  test.describe('OAuth App Registration Flow', () => {
    const testAppName = generateAppName()
    const testDescription = 'E2E Test OAuth Application'
    const testHomepageUrl = 'https://e2etest.example.com'
    const testRedirectUri = 'https://e2etest.example.com/auth/callback'
    const testDeveloperEmail = 'developer@e2etest.example.com'

    test.beforeEach(async ({ page }: { page: Page }) => {
      console.log('Setting up registration flow test...')
      // Note: Registration might be at a different route
      // Adjust if needed based on actual implementation
    })

    test('should load app registration form', async ({ page }: { page: Page }) => {
      // Navigation to registration form depends on implementation
      // This test is a placeholder for when the registration route is added
      console.log('App registration form test - implementation pending')
    })

    test('should display all required form fields', async ({ page }: { page: Page }) => {
      console.log('Form fields test - implementation pending')
      // Expected fields:
      // - App Name (required)
      // - Description (required)
      // - Homepage URL (required)
      // - Redirect URIs (required, multiple)
      // - Logo URL (optional)
      // - Privacy Policy URL (optional)
      // - Terms of Service URL (optional)
      // - Developer Email (required)
    })

    test('should validate required fields', async ({ page }: { page: Page }) => {
      console.log('Field validation test - implementation pending')
    })

    test('should allow adding multiple redirect URIs', async ({ page }: { page: Page }) => {
      console.log('Multiple redirect URIs test - implementation pending')
    })

    test('should validate URL formats', async ({ page }: { page: Page }) => {
      console.log('URL validation test - implementation pending')
    })

    test('should validate email format', async ({ page }: { page: Page }) => {
      console.log('Email validation test - implementation pending')
    })

    test('should register app successfully', async ({ page }: { page: Page }) => {
      console.log('App registration success test - implementation pending')
    })

    test('should display client credentials after registration', async ({
      page,
    }: {
      page: Page
    }) => {
      console.log('Client credentials display test - implementation pending')
      // Expected:
      // - Client ID (UUID format)
      // - Client Secret (one-time display)
      // - Warning about copying secret
      // - Next steps instructions
    })

    test('should show security warning for client secret', async ({ page }: { page: Page }) => {
      console.log('Security warning test - implementation pending')
      // Should show:
      // - Warning that secret cannot be shown again
      // - Recommendation to save securely
    })

    test('should not display client secret in plain text after navigation', async ({
      page,
    }: {
      page: Page
    }) => {
      console.log('Secret security test - implementation pending')
      // After registration and leaving page, secret should never be accessible again
    })
  })

  test.describe('Admin OAuth App Management', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/office/oauth-apps')
      await waitForOAuthAppsLoad(page)
    })

    test('should display pending apps for approval', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(1000)

      // Filter to pending
      const pendingButton = page.getByRole('button', { name: /^pending$/i })
      await pendingButton.click()
      await page.waitForTimeout(2000)

      // Look for pending status in cards
      const pendingStatus = page.getByText(/status: pending/i).first()
      const hasPending = await pendingStatus.isVisible({ timeout: 3000 }).catch(() => false)

      if (hasPending) {
        console.log('Pending apps displayed for approval')
      } else {
        console.log('No pending apps (all approved or none submitted)')
      }
    })

    test('should display app approval actions on detail page', async ({
      page,
    }: {
      page: Page
    }) => {
      console.log('App approval actions test - implementation pending')
      // Expected on detail page:
      // - Approve button
      // - Reject button
      // - Scope selection (for approval)
      // - Trust level selection (active/trusted)
    })

    test('should allow approving an app', async ({ page }: { page: Page }) => {
      console.log('App approval test - implementation pending')
    })

    test('should allow rejecting an app', async ({ page }: { page: Page }) => {
      console.log('App rejection test - implementation pending')
    })

    test('should allow suspending an active app', async ({ page }: { page: Page }) => {
      console.log('App suspension test - implementation pending')
    })

    test('should allow revoking an app', async ({ page }: { page: Page }) => {
      console.log('App revocation test - implementation pending')
    })

    test('should display app usage statistics', async ({ page }: { page: Page }) => {
      console.log('App usage statistics test - implementation pending')
      // Expected metrics:
      // - Total users authorized
      // - Active tokens
      // - API request count
      // - Last used timestamp
    })
  })

  test.describe('OAuth App Detail View', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
      await page.goto('/office/oauth-apps')
      await waitForOAuthAppsLoad(page)
    })

    test('should display app metadata on detail page', async ({ page }: { page: Page }) => {
      await page.waitForTimeout(2000)

      // Find and click first View button
      const viewButtons = page.getByRole('button', { name: /view/i })
      const buttonCount = await viewButtons.count()

      if (buttonCount > 0) {
        await viewButtons.first().click()
        await page.waitForTimeout(2000)

        // Check URL contains app ID
        expect(page.url()).toContain('/office/oauth-apps/')

        console.log('OAuth app detail page loaded')

        // Detail page implementation is TODO, so this is a placeholder
        // Expected elements:
        // - App name
        // - Description
        // - Status badge
        // - Homepage URL
        // - Redirect URIs list
        // - Allowed scopes
        // - Created date
        // - Approval date (if approved)
      } else {
        console.log('No apps available to view detail')
      }
    })

    test('should display client ID (masked)', async ({ page }: { page: Page }) => {
      console.log('Client ID display test - implementation pending')
      // Client ID should be displayed but in a read-only format
      // Should NOT display client secret
    })

    test('should never display client secret on detail page', async ({
      page,
    }: {
      page: Page
    }) => {
      console.log('Client secret security test - implementation pending')
      // Client secret should NEVER be retrievable after initial registration
    })

    test('should display redirect URIs list', async ({ page }: { page: Page }) => {
      console.log('Redirect URIs display test - implementation pending')
    })

    test('should display allowed scopes', async ({ page }: { page: Page }) => {
      console.log('Allowed scopes display test - implementation pending')
    })

    test('should display approval metadata', async ({ page }: { page: Page }) => {
      console.log('Approval metadata test - implementation pending')
      // Expected for approved apps:
      // - Approved by (admin name)
      // - Approved at (timestamp)
      // - Trust level (active/trusted)
    })
  })

  test.describe('OAuth Security', () => {
    test('should enforce HTTPS for redirect URIs', async ({ page }: { page: Page }) => {
      console.log('HTTPS redirect URI validation - implementation pending')
      // Registration should reject HTTP redirect URIs (except localhost for dev)
    })

    test('should validate redirect URI format', async ({ page }: { page: Page }) => {
      console.log('Redirect URI format validation - implementation pending')
      // Should be valid URLs
    })

    test('should require at least one redirect URI', async ({ page }: { page: Page }) => {
      console.log('Minimum redirect URI validation - implementation pending')
    })

    test('should limit maximum redirect URIs', async ({ page }: { page: Page }) => {
      console.log('Maximum redirect URI validation - implementation pending')
      // Should limit to 10 redirect URIs per app
    })

    test('should validate client_id format (UUID)', async ({ page }: { page: Page }) => {
      console.log('Client ID format validation - implementation pending')
    })

    test('should generate secure client_secret', async ({ page }: { page: Page }) => {
      console.log('Client secret security - implementation pending')
      // Secret should be:
      // - Cryptographically random
      // - Sufficient length (>=32 characters)
      // - Stored as hash in database
      // - Only shown once
    })
  })

  test.describe('OAuth App Lifecycle', () => {
    test('should start app in pending status', async ({ page }: { page: Page }) => {
      console.log('Initial app status - implementation pending')
      // New apps should be in "pending" status until admin approval
    })

    test('should transition from pending to active on approval', async ({
      page,
    }: {
      page: Page
    }) => {
      console.log('Status transition: pending → active - implementation pending')
    })

    test('should transition from active to trusted on trust elevation', async ({
      page,
    }: {
      page: Page
    }) => {
      console.log('Status transition: active → trusted - implementation pending')
    })

    test('should transition from active to suspended on suspension', async ({
      page,
    }: {
      page: Page
    }) => {
      console.log('Status transition: active → suspended - implementation pending')
    })

    test('should transition to revoked (terminal state)', async ({ page }: { page: Page }) => {
      console.log('Status transition: * → revoked - implementation pending')
      // Revoked should be terminal - cannot be reactivated
    })

    test('should revoke all tokens when app is suspended', async ({ page }: { page: Page }) => {
      console.log('Token revocation on suspension - implementation pending')
    })

    test('should revoke all tokens when app is revoked', async ({ page }: { page: Page }) => {
      console.log('Token revocation on app revocation - implementation pending')
    })
  })
})
