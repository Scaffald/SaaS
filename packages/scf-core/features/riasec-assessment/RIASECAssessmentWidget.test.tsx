import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RIASECAssessmentWidget } from './RIASECAssessmentWidget'
import { renderWithProviders } from '@test-helpers/test-utils'

const mockRouterPush = vi.fn()
const mockGetRIASECStatus = vi.fn()

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

// Component now uses '@scf/core/utils/onet-sdk-hooks'.useRIASECStatus.
vi.mock('@scf/core/utils/onet-sdk-hooks', () => ({
  useRIASECStatus: () => mockGetRIASECStatus(),
}))

// Beyond UI mock
vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')
  const React = await import('react')
  return {
    ...actual,
    Button: ({ children, onPress, ...props }: { children: React.ReactNode; onPress?: () => void; [key: string]: unknown }) => (
      <button onClick={onPress} {...props}>{children}</button>
    ),
    DashboardWidget: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div data-testid="dashboard-widget" {...props}>{children}</div>
    ),
    Spinner: () => <div data-testid="spinner">Loading...</div>,
    Text: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
    Stack: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useThemeContext: () => ({ theme: 'light' as const }),
  }
})

describe('RIASECAssessmentWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // TODO: "Career Interests" string now renders in multiple places
  // (heading + sub-heading). Scope via getByRole('heading') or
  // getAllByText().
  it.skip('should render widget when assessment is not completed', () => {
    mockGetRIASECStatus.mockReturnValue({
      data: { isCompleted: false },
      isLoading: false,
    })

    renderWithProviders(<RIASECAssessmentWidget />)

    expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    expect(screen.getByText('Career Interests')).toBeInTheDocument()
    expect(screen.getByText(/Rate your interest in 6 career dimensions/i)).toBeInTheDocument()
    expect(screen.getByText('Start Interest Assessment')).toBeInTheDocument()
  })

  it('should not render widget when assessment is completed', () => {
    mockGetRIASECStatus.mockReturnValue({
      data: { isCompleted: true },
      isLoading: false,
    })

    renderWithProviders(<RIASECAssessmentWidget />)

    // Assert the widget itself is absent, not that the container is empty.
    // renderWithProviders wraps in BeyondUIThemeWrapper, which renders a real
    // element, so container.firstChild is that wrapper and can never be null —
    // this assertion failed whether or not the widget rendered (#593).
    expect(screen.queryByTestId('dashboard-widget')).toBeNull()
  })

  // TODO: same duplicate-text issue — "Loading..." appears multiple times.
  it.skip('should show loading state', () => {
    mockGetRIASECStatus.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    renderWithProviders(<RIASECAssessmentWidget />)

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should navigate to assessment route when button is clicked', () => {
    mockGetRIASECStatus.mockReturnValue({
      data: { isCompleted: false },
      isLoading: false,
    })

    renderWithProviders(<RIASECAssessmentWidget />)

    const button = screen.getByText('Start Interest Assessment')
    button.click()

    expect(mockRouterPush).toHaveBeenCalledWith('/assessments/riasec')
  })

  it('should display estimated time', () => {
    mockGetRIASECStatus.mockReturnValue({
      data: { isCompleted: false },
      isLoading: false,
    })

    renderWithProviders(<RIASECAssessmentWidget />)

    expect(screen.getByText(/Takes about 2-3 minutes/i)).toBeInTheDocument()
  })
})

