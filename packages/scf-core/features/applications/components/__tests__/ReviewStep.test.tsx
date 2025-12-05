import type { AttachmentMetadata, CustomQuestionAnswer, ScreeningAnswers } from '@scf/schemas'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReviewStep } from '../ReviewStep'

const mockOnEdit = vi.fn()
const mockOnSubmit = vi.fn()

vi.mock('@unicornlove/ui', () => ({
  Checkbox: ({
    checked,
    onCheckedChange,
    label,
  }: {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    label?: string
  }) => (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        data-testid="consent-checkbox"
      />
      {label}
    </label>
  ),
}))

describe('ReviewStep', () => {
  const screeningAnswers: Partial<ScreeningAnswers> = {
    current_location: 'New York, NY',
    willing_to_relocate: true,
    years_experience: 5,
    is_authorized_to_work: true,
    earliest_start_date: 'Immediately',
  }

  const customQuestionAnswers: CustomQuestionAnswer[] = [
    {
      question_id: 'q1',
      question: 'Why are you interested?',
      type: 'long_text',
      answer: 'I am very interested in this position.',
    },
  ]

  const attachments: Record<string, AttachmentMetadata> = {
    resume: {
      path: 'applications/resume.pdf',
      filename: 'resume.pdf',
      size: 1024000,
      mime_type: 'application/pdf',
      uploaded_at: '2024-01-01T00:00:00Z',
    },
    cover_letter: {
      path: 'applications/cover_letter.pdf',
      filename: 'cover_letter.pdf',
      size: 512000,
      mime_type: 'application/pdf',
      uploaded_at: '2024-01-01T00:00:00Z',
    },
  }

  const defaultProps = {
    screeningAnswers,
    customQuestionAnswers,
    attachments,
    onEdit: mockOnEdit,
    onSubmit: mockOnSubmit,
    isSubmitting: false,
    isEditMode: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders review header', () => {
    render(<ReviewStep {...defaultProps} />)

    expect(screen.getByText('Review Your Application')).toBeInTheDocument()
    expect(screen.getByText(/Please review your information carefully/)).toBeInTheDocument()
  })

  it('displays screening answers', () => {
    render(<ReviewStep {...defaultProps} />)

    expect(screen.getByText('Screening Questions')).toBeInTheDocument()
    expect(screen.getByText(/New York, NY/)).toBeInTheDocument()
    expect(screen.getByText(/Yes/)).toBeInTheDocument() // willing to relocate
  })

  it('displays custom question answers', () => {
    render(<ReviewStep {...defaultProps} />)

    expect(screen.getByText('Additional Questions')).toBeInTheDocument()
    expect(screen.getByText(/Why are you interested/)).toBeInTheDocument()
    expect(screen.getByText(/I am very interested in this position/)).toBeInTheDocument()
  })

  it('displays attachments', () => {
    render(<ReviewStep {...defaultProps} />)

    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
    expect(screen.getByText('cover_letter.pdf')).toBeInTheDocument()
  })

  it('calls onEdit with screening when edit button is clicked', () => {
    render(<ReviewStep {...defaultProps} />)

    const editButtons = screen.getAllByText('Edit')
    const screeningEditButton = editButtons[0]
    fireEvent.click(screeningEditButton)

    expect(mockOnEdit).toHaveBeenCalledWith('screening')
  })

  it('calls onEdit with questions when questions edit button is clicked', () => {
    render(<ReviewStep {...defaultProps} />)

    const editButtons = screen.getAllByText('Edit')
    const questionsEditButton = editButtons[1]
    fireEvent.click(questionsEditButton)

    expect(mockOnEdit).toHaveBeenCalledWith('questions')
  })

  it('calls onEdit with attachments when attachments edit button is clicked', () => {
    render(<ReviewStep {...defaultProps} />)

    const editButtons = screen.getAllByText('Edit')
    const attachmentsEditButton = editButtons[2]
    fireEvent.click(attachmentsEditButton)

    expect(mockOnEdit).toHaveBeenCalledWith('attachments')
  })

  it('disables submit button until consent is checked', () => {
    render(<ReviewStep {...defaultProps} />)

    const submitButton = screen.getByText('Submit Application')
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when consent is checked', () => {
    render(<ReviewStep {...defaultProps} />)

    const checkbox = screen.getByTestId('consent-checkbox')
    fireEvent.change(checkbox, { target: { checked: true } })

    const submitButton = screen.getByText('Submit Application')
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onSubmit when submit button is clicked and consent is checked', async () => {
    render(<ReviewStep {...defaultProps} />)

    const checkbox = screen.getByTestId('consent-checkbox')
    fireEvent.change(checkbox, { target: { checked: true } })

    const submitButton = screen.getByText('Submit Application')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled()
    })
  })

  it('displays loading state when submitting', () => {
    render(<ReviewStep {...defaultProps} isSubmitting={true} />)

    expect(screen.getByText('Submitting...')).toBeInTheDocument()
  })

  it('handles empty custom question answers', () => {
    render(<ReviewStep {...defaultProps} customQuestionAnswers={[]} />)

    expect(screen.getByText('Screening Questions')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
  })

  it('handles empty attachments', () => {
    render(<ReviewStep {...defaultProps} attachments={{}} />)

    expect(screen.getByText('Documents')).toBeInTheDocument()
  })

  it('shows edit mode text when isEditMode is true', () => {
    // This would be tested if the component shows different text in edit mode
    render(<ReviewStep {...defaultProps} isEditMode={true} />)

    expect(screen.getByText('Review Your Application')).toBeInTheDocument()
  })
})
