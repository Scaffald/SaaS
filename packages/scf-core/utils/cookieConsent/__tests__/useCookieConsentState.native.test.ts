import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

/**
 * Native never asks for cookie consent (#764): the hook answers with the
 * implicit state on the first render and never reads storage, so the
 * analytics gate in AuthProvider is satisfied without a banner.
 */
vi.mock('react-native', async () => {
  const actual = await vi.importActual('react-native')
  return { ...(actual as object), Platform: { OS: 'ios' } }
})

import { NATIVE_IMPLICIT_CONSENT } from '../cookieConsentStorage'
import { useCookieConsentState } from '../useCookieConsentState'

describe('useCookieConsentState on native', () => {
  it('is ready immediately with performance consent implied', async () => {
    const { result } = renderHook(() => useCookieConsentState())
    expect(result.current.isReady).toBe(true)
    expect(result.current.hasConsentedTo('performance')).toBe(true)
    expect(result.current.hasConsentedTo('strictly-necessary')).toBe(true)
    expect(result.current.hasConsentedTo('marketing')).toBe(false)
    await waitFor(() => expect(result.current.isReady).toBe(true))
  })

  it('pins the implicit state so a change is a deliberate one', () => {
    expect(NATIVE_IMPLICIT_CONSENT).toEqual({
      version: '1',
      updatedAt: '2026-09-17T00:00:00.000Z',
      selections: { 'strictly-necessary': true, performance: true },
    })
  })
})
