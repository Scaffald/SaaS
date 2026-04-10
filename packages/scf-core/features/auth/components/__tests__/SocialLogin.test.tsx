import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  return {
    ...actual,
    SocialLoginGroup: ({
    orLabel,
    googleText,
    appleText,
    showApple,
    onGooglePress,
    onApplePress,
  }: {
    orLabel?: string
    googleText?: string
    appleText?: string
    showApple?: boolean
    onGooglePress?: () => void
    onApplePress?: () => void
  }) => (
    <div data-testid="social-login-group">
      <span data-testid="or-label">{orLabel}</span>
      <span data-testid="google-text">{googleText}</span>
      <span data-testid="apple-text">{appleText}</span>
      <span data-testid="show-apple">{String(showApple)}</span>
      <button
        data-testid="google-button"
        type="button"
        onClick={onGooglePress}
      >
        Google
      </button>
      <button data-testid="apple-button" type="button" onClick={onApplePress}>
        Apple
      </button>
    </div>
  ),
  }
})

vi.mock('@scf/core/utils/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

const mockOnGooglePress = vi.fn()
const mockOnApplePress = vi.fn()

vi.mock('../../hooks/useSocialAuthHandlers', () => ({
  useSocialAuthHandlers: () => ({
    onGooglePress: mockOnGooglePress,
    onApplePress: mockOnApplePress,
  }),
}))

describe('SocialLogin', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders SocialLoginGroup with correct props', async () => {
    const { SocialLogin } = await import('../SocialLogin')
    const { getByTestId } = render(<SocialLogin />)

    expect(getByTestId('social-login-group')).toBeInTheDocument()
    expect(getByTestId('or-label')).toHaveTextContent('common.or')
    expect(getByTestId('google-text')).toHaveTextContent('auth.login.googleButton')
    expect(getByTestId('apple-text')).toHaveTextContent('auth.login.appleButton')
    expect(getByTestId('show-apple')).toHaveTextContent('true')
  })

  it('provides Google and Apple handlers to SocialLoginGroup', async () => {
    const { SocialLogin } = await import('../SocialLogin')
    const { getByTestId } = render(<SocialLogin />)

    getByTestId('google-button').click()
    expect(mockOnGooglePress).toHaveBeenCalledTimes(1)

    getByTestId('apple-button').click()
    expect(mockOnApplePress).toHaveBeenCalledTimes(1)
  })
})
