import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseQuery = vi.fn()

vi.mock('tamagui', () => {
  const Stack = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Text = ({ children }: { children?: ReactNode }) => <span>{children}</span>
  const Button = ({ children, onPress }: { children?: ReactNode; onPress?: () => void }) => (
    <button type="button" onClick={onPress}>
      {children}
    </button>
  )
  const Spinner = () => <span>Loading</span>

  const SelectTrigger = ({
    children,
  }: {
    children?: ReactNode
    iconAfter?: ReactNode
    size?: string
  }) => <button type="button">{children}</button>
  const SelectValue = ({
    children,
    placeholder,
  }: {
    children?: ReactNode
    placeholder?: string
  }) => <span>{children || placeholder}</span>
  const SelectContent = ({ children }: { children?: ReactNode; zIndex?: number }) => (
    <div>{children}</div>
  )
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

  const Select = Object.assign(
    (_props: { value?: string; onValueChange?: (value: string) => void }) => null,
    {
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
    }
  )

  const styled = vi.fn((component: unknown) => component)

  const View = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  const Sheet = ({ children, open }: { children?: ReactNode; open?: boolean }) =>
    open ? <div>{children}</div> : null

  return {
    Theme: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    YStack: Stack,
    XStack: Stack,
    View,
    Text,
    Button,
    Select,
    Spinner,
    Sheet,
    styled,
  }
})

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

    // Check for analytics summary title
    expect(screen.getByText(/Analytics summary/i)).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    render(<TeamAnalyticsSummary teamId="team-1" />)

    // Check for spinner (which renders "Loading" text)
    const loadingElements = screen.getAllByText(/Loading/i)
    expect(loadingElements.length).toBeGreaterThan(0)
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
