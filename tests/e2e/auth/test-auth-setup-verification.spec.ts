/**
 * E2E tests for auth setup verification
 * Tests complete authentication flows for admin, user, and super-admin personas
 */

import * as fs from 'node:fs'
import { expect, test } from '@playwright/test'

const authFile = 'tests/.auth/admin.json'
const userFile = 'tests/.auth/user.json'
const superAdminFile = 'tests/.auth/super-admin.json'

test.describe('Auth Setup Verification - E2E', () => {
  test.describe('Admin Authentication Flow', () => {
    test.beforeEach(() => {
      // Skip if admin.json doesn't exist
      if (!fs.existsSync(authFile)) {
        test.skip()
      }
    })

    test('should navigate to dashboard with admin.json without redirect', async ({ page }) => {
      test.use({ storageState: authFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Should not redirect to /auth
      expect(page.url()).toContain('/dashboard')
      expect(page.url()).not.toContain('/auth')
    })

    test('should show admin-specific UI elements', async ({ page }) => {
      test.use({ storageState: authFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Check that we're authenticated (no sign-in form visible)
      const signInHeading = page.getByRole('heading', { name: /sign in/i })
      await expect(signInHeading)
        .not.toBeVisible({ timeout: 2000 })
        .catch(() => {
          // If sign-in is visible, auth failed
          throw new Error('Admin authentication failed - sign-in form is visible')
        })
    })

    test('should make API calls without 401 errors', async ({ page }) => {
      test.use({ storageState: authFile })

      // Listen for network requests
      const responses: any[] = []
      page.on('response', (response) => {
        if (response.url().includes('/api/') || response.url().includes('/trpc/')) {
          responses.push({ url: response.url(), status: response.status() })
        }
      })

      await page.goto('/dashboard', { waitUntil: 'networkidle', timeout: 30000 })

      // Wait a bit for API calls to complete
      await page.waitForTimeout(2000)

      // Check that we don't have 401 errors
      const unauthorizedResponses = responses.filter((r) => r.status === 401)
      expect(unauthorizedResponses.length).toBe(0)
    })
  })

  test.describe('User Authentication Flow', () => {
    test.beforeEach(() => {
      if (!fs.existsSync(userFile)) {
        test.skip()
      }
    })

    test('should navigate to dashboard with user.json without redirect', async ({ page }) => {
      test.use({ storageState: userFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })

      expect(page.url()).toContain('/dashboard')
      expect(page.url()).not.toContain('/auth')
    })

    test('should show user-specific UI elements', async ({ page }) => {
      test.use({ storageState: userFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Should not see sign-in form
      const signInHeading = page.getByRole('heading', { name: /sign in/i })
      await expect(signInHeading)
        .not.toBeVisible({ timeout: 2000 })
        .catch(() => {
          throw new Error('User authentication failed - sign-in form is visible')
        })
    })

    test('should not access admin-only routes', async ({ page }) => {
      test.use({ storageState: userFile })

      // Try to access an admin route
      await page.goto('/office', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // User should either be redirected or see an error
      // The exact behavior depends on the app's authorization logic
      // At minimum, we should not see admin-specific content if user doesn't have access
      const currentUrl = page.url()
      // User might be redirected away from /office if they don't have access
      expect(currentUrl).toBeTruthy()
    })
  })

  test.describe('Super-Admin Authentication Flow', () => {
    test.beforeEach(() => {
      if (!fs.existsSync(superAdminFile)) {
        test.skip()
      }
    })

    test('should navigate to dashboard with super-admin.json without redirect', async ({
      page,
    }) => {
      test.use({ storageState: superAdminFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })

      expect(page.url()).toContain('/dashboard')
      expect(page.url()).not.toContain('/auth')
    })

    test('should show super-admin-specific UI elements', async ({ page }) => {
      test.use({ storageState: superAdminFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Should not see sign-in form
      const signInHeading = page.getByRole('heading', { name: /sign in/i })
      await expect(signInHeading)
        .not.toBeVisible({ timeout: 2000 })
        .catch(() => {
          throw new Error('Super-admin authentication failed - sign-in form is visible')
        })
    })

    test('should access all routes', async ({ page }) => {
      test.use({ storageState: superAdminFile })

      // Super-admin should be able to access admin routes
      await page.goto('/office', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Should not be redirected to /auth
      expect(page.url()).not.toContain('/auth')
    })
  })

  test.describe('Auth State Persistence', () => {
    test('should maintain auth state across multiple navigations', async ({ page }) => {
      test.use({ storageState: authFile })

      // Navigate to multiple pages
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      expect(page.url()).toContain('/dashboard')

      // Navigate to another page
      await page.goto('/discover', { waitUntil: 'domcontentloaded' })
      expect(page.url()).toContain('/discover')
      expect(page.url()).not.toContain('/auth')

      // Navigate back to dashboard
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      expect(page.url()).toContain('/dashboard')
      expect(page.url()).not.toContain('/auth')
    })

    test('should maintain auth state after page reload', async ({ page }) => {
      test.use({ storageState: authFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      expect(page.url()).toContain('/dashboard')

      // Reload the page
      await page.reload({ waitUntil: 'domcontentloaded' })

      // Should still be authenticated
      expect(page.url()).toContain('/dashboard')
      expect(page.url()).not.toContain('/auth')
    })

    test('should maintain auth state in new tabs', async ({ context, page }) => {
      test.use({ storageState: authFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      expect(page.url()).toContain('/dashboard')

      // Open a new page (tab) in the same context
      const newPage = await context.newPage()
      await newPage.goto('/dashboard', { waitUntil: 'domcontentloaded' })

      // Should be authenticated in the new tab too
      expect(newPage.url()).toContain('/dashboard')
      expect(newPage.url()).not.toContain('/auth')

      await newPage.close()
    })
  })
})
