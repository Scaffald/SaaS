/**
 * Performance Test Helper Utilities
 *
 * Provides reusable test helpers for performance testing including
 * Core Web Vitals measurement, Lighthouse integration, and performance metrics.
 */

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Core Web Vitals metrics structure
 */
export interface WebVitalsMetrics {
  fcp?: number // First Contentful Paint (ms)
  lcp?: number // Largest Contentful Paint (ms)
  fid?: number // First Input Delay (ms)
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte (ms)
  tti?: number // Time to Interactive (ms)
}

/**
 * Performance targets from REQ-198
 */
export const PERFORMANCE_TARGETS = {
  FCP: 1000, // First Contentful Paint < 1s
  LCP: 2500, // Largest Contentful Paint < 2.5s
  FID: 100, // First Input Delay < 100ms
  CLS: 0.1, // Cumulative Layout Shift < 0.1
  TTI: 3000, // Time to Interactive < 3s
  TTFB: 800, // Time to First Byte < 800ms
} as const

/**
 * Measure Core Web Vitals using Performance Observer API
 * Returns metrics collected during page load
 */
export async function measureWebVitals(page: Page): Promise<WebVitalsMetrics> {
  return await page.evaluate(() => {
    return new Promise<WebVitalsMetrics>((resolve) => {
      const metrics: WebVitalsMetrics = {}
      let resolveCount = 0

      const resolveWhenDone = () => {
        resolveCount++
        if (resolveCount >= 3) {
          // Give extra time for LCP
          setTimeout(() => resolve(metrics), 1000)
        }
      }

      // Measure FCP (First Contentful Paint)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            metrics.fcp = Math.round(entry.startTime)
            resolveWhenDone()
          }
        }
      }).observe({ entryTypes: ['paint'] })

      // Measure LCP (Largest Contentful Paint)
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        if (lastEntry) {
          metrics.lcp = Math.round(lastEntry.startTime)
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // Measure FID (First Input Delay)
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming
          if (fidEntry.processingStart && fidEntry.startTime) {
            metrics.fid = Math.round(fidEntry.processingStart - fidEntry.startTime)
            resolveWhenDone()
          }
        }
      }).observe({ entryTypes: ['first-input'] })

      // Measure CLS (Cumulative Layout Shift)
      let clsValue = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as LayoutShift
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value
          }
        }
        metrics.cls = clsValue
      }).observe({ entryTypes: ['layout-shift'] })

      // Measure TTFB (Time to First Byte)
      const navigationEntry = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming
      if (navigationEntry) {
        metrics.ttfb = Math.round(navigationEntry.responseStart - navigationEntry.requestStart)
      }

      // Measure TTI (Time to Interactive) - approximate
      // TTI is calculated as DOMContentLoaded + 5 seconds of quiet period
      const domContentLoaded = navigationEntry?.domContentLoadedEventEnd || 0
      let quietPeriodStart = domContentLoaded
      const checkQuietPeriod = () => {
        const now = performance.now()
        if (now - quietPeriodStart >= 5000) {
          metrics.tti = Math.round(domContentLoaded)
          resolveWhenDone()
        } else {
          quietPeriodStart = now
          setTimeout(checkQuietPeriod, 1000)
        }
      }
      if (domContentLoaded > 0) {
        setTimeout(checkQuietPeriod, 1000)
      } else {
        resolveWhenDone()
      }

      // Fallback timeout
      setTimeout(() => resolve(metrics), 10000)
    })
  })
}

/**
 * Assert that Core Web Vitals meet performance targets
 */
export async function assertWebVitalsTargets(
  page: Page,
  metrics: WebVitalsMetrics,
  customTargets?: Partial<typeof PERFORMANCE_TARGETS>
): Promise<void> {
  const targets = { ...PERFORMANCE_TARGETS, ...customTargets }

  if (metrics.fcp !== undefined) {
    expect(metrics.fcp, 'FCP should be < 1s').toBeLessThan(targets.FCP)
  }

  if (metrics.lcp !== undefined) {
    expect(metrics.lcp, 'LCP should be < 2.5s').toBeLessThan(targets.LCP)
  }

  if (metrics.fid !== undefined) {
    expect(metrics.fid, 'FID should be < 100ms').toBeLessThan(targets.FID)
  }

  if (metrics.cls !== undefined) {
    expect(metrics.cls, 'CLS should be < 0.1').toBeLessThan(targets.CLS)
  }

  if (metrics.tti !== undefined) {
    expect(metrics.tti, 'TTI should be < 3s').toBeLessThan(targets.TTI)
  }

  if (metrics.ttfb !== undefined) {
    expect(metrics.ttfb, 'TTFB should be < 800ms').toBeLessThan(targets.TTFB)
  }
}

/**
 * Measure page load time
 */
export async function measurePageLoadTime(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming
    return navigationEntry
      ? Math.round(navigationEntry.loadEventEnd - navigationEntry.fetchStart)
      : 0
  })
}

/**
 * Measure resource load time for a specific resource type
 */
export async function measureResourceLoadTime(
  page: Page,
  resourceType: 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'xmlhttprequest'
): Promise<number> {
  return await page.evaluate((type) => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const filtered = resources.filter((r) => {
      const initiatorType = r.initiatorType || ''
      return (
        (type === 'script' && initiatorType === 'script') ||
        (type === 'stylesheet' && initiatorType === 'link') ||
        (type === 'image' && initiatorType === 'img') ||
        (type === 'font' && initiatorType === 'css') ||
        (type === 'fetch' && initiatorType === 'fetch') ||
        (type === 'xmlhttprequest' && initiatorType === 'xmlhttprequest')
      )
    })

    if (filtered.length === 0) return 0

    const totalTime = filtered.reduce((sum, r) => sum + (r.responseEnd - r.fetchStart), 0)
    return Math.round(totalTime / filtered.length)
  }, resourceType)
}

/**
 * Wait for page to be fully interactive
 * Checks that no network requests are in progress and DOM is ready
 */
export async function waitForPageInteractive(page: Page, timeout = 30000): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout })
  await page.waitForFunction(() => document.readyState === 'complete', { timeout })
}

/**
 * Measure JavaScript execution time
 */
export async function measureJSExecutionTime(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const navigationEntry = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming
    if (navigationEntry) {
      return Math.round(navigationEntry.domInteractive - navigationEntry.fetchStart)
    }
    return 0
  })
}

/**
 * Get performance metrics summary for a page
 */
export async function getPerformanceSummary(page: Page): Promise<{
  webVitals: WebVitalsMetrics
  loadTime: number
  jsExecutionTime: number
}> {
  const webVitals = await measureWebVitals(page)
  const loadTime = await measurePageLoadTime(page)
  const jsExecutionTime = await measureJSExecutionTime(page)

  return {
    webVitals,
    loadTime,
    jsExecutionTime,
  }
}
