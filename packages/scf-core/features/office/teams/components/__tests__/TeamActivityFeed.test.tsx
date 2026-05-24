import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TestQueryWrapper } from '@test-helpers/test-utils'

const mockUseInfiniteQuery = vi.fn()
const mockUseMutation = vi.fn()

const mockUseUtils = vi.fn(() => ({
  teams: {
    analytics: {
      activity: { invalidate: vi.fn() },
    },
  },
}))

vi.mock('@scaffald/ui', () => {
  const Stack = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Button = ({ children, onPress }: { children?: ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
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
  const Separator = () => <hr />
  const Spinner = () => <span>Loading</span>

  const SelectTrigger = ({ children }: { children?: ReactNode }) => (
    <button type="button">{children}</button>
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

  const styled = vi.fn(() => ({ attrs: vi.fn(() => vi.fn(() => null)) }))

  return {
    Theme: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Stack: Stack,
    Row: Stack,
    Text,
    Button,
    TextArea,
    Separator,
    Select,
    Spinner,
    styled,
    useMedia: () => ({ sm: false }),
  }
})

// Component now uses teams-sdk-hooks: useTeamActivityFeed (replaces
// the infinite-query mock) and usePostTeamCommentMutation. Cache
// invalidation goes through @tanstack/react-query's useQueryClient.
vi.mock('@scf/core/utils/teams-sdk-hooks', () => ({
  useTeamActivityFeed: (...args: unknown[]) => mockUseInfiniteQuery(...args),
  usePostTeamCommentMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    // Wrap in an arrow to defer the mockUseUtils lookup until call time
    // (vi.mock is hoisted above the const declaration).
    useQueryClient: () => mockUseUtils(),
  }
})

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  return {
    ...actual,
    useToast: () => ({ show: vi.fn() }),
  }
})

vi.mock('lucide-react-native', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Check: () => <span data-testid="check-icon">Check</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
  MessageCircle: () => <span data-testid="message-circle-icon">MessageCircle</span>,
  Send: () => <span data-testid="send-icon">Send</span>,
}))

const { TeamActivityFeed } = await import('../TeamActivityFeed')

describe('TeamActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseMutation.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    })
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            events: [
              {
                id: 'event-1',
                eventType: 'member.joined',
                actorUserId: 'user-1',
                occurredAt: new Date().toISOString(),
              },
            ],
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    })
  })

  it('renders activity events', () => {
    render(<TeamActivityFeed teamId="team-1" />, { wrapper: TestQueryWrapper })

    expect(screen.getByText(/joined/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    })

    render(<TeamActivityFeed teamId="team-1" />, { wrapper: TestQueryWrapper })

    // Check for spinner (which renders "Loading" text)
    const loadingElements = screen.getAllByText(/Loading/i)
    expect(loadingElements.length).toBeGreaterThan(0)
  })

  it('handles empty activity feed', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: {
        pages: [
          {
            events: [],
            nextCursor: null,
          },
        ],
      },
      isLoading: false,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    })

    render(<TeamActivityFeed teamId="team-1" />, { wrapper: TestQueryWrapper })

    expect(screen.getByText(/No activity/i)).toBeInTheDocument()
  })
})
