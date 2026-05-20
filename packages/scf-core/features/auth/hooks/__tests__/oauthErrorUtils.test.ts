import { describe, expect, it, vi } from 'vitest'

vi.mock('@react-native-google-signin/google-signin', () => ({
  statusCodes: {
    SIGN_IN_CANCELLED: 12501,
    IN_PROGRESS: 8,
    PLAY_SERVICES_NOT_AVAILABLE: 9,
    SIGN_IN_REQUIRED: 4,
  },
}))

const { normalizeOAuthError } = await import('../oauthErrorUtils')

describe('normalizeOAuthError', () => {
  it('flags Google SIGN_IN_CANCELLED as cancelled (no toast)', () => {
    const result = normalizeOAuthError({ code: 12501, name: 'CANCELLED' }, 'google')
    expect(result.isCancelled).toBe(true)
    expect(result.isInProgress).toBe(false)
    expect(result.errorCode).toBe('12501')
  })

  it('flags Google IN_PROGRESS as in-progress (silent no-op)', () => {
    const result = normalizeOAuthError({ code: 8 }, 'google')
    expect(result.isCancelled).toBe(false)
    expect(result.isInProgress).toBe(true)
  })

  it('treats unknown Google error codes as toast-worthy failures', () => {
    const result = normalizeOAuthError({ code: 9 }, 'google')
    expect(result.isCancelled).toBe(false)
    expect(result.isInProgress).toBe(false)
    expect(result.errorCode).toBe('9')
  })

  it('extracts message from Error instances', () => {
    const result = normalizeOAuthError(new Error('no ID token present'), 'google')
    expect(result.message).toBe('no ID token present')
    expect(result.errorCode).toBe('Error')
    expect(result.isCancelled).toBe(false)
  })

  it('flags Apple ERR_REQUEST_CANCELED as cancelled', () => {
    const result = normalizeOAuthError({ code: 'ERR_REQUEST_CANCELED' }, 'apple')
    expect(result.isCancelled).toBe(true)
  })

  it('treats Apple Error("No identity token...") as toast-worthy', () => {
    const result = normalizeOAuthError(
      new Error('Apple Sign In failed: No identity token received'),
      'apple'
    )
    expect(result.isCancelled).toBe(false)
    expect(result.errorCode).toBe('Error')
  })

  it('falls back to unknown for non-Error, non-coded inputs', () => {
    const result = normalizeOAuthError('boom', 'google')
    expect(result.errorCode).toBe('unknown')
    expect(result.message).toBeNull()
  })
})
