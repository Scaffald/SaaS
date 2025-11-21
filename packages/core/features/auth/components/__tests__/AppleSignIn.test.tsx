import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithOAuthMock = vi.hoisted(() => vi.fn())
const captureEventMock = vi.hoisted(() => vi.fn())

vi.mock('tamagui', () => ({
  Theme: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Button: ({ children, onPress }: { children: ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  ),
}))

vi.mock('@app/core/utils/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithOAuth: signInWithOAuthMock,
    },
  },
}))

vi.mock('@app/core/utils/analytics/client', () => ({
  captureEvent: captureEventMock,
}))

vi.mock('../IconApple', () => ({
  IconApple: () => <span data-testid="apple-icon" />,
}))

const { AppleSignIn } = await import('../AppleSignIn')

describe('AppleSignIn', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_URL = 'https://example.com/auth'
    signInWithOAuthMock.mockReset()
    captureEventMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('invokes supabase OAuth sign-in with Apple provider', () => {
    signInWithOAuthMock.mockResolvedValue({ error: null })
    render(<AppleSignIn />)

    fireEvent.click(screen.getByRole('button', { name: /login with apple/i }))

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'apple',
      options: { redirectTo: 'https://example.com/auth' },
    })
  })

  it('logs an error when OAuth sign-in fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('Apple OAuth failed')
    signInWithOAuthMock.mockResolvedValue({ error })

    render(<AppleSignIn />)
    fireEvent.click(screen.getByRole('button', { name: /login with apple/i }))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Apple Sign-In Error:', error)
    })
  })
})
