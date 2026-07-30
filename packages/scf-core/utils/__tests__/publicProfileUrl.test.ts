import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getPublicProfileDisplayUrl,
  getPublicProfilePath,
  getPublicProfileShareUrl,
  resolvePublicOrigin,
} from '../publicProfileUrl'

const APEX = 'https://scaffald.com'

describe('getPublicProfilePath', () => {
  it('matches the real route, not the retired /u/ form', () => {
    // /u/:slug had no matching route and produced "Unmatched route" (SC-74).
    expect(getPublicProfilePath('eric')).toBe('/users/eric')
  })
})

describe('resolvePublicOrigin', () => {
  const originalUrl = process.env.EXPO_PUBLIC_URL

  afterEach(() => {
    if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_URL
    else process.env.EXPO_PUBLIC_URL = originalUrl
    vi.restoreAllMocks()
  })

  /**
   * These run under jsdom, so Platform.OS is 'web' and window exists — the
   * branch that matters for the clipboard bug this replaced.
   */
  it('uses the current window origin on web', () => {
    expect(resolvePublicOrigin()).toBe(window.location.origin)
  })

  it('returns an absolute url, unlike getBaseUrl which is empty on web', () => {
    // The whole point: getBaseUrl() returns '' on web so callers navigate
    // same-origin. Copying that to a clipboard yields a bare "/users/eric",
    // which is useless to whoever receives it.
    const url = getPublicProfileShareUrl('eric')
    expect(url).toMatch(/^https?:\/\//)
    expect(url.endsWith('/users/eric')).toBe(true)
  })
})

describe('getPublicProfileDisplayUrl', () => {
  it('drops the scheme but keeps host and path', () => {
    const display = getPublicProfileDisplayUrl('eric')
    expect(display).not.toMatch(/^https?:\/\//)
    expect(display.endsWith('/users/eric')).toBe(true)
  })

  it('agrees with the share url apart from the scheme', () => {
    expect(getPublicProfileDisplayUrl('eric')).toBe(
      getPublicProfileShareUrl('eric').replace(/^https?:\/\//, '')
    )
  })
})

describe('native origin resolution', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('react-native', async () => {
      const actual = await vi.importActual<typeof import('react-native')>('react-native')
      return { ...actual, Platform: { ...actual.Platform, OS: 'ios' } }
    })
  })

  afterEach(() => {
    vi.doUnmock('react-native')
    vi.resetModules()
    delete process.env.EXPO_PUBLIC_URL
  })

  it('reads EXPO_PUBLIC_URL and strips a trailing slash', async () => {
    process.env.EXPO_PUBLIC_URL = 'https://dev.scaffald.com/'
    const mod = await import('../publicProfileUrl')

    expect(mod.resolvePublicOrigin()).toBe('https://dev.scaffald.com')
    expect(mod.getPublicProfileShareUrl('eric')).toBe('https://dev.scaffald.com/users/eric')
  })

  it('falls back to the apex when EXPO_PUBLIC_URL is unset', async () => {
    delete process.env.EXPO_PUBLIC_URL
    const mod = await import('../publicProfileUrl')

    expect(mod.resolvePublicOrigin()).toBe(APEX)
  })
})
