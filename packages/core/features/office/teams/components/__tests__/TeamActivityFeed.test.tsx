import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { ReactNode } from 'react'

const mockUseQuery = vi.fn()

vi.mock('tamagui', () => ({
  Theme: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  YStack: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  XStack: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
  Spinner: () => <span>Loading</span>,
}))

vi.mock('@app/core/utils/api', () => ({
  api: {
    teams: {
      analytics: {
        activity: { useQuery: mockUseQuery },
      },
    },
  },
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
    mockUseQuery.mockReturnValue({
      data: {
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
      isLoading: false,
    })
  })

  it('renders activity events', () => {
    render(<TeamActivityFeed teamId="team-1" />)

    expect(screen.getByText(/joined/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(<TeamActivityFeed teamId="team-1" />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('handles empty activity feed', () => {
    mockUseQuery.mockReturnValue({
      data: { events: [], nextCursor: null },
      isLoading: false,
    })

    render(<TeamActivityFeed teamId="team-1" />)

    expect(screen.getByText(/No activity/i)).toBeInTheDocument()
  })
})

