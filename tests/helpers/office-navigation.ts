/**
 * Office Navigation Helpers
 *
 * Provides utilities for navigating office admin routes
 */

import type { Page } from '@playwright/test'

/**
 * Office route paths
 */
export const OFFICE_ROUTES = {
  // Main office routes
  DASHBOARD: '/office',
  APPLICATIONS: '/office/applications',
  APPLICATIONS_INDEX: '/office/applications/index',

  // User management
  USERS: '/office/users',
  USERS_INDEX: '/office/users/index',
  USER_CREATE: '/office/users/create',

  // Job management
  JOBS: '/office/jobs',
  JOBS_INDEX: '/office/jobs/index',
  JOB_CREATE: '/office/jobs/create',

  // Organization management
  ORGANIZATIONS: '/office/organizations',
  ORGANIZATIONS_INDEX: '/office/organizations/index',
  ORGANIZATION_CREATE: '/office/organizations/create',

  // University management
  UNIVERSITIES: '/office/universities',
  UNIVERSITIES_INDEX: '/office/universities/index',
  UNIVERSITY_CREATE: '/office/universities/create',
} as const

/**
 * Dynamic route builders
 */
export const buildOfficeRoute = {
  userEdit: (userId: string) => `/office/users/${userId}/edit`,
  jobEdit: (jobId: string) => `/office/jobs/${jobId}/edit`,
  jobView: (jobId: string) => `/office/jobs/${jobId}`,
  organizationEdit: (orgId: string) => `/office/organizations/${orgId}/edit`,
  organizationView: (orgId: string) => `/office/organizations/${orgId}`,
  universityEdit: (universityId: string) => `/office/universities/${universityId}/edit`,
  applicationView: (applicationId: string) => `/office/applications/${applicationId}`,
}

/**
 * Navigate to an office route
 * Waits for page load and handles common loading states
 */
export async function navigateToOfficeRoute(
  page: Page,
  route: string,
  options?: {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'
    timeout?: number
    skipLoadCheck?: boolean
  }
): Promise<void> {
  const waitUntil = options?.waitUntil ?? 'domcontentloaded'
  const timeout = options?.timeout ?? 30000

  await page.goto(route, {
    waitUntil,
    timeout,
  })

  if (!options?.skipLoadCheck) {
    await waitForPageLoad(page, { timeout })
  }
}

/**
 * Wait for page to fully load
 * Handles React/React Native Web hydration and loading states
 */
export async function waitForPageLoad(
  page: Page,
  options?: {
    timeout?: number
    checkForLoadingIndicators?: boolean
  }
): Promise<void> {
  const timeout = options?.timeout ?? 30000
  const checkForLoadingIndicators = options?.checkForLoadingIndicators ?? true

  // Wait for basic DOM content
  await page.waitForLoadState('domcontentloaded', { timeout })

  // Wait a bit for React to hydrate
  await page.waitForTimeout(500)

  if (checkForLoadingIndicators) {
    // Wait for loading spinners to disappear
    await waitForLoadingComplete(page, { timeout })
  }
}

/**
 * Wait for loading indicators to disappear
 */
export async function waitForLoadingComplete(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 10000

  try {
    // Wait for common loading indicators to disappear
    // Only target specific loading UI elements, not all text containing "loading"
    await page.locator('[role="progressbar"]')
      .or(page.locator('[aria-busy="true"]'))
      .or(page.locator('[data-loading="true"]'))
      .or(page.locator('[class*="spinner"]'))
      .or(page.locator('[class*="loading"][role="status"]'))
      .first()
      .waitFor({ state: 'hidden', timeout })
  } catch {
    // No loading indicators found or they disappeared, that's okay
  }
}

/**
 * Navigate back to previous page
 */
export async function navigateBack(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 30000

  await page.goBack({ waitUntil: 'domcontentloaded', timeout })
  await waitForPageLoad(page, { timeout })
}

/**
 * Navigate to office dashboard from any page
 */
export async function navigateToOfficeDashboard(page: Page): Promise<void> {
  await navigateToOfficeRoute(page, OFFICE_ROUTES.DASHBOARD)
}

