import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const toastShowMock = vi.fn()

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  return {
    ...actual,
    useToast: () => ({ show: toastShowMock }),
    SocialLoginGroup: ({
      orLabel,
      googleText,
      appleText,
      showApple,
      onGooglePress,
      onApplePress,
      disabled,
    }: {
      orLabel?: string
      googleText?: string
      appleText?: string
      showApple?: boolean
      onGooglePress?: () => void
      onApplePress?: () => void
      disabled?: boolean
    }) => (
      <div data-testid="social-login-group">
        <span data-testid="or-label">{orLabel}</span>
        <span data-testid="google-text">{googleText}</span>
        <span data-testid="apple-text">{appleText}</span>
        <span data-testid="show-apple">{String(showApple)}</span>
        <span data-testid="disabled">{String(disabled)}</span>
        <button data-testid="google-button" type="button" onClick={onGooglePress}>
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

  it('renders SocialLoginGroup with disabled=true when consent not granted', async () => {
    const { SocialLogin } = await import('../SocialLogin')
    const { getByTestId } = render(<SocialLogin hasAgreed={false} />)

    expect(getByTestId('social-login-group')).toBeInTheDocument()
    expect(getByTestId('or-label')).toHaveTextContent('common.or')
    expect(getByTestId('disabled')).toHaveTextContent('true')
  })

  it('enables SocialLoginGroup when consent is granted', async () => {
    const { SocialLogin } = await import('../SocialLogin')
    const { getByTestId } = render(<SocialLogin hasAgreed={true} />)
    expect(getByTestId('disabled')).toHaveTextContent('false')
  })

  it('blocks Google/Apple handlers and shows consent toast when not agreed', async () => {
    const { SocialLogin } = await import('../SocialLogin')
    const { getByTestId } = render(<SocialLogin hasAgreed={false} />)

    getByTestId('google-button').click()
    getByTestId('apple-button').click()

    expect(mockOnGooglePress).not.toHaveBeenCalled()
    expect(mockOnApplePress).not.toHaveBeenCalled()
    expect(toastShowMock).toHaveBeenCalledWith({
      message: 'auth.errors.mustAcceptTerms',
      variant: 'error',
      duration: 4000,
    })
    expect(toastShowMock).toHaveBeenCalledTimes(2)
  })

  it('forwards to Google/Apple handlers when consent is granted', async () => {
    const { SocialLogin } = await import('../SocialLogin')
    const { getByTestId } = render(<SocialLogin hasAgreed={true} />)

    getByTestId('google-button').click()
    expect(mockOnGooglePress).toHaveBeenCalledTimes(1)

    getByTestId('apple-button').click()
    expect(mockOnApplePress).toHaveBeenCalledTimes(1)

    expect(toastShowMock).not.toHaveBeenCalled()
  })
})
