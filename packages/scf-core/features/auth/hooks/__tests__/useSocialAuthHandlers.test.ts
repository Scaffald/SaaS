import { renderHook, act } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const captureEventMock = vi.hoisted(() => vi.fn())
const signInWithOAuthMock = vi.hoisted(() => vi.fn())
const toastShowMock = vi.hoisted(() => vi.fn())
const loggerErrorMock = vi.hoisted(() => vi.fn())

vi.mock('@scf/core/utils/analytics/client', () => ({
  captureEvent: captureEventMock,
}))

vi.mock('@scf/core/utils/supabase/client', () => ({
  supabase: {
    auth: { signInWithOAuth: signInWithOAuthMock },
  },
}))

vi.mock('@scf/core/utils/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@scaffald/ui', () => ({
  useToast: () => ({ show: toastShowMock }),
}))

vi.mock('@scf/core', () => ({
  logger: { error: loggerErrorMock },
}))

const ORIGINAL_URL = process.env.EXPO_PUBLIC_URL

describe('useSocialAuthHandlers (web)', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_URL = 'https://app.scaffald.com'
  })

  afterEach(() => {
    vi.clearAllMocks()
    if (ORIGINAL_URL === undefined) {
      delete process.env.EXPO_PUBLIC_URL
    } else {
      process.env.EXPO_PUBLIC_URL = ORIGINAL_URL
    }
  })

  it('calls supabase.auth.signInWithOAuth with normalized redirect URL for Google', async () => {
    signInWithOAuthMock.mockResolvedValueOnce({ data: { url: 'https://google.example' }, error: null })
    const { useSocialAuthHandlers } = await import('../useSocialAuthHandlers')
    const { result } = renderHook(() => useSocialAuthHandlers())

    await act(async () => {
      await result.current.onGooglePress()
    })

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://app.scaffald.com/auth/callback' },
    })
    expect(captureEventMock).toHaveBeenCalledWith('auth_social_sign_in_started', { provider: 'google' })
    expect(captureEventMock).toHaveBeenCalledWith('auth_social_sign_in_initiated', { provider: 'google' })
    expect(toastShowMock).not.toHaveBeenCalled()
  })

  it('strips trailing slash from EXPO_PUBLIC_URL before appending /auth/callback', async () => {
    process.env.EXPO_PUBLIC_URL = 'https://app.scaffald.com/'
    signInWithOAuthMock.mockResolvedValueOnce({ data: { url: 'x' }, error: null })
    const { useSocialAuthHandlers } = await import('../useSocialAuthHandlers')
    const { result } = renderHook(() => useSocialAuthHandlers())

    await act(async () => {
      await result.current.onGooglePress()
    })

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://app.scaffald.com/auth/callback' },
    })
  })

  it('falls back to undefined redirectTo when EXPO_PUBLIC_URL is unset', async () => {
    delete process.env.EXPO_PUBLIC_URL
    signInWithOAuthMock.mockResolvedValueOnce({ data: { url: 'x' }, error: null })
    const { useSocialAuthHandlers } = await import('../useSocialAuthHandlers')
    const { result } = renderHook(() => useSocialAuthHandlers())

    await act(async () => {
      await result.current.onGooglePress()
    })

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: undefined },
    })
  })

  it('shows toast + captures failure event when Google sign-in returns sync error', async () => {
    signInWithOAuthMock.mockResolvedValueOnce({
      data: { url: null },
      error: { name: 'AuthApiError', message: 'provider not enabled' },
    })
    const { useSocialAuthHandlers } = await import('../useSocialAuthHandlers')
    const { result } = renderHook(() => useSocialAuthHandlers())

    await act(async () => {
      await result.current.onGooglePress()
    })

    expect(toastShowMock).toHaveBeenCalledWith({
      message: 'auth.errors.googleSignInFailed',
      variant: 'error',
      duration: 5000,
    })
    expect(captureEventMock).toHaveBeenCalledWith('auth_social_sign_in_failed', {
      provider: 'google',
      error_code: 'AuthApiError',
      message: 'provider not enabled',
    })
    expect(captureEventMock).not.toHaveBeenCalledWith(
      'auth_social_sign_in_initiated',
      expect.anything()
    )
  })

  it('shows the Apple toast when Apple sign-in returns sync error', async () => {
    signInWithOAuthMock.mockResolvedValueOnce({
      data: { url: null },
      error: { name: 'AuthApiError', message: 'apple disabled' },
    })
    const { useSocialAuthHandlers } = await import('../useSocialAuthHandlers')
    const { result } = renderHook(() => useSocialAuthHandlers())

    await act(async () => {
      await result.current.onApplePress()
    })

    expect(toastShowMock).toHaveBeenCalledWith({
      message: 'auth.errors.appleSignInFailed',
      variant: 'error',
      duration: 5000,
    })
  })
})
