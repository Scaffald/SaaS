/**
 * Core Web Vitals Testing
 *
 * Tests for Core Web Vitals measurement and validation.
 * Validates that all Core Web Vitals meet REQ-198 targets:
 * - Time to Interactive (TTI): < 3s
 * - First Contentful Paint (FCP): < 1s
 * - Largest Contentful Paint (LCP): < 2.5s
 * - Cumulative Layout Shift (CLS): < 0.1
 * - First Input Delay (FID): < 100ms
 *
 * Task 5: Optimize Web Performance and Core Web Vitals
 */

import { expect, test } from '@playwright/test'
import {
  assertWebVitalsTargets,
  measureWebVitals,
  PERFORMANCE_TARGETS,
  type WebVitalsMetrics,
} from '../infrastructure/playwright/helpers/performance'

/**
 * Key pages to test Core Web Vitals
 */
const TEST_PAGES = [
  { path: '/', name: 'Home' },
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/dashboard/profile/general', name: 'Profile General' },
  { path: '/dashboard/discover/workers', name: 'Discover Workers' },
  { path: '/dashboard/discover/jobs', name: 'Discover Jobs' },
  { path: '/dashboard/discover/employers', name: 'Discover Employers' },
  { path: '/dashboard/discover/map', name: 'Discover Map' },
]

test.describe('Core Web Vitals Testing', () => {
  for (const { path, name } of TEST_PAGES) {
    test.describe(name, () => {
      test('measures and validates Core Web Vitals', async ({ page }) => {
        // Navigate to page
        await page.goto(path, { waitUntil: 'networkidle' })

        // Wait for page to be fully interactive
        await page.waitForLoadState('domcontentloaded')
        await page.waitForTimeout(3000) // Allow time for LCP and layout shifts

        // Measure Core Web Vitals
        const metrics = await measureWebVitals(page)

        // Log metrics for debugging
        console.log(`${name} Web Vitals:`, metrics)

        // Validate metrics meet targets
        await assertWebVitalsTargets(page, metrics)
      })

      test('First Contentful Paint (FCP) < 1s', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await page.waitForTimeout(2000)

        const metrics = await measureWebVitals(page)

        if (metrics.fcp !== undefined) {
          expect(metrics.fcp, `FCP should be < ${PERFORMANCE_TARGETS.FCP}ms`).toBeLessThan(
            PERFORMANCE_TARGETS.FCP
          )
        }
      })

      test('Largest Contentful Paint (LCP) < 2.5s', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await page.waitForTimeout(3000) // LCP needs more time

        const metrics = await measureWebVitals(page)

        if (metrics.lcp !== undefined) {
          expect(metrics.lcp, `LCP should be < ${PERFORMANCE_TARGETS.LCP}ms`).toBeLessThan(
            PERFORMANCE_TARGETS.LCP
          )
        }
      })

      test('Cumulative Layout Shift (CLS) < 0.1', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await page.waitForTimeout(3000) // Allow time for layout shifts

        const metrics = await measureWebVitals(page)

        if (metrics.cls !== undefined) {
          expect(metrics.cls, `CLS should be < ${PERFORMANCE_TARGETS.CLS}`).toBeLessThan(
            PERFORMANCE_TARGETS.CLS
          )
        }
      })

      test('Time to Interactive (TTI) < 3s', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await page.waitForTimeout(5000) // TTI needs quiet period

        const metrics = await measureWebVitals(page)

        if (metrics.tti !== undefined) {
          expect(metrics.tti, `TTI should be < ${PERFORMANCE_TARGETS.TTI}ms`).toBeLessThan(
            PERFORMANCE_TARGETS.TTI
          )
        }
      })

      test('First Input Delay (FID) < 100ms', async ({ page }) => {
        await page.goto(path, { waitUntil: 'networkidle' })
        await page.waitForTimeout(2000)

        // Trigger first input
        const firstClickable = page.locator('a, button, input, select').first()
        if ((await firstClickable.count()) > 0) {
          await firstClickable.click()
          await page.waitForTimeout(1000)
        }

        const metrics = await measureWebVitals(page)

        if (metrics.fid !== undefined) {
          expect(metrics.fid, `FID should be < ${PERFORMANCE_TARGETS.FID}ms`).toBeLessThan(
            PERFORMANCE_TARGETS.FID
          )
        }
      })
    })
  }
})
