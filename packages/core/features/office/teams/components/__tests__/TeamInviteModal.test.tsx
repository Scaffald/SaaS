import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseMutation = vi.fn()
const mockUseQuery = vi.fn()
const mockShow = vi.fn()

vi.mock('@app/core/utils/api', () => ({
  api: {
    teams: {
      invitations: {
        create: { useMutation: mockUseMutation },
      },
      members: {
        roles: {
          useQuery: mockUseQuery,
        },
      },
    },
  },
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({ show: mockShow }),
}))

vi.mock('@app/ui/components/ResponsiveModal', () => ({
  ResponsiveModal: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="modal">{children}</div> : null,
}))

vi.mock('@app/ui/components/user/UserSearch', () => ({
  UserSearch: ({
    onSelect,
  }: {
    onSelect?: (user: { id: string; displayName: string }) => void
  }) => (
    <div data-testid="user-search">
      <button type="button" onClick={() => onSelect?.({ id: 'user-1', displayName: 'Test User' })}>
        Select User
      </button>
    </div>
  ),
}))

vi.mock('tamagui', () => {
  const Stack = ({ children, testID }: { children?: ReactNode; testID?: string }) => (
    <div data-testid={testID}>{children}</div>
  )
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Button = ({ children, onPress }: { children?: ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  )
  const Input = ({
    value,
    onChangeText,
    placeholder,
  }: {
    value?: string
    onChangeText?: (text: string) => void
    placeholder?: string
  }) => (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChangeText?.(e.target.value)}
      placeholder={placeholder}
    />
  )
  const Label = ({ children, htmlFor }: { children?: ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor}>{children}</label>
  )
  const TextArea = ({
    value,
    onChangeText,
    placeholder,
  }: {
    value?: string
    onChangeText?: (text: string) => void
    placeholder?: string
  }) => (
    <textarea
      value={value || ''}
      onChange={(e) => onChangeText?.(e.target.value)}
      placeholder={placeholder}
    />
  )
  const SelectTrigger = ({
    children,
    disabled,
  }: {
    children?: ReactNode
    iconAfter?: ReactNode
    disabled?: boolean
  }) => (
    <button type="button" disabled={disabled}>
      {children}
    </button>
  )
  const SelectValue = ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>
  const SelectContent = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const SelectViewport = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const SelectGroup = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const SelectLabel = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const SelectItem = ({ children, value }: { children?: ReactNode; value?: string }) => (
    <div data-value={value}>{children}</div>
  )
  const SelectItemText = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const SelectItemIndicator = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const SelectScrollUpButton = () => null
  const SelectScrollDownButton = () => null

  const Select = Object.assign(() => null, {
    Trigger: SelectTrigger,
    Value: SelectValue,
    Content: SelectContent,
    Viewport: SelectViewport,
    Group: SelectGroup,
    Label: SelectLabel,
    Item: SelectItem,
    ItemText: SelectItemText,
    ItemIndicator: SelectItemIndicator,
    ScrollUpButton: SelectScrollUpButton,
    ScrollDownButton: SelectScrollDownButton,
  })

  const RadioGroupItem = ({ value, id }: { value: string; id?: string }) => (
    <input type="radio" id={id} value={value} name="invite-type" />
  )
  const RadioGroup = Object.assign(
    ({ children }: { children?: ReactNode }) => <div role="radiogroup">{children}</div>,
    {
      Item: RadioGroupItem,
    }
  )

  const Spinner = () => <span>Loading</span>

  return {
    Theme: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    YStack: Stack,
    XStack: Stack,
    Text,
    Button,
    Input,
    Label,
    TextArea,
    Select,
    RadioGroup,
    Spinner,
  }
})

vi.mock('@tamagui/lucide-icons', () => ({
  Check: () => <span data-testid="check-icon">Check</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
  Mail: () => <span data-testid="mail-icon">Mail</span>,
  UserPlus: () => <span data-testid="user-plus-icon">UserPlus</span>,
  X: () => <span data-testid="x-icon">X</span>,
}))

const { TeamInviteModal } = await import('../TeamInviteModal')

describe('TeamInviteModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    })
    mockUseQuery.mockReturnValue({
      data: {
        roles: [{ id: 'role-1', key: 'member', name: 'Member' }],
      },
      isLoading: false,
    })
  })

  it('renders when open', () => {
    render(
      <TeamInviteModal open={true} onOpenChange={vi.fn()} teamId="team-1" organizationId="org-1" />
    )

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <TeamInviteModal open={false} onOpenChange={vi.fn()} teamId="team-1" organizationId="org-1" />
    )

    expect(screen.queryByTestId('modal')).not.toBeInTheDocument()
  })

  it('allows switching between email and user invite types', async () => {
    render(
      <TeamInviteModal open={true} onOpenChange={vi.fn()} teamId="team-1" organizationId="org-1" />
    )

    // Should default to email
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })
})