/**
 * Check if currently on an office route
 */
export async function isOnOfficeRoute(page: Page): Promise<boolean> {
  const url = page.url()
  return url.includes('/office')
}

/**
 * Get current route path
 */
export async function getCurrentRoute(page: Page): Promise<string> {
  const url = new URL(page.url())
  return url.pathname
}

/**
 * Wait for navigation to complete
 * Useful after form submissions or button clicks
 */
export async function waitForNavigation(
  page: Page,
  options?: {
    timeout?: number
    url?: string | RegExp
  }
): Promise<void> {
  const timeout = options?.timeout ?? 30000

  await page.waitForURL(options?.url ?? '**/office/**', {
    timeout,
    waitUntil: 'domcontentloaded',
  })

  await waitForPageLoad(page, { timeout })
}

/**
 * Click a navigation link by text
 */
export async function clickNavLink(
  page: Page,
  linkText: string,
  options?: {
    exact?: boolean
    timeout?: number
    waitForLoad?: boolean
  }
): Promise<void> {
  const timeout = options?.timeout ?? 10000
  const waitForLoad = options?.waitForLoad ?? true

  const link = page.getByRole('link', {
    name: new RegExp(linkText, options?.exact ? undefined : 'i'),
  })

  if (waitForLoad) {
    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      link.click({ timeout }),
    ])
    await waitForPageLoad(page, { timeout })
  } else {
    await link.click({ timeout })
  }
}

/**
 * Click a button by text
 */
export async function clickButton(
  page: Page,
  buttonText: string,
  options?: {
    exact?: boolean
    timeout?: number
  }
): Promise<void> {
  const timeout = options?.timeout ?? 10000

  const button = page.getByRole('button', {
    name: new RegExp(buttonText, options?.exact ? undefined : 'i'),
  })

  await button.click({ timeout })
}

/**
 * Wait for a specific element to be visible
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options?: {
    timeout?: number
    state?: 'attached' | 'detached' | 'visible' | 'hidden'
  }
): Promise<void> {
  const timeout = options?.timeout ?? 10000
  const state = options?.state ?? 'visible'

  await page.locator(selector).waitFor({ state, timeout })
}

/**
 * Check if user has office access (useful for permission tests)
 */
export async function hasOfficeAccess(page: Page): Promise<boolean> {
  try {
    await navigateToOfficeRoute(page, OFFICE_ROUTES.DASHBOARD, {
      timeout: 5000,
      skipLoadCheck: true,
    })

    // Check if we're redirected away or see an access denied message
    const url = page.url()
    if (!url.includes('/office')) {
      return false
    }

    // Check for access denied messages
    const accessDenied = await page.getByText(/access denied|unauthorized|forbidden/i)
      .first()
      .isVisible()
      .catch(() => false)

    return !accessDenied
  } catch {
    return false
  }
}

/**
 * Refresh the current page
 */
export async function refreshPage(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 30000

  await page.reload({
    waitUntil: 'domcontentloaded',
    timeout,
  })

  await waitForPageLoad(page, { timeout })
}

/**
 * Dismiss any modal or dialog
 */
export async function dismissModal(
  page: Page,
  options?: { timeout?: number }
): Promise<void> {
  const timeout = options?.timeout ?? 5000

  try {
    // Try to find and click close button
    const closeButton = page.getByRole('button', { name: /close|dismiss|cancel/i })
    await closeButton.click({ timeout })
  } catch {
    // Try to click backdrop/overlay
    try {
      const backdrop = page.locator('[class*="backdrop"]')
        .or(page.locator('[class*="overlay"]'))
        .first()
      await backdrop.click({ timeout })
    } catch {
      // Try pressing Escape
      await page.keyboard.press('Escape')
    }
  }

  // Wait for modal to close
  await page.waitForTimeout(300)
}

/**
 * Scroll to bottom of page (useful for infinite scroll lists)
 */
export async function scrollToBottom(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight)
  })

  await page.waitForTimeout(500)
}

/**
 * Scroll element into view
 */
export async function scrollToElement(
  page: Page,
  selector: string
): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
}
