/**
 * Referral Tracking Unit Tests
 * REQ-128: Flexible Invitation System
 *
 * These are unit tests for client-side referral tracking utilities.
 * We mock browser APIs (localStorage, document.cookie) since these
 * are external to our code.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('Referral Tracking', () => {
  // Store for our mock localStorage
  let localStorageStore: Record<string, string> = {}
  let documentCookieValue = ''

  // Save original values
  const originalWindow = global.window
  const originalDocument = global.document
  const originalLocalStorage = global.localStorage

  beforeEach(async () => {
    // Reset stores
    localStorageStore = {}
    documentCookieValue = ''

    // Reset module cache to get fresh imports
    vi.resetModules()

    // Create mock localStorage
    const localStorageMock = {
      getItem: (key: string) => localStorageStore[key] || null,
      setItem: (key: string, value: string) => {
        localStorageStore[key] = value
      },
      removeItem: (key: string) => {
        delete localStorageStore[key]
      },
      clear: () => {
        localStorageStore = {}
      },
      length: 0,
      key: vi.fn(),
    }

    // Mock global localStorage (used by the code directly)
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    })

    // Mock window with our localStorage
    Object.defineProperty(global, 'window', {
      value: {
        location: {
          href: 'https://forsured.com/signup',
          search: '',
        },
        localStorage: localStorageMock,
      },
      writable: true,
      configurable: true,
    })

    // Mock document with cookie getter/setter
    Object.defineProperty(global, 'document', {
      value: {
        get cookie() {
          return documentCookieValue
        },
        set cookie(value: string) {
          // Parse and store cookie (simplified)
          if (value.includes('max-age=0')) {
            // Cookie being deleted
            documentCookieValue = documentCookieValue
              .split(';')
              .filter((c) => !c.trim().startsWith('fs_ref='))
              .join(';')
          } else {
            const cookiePart = value.split(';')[0]
            if (documentCookieValue) {
              documentCookieValue += '; ' + cookiePart
            } else {
              documentCookieValue = cookiePart
            }
          }
        },
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Restore originals
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(global, 'document', {
      value: originalDocument,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    })
  })

  describe('captureReferral', () => {
    it('should capture referral from URL params', async () => {
      // Set up URL with referral params
      global.window.location.search = '?ref=ABC12345&type=client'
      global.window.location.href = 'https://forsured.com/signup?ref=ABC12345&type=client'

      // Import fresh module
      const { captureReferral, getStoredReferral } = await import('../referralTracking')

      captureReferral()

      // Check localStorage was updated
      expect(localStorageStore['fs_referral']).toBeDefined()

      // Parse and verify
      const stored = JSON.parse(localStorageStore['fs_referral'])
      expect(stored.code).toBe('ABC12345')
      expect(stored.type).toBe('client')
    })

    it('should uppercase referral code', async () => {
      global.window.location.search = '?ref=abc12345'
      global.window.location.href = 'https://forsured.com/signup?ref=abc12345'

      const { captureReferral } = await import('../referralTracking')

      captureReferral()

      const stored = JSON.parse(localStorageStore['fs_referral'])
      expect(stored.code).toBe('ABC12345')
    })

    it('should do nothing without ref param', async () => {
      global.window.location.search = '?other=value'

      const { captureReferral } = await import('../referralTracking')

      captureReferral()

      expect(localStorageStore['fs_referral']).toBeUndefined()
    })

    it('should set cookie with referral code', async () => {
      global.window.location.search = '?ref=COOKIE123'
      global.window.location.href = 'https://forsured.com/signup?ref=COOKIE123'

      const { captureReferral } = await import('../referralTracking')

      captureReferral()

      expect(documentCookieValue).toContain('fs_ref=COOKIE123')
    })
  })

  describe('getStoredReferral', () => {
    it('should return null when no referral stored', async () => {
      const { getStoredReferral } = await import('../referralTracking')

      const stored = getStoredReferral()

      expect(stored).toBeNull()
    })

    it('should return stored referral data', async () => {
      const referralData = {
        code: 'TEST123',
        type: 'broker',
        timestamp: Date.now(),
        landingUrl: 'https://forsured.com/',
      }
      localStorageStore['fs_referral'] = JSON.stringify(referralData)

      const { getStoredReferral } = await import('../referralTracking')

      const stored = getStoredReferral()

      expect(stored).toEqual(referralData)
    })

    it('should return null for expired referral (> 30 days)', async () => {
      const oldTimestamp = Date.now() - 31 * 24 * 60 * 60 * 1000 // 31 days ago
      const referralData = {
        code: 'EXPIRED',
        timestamp: oldTimestamp,
      }
      localStorageStore['fs_referral'] = JSON.stringify(referralData)

      const { getStoredReferral } = await import('../referralTracking')

      const stored = getStoredReferral()

      expect(stored).toBeNull()
      // Should have cleared the expired referral
      expect(localStorageStore['fs_referral']).toBeUndefined()
    })

    it('should return referral if within 30 days', async () => {
      const recentTimestamp = Date.now() - 29 * 24 * 60 * 60 * 1000 // 29 days ago
      const referralData = {
        code: 'VALID',
        timestamp: recentTimestamp,
      }
      localStorageStore['fs_referral'] = JSON.stringify(referralData)

      const { getStoredReferral } = await import('../referralTracking')

      const stored = getStoredReferral()

      expect(stored).not.toBeNull()
      expect(stored?.code).toBe('VALID')
    })
  })

  describe('getReferralFromCookie', () => {
    it('should return referral code from cookie', async () => {
      documentCookieValue = 'other=value; fs_ref=FROMCOOKIE; another=test'

      const { getReferralFromCookie } = await import('../referralTracking')

      const code = getReferralFromCookie()

      expect(code).toBe('FROMCOOKIE')
    })

    it('should return null when cookie not present', async () => {
      documentCookieValue = 'other=value'

      const { getReferralFromCookie } = await import('../referralTracking')

      const code = getReferralFromCookie()

      expect(code).toBeNull()
    })
  })

  describe('clearReferral', () => {
    it('should clear localStorage and cookie', async () => {
      localStorageStore['fs_referral'] = JSON.stringify({ code: 'CLEAR' })
      documentCookieValue = 'fs_ref=CLEAR'

      const { clearReferral } = await import('../referralTracking')

      clearReferral()

      expect(localStorageStore['fs_referral']).toBeUndefined()
      // Cookie should no longer contain fs_ref
      expect(documentCookieValue).not.toContain('fs_ref=CLEAR')
    })
  })
})

describe('Referral Tracking - Server Side', () => {
  beforeEach(() => {
    vi.resetModules()
    // Simulate server-side (no window)
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('should handle server-side gracefully', async () => {
    const { captureReferral, getStoredReferral, clearReferral, getReferralFromCookie } =
      await import('../referralTracking')

    // These should not throw
    expect(() => captureReferral()).not.toThrow()
    expect(getStoredReferral()).toBeNull()
    expect(getReferralFromCookie()).toBeNull()
    expect(() => clearReferral()).not.toThrow()
  })
})
