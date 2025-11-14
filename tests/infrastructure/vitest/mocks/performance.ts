/**
 * Performance Mock Utilities for Vitest
 *
 * Provides mocks for performance APIs used in unit tests.
 */

/**
 * Mock PerformanceObserver for unit tests
 */
export function createMockPerformanceObserver() {
  return class MockPerformanceObserver {
    observe() {
      // No-op
    }
    disconnect() {
      // No-op
    }
    takeRecords() {
      return []
    }
  }
}

/**
 * Mock performance timing for unit tests
 */
export function createMockPerformanceTiming() {
  return {
    fetchStart: 0,
    responseStart: 100,
    responseEnd: 200,
    domContentLoadedEventEnd: 500,
    loadEventEnd: 1000,
  } as PerformanceNavigationTiming
}

/**
 * Setup performance mocks for tests
 */
export function setupPerformanceMocks() {
  if (typeof global !== 'undefined') {
    // Mock PerformanceObserver if not available
    if (typeof (global as unknown as { PerformanceObserver?: unknown }).PerformanceObserver === 'undefined') {
      (global as unknown as { PerformanceObserver: unknown }).PerformanceObserver = createMockPerformanceObserver()
    }

    // Mock performance.getEntriesByType if not available
    if (typeof performance !== 'undefined') {
      const originalGetEntriesByType = performance.getEntriesByType.bind(performance)
      performance.getEntriesByType = function (type: string) {
        if (type === 'navigation') {
          return [createMockPerformanceTiming()]
        }
        return originalGetEntriesByType(type)
      }
    }
  }
}

