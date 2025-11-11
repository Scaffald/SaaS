import type { ReactNode } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const signInWithOAuthMock = vi.hoisted(() => vi.fn())
const captureEventMock = vi.hoisted(() => vi.fn())

vi.mock('tamagui', () => ({
  Theme: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Button: ({
    children,
    onPress,
  }: {
    children: ReactNode
    onPress?: () => void
  }) => (
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

vi.mock('../IconGoogle', () => ({
  IconGoogle: () => <span data-testid="google-icon" />,
}))

const { GoogleSignIn } = await import('../GoogleSignIn')

describe('GoogleSignIn', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_URL = 'https://example.com/auth'
    signInWithOAuthMock.mockReset()
    captureEventMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('invokes supabase OAuth sign-in with Google provider', async () => {
    signInWithOAuthMock.mockResolvedValue({ error: null })
    render(<GoogleSignIn />)

    fireEvent.click(screen.getByRole('button', { name: /login with google/i }))

    expect(signInWithOAuthMock).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://example.com/auth' },
    })
  })

  it('logs an error when OAuth sign-in fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('OAuth failed')
    signInWithOAuthMock.mockResolvedValue({ error })

    render(<GoogleSignIn />)
    fireEvent.click(screen.getByRole('button', { name: /login with google/i }))

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Google Sign-In Error:', error)
    })
  })
})

