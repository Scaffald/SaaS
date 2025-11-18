import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockUseQuery = vi.fn()

vi.mock('@app/core/utils/api', () => ({
  api: {
    teams: {
      analytics: {
        activity: { useQuery: mockUseQuery },
      },
    },
  },
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

