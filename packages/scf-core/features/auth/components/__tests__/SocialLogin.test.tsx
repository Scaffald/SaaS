import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

let mockPlatform: 'web' | 'ios' = 'web'

vi.mock('@scaffald/ui', () => ({
  Row: ({ children }: { children?: ReactNode }) => (
    <div data-testid="social-login-row">{children}</div>
  ),
  Stack: ({ children }: { children?: ReactNode }) => (
    <div data-testid="social-login-stack">{children}</div>
  ),
  Separator: () => <div data-testid="separator" />,
  Caption: ({ children }: { children?: ReactNode }) => (
    <span data-testid="caption">{children}</span>
  ),
  usePlatform: () => ({ platform: mockPlatform }),
  useThemeContext: () => ({ theme: 'light' as const, setTheme: () => {}, toggleTheme: () => {} }),
}))

vi.mock('@scaffald/ui/tokens', () => ({
  colors: {
    bg: { primary: '#fff' },
    text: {
      light: { secondary: '#414e62', tertiary: '#97a1af' },
      dark: { secondary: '#97a1af', tertiary: '#6b7280' },
    },
  },
}))

vi.mock('@scf/core/utils/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../AppleSignIn', () => ({
  AppleSignIn: () => <div data-testid="apple-sign-in" />,
}))

vi.mock('../GoogleSignIn', () => ({
  GoogleSignIn: () => <div data-testid="google-sign-in" />,
}))

describe('SocialLogin', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders Apple and Google sign in options with OR separator on web', async () => {
    mockPlatform = 'web'
    const { SocialLogin } = await import('../SocialLogin')
    const { getByTestId, getByText } = render(<SocialLogin />)

    expect(getByTestId('apple-sign-in')).toBeInTheDocument()
    expect(getByTestId('google-sign-in')).toBeInTheDocument()
    expect(getByText(/or/i)).toBeInTheDocument()
    expect(getByTestId('social-login-row')).toBeInTheDocument()
  })

  it('renders Apple and Google sign in on native', async () => {
    mockPlatform = 'ios'
    const { SocialLogin } = await import('../SocialLogin')
    const { getByTestId, getByText } = render(<SocialLogin />)

    expect(getByTestId('apple-sign-in')).toBeInTheDocument()
    expect(getByTestId('google-sign-in')).toBeInTheDocument()
    expect(getByText(/or/i)).toBeInTheDocument()
  })
})
