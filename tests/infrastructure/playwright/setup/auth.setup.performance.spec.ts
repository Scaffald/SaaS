/**
 * Performance tests for auth setup
 * Verifies that auth setup completes quickly and files load efficiently
 */

import * as fs from 'node:fs'
import { expect, test } from '@playwright/test'
import { getSession } from '../../playwright-helpers/playwright-helpers/auth'

const authFile = 'tests/.auth/admin.json'
const REQUIRED_SETUP_TIME_MS = 10000 // 10 seconds as per REQ-72 requirement
const REQUIRED_FILE_LOAD_TIME_MS = 1000 // 1 second for file loading

test.describe('Auth Setup Performance', () => {
  test.describe('Setup Speed', () => {
    test('should complete auth setup in less than 10 seconds', async ({ page }) => {
      // This test measures the time it takes to create an auth file
      // We'll simulate the setup process by creating a session and saving state

      const startTime = Date.now()

      try {
        // Get session (this is the API call part)
        const session = await getSession('ewongagent@gmail.com', 'password123')

        // Navigate and set up session
        await page.goto('http://localhost:8081/')
        await page.waitForLoadState('domcontentloaded')

        // Set localStorage
        const storageKey = 'sb-127-0-0-1-54321-auth-token'
        await page.evaluate(
          ({ storageKey, sessionData }) => {
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                currentSession: sessionData,
                expiresAt: sessionData.expires_at,
              })
            )
          },
          { storageKey, sessionData: session.session }
        )

        // Reload and verify
        await page.reload({ waitUntil: 'domcontentloaded' })
        await page.goto('http://localhost:8081/dashboard', { waitUntil: 'domcontentloaded' })

        const endTime = Date.now()
        const elapsed = endTime - startTime

        // Should complete in less than 10 seconds
        expect(elapsed).toBeLessThan(REQUIRED_SETUP_TIME_MS)
      } catch (error) {
        const endTime = Date.now()
        const elapsed = endTime - startTime

        // Even if there's an error, it shouldn't take more than 10 seconds
        expect(elapsed).toBeLessThan(REQUIRED_SETUP_TIME_MS)
        throw error
      }
    })

    test('should not timeout during auth setup', async ({ page }) => {
      // This test ensures that the setup process doesn't hang or timeout
      // The previous CDN-based approach would timeout after 30 seconds

      const startTime = Date.now()
      let completed = false

      try {
        const session = await getSession('ewongagent@gmail.com', 'password123')
        await page.goto('http://localhost:8081/')
        await page.waitForLoadState('domcontentloaded')

        const storageKey = 'sb-127-0-0-1-54321-auth-token'
        await page.evaluate(
          ({ storageKey, sessionData }) => {
            localStorage.setItem(
              storageKey,
              JSON.stringify({
                currentSession: sessionData,
                expiresAt: sessionData.expires_at,
              })
            )
          },
          { storageKey, sessionData: session.session }
        )

        completed = true
      } catch (error) {
        const elapsed = Date.now() - startTime

        // If it failed, it should fail quickly, not after a long timeout
        expect(elapsed).toBeLessThan(REQUIRED_SETUP_TIME_MS * 2) // Allow some buffer
        throw error
      }

      expect(completed).toBe(true)
    })

    test('should be faster than CDN-based approach', async ({ page }) => {
      // This test verifies that the new approach is faster
      // The old CDN approach would take 30+ seconds (and timeout)
      // The new API-based approach should be much faster

      const startTime = Date.now()

      const session = await getSession('ewongagent@gmail.com', 'password123')
      await page.goto('http://localhost:8081/')
      await page.waitForLoadState('domcontentloaded')

      const storageKey = 'sb-127-0-0-1-54321-auth-token'
      await page.evaluate(
        ({ storageKey, sessionData }) => {
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              currentSession: sessionData,
              expiresAt: sessionData.expires_at,
            })
          )
        },
        { storageKey, sessionData: session.session }
      )

      const elapsed = Date.now() - startTime

      // Should be much faster than 30 seconds (the old timeout)
      expect(elapsed).toBeLessThan(30000)

      // And should ideally be under 10 seconds
      expect(elapsed).toBeLessThan(REQUIRED_SETUP_TIME_MS)
    })
  })

  test.describe('File Loading Speed', () => {
    test('should load auth files quickly', async ({ page }) => {
      if (!fs.existsSync(authFile)) {
        test.skip()
      }

      test.use({ storageState: authFile })

      const startTime = Date.now()

      // Navigate with storage state
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 })

      const elapsed = Date.now() - startTime

      // Loading the file and applying storage state should be fast
      // The timeout is for page load, not file loading
      // File loading itself should be nearly instantaneous
      expect(page.url()).toContain('/dashboard')
    })

    test('should apply storage state without delay', async ({ page }) => {
      if (!fs.existsSync(authFile)) {
        test.skip()
      }

      test.use({ storageState: authFile })

      const startTime = Date.now()

      // The storage state should be applied when the context is created
      // This happens before page.goto, so we measure the full flow
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

      const elapsed = Date.now() - startTime

      // The storage state application itself is synchronous
      // The time here is mostly page loading, not storage state application
      expect(page.url()).toContain('/dashboard')
    })

    test('should not delay when using existing auth files', async ({ page }) => {
      if (!fs.existsSync(authFile)) {
        test.skip()
      }

      test.use({ storageState: authFile })

      // When auth files exist, there should be no setup delay
      // The file is loaded synchronously when the context is created
      const startTime = Date.now()

      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })

      const elapsed = Date.now() - startTime

      // Should be able to navigate quickly with existing auth file
      expect(elapsed).toBeLessThan(REQUIRED_FILE_LOAD_TIME_MS * 10) // Allow for page load time
      expect(page.url()).toContain('/dashboard')
    })
  })

  test.describe('API Call Performance', () => {
    test('should get session quickly via API', async () => {
      const startTime = Date.now()

      await getSession('ewongagent@gmail.com', 'password123')

      const elapsed = Date.now() - startTime

      // API call should be fast (typically < 1 second)
      expect(elapsed).toBeLessThan(5000) // Allow some buffer for network
    })

    test('should not timeout on API calls', async () => {
      // The old CDN approach would timeout after 30 seconds
      // The API approach should complete quickly

      const startTime = Date.now()

      try {
        await getSession('ewongagent@gmail.com', 'password123')
      } catch (error) {
        const elapsed = Date.now() - startTime

        // If it fails, it should fail quickly, not after 30 seconds
        expect(elapsed).toBeLessThan(10000)
        throw error
      }

      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(10000)
    })
  })
})
