import { ROUTES } from '@app/core/constants/routes'
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

'@scaffald/tamagui-ui', () => ({
  Button: ({ children, onPress, ...rest }: { children: ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress} {...rest}>
      {children}
    </button>
  ),
  Input: ({
    value,
    onChangeText,
    placeholder,
  }: {
    value?: string
    onChangeText?: (text: string) => void
    placeholder?: string
  }) => (
    <input
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChangeText?.(event.target.value)}
      data-testid="email-input"
    />
  ),
  Paragraph: ({ children, text }: { children?: ReactNode; text?: string }) => (
    <p>{children ?? text}</p>
  ),
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  YStack: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Form: ({ children, onSubmit }: { children?: ReactNode; onSubmit?: () => void }) => (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
    >
      {children}
    </form>
  ),
  LoadingOverlay: () => <div data-testid="loading-overlay" />,
  H2: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
  isWeb: true,
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

vi.mock('@app/core/utils/useUser', () => ({
  useUser: () => ({
    isLoadingSession: false,
  }),
}))

vi.mock('@app/core/assets', () => ({
  ScaffaldLogo: () => <div data-testid="scaffald-logo" />,
}))

vi.mock('@app/core/utils/api', () => ({
  api: {
    auth: {
      requestMagicLink: {
        useMutation: () => ({
          mutateAsync: mockMutateAsync,
          isLoading: false,
        }),
      },
    },
  },
}))

vi.mock('@app/core/utils/analytics/client', () => ({
  captureEvent: captureEventMock,
}))

vi.mock('@app/core/utils/analytics/queue', () => ({
  captureEventWithQueue: captureEventWithQueueMock,
}))

vi.mock('@app/core/utils/errors/translateError', () => ({
  translateError: translateErrorMock,
}))

vi.mock('../components/SocialLogin', () => ({
  SocialLogin: () => <div data-testid="social-login" />,
}))

vi.mock('@trpc/client', () => ({
  TRPCClientError: class TRPCClientError extends Error {},
}))

vi.mock('@app/core/utils/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}))

// Lazy import to ensure mocks are registered first
const { LoginScreen } = await import('../login-screen')

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

  it('normalizes email, sends magic link, and navigates to verify screen', async () => {
    mockMutateAsync.mockResolvedValue({ mode: 'magic_link' })

    render(<LoginScreen />)

    // Router should clear the email param after mount
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/auth')
    })

    const input = screen.getByPlaceholderText('your@email.acme')
    fireEvent.change(input, { target: { value: ' Person@Example.com ' } })

    const submitButton = screen.getByRole('button', { name: /sign in or register/i })
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

  it('surfaces TRPC email errors as form errors', async () => {
    const error = new TRPCClientError('Email already in use')
    mockMutateAsync.mockRejectedValue(error)

    render(<LoginScreen />)

    const input = screen.getByPlaceholderText('your@email.acme')
    fireEvent.change(input, { target: { value: 'duplicate@example.com' } })

    fireEvent.click(screen.getByRole('button', { name: /sign in or register/i }))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled()
    })

    expect(
      await screen.findByText('Email already in use', undefined, { timeout: 500 })
    ).toBeInTheDocument()
  })

  it('handles unexpected errors with a generic message', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Network down'))

    render(<LoginScreen />)

    const input = screen.getByPlaceholderText('your@email.acme')
    fireEvent.change(input, { target: { value: 'user@example.com' } })

    fireEvent.click(screen.getByRole('button', { name: /sign in or register/i }))

    expect(await screen.findByText('Network down')).toBeInTheDocument()
  })
})
