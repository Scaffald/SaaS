/**
 * SC-66: when the user arrives at /auth/verify with no email param
 * (via the "Use one-time code" link), MagicLinkPending must render
 * an inline email Input above the OTP boxes and use the entered email
 * for verifyOtp. When the email prop is provided (existing magic-link
 * flow), the inline Input must NOT render.
 */

import '@testing-library/jest-dom/vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const verifyOtpMock = vi.fn()
const requestMagicLinkMutateAsync = vi.fn()
const routerPushMock = vi.fn()
const routerReplaceMock = vi.fn()

vi.mock('@scf/core/utils/supabase/client', () => ({
  supabase: {
    auth: {
      verifyOtp: verifyOtpMock,
    },
  },
}))

vi.mock('@scf/core/utils/auth-sdk-hooks', () => ({
  useRequestMagicLinkMutation: () => ({
    mutateAsync: requestMagicLinkMutateAsync,
    isPending: false,
  }),
}))

vi.mock('@scf/core/utils/errors/translateError', () => ({
  translateError: (err: unknown) => (err instanceof Error ? err.message : 'Unknown error'),
}))

vi.mock('@scf/core/utils/getBaseUrl', () => ({
  getBaseUrl: () => 'https://example.com/auth',
}))

vi.mock('@scf/core/utils/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('expo-router', () => ({
  router: {
    push: routerPushMock,
    replace: routerReplaceMock,
  },
}))

// Capture the onEnter prop passed to CodeConfirmation so the test can
// invoke it to simulate the user completing the 6-digit code.
let capturedOnEnter: ((code: string) => void) | null = null

vi.mock('../CodeConfirmation', () => ({
  CodeConfirmation: ({ onEnter }: { onEnter: (code: string) => void }) => {
    capturedOnEnter = onEnter
    return <div data-testid="code-confirmation" />
  },
}))

vi.mock('../EmailHeader', () => ({
  EmailHeader: ({ email }: { email: string }) => (
    <div data-testid="email-header">{email}</div>
  ),
}))

vi.mock('../ResendTimer', () => ({
  ResendTimer: () => <div data-testid="resend-timer" />,
}))

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@scaffald/ui')
  return {
    ...actual,
    useThemeContext: () => ({ theme: 'light' }),
    Input: ({
      placeholder,
      value,
      onChangeText,
      errorMessage,
    }: {
      placeholder?: string
      value?: string
      onChangeText?: (next: string) => void
      errorMessage?: string
    }) => (
      <div>
        <input
          data-testid="email-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChangeText?.((e.target as HTMLInputElement).value)}
        />
        {errorMessage ? <span data-testid="email-error">{errorMessage}</span> : null}
      </div>
    ),
    Box: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Row: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Stack: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
    Paragraph: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
    Spinner: () => <div data-testid="spinner" />,
  }
})

describe('MagicLinkPending', () => {
  beforeEach(() => {
    capturedOnEnter = null
    verifyOtpMock.mockReset()
    requestMagicLinkMutateAsync.mockReset()
    routerPushMock.mockReset()
    routerReplaceMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders the EmailHeader (no inline Input) when email prop is provided', async () => {
    const { MagicLinkPending } = await import('../MagicLinkPending')
    const { queryByTestId, getByTestId } = render(<MagicLinkPending email="user@example.com" />)

    expect(getByTestId('email-header')).toHaveTextContent('user@example.com')
    expect(queryByTestId('email-input')).not.toBeInTheDocument()
  })

  it('renders the inline email Input when email prop is missing (SC-66)', async () => {
    const { MagicLinkPending } = await import('../MagicLinkPending')
    const { queryByTestId, getByTestId } = render(<MagicLinkPending />)

    expect(getByTestId('email-input')).toBeInTheDocument()
    expect(queryByTestId('email-header')).not.toBeInTheDocument()
  })

  it('blocks verifyOtp with an invalid inline email and surfaces emailInvalid', async () => {
    const { MagicLinkPending } = await import('../MagicLinkPending')
    const { getByTestId, findByTestId } = render(<MagicLinkPending />)

    fireEvent.change(getByTestId('email-input'), { target: { value: 'not-an-email' } })
    expect(capturedOnEnter).toBeTruthy()
    capturedOnEnter?.('123456')

    expect(await findByTestId('email-error')).toHaveTextContent('auth.verify.emailInvalid')
    expect(verifyOtpMock).not.toHaveBeenCalled()
  })

  it('calls verifyOtp with the entered email + code when both are valid', async () => {
    verifyOtpMock.mockResolvedValue({ error: null })
    const { MagicLinkPending } = await import('../MagicLinkPending')
    const { getByTestId } = render(<MagicLinkPending />)

    fireEvent.change(getByTestId('email-input'), { target: { value: 'Person@Example.com' } })
    capturedOnEnter?.('654321')

    await waitFor(() => {
      expect(verifyOtpMock).toHaveBeenCalledWith({
        email: 'person@example.com',
        token: '654321',
        type: 'email',
      })
    })
  })
})
