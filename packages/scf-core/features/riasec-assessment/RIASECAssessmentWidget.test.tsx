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

vi.mock('@scf/core/utils/api', () => ({
  api: {
    onet: {
      getRIASECStatus: {
        useQuery: () => mockGetRIASECStatus(),
      },
    },
  },
}))

// Beyond UI mock
vi.mock('@scaffald/ui', async () => {
  const React = await import('react')
  return {
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

  it('should render widget when assessment is not completed', () => {
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

    const { container } = renderWithProviders(<RIASECAssessmentWidget />)

    expect(container.firstChild).toBeNull()
  })

  it('should show loading state', () => {
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

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/assessments/riasec')
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

