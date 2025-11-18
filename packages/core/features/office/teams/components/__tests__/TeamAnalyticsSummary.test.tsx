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
        overview: { useQuery: mockUseQuery },
      },
    },
  },
}))

vi.mock('@tamagui/lucide-icons', () => ({
  Check: () => <span data-testid="check-icon">Check</span>,
  ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
  RefreshCw: () => <span data-testid="refresh-cw-icon">RefreshCw</span>,
}))

const { TeamAnalyticsSummary } = await import('../TeamAnalyticsSummary')

describe('TeamAnalyticsSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({
      data: {
        metrics: [
          {
            id: 'metric-1',
            members: { total: 5, active: 4, pending: 1 },
            jobs: { active: 3 },
            applications: { active: 10, reviewed: 8 },
          },
        ],
      },
      isLoading: false,
    })
  })

  it('displays metrics when data is available', () => {
    render(<TeamAnalyticsSummary teamId="team-1" />)

    expect(screen.getByText(/5/i)).toBeInTheDocument() // Total members
  })

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(<TeamAnalyticsSummary teamId="team-1" />)

    expect(screen.getByText(/Loading/i)).toBeInTheDocument()
  })

  it('handles empty metrics', () => {
    mockUseQuery.mockReturnValue({
      data: { metrics: [] },
      isLoading: false,
    })

    render(<TeamAnalyticsSummary teamId="team-1" />)

    // Should render without crashing
    expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument()
  })
})

