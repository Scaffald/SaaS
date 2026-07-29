import { renderHook, act, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const captureEventMock = vi.hoisted(() => vi.fn())
const getUserIdentitiesMock = vi.hoisted(() => vi.fn())
const linkIdentityMock = vi.hoisted(() => vi.fn())
const unlinkIdentityMock = vi.hoisted(() => vi.fn())
const loggerErrorMock = vi.hoisted(() => vi.fn())

vi.mock('@scf/core/utils/analytics/client', () => ({
  captureEvent: captureEventMock,
}))

vi.mock('@scf/core/utils/supabase/client', () => ({
  supabase: {
    auth: {
      getUserIdentities: getUserIdentitiesMock,
      linkIdentity: linkIdentityMock,
      unlinkIdentity: unlinkIdentityMock,
    },
  },
}))

vi.mock('@scf/core', () => ({
  logger: { error: loggerErrorMock },
}))

const ORIGINAL_URL = process.env.EXPO_PUBLIC_URL

const sampleIdentity = (provider: string) => ({
  identity_id: `${provider}-id`,
  user_id: 'user-1',
  identity_data: { email: `${provider}@example.com` },
  provider,
  created_at: '2026-05-20T00:00:00Z',
  last_sign_in_at: '2026-05-20T00:00:00Z',
  updated_at: '2026-05-20T00:00:00Z',
})

describe('useConnectedAccounts', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_URL = 'https://scaffald.com'
    getUserIdentitiesMock.mockResolvedValue({
      data: { identities: [sampleIdentity('email'), sampleIdentity('google')] },
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    if (ORIGINAL_URL === undefined) delete process.env.EXPO_PUBLIC_URL
    else process.env.EXPO_PUBLIC_URL = ORIGINAL_URL
  })

  it('loads identities on mount', async () => {
    const { useConnectedAccounts } = await import('../useConnectedAccounts')
    const { result } = renderHook(() => useConnectedAccounts())

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.identities).toHaveLength(2)
    expect(result.current.identities[0].provider).toBe('email')
    expect(result.current.identities[1].provider).toBe('google')
  })

  it('isLastIdentity is true when only one identity remains', async () => {
    getUserIdentitiesMock.mockResolvedValueOnce({
      data: { identities: [sampleIdentity('email')] },
      error: null,
    })
    const { useConnectedAccounts } = await import('../useConnectedAccounts')
    const { result } = renderHook(() => useConnectedAccounts())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isLastIdentity(result.current.identities[0])).toBe(true)
  })

  it('isLastIdentity is false when multiple identities exist', async () => {
    const { useConnectedAccounts } = await import('../useConnectedAccounts')
    const { result } = renderHook(() => useConnectedAccounts())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isLastIdentity(result.current.identities[0])).toBe(false)
  })

  it('link() calls supabase.auth.linkIdentity with normalized redirect', async () => {
    linkIdentityMock.mockResolvedValueOnce({ data: { url: 'x' }, error: null })
    const { useConnectedAccounts } = await import('../useConnectedAccounts')
    const { result } = renderHook(() => useConnectedAccounts())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let res: { ok: boolean; error?: string } = { ok: false }
    await act(async () => {
      res = await result.current.link('google')
    })

    expect(res.ok).toBe(true)
    expect(linkIdentityMock).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://scaffald.com/dashboard/settings?linked=success' },
    })
    expect(captureEventMock).toHaveBeenCalledWith('auth_identity_link_started', {
      provider: 'google',
    })
    expect(captureEventMock).toHaveBeenCalledWith('auth_identity_link_initiated', {
      provider: 'google',
    })
  })

  it('link() surfaces supabase errors without redirecting', async () => {
    linkIdentityMock.mockResolvedValueOnce({
      data: { url: null },
      error: { name: 'AuthApiError', message: 'manual linking disabled' },
    })
    const { useConnectedAccounts } = await import('../useConnectedAccounts')
    const { result } = renderHook(() => useConnectedAccounts())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let res: { ok: boolean; error?: string } = { ok: true }
    await act(async () => {
      res = await result.current.link('google')
    })

    expect(res.ok).toBe(false)
    expect(res.error).toBe('manual linking disabled')
    expect(captureEventMock).toHaveBeenCalledWith('auth_identity_link_failed', {
      provider: 'google',
      error_code: 'AuthApiError',
      message: 'manual linking disabled',
    })
  })

  it('unlink() calls supabase.auth.unlinkIdentity and refreshes identities', async () => {
    unlinkIdentityMock.mockResolvedValueOnce({ data: {}, error: null })
    const { useConnectedAccounts } = await import('../useConnectedAccounts')
    const { result } = renderHook(() => useConnectedAccounts())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(getUserIdentitiesMock).toHaveBeenCalledTimes(1)

    let res: { ok: boolean; error?: string } = { ok: false }
    await act(async () => {
      res = await result.current.unlink(result.current.identities[1])
    })

    expect(res.ok).toBe(true)
    expect(unlinkIdentityMock).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'google' })
    )
    expect(captureEventMock).toHaveBeenCalledWith('auth_identity_unlink_succeeded', {
      provider: 'google',
    })
    expect(getUserIdentitiesMock).toHaveBeenCalledTimes(2)
  })

  it('unlink() captures failure event and does not refresh on error', async () => {
    unlinkIdentityMock.mockResolvedValueOnce({
      data: {},
      error: { name: 'AuthApiError', message: 'cannot unlink last identity' },
    })
    const { useConnectedAccounts } = await import('../useConnectedAccounts')
    const { result } = renderHook(() => useConnectedAccounts())
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    let res: { ok: boolean; error?: string } = { ok: true }
    await act(async () => {
      res = await result.current.unlink(result.current.identities[1])
    })

    expect(res.ok).toBe(false)
    expect(captureEventMock).toHaveBeenCalledWith('auth_identity_unlink_failed', {
      provider: 'google',
      error_code: 'AuthApiError',
      message: 'cannot unlink last identity',
    })
    // No refresh after failure — count stays at the initial mount fetch.
    expect(getUserIdentitiesMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces error state when getUserIdentities fails', async () => {
    getUserIdentitiesMock.mockResolvedValueOnce({
      data: null,
      error: { name: 'AuthApiError', message: 'unauthorized' },
    })
    const { useConnectedAccounts } = await import('../useConnectedAccounts')
    const { result } = renderHook(() => useConnectedAccounts())
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toBe('unauthorized')
    expect(result.current.identities).toEqual([])
  })
})
