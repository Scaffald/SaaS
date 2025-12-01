import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApplicationWizard } from '../ApplicationWizard'

const mockOnSuccess = vi.fn()
const mockOnCancel = vi.fn()
const mockOnViewApplication = vi.fn()
const mockOnReturnToJobs = vi.fn()

const mockUseApplicationForm = {
  currentStep: 'screening',
  screeningAnswers: {},
  customQuestionAnswers: [],
  attachments: {},
  updateScreeningAnswers: vi.fn(),
  updateAllAttachments: vi.fn(),
  nextStep: vi.fn(),
  previousStep: vi.fn(),
  submitApplication: vi.fn().mockResolvedValue({ success: true, applicationId: 'app-123' }),
  isSubmitting: false,
  submitError: null as Error | null,
  completedSteps: [],
  isEditMode: false,
  applicationId: undefined,
  isSaving: false,
  lastSavedAt: null,
  saveError: null,
}

vi.mock('../hooks/useApplicationForm', () => ({
  useApplicationForm: () => mockUseApplicationForm,
}))

vi.mock('../ProgressIndicator', () => ({
  ProgressIndicator: ({ currentStep }: { currentStep: string }) => (
    <div data-testid="progress-indicator">Step: {currentStep}</div>
  ),
}))

vi.mock('../ScreeningStep', () => ({
  ScreeningStep: ({
    onContinue,
    onAnswersChange,
  }: {
    onContinue: () => void
    onAnswersChange: (answers: unknown) => void
  }) => (
    <div data-testid="screening-step">
      <button type="button" onClick={onContinue}>
        Continue Screening
      </button>
      <button type="button" onClick={() => onAnswersChange({ current_location: 'New York' })}>
        Update Answers
      </button>
    </div>
  ),
}))

vi.mock('../CustomQuestionsStep', () => ({
  CustomQuestionsStep: ({ onContinue }: { onContinue: () => void }) => (
    <div data-testid="custom-questions-step">
      <button type="button" onClick={onContinue}>
        Continue Questions
      </button>
    </div>
  ),
}))

vi.mock('../AttachmentsStep', () => ({
  AttachmentsStep: ({ onContinue }: { onContinue: () => void }) => (
    <div data-testid="attachments-step">
      <button type="button" onClick={onContinue}>
        Continue Attachments
      </button>
    </div>
  ),
}))

vi.mock('../ReviewStep', () => ({
  ReviewStep: ({ onSubmit }: { onSubmit: () => void }) => (
    <div data-testid="review-step">
      <button type="button" onClick={onSubmit}>
        Submit Application
      </button>
    </div>
  ),
}))

vi.mock('../SuccessStep', () => ({
  SuccessStep: () => <div data-testid="success-step">Application Submitted</div>,
}))

'@unicornlove/ui', () => ({
  SaveStatusIndicator: ({ status }: { status: string }) => (
    <div data-testid="save-status">{status}</div>
  ),
}))

describe('ApplicationWizard', () => {
  const defaultProps = {
    jobId: 'job-123',
    jobTitle: 'Software Engineer',
    organizationName: 'Tech Corp',
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
    onViewApplication: mockOnViewApplication,
    onReturnToJobs: mockOnReturnToJobs,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseApplicationForm.currentStep = 'screening'
    mockUseApplicationForm.completedSteps = []
    mockUseApplicationForm.isSubmitting = false
    mockUseApplicationForm.submitError = null
    mockUseApplicationForm.applicationId = undefined
  })

  it('renders wizard with header and progress indicator', () => {
    render(<ApplicationWizard {...defaultProps} />)

    expect(screen.getByText(/Apply to Software Engineer/)).toBeInTheDocument()
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    expect(screen.getByTestId('progress-indicator')).toBeInTheDocument()
  })

  it('renders screening step initially', () => {
    render(<ApplicationWizard {...defaultProps} />)

    expect(screen.getByTestId('screening-step')).toBeInTheDocument()
  })

  it('navigates to attachments step when no custom questions', () => {
    mockUseApplicationForm.currentStep = 'screening'
    render(<ApplicationWizard {...defaultProps} />)

    const continueButton = screen.getByText('Continue Screening')
    fireEvent.click(continueButton)

    expect(mockUseApplicationForm.nextStep).toHaveBeenCalledWith('attachments')
  })

  it('renders custom questions step when current step is custom_questions', () => {
    mockUseApplicationForm.currentStep = 'custom_questions'
    render(<ApplicationWizard {...defaultProps} />)

    expect(screen.getByTestId('custom-questions-step')).toBeInTheDocument()
  })

  it('renders attachments step', () => {
    mockUseApplicationForm.currentStep = 'attachments'
    render(<ApplicationWizard {...defaultProps} />)

    expect(screen.getByTestId('attachments-step')).toBeInTheDocument()
  })

  it('renders review step', () => {
    mockUseApplicationForm.currentStep = 'review'
    render(<ApplicationWizard {...defaultProps} />)

    expect(screen.getByTestId('review-step')).toBeInTheDocument()
  })

  it('submits application and shows success step', async () => {
    mockUseApplicationForm.currentStep = 'review'
    render(<ApplicationWizard {...defaultProps} />)

    const submitButton = screen.getByText('Submit Application')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockUseApplicationForm.submitApplication).toHaveBeenCalled()
    })

    // After submission, should show success step
    await waitFor(() => {
      expect(screen.getByTestId('success-step')).toBeInTheDocument()
    })
  })

  it('displays error when submit fails', () => {
    mockUseApplicationForm.submitError = { message: 'Submission failed' } as Error
    render(<ApplicationWizard {...defaultProps} />)

    expect(screen.getByText('Submission failed')).toBeInTheDocument()
  })

  it('displays save status indicator', () => {
    mockUseApplicationForm.isSaving = true
    render(<ApplicationWizard {...defaultProps} />)

    expect(screen.getByTestId('save-status')).toBeInTheDocument()
  })
})
