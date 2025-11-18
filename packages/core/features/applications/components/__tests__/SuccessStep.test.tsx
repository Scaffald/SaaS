import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SuccessStep } from '../SuccessStep'

const mockPush = vi.fn()

vi.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

vi.mock('@app/core/constants/routes', () => ({
  ROUTES: {
    DASHBOARD: {
      path: '/dashboard',
    },
  },
}))

describe('SuccessStep', () => {
  const defaultProps = {
    applicationId: 'app-12345',
    jobTitle: 'Software Engineer',
    organizationName: 'Tech Corp',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders success message', () => {
    render(<SuccessStep {...defaultProps} />)

    expect(screen.getByText('Application Submitted Successfully!')).toBeInTheDocument()
    expect(screen.getByText(/Thank you for applying to Software Engineer at Tech Corp/)).toBeInTheDocument()
  })

  it('displays formatted application ID', () => {
    render(<SuccessStep {...defaultProps} />)

    expect(screen.getByText(/Application ID: #APP-12345/)).toBeInTheDocument()
  })

  it('formats application ID correctly with short ID', () => {
    render(<SuccessStep {...defaultProps} applicationId="app-1" />)

    // Should pad to 5 digits
    expect(screen.getByText(/Application ID: #APP-00001/)).toBeInTheDocument()
  })

  it('formats application ID correctly with long ID', () => {
    render(<SuccessStep {...defaultProps} applicationId="app-1234567890" />)

    // Should use last 5 digits
    expect(screen.getByText(/Application ID: #APP-67890/)).toBeInTheDocument()
  })

  it('displays next steps information', () => {
    render(<SuccessStep {...defaultProps} />)

    expect(screen.getByText('What happens next:')).toBeInTheDocument()
    expect(screen.getByText(/Our team will review your application within 3-5 business days/)).toBeInTheDocument()
    expect(screen.getByText(/You'll receive an email update on your application status/)).toBeInTheDocument()
    expect(screen.getByText(/If selected, we'll contact you to schedule an interview/)).toBeInTheDocument()
  })

  it('calls onViewApplication when view application button is clicked', () => {
    const onViewApplication = vi.fn()
    render(<SuccessStep {...defaultProps} onViewApplication={onViewApplication} />)

    const viewButton = screen.getByText('View Application Status')
    fireEvent.click(viewButton)

    expect(onViewApplication).toHaveBeenCalledWith('app-12345')
  })

  it('calls onReturnToJobs when browse more jobs button is clicked', () => {
    const onReturnToJobs = vi.fn()
    render(<SuccessStep {...defaultProps} onReturnToJobs={onReturnToJobs} />)

    const browseButton = screen.getByText('Browse More Jobs')
    fireEvent.click(browseButton)

    expect(onReturnToJobs).toHaveBeenCalled()
  })

  it('navigates to dashboard when return to dashboard button is clicked', () => {
    render(<SuccessStep {...defaultProps} />)

    const dashboardButton = screen.getByText('Return to Dashboard')
    fireEvent.click(dashboardButton)

    expect(mockPush).toHaveBeenCalledWith('/dashboard')
  })

  it('renders all navigation buttons when all callbacks provided', () => {
    const onViewApplication = vi.fn()
    const onReturnToJobs = vi.fn()

    render(
      <SuccessStep
        {...defaultProps}
        onViewApplication={onViewApplication}
        onReturnToJobs={onReturnToJobs}
      />,
    )

    expect(screen.getByText('View Application Status')).toBeInTheDocument()
    expect(screen.getByText('Browse More Jobs')).toBeInTheDocument()
    expect(screen.getByText('Return to Dashboard')).toBeInTheDocument()
  })

  it('only renders return to dashboard when callbacks not provided', () => {
    render(<SuccessStep {...defaultProps} />)

    expect(screen.queryByText('View Application Status')).not.toBeInTheDocument()
    expect(screen.queryByText('Browse More Jobs')).not.toBeInTheDocument()
    expect(screen.getByText('Return to Dashboard')).toBeInTheDocument()
  })

  it('has correct accessibility attributes', () => {
    const { container } = render(<SuccessStep {...defaultProps} />)

    const mainElement = container.querySelector('[aria-live="polite"]')
    expect(mainElement).toBeInTheDocument()
    expect(mainElement).toHaveAttribute('aria-label', 'Application submitted successfully')
  })
})

