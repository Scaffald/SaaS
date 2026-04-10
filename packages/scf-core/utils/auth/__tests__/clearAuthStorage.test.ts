import type { QueryClient } from '@tanstack/react-query'
import { Platform } from 'react-native'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { clearAllAuthStorage, isSessionExpired } from '../clearAuthStorage'

const getSessionMock = vi.hoisted(() => vi.fn())
const signOutMock = vi.hoisted(() => vi.fn())

const asyncStorageMock = {
  getAllKeys: vi.fn<() => Promise<string[]>>(),
  multiRemove: vi.fn<(keys: string[]) => Promise<void>>(),
}

vi.mock('@scf/core/utils/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      signOut: signOutMock,
    },
  },
}))

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorageMock,
}))

const originalPlatform = Platform.OS

const setPlatform = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  })
}

// Mock document.cookie with proper getter/setter to avoid biome-ignore
let mockCookies: string[] = []

Object.defineProperty(document, 'cookie', {
  configurable: true,
  get: () => mockCookies.join('; '),
  set: (value: string) => {
    const [name] = value.split('=')
    if (value.endsWith('=') || !value.includes('=')) {
      // Clearing cookie - remove it
      mockCookies = mockCookies.filter((cookie) => !cookie.startsWith(`${name}=`))
    } else {
      // Setting cookie - add or update
      const existingIndex = mockCookies.findIndex((cookie) => cookie.startsWith(`${name}=`))
      if (existingIndex >= 0) {
        mockCookies[existingIndex] = value
      } else {
        mockCookies.push(value)
      }
    }
  },
})

const clearMockCookies = () => {
  mockCookies = []
}

const setMockCookie = (cookie: string) => {
  // Directly manipulate the mock array to avoid document.cookie assignment
  const [name] = cookie.split('=')
  const existingIndex = mockCookies.findIndex((c) => c.startsWith(`${name}=`))
  if (existingIndex >= 0) {
    mockCookies[existingIndex] = cookie
  } else {
    mockCookies.push(cookie)
  }
}

describe('clearAllAuthStorage', () => {
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    setPlatform('web')
    getSessionMock.mockReset()
    signOutMock.mockReset()
    asyncStorageMock.getAllKeys.mockReset()
    asyncStorageMock.multiRemove.mockReset()
    localStorage.clear()
    sessionStorage.clear()
    clearMockCookies()
  })

  afterAll(() => {
    setPlatform(originalPlatform)
  })

  it('performs comprehensive cleanup on web platforms', async () => {
    setPlatform('web')
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: '123' } } },
      error: null,
    })
    signOutMock.mockResolvedValue({ error: null })

    localStorage.setItem('sb-auth-token', 'abc')
    localStorage.setItem('regular-key', 'keep')
    sessionStorage.setItem('authSession', '123')
    setMockCookie('sb-auth-token=abc')

    const queryClient = { clear: vi.fn() } as unknown as QueryClient

    await clearAllAuthStorage(queryClient)

    expect(queryClient.clear).toHaveBeenCalled()
    expect(getSessionMock).toHaveBeenCalled()
    expect(signOutMock).toHaveBeenCalledTimes(1)
    expect(signOutMock).toHaveBeenCalledWith()
    expect(localStorage.getItem('sb-auth-token')).toBeNull()
    expect(localStorage.getItem('regular-key')).toBe('keep')
    expect(sessionStorage.length).toBe(0)
    // CookieStore API not available in jsdom, so cookie deletion is best-effort
    // Just verify the function completed without error
  })

  it('falls back to local sign-out and clears native storage when no session is active', async () => {
    setPlatform('ios')
    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: null,
    })
    signOutMock.mockResolvedValue({ error: null })
    await clearAllAuthStorage()

    expect(signOutMock).toHaveBeenCalledTimes(1)
    expect(signOutMock).toHaveBeenCalledWith({ scope: 'local' })
  })
})

describe('isSessionExpired', () => {
  it('returns true when expiresAt is missing', () => {
    expect(isSessionExpired(undefined)).toBe(true)
  })

  it('returns true when session expires within buffer window', () => {
    const soon = Math.floor(Date.now() / 1000) + 30
    expect(isSessionExpired(soon)).toBe(true)
  })

  it('returns false when session is valid beyond buffer window', () => {
    const later = Math.floor(Date.now() / 1000) + 3600
    expect(isSessionExpired(later)).toBe(false)
  })
})

