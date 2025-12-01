import type { ScreeningAnswers } from '@app/schemas'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScreeningStep } from '../ScreeningStep'

const mockOnAnswersChange = vi.fn()
const mockOnContinue = vi.fn()

vi.mock('@unicornlove/ui', () => ({
  AddressAutocomplete: ({
    value,
    onChange,
    onAddressSelect,
    placeholder,
  }: {
    value: string
    onChange: (text: string) => void
    onAddressSelect: (address: { formattedAddress: string }) => void
    placeholder?: string
  }) => (
    <div data-testid="address-autocomplete">
      <input
        data-testid="address-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        data-testid="select-address"
        onClick={() => onAddressSelect({ formattedAddress: '123 Main St, City, State' })}
      >
        Select Address
      </button>
    </div>
  ),
}))

describe('ScreeningStep', () => {
  const defaultProps = {
    answers: {} as Partial<ScreeningAnswers>,
    onAnswersChange: mockOnAnswersChange,
    onContinue: mockOnContinue,
    isSubmitting: false,
    requiredSkills: [],
    optionalSkills: [],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env.EXPO_PUBLIC_MAPBOX_TOKEN = 'test-token'
  })

  it('renders all form fields', () => {
    render(<ScreeningStep {...defaultProps} />)

    expect(screen.getByText('Basic Information')).toBeInTheDocument()
    expect(screen.getByText(/Your current location/)).toBeInTheDocument()
    expect(screen.getByText(/Are you willing to relocate/)).toBeInTheDocument()
    expect(screen.getByText(/Years of experience/)).toBeInTheDocument()
    expect(screen.getByText(/Are you authorized to work legally in the US/)).toBeInTheDocument()
    expect(screen.getByText(/Earliest start date/)).toBeInTheDocument()
  })

  it('displays required and optional skills when provided', () => {
    render(
      <ScreeningStep
        {...defaultProps}
        requiredSkills={['Skill 1', 'Skill 2']}
        optionalSkills={['Optional 1']}
      />
    )

    expect(screen.getByText('Required skills')).toBeInTheDocument()
    expect(screen.getByText('Skill 1, Skill 2')).toBeInTheDocument()
    expect(screen.getByText('Optional skills')).toBeInTheDocument()
    expect(screen.getByText('Optional 1')).toBeInTheDocument()
  })

  it('calls onAnswersChange when location is entered', () => {
    render(<ScreeningStep {...defaultProps} />)

    const addressInput = screen.getByTestId('address-input')
    fireEvent.change(addressInput, { target: { value: 'New York' } })

    expect(mockOnAnswersChange).toHaveBeenCalledWith({
      current_location: 'New York',
    })
  })

  it('calls onAnswersChange when address is selected', () => {
    render(<ScreeningStep {...defaultProps} />)

    const selectButton = screen.getByTestId('select-address')
    fireEvent.click(selectButton)

    expect(mockOnAnswersChange).toHaveBeenCalledWith({
      current_location: '123 Main St, City, State',
    })
  })

  it('calls onAnswersChange when willing to relocate is set to yes', () => {
    render(<ScreeningStep {...defaultProps} />)

    const yesButton = screen.getByText('Yes').closest('button')
    if (yesButton) {
      fireEvent.click(yesButton)
    }

    expect(mockOnAnswersChange).toHaveBeenCalled()
  })

  it('calls onAnswersChange when work authorization is set', () => {
    render(<ScreeningStep {...defaultProps} />)

    const buttons = screen.getAllByText('Yes')
    // Work authorization Yes button should be the second one
    const workAuthButton = buttons[1]?.closest('button')
    if (workAuthButton) {
      fireEvent.click(workAuthButton)
    }

    expect(mockOnAnswersChange).toHaveBeenCalled()
  })

  it('shows validation errors when continue is clicked with empty fields', async () => {
    render(<ScreeningStep {...defaultProps} />)

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText('Current location is required')).toBeInTheDocument()
    })

    expect(mockOnContinue).not.toHaveBeenCalled()
  })

  it('calls onContinue when all required fields are filled', async () => {
    const validAnswers: Partial<ScreeningAnswers> = {
      current_location: 'New York, NY',
      willing_to_relocate: true,
      years_experience: 5,
      is_authorized_to_work: true,
      earliest_start_date: 'Immediately',
    }

    render(<ScreeningStep {...defaultProps} answers={validAnswers} />)

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(mockOnContinue).toHaveBeenCalled()
    })
  })

  it('disables form when isSubmitting is true', () => {
    render(<ScreeningStep {...defaultProps} isSubmitting={true} />)

    const continueButton = screen.getByText('Saving...')
    expect(continueButton).toBeInTheDocument()
  })

  it('clears errors when field is updated after error', async () => {
    render(<ScreeningStep {...defaultProps} />)

    // Trigger validation error
    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText('Current location is required')).toBeInTheDocument()
    })

    // Fix the error
    const addressInput = screen.getByTestId('address-input')
    fireEvent.change(addressInput, { target: { value: 'New York' } })

    await waitFor(() => {
      expect(screen.queryByText('Current location is required')).not.toBeInTheDocument()
    })
  })

  it('validates years of experience range', async () => {
    const invalidAnswers: Partial<ScreeningAnswers> = {
      current_location: 'New York',
      years_experience: 100, // Invalid: too high
      is_authorized_to_work: true,
      earliest_start_date: 'Immediately',
    }

    render(<ScreeningStep {...defaultProps} answers={invalidAnswers} />)

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid number of years')).toBeInTheDocument()
    })
  })
})
