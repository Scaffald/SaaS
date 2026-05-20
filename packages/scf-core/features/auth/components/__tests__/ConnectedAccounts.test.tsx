import '@testing-library/jest-dom/vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const toastShowMock = vi.fn()
const refreshMock = vi.fn()

const baseHookReturn = {
  identities: [],
  isLoading: false,
  isMutating: false,
  error: null as string | null,
  refresh: refreshMock,
  link: vi.fn(),
  unlink: vi.fn(),
  isLastIdentity: () => false,
}

let currentHookReturn = { ...baseHookReturn }

vi.mock('@scaffald/ui', () => {
  const Passthrough = ({ children }: { children?: ReactNode }) => <>{children}</>
  return {
    useToast: () => ({ show: toastShowMock }),
    useThemeContext: () => ({ theme: 'light' }),
    Button: ({ children, onPress, disabled }: { children?: ReactNode; onPress?: () => void; disabled?: boolean }) => (
      <button type="button" onClick={onPress} disabled={disabled}>
        {children}
      </button>
    ),
    Card: ({ children, ...rest }: { children?: ReactNode; [k: string]: unknown }) => (
      <div data-testid={rest['data-testid'] as string | undefined}>{children}</div>
    ),
    Modal: ({ visible, children }: { visible: boolean; children?: ReactNode }) =>
      visible ? <div>{children}</div> : null,
    ModalActions: Passthrough,
    ModalContent: Passthrough,
    ModalHeader: Passthrough,
    Paragraph: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
    Row: Passthrough,
    Stack: Passthrough,
    Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  }
})

vi.mock('@scaffald/ui/tokens', () => ({
  colors: {
    text: { light: { secondary: '#444' }, dark: { secondary: '#bbb' } },
    fg: { light: { error: '#a00' }, dark: { error: '#f88' } },
  },
  spacing: { 4: 4, 8: 8, 12: 12, 16: 16 },
}))

vi.mock('@scf/core/utils/useTranslation', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

vi.mock('../../hooks/useConnectedAccounts', () => ({
  useConnectedAccounts: () => currentHookReturn,
}))

describe('ConnectedAccounts', () => {
  afterEach(() => {
    vi.clearAllMocks()
    currentHookReturn = { ...baseHookReturn }
  })

  it('renders empty state when there are no identities and no error', async () => {
    const { ConnectedAccounts } = await import('../ConnectedAccounts')
    render(<ConnectedAccounts />)
    expect(screen.getByText('auth.connectedAccounts.empty')).toBeInTheDocument()
    expect(screen.queryByTestId('connected-accounts-error')).not.toBeInTheDocument()
  })

  it('renders an error card with retry when getUserIdentities failed', async () => {
    // Codex feedback (#269): without this branch the user saw "no providers"
    // on a network/auth failure and might pointlessly try to re-link.
    currentHookReturn = { ...baseHookReturn, error: 'unauthorized' }
    const { ConnectedAccounts } = await import('../ConnectedAccounts')
    render(<ConnectedAccounts />)
    expect(screen.getByTestId('connected-accounts-error')).toBeInTheDocument()
    expect(screen.getByText('auth.connectedAccounts.fetchError')).toBeInTheDocument()
    expect(screen.queryByText('auth.connectedAccounts.empty')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('common.actions.retry'))
    expect(refreshMock).toHaveBeenCalledTimes(1)
  })

  it('does not render error card while loading', async () => {
    currentHookReturn = { ...baseHookReturn, isLoading: true, error: 'something' }
    const { ConnectedAccounts } = await import('../ConnectedAccounts')
    render(<ConnectedAccounts />)
    // While loading we show the loading text, not the error retry block —
    // the hook clears error before its initial fetch resolves.
    expect(screen.queryByTestId('connected-accounts-error')).not.toBeInTheDocument()
    expect(screen.getByText('common.status.loading')).toBeInTheDocument()
  })
})
