import React from 'react'
import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

type SessionContextValue = {
  session: { id: string } | null
  error: unknown
  isLoading: boolean
  supabaseClient: { client: boolean }
  signOut: () => Promise<void> | void
  clearAuth: () => Promise<void> | void
  refreshSession: () => Promise<void> | void
} | null

const MockSessionContext = React.createContext<SessionContextValue>(null)

vi.mock('../client', () => ({
  supabase: { client: true },
}))

vi.mock('@scf/core/provider/auth/AuthProvider', () => ({
  SessionContext: MockSessionContext,
}))

describe('useSessionContext', () => {
  beforeEach(() => {
    ;(globalThis as Record<string, unknown>).__DEV__ = true
  })

  it('returns provider value when present', async () => {
    const { useSessionContext } = await import('../useSessionContext')
    const providerValue = {
      session: { id: 'abc' },
      error: null,
      isLoading: false,
      supabaseClient: { client: true },
      signOut: vi.fn(),
      clearAuth: vi.fn(),
      refreshSession: vi.fn(),
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MockSessionContext.Provider value={providerValue}>{children}</MockSessionContext.Provider>
    )

    const { result } = renderHook(() => useSessionContext(), { wrapper })

    expect(result.current).toBe(providerValue)
  })

  it('provides fallback context and warns in dev when missing provider', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { useSessionContext } = await import('../useSessionContext')

    const { result } = renderHook(() => useSessionContext())

    expect(result.current.session).toBeNull()
    expect(result.current.isLoading).toBe(true)
    expect(result.current.supabaseClient).toEqual({ client: true })

    await result.current.signOut()
    await result.current.clearAuth()
    await result.current.refreshSession()

    expect(warnSpy).toHaveBeenCalledTimes(4)
    expect(warnSpy).toHaveBeenCalledWith(
      '[useSessionContext] SessionContext provider missing. Returning fallback context to avoid runtime crash.',
    )
  })
})
