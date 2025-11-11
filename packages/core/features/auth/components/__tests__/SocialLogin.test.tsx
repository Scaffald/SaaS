import '@testing-library/jest-dom/vitest'
import type { ReactNode } from 'react'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

async function renderSocialLogin(isWeb: boolean) {
  vi.resetModules()

  vi.doMock('tamagui', async () => {
    const actual = await vi.importActual<typeof import('tamagui')>('tamagui')

    const MockYStack = ({ children }: { children: ReactNode }) => (
      <div data-testid="y-stack">{children}</div>
    )
    const MockXStack = ({ children }: { children: ReactNode }) => (
      <div data-testid="social-login-stack">{children}</div>
    )

    return {
      ...actual,
      isWeb,
      YStack: MockYStack,
      XStack: MockXStack,
      Separator: ({ children }: { children?: ReactNode }) => (
        <div data-testid="separator">{children}</div>
      ),
      SizableText: ({ children }: { children: ReactNode }) => (
        <span data-testid="sizable-text">{children}</span>
      ),
    }
  })

  vi.doMock('../AppleSignIn', () => ({
    AppleSignIn: () => <div data-testid="apple-sign-in" />,
  }))

  vi.doMock('../GoogleSignIn', () => ({
    GoogleSignIn: () => <div data-testid="google-sign-in" />,
  }))

  const { SocialLogin } = await import('../SocialLogin')
  return render(<SocialLogin />)
}

describe('SocialLogin', () => {
  afterEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('renders Apple and Google sign in options with OR separator on web', async () => {
    await renderSocialLogin(true)

    expect(screen.getByTestId('apple-sign-in')).toBeInTheDocument()
    expect(screen.getByTestId('google-sign-in')).toBeInTheDocument()
    expect(screen.getByText(/or/i)).toBeInTheDocument()
    expect(screen.getByTestId('social-login-stack')).toBeInTheDocument()
  })

  it('falls back to vertical stack on native platforms', async () => {
    await renderSocialLogin(false)

    expect(screen.getByTestId('apple-sign-in')).toBeInTheDocument()
    expect(screen.getByTestId('google-sign-in')).toBeInTheDocument()
    expect(screen.queryByTestId('social-login-stack')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('y-stack').length).toBeGreaterThan(0)
  })
})

