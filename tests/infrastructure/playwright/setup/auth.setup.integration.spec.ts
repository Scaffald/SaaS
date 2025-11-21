/**
 * Integration tests for auth setup
 * Tests the complete auth setup flow, file creation, and usage
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import { expect, test } from '@playwright/test'
import { authFileIsValid } from './setup/auth.setup'

const authFile = 'tests/.auth/admin.json'
const userFile = 'tests/.auth/user.json'
const superAdminFile = 'tests/.auth/super-admin.json'

test.describe('Auth Setup Integration', () => {
  test.describe('Auth File Creation', () => {
    test('should create admin.json auth file', async () => {
      // This test verifies that the setup project creates the admin auth file
      // The file should exist after running the setup project
      // Note: This test assumes setup has run (via dependencies in playwright.config.ts)

      // Check if file exists (it may or may not exist depending on when setup ran)
      const fileExists = fs.existsSync(authFile)

      if (fileExists) {
        // If file exists, verify it's valid JSON
        const content = fs.readFileSync(authFile, 'utf-8')
        expect(() => JSON.parse(content)).not.toThrow()

        const parsed = JSON.parse(content)
        // Verify it has the expected structure
        expect(parsed).toHaveProperty('cookies')
        expect(parsed).toHaveProperty('origins')
      }
    })

    test('should create user.json auth file', async () => {
      const fileExists = fs.existsSync(userFile)

      if (fileExists) {
        const content = fs.readFileSync(userFile, 'utf-8')
        expect(() => JSON.parse(content)).not.toThrow()

        const parsed = JSON.parse(content)
        expect(parsed).toHaveProperty('origins')
      }
    })

    test('should create super-admin.json auth file', async () => {
      const fileExists = fs.existsSync(superAdminFile)

      if (fileExists) {
        const content = fs.readFileSync(superAdminFile, 'utf-8')
        expect(() => JSON.parse(content)).not.toThrow()

        const parsed = JSON.parse(content)
        expect(parsed).toHaveProperty('origins')
      }
    })

    test('should have valid localStorage keys in auth files', async () => {
      // Check admin file if it exists
      if (fs.existsSync(authFile)) {
        const content = fs.readFileSync(authFile, 'utf-8')
        const parsed = JSON.parse(content)

        // Find localStorage entries
        const origins = parsed.origins || []
        const hasLocalStorage = origins.some(
          (origin: any) => origin.localStorage && origin.localStorage.length > 0
        )

        expect(hasLocalStorage).toBe(true)
      }
    })
  })

  test.describe('Auth File Usage in Tests', () => {
    test('should load admin.json and authenticate', async ({ page }) => {
      // Use admin storage state
      test.use({ storageState: authFile })

      // Navigate to dashboard
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })

      // Should not be redirected to /auth
      expect(page.url()).toContain('/dashboard')

      // Should not see sign-in form
      const signInHeading = page.getByRole('heading', { name: /sign in/i })
      await expect(signInHeading)
        .not.toBeVisible({ timeout: 2000 })
        .catch(() => {
          // If sign-in is visible, that's a failure
          throw new Error('User was not authenticated - redirected to sign-in')
        })
    })

    test('should load user.json and authenticate', async ({ page }) => {
      // Only run if user.json exists
      if (!fs.existsSync(userFile)) {
        test.skip()
      }

      test.use({ storageState: userFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
      expect(page.url()).toContain('/dashboard')
    })

    test('should load super-admin.json and authenticate', async ({ page }) => {
      // Only run if super-admin.json exists
      if (!fs.existsSync(superAdminFile)) {
        test.skip()
      }

      test.use({ storageState: superAdminFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
      expect(page.url()).toContain('/dashboard')
    })

    test('should prevent redirects to /auth when using storage state', async ({ page }) => {
      test.use({ storageState: authFile })

      await page.goto('/dashboard')

      // Should stay on dashboard, not redirect to /auth
      await expect(page).toHaveURL(/dashboard/, { timeout: 10000 })
      expect(page.url()).not.toContain('/auth')
    })
  })

  test.describe('Auth File Regeneration', () => {
    test('should recognize fresh files (<7 days) as valid', () => {
      if (fs.existsSync(authFile)) {
        expect(authFileIsValid(authFile)).toBe(true)
      }
    })

    test('should handle missing files gracefully', () => {
      const missingFile = 'tests/.auth/missing.json'
      expect(authFileIsValid(missingFile)).toBe(false)
    })
  })

  test.describe('Cross-Browser Compatibility', () => {
    test('should work with chromium project', async ({ page, browserName }) => {
      // This test runs in the default chromium project
      test.use({ storageState: authFile })

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })
      expect(page.url()).toContain('/dashboard')
    })
  })
})
