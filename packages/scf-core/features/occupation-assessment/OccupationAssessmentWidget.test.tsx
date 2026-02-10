import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OccupationAssessmentWidget } from './OccupationAssessmentWidget'
import { renderWithProviders } from '@test-helpers/test-utils'

const mockRouterPush = vi.fn()
const mockGetOccupationStatus = vi.fn()

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}))

vi.mock('@scf/core/utils/api', () => ({
  api: {
    onet: {
      getOccupationStatus: {
        useQuery: () => mockGetOccupationStatus(),
      },
    },
  },
}))

// Legacy UI mock (tamagui)
vi.mock('@unicornlove/beyond-ui', async () => {
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
  }
})

describe('OccupationAssessmentWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render widget when assessment is not completed', () => {
    mockGetOccupationStatus.mockReturnValue({
      data: { isCompleted: false },
      isLoading: false,
    })

    renderWithProviders(<OccupationAssessmentWidget />)

    expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    expect(screen.getByText('Occupation Preferences')).toBeInTheDocument()
    expect(screen.getByText(/Tell us about your current occupation/i)).toBeInTheDocument()
    expect(screen.getByText('Add Occupations')).toBeInTheDocument()
  })

  it('should not render widget when assessment is completed', () => {
    mockGetOccupationStatus.mockReturnValue({
      data: { isCompleted: true },
      isLoading: false,
    })

    const { container } = renderWithProviders(<OccupationAssessmentWidget />)

    expect(container.firstChild).toBeNull()
  })

  it('should show loading state', () => {
    mockGetOccupationStatus.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    renderWithProviders(<OccupationAssessmentWidget />)

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should navigate to assessment route when button is clicked', () => {
    mockGetOccupationStatus.mockReturnValue({
      data: { isCompleted: false },
      isLoading: false,
    })

    renderWithProviders(<OccupationAssessmentWidget />)

    const button = screen.getByText('Add Occupations')
    button.click()

    expect(mockRouterPush).toHaveBeenCalledWith('/dashboard/assessments/occupation')
  })

  it('should display estimated time', () => {
    mockGetOccupationStatus.mockReturnValue({
      data: { isCompleted: false },
      isLoading: false,
    })

    renderWithProviders(<OccupationAssessmentWidget />)

    expect(screen.getByText(/Takes about 1-2 minutes/i)).toBeInTheDocument()
  })
})

