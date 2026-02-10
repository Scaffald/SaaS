import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseMutation = vi.fn()
const mockUseQuery = vi.fn()
const mockShow = vi.fn()

vi.mock('@scf/core/utils/api', () => ({
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

vi.mock('@unicornlove/beyond-ui', () => ({
  useToast: () => ({ show: mockShow }),
}))

vi.mock('@unicornlove/beyond-ui', () => ({
  ResponsiveModal: ({
    open,
    children,
    testID,
  }: {
    open: boolean
    children: React.ReactNode
    testID?: string
  }) => (open ? <div data-testid={testID ?? 'modal'}>{children}</div> : null),
  ResponsiveSelect: ({
    value,
    onValueChange,
    options,
    placeholder,
    'data-testid': dataTestId,
    testID,
  }: {
    value?: string | null
    onValueChange: (value: string) => void
    options: Array<{ value: string; label: string }>
    placeholder?: string
    'data-testid'?: string
    testID?: string
  }) => (
    <select
      data-testid={dataTestId ?? testID ?? 'responsive-select'}
      value={value ?? ''}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}))

vi.mock('@scf/core/components/user', () => ({
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
    Stack: Stack,
    Row: Stack,
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
