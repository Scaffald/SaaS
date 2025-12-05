import type { CustomQuestionAnswer } from '@scf/schemas'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type CustomQuestion, CustomQuestionsStep } from '../CustomQuestionsStep'

const mockOnAnswersChange = vi.fn()
const mockOnPrevious = vi.fn()
const mockOnContinue = vi.fn()

describe('CustomQuestionsStep', () => {
  const questions: CustomQuestion[] = [
    {
      id: 'q1',
      question: 'Why are you interested in this position?',
      type: 'long_text',
      required: true,
      min_length: 50,
      max_length: 500,
    },
    {
      id: 'q2',
      question: 'Do you have experience with React?',
      type: 'yes_no',
      required: false,
    },
    {
      id: 'q3',
      question: 'Select your preferred work style',
      type: 'single_choice',
      required: true,
      options: ['Remote', 'Hybrid', 'Onsite'],
    },
  ]

  const defaultProps = {
    questions,
    answers: [] as CustomQuestionAnswer[],
    onAnswersChange: mockOnAnswersChange,
    onPrevious: mockOnPrevious,
    onContinue: mockOnContinue,
    isSubmitting: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders all questions', () => {
    render(<CustomQuestionsStep {...defaultProps} />)

    expect(screen.getByText('Additional Questions')).toBeInTheDocument()
    expect(screen.getByText(/Why are you interested in this position/)).toBeInTheDocument()
    expect(screen.getByText(/Do you have experience with React/)).toBeInTheDocument()
    expect(screen.getByText(/Select your preferred work style/)).toBeInTheDocument()
  })

  it('displays character counter for text questions', () => {
    render(<CustomQuestionsStep {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your answer here...')
    fireEvent.change(textarea, {
      target: { value: 'This is a test answer with enough characters' },
    })

    expect(screen.getByText(/\/ 500 characters/)).toBeInTheDocument()
  })

  it('validates minimum length for required text questions', async () => {
    render(<CustomQuestionsStep {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your answer here...')
    fireEvent.change(textarea, { target: { value: 'Short' } })

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText(/Please provide at least 50 characters/)).toBeInTheDocument()
    })

    expect(mockOnContinue).not.toHaveBeenCalled()
  })

  it('validates maximum length for text questions', async () => {
    const longText = 'a'.repeat(501)
    render(<CustomQuestionsStep {...defaultProps} />)

    const textarea = screen.getByPlaceholderText('Type your answer here...')
    fireEvent.change(textarea, { target: { value: longText } })

    // Text should be truncated to max length
    await waitFor(() => {
      expect(textarea).toHaveValue('a'.repeat(500))
    })
  })

  it('handles yes/no toggle questions', () => {
    render(<CustomQuestionsStep {...defaultProps} />)

    const toggle = screen.getByLabelText(/Do you have experience with React/)
    fireEvent.click(toggle)

    expect(mockOnAnswersChange).toHaveBeenCalled()
  })

  it('handles single choice questions', () => {
    render(<CustomQuestionsStep {...defaultProps} />)

    const remoteOption = screen.getByText('Remote').closest('div')
    if (remoteOption) {
      fireEvent.click(remoteOption)
    }

    expect(mockOnAnswersChange).toHaveBeenCalled()
  })

  it('handles multiple choice questions', () => {
    const multiChoiceQuestion: CustomQuestion = {
      id: 'q4',
      question: 'Select your skills',
      type: 'multiple_choice',
      required: false,
      options: ['JavaScript', 'TypeScript', 'Python'],
    }

    render(
      <CustomQuestionsStep {...defaultProps} questions={[...questions, multiChoiceQuestion]} />
    )

    const jsOption = screen.getByText('JavaScript').closest('div')
    if (jsOption) {
      fireEvent.click(jsOption)
    }

    expect(mockOnAnswersChange).toHaveBeenCalled()
  })

  it('calls onContinue when all required questions are answered', async () => {
    const answers: CustomQuestionAnswer[] = [
      {
        question_id: 'q1',
        question: 'Why are you interested?',
        type: 'long_text',
        answer:
          'This is a detailed answer that meets the minimum length requirement of 50 characters.',
      },
      {
        question_id: 'q3',
        question: 'Select your preferred work style',
        type: 'single_choice',
        answer: 'Remote',
      },
    ]

    render(<CustomQuestionsStep {...defaultProps} answers={answers} />)

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(mockOnContinue).toHaveBeenCalled()
    })
  })

  it('calls onPrevious when previous button is clicked', () => {
    render(<CustomQuestionsStep {...defaultProps} />)

    const previousButton = screen.getByText('Previous')
    fireEvent.click(previousButton)

    expect(mockOnPrevious).toHaveBeenCalled()
  })

  it('displays validation summary when multiple errors exist', async () => {
    render(<CustomQuestionsStep {...defaultProps} />)

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText('Please complete the following:')).toBeInTheDocument()
    })
  })

  it('handles empty questions array', () => {
    render(<CustomQuestionsStep {...defaultProps} questions={[]} />)

    expect(screen.getByText(/This position has no additional questions/)).toBeInTheDocument()
  })

  it('disables form when isSubmitting is true', () => {
    render(<CustomQuestionsStep {...defaultProps} isSubmitting={true} />)

    const continueButton = screen.getByText('Saving...')
    expect(continueButton).toBeInTheDocument()
  })
})
