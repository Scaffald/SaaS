/**
 * Example Playwright test using Supabase authentication helpers
 * 
 * Usage:
 * 1. Install Playwright: pnpm add -D @playwright/test
 * 2. Run: pnpm exec playwright test
 */

import { test, expect } from '@playwright/test'
import {
  signInAsUser,
  signInAsTestUser,
  signInAsAdmin,
  getBearerToken,
  TEST_USERS,
} from './playwright-helpers/auth'

// Example: Basic login test
test.describe('Authentication', () => {
  test('should login with test user', async ({ page }) => {
    // Login using the helper
    await signInAsTestUser(page)

    // Now you can interact with authenticated pages
    await page.goto('/dashboard')
    
    // Verify user is authenticated
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should login with admin user', async ({ page }) => {
    await signInAsAdmin(page)

    // Test admin-specific features
    await page.goto('/office')
    await expect(page).toHaveURL(/office/)
  })

  test('should login with custom credentials', async ({ page }) => {
    // Login with any credentials
    await signInAsUser(page, TEST_USERS.superAdmin.email, TEST_USERS.superAdmin.password)

    await page.goto('/office')
    await expect(page).toHaveURL(/office/)
  })
})

// Example: Using bearer tokens for API testing
test.describe('API Testing', () => {
  test('should make authenticated API requests', async ({ request }) => {
    // Get a bearer token
    const token = await getBearerToken(TEST_USERS.regular.email, TEST_USERS.regular.password)

    // Make authenticated requests
    const response = await request.get('/api/user/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(response.ok()).toBeTruthy()
  })
})



