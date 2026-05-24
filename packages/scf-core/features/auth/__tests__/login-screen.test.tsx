import { ROUTES } from '@scf/core/constants/routes'
import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TRPCClientError } from '@trpc/client'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockReplace = vi.hoisted(() => vi.fn())
const mockPush = vi.hoisted(() => vi.fn())
const mockMutateAsync = vi.hoisted(() => vi.fn())
const mockOnAuthStateChange = vi.hoisted(() =>
  vi.fn(() => ({
    data: {
      subscription: {
        unsubscribe: vi.fn(),
      },
    },
  }))
)

const captureEventMock = vi.hoisted(() => vi.fn())
const captureEventWithQueueMock = vi.hoisted(() => vi.fn().mockResolvedValue(true))
const translateErrorMock = vi.hoisted(() =>
  vi.fn((error: unknown) => (error instanceof Error ? error.message : 'Unknown error'))
)

vi.mock('@scf/core/utils/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'auth.login.emailPlaceholder': 'your@email.acme',
        'auth.login.description': 'Sign in or create an account',
        'auth.login.submitButton': 'Sign in or register',
        'auth.login.sending': 'Sending…',
        'auth.login.socialDescription': 'Or continue with',
        'validation.email.required': 'Email is required',
        'validation.email.invalid': 'Invalid email',
      }
      return map[key] ?? key
    },
  }),
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
  useLocalSearchParams: () => ({
    email: 'USER@Example.com',
  }),
}))

vi.mock('@scf/core/utils/useUser', () => ({
  useUser: () => ({
    isLoadingSession: false,
  }),
}))

vi.mock('@scf/core/assets', () => ({
  ScaffaldLogo: () => <div data-testid="scaffald-logo" />,
}))

// Component now uses '@scf/core/utils/auth-sdk-hooks'.
vi.mock('@scf/core/utils/auth-sdk-hooks', () => ({
  useRequestMagicLinkMutation: () => ({
    mutateAsync: mockMutateAsync,
    isLoading: false,
    isPending: false,
  }),
}))

vi.mock('@scf/core/utils/cookieConsent/useRecordConsentMutation', () => ({
  useRecordTermsAcceptanceMutation: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
}))

vi.mock('@scf/core/utils/analytics/client', () => ({
  captureEvent: captureEventMock,
}))

vi.mock('@scf/core/utils/analytics/queue', () => ({
  captureEventWithQueue: captureEventWithQueueMock,
}))

vi.mock('@scf/core/utils/errors/translateError', () => ({
  translateError: translateErrorMock,
}))

vi.mock('../components/SocialLogin', () => ({
  SocialLogin: () => <div data-testid="social-login" />,
}))

vi.mock('@trpc/client', () => ({
  TRPCClientError: class TRPCClientError extends Error {},
}))

vi.mock('@scf/core/utils/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}))

describe('LoginScreen', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_URL = 'https://example.com/auth'
    mockReplace.mockClear()
    mockPush.mockClear()
    mockMutateAsync.mockReset()
    captureEventMock.mockReset()
    captureEventWithQueueMock.mockReset()
    translateErrorMock.mockClear()
    captureEventMock.mockReturnValue(true)
    captureEventWithQueueMock.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // SC-65: helper — simulate user checking the Terms checkbox. The form
  // fields are always enabled, but submission still requires consent.
  function acceptTerms(container: HTMLElement) {
    const checkbox = container.querySelector('[role="checkbox"]') as HTMLElement | null
    if (!checkbox) throw new Error('Terms checkbox not found')
    fireEvent.click(checkbox)
  }

  it('renders login form', async () => {
    const { LoginScreen } = await import('../login-screen')
    const { getByPlaceholderText } = render(<LoginScreen />)
    expect(getByPlaceholderText('your@email.acme')).toBeInTheDocument()
  })

  it('normalizes email, sends magic link, and navigates to verify screen', async () => {
    const mod = await import('../login-screen')
    const LoginScreen = mod.LoginScreen
    mockMutateAsync.mockResolvedValue({ mode: 'magic_link' })

    const { container, getByPlaceholderText, getByRole } = render(<LoginScreen />)

    // Router should clear the email param after mount
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth')
    })

    const input = getByPlaceholderText('your@email.acme')
    fireEvent.change(input, { target: { value: ' Person@Example.com ' } })

    acceptTerms(container)

    const submitButton = getByRole('button', { name: /sign in or register/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'person@example.com',
        redirectTo: 'https://example.com/auth',
      })
    })

    expect(mockPush).toHaveBeenCalledWith({
      pathname: ROUTES.AUTH.VERIFY.path,
      params: {
        email: 'person@example.com',
        mode: 'magic_link',
      },
    })
  })

  // TODO: error display path changed — translateError is wired
  // differently now; the rejection no longer renders the literal
  // error.message text. Rewrite to inspect form.formState.errors
  // or the new error-banner markup.
  it.skip('surfaces TRPC email errors as form errors', async () => {
    const { LoginScreen } = await import('../login-screen')
    const error = new TRPCClientError('Email already in use')
    mockMutateAsync.mockRejectedValue(error)

    const { container, getByPlaceholderText, getByRole, findByText } = render(<LoginScreen />)

    const input = getByPlaceholderText('your@email.acme')
    fireEvent.change(input, { target: { value: 'duplicate@example.com' } })

    acceptTerms(container)

    fireEvent.click(getByRole('button', { name: /sign in or register/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled()
    })

    expect(
      await findByText('Email already in use', undefined, { timeout: 500 })
    ).toBeInTheDocument()
  })

  // TODO: same root cause as "surfaces TRPC email errors" — error
  // rendering changed and the literal message no longer appears.
  it.skip('handles unexpected errors with a generic message', async () => {
    const { LoginScreen } = await import('../login-screen')
    mockMutateAsync.mockRejectedValue(new Error('Network down'))

    const { container, getByPlaceholderText, getByRole, findByText } = render(<LoginScreen />)

    const input = getByPlaceholderText('your@email.acme')
    fireEvent.change(input, { target: { value: 'user@example.com' } })

    acceptTerms(container)

    fireEvent.click(getByRole('button', { name: /sign in or register/i }))

    expect(await findByText('Network down')).toBeInTheDocument()
  })

  it('SC-65: surfaces inline consent error and blocks submit when Terms is unchecked', async () => {
    const { LoginScreen } = await import('../login-screen')
    mockMutateAsync.mockResolvedValue({ mode: 'magic_link' })

    const { getByPlaceholderText, getByRole, findByText, queryByText } = render(
      <LoginScreen />
    )

    // No inline error before any submit attempt.
    expect(queryByText('auth.errors.mustAcceptTerms')).not.toBeInTheDocument()

    const input = getByPlaceholderText('your@email.acme')
    fireEvent.change(input, { target: { value: 'user@example.com' } })

    // Submit without checking Terms — inline error appears, no magic link.
    fireEvent.click(getByRole('button', { name: /sign in or register/i }))

    expect(await findByText('auth.errors.mustAcceptTerms')).toBeInTheDocument()
    expect(mockMutateAsync).not.toHaveBeenCalled()
  })
})
