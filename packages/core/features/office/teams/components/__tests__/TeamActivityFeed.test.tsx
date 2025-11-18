import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'

const mockUseInfiniteQuery = vi.fn()

const mockUseUtils = vi.fn(() => ({
  teams: {
    analytics: {
      activity: { invalidate: vi.fn() },
    },
  },
}))

vi.mock('tamagui', () => {
  const Stack = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Button = ({ children, onPress }: { children?: ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>{children}</button>
  )
  const TextArea = ({ value, onChangeText, placeholder }: { value?: string; onChangeText?: (text: string) => void; placeholder?: string }) => (
    <textarea
      value={value || ''}
      onChange={(e) => onChangeText?.(e.target.value)}
      placeholder={placeholder}
    />
  )
  const Separator = () => <hr />
  const Spinner = () => <span>Loading</span>
  
  const SelectTrigger = ({ children }: { children?: ReactNode }) => <button type="button">{children}</button>
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
  
  return {
    Theme: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    YStack: Stack,
    XStack: Stack,
    Text,
    Button,
    TextArea,
    Separator,
    Select,
    Spinner,
    useMedia: () => ({ sm: false }),
  }
})

vi.mock('@app/core/utils/api', () => ({
  api: {
    teams: {
      analytics: {
        activity: { useInfiniteQuery: mockUseInfiniteQuery },
      },
    },
    useUtils: mockUseUtils,
  },
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({ show: vi.fn() }),
}))

vi.mock('@tamagui/lucide-icons', () => ({
  Check: () => <span data-testid="check-icon">Check</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
  MessageCircle: () => <span data-testid="message-circle-icon">MessageCircle</span>,
  Send: () => <span data-testid="send-icon">Send</span>,
}))

const { TeamActivityFeed } = await import('../TeamActivityFeed')

describe('TeamActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    render(<TeamActivityFeed teamId="team-1" />)

    expect(screen.getByText(/joined/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseInfiniteQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      hasNextPage: false,
      fetchNextPage: vi.fn(),
    })

    render(<TeamActivityFeed teamId="team-1" />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
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

    render(<TeamActivityFeed teamId="team-1" />)

    expect(screen.getByText(/No activity/i)).toBeInTheDocument()
  })
})

