import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EducationStep } from '../EducationStep'

vi.mock('../StepNavigation', () => ({
  StepNavigation: ({
    canGoNext,
    isSaving,
    onNext,
    onBack,
    onSaveForLater,
    onSkip,
    nextLabel = 'Next',
    backLabel = 'Back',
    skipLabel = 'Skip This Step',
    saveLabel = 'Save & Continue Later',
  }: {
    canGoNext: boolean
    isSaving: boolean
    onNext: () => void
    onBack: () => void
    onSaveForLater?: () => void
    onSkip?: () => void
    nextLabel?: string
    backLabel?: string
    skipLabel?: string
    saveLabel?: string
  }) => (
    <div>
      <button type="button" disabled={!canGoNext || isSaving} onClick={onNext}>
        {nextLabel}
      </button>
      <button type="button" onClick={onBack}>
        {backLabel}
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={onSaveForLater}>
          {saveLabel}
        </button>
      ) : null}
      {onSkip ? (
        <button type="button" onClick={onSkip}>
          {skipLabel}
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('@unicornlove/beyond-ui', () => ({
  MonthYearPicker: ({
    label,
    value,
    onChange,
    disabled,
  }: {
    label: string
    value: Date | null
    onChange: (date: Date | null) => void
    disabled?: boolean
  }) => {
    const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`
    return (
      <div data-testid={`month-year-picker-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <label htmlFor={inputId}>{label}</label>
        <input
          id={inputId}
          type="month"
          value={
            value ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}` : ''
          }
          onChange={(e) => {
            if (e.target.value) {
              const [year, month] = e.target.value.split('-')
              onChange(new Date(Number.parseInt(year, 10), Number.parseInt(month, 10) - 1, 1))
            } else {
              onChange(null)
            }
          }}
          disabled={disabled}
          data-testid={inputId}
        />
      </div>
    )
  },
  ToggleSwitch: ({
    checked,
    onCheckedChange,
    'aria-label': ariaLabel,
  }: {
    checked: boolean
    onCheckedChange: (checked: boolean) => void
    'aria-label'?: string
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      aria-label={ariaLabel}
      data-testid="toggle-current-enrollment"
    />
  ),
}))

vi.mock('@unicornlove/beyond-ui', () => {
  const Stack = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <div {...rest}>{children}</div>

  const Input = ({
    value = '',
    onChangeText,
    placeholder,
    ...rest
  }: {
    value?: string
    onChangeText?: (value: string) => void
    placeholder?: string
  } & Record<string, unknown>) => (
    <input
      value={value}
      onChange={(event) => onChangeText?.(event.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  )

  const Text = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <span {...rest}>{children}</span>

  const Paragraph = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <p {...rest}>{children}</p>

  const Button = ({
    children,
    onPress,
    disabled,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    disabled?: boolean
  } & Record<string, unknown>) => (
    <button type="button" disabled={disabled} onClick={onPress} {...rest}>
      {children}
    </button>
  )

  return {
    Stack: Stack,
    Row: Stack,
    Input,
    Text,
    Paragraph,
    Button,
  }
})

describe('EducationStep', () => {
  const onContinue = vi.fn()
  const onSaveForLater = vi.fn()
  const onBack = vi.fn()
  const onSkip = vi.fn()
  const onStepStateChange = vi.fn()

  beforeEach(() => {
    onContinue.mockReset()
    onSaveForLater.mockReset()
    onBack.mockReset()
    onSkip.mockReset()
    onStepStateChange.mockReset()
  })

  it('renders with initial data', () => {
    const initialData = {
      degreeType: 'Associate of Applied Science',
      institutionName: 'Northwest Technical College',
      startDate: '2018-01-01',
      endDate: '2020-12-01',
      isCurrent: false,
    }

    render(
      <EducationStep
        initialData={initialData}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    expect(screen.getByDisplayValue('Associate of Applied Science')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Northwest Technical College')).toBeInTheDocument()
  })

  it('allows continue button to be enabled (step is optional)', () => {
    render(
      <EducationStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const finishButton = screen.getByRole('button', { name: /finish/i })
    expect(finishButton).toBeEnabled()
  })

  it('submits trimmed values on continue', async () => {
    render(
      <EducationStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Associate of Applied Science, Carpentry'), {
      target: { value: '  Bachelor of Science  ' },
    })
    fireEvent.change(screen.getByPlaceholderText('Northwest Technical College'), {
      target: { value: '  University of Washington  ' },
    })

    const startDateInput = screen.getByTestId('input-start-date')
    fireEvent.change(startDateInput, { target: { value: '2018-01' } })

    const user = userEvent.setup()
    const finishButton = screen.getByRole('button', { name: /finish/i })
    await user.click(finishButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith({
        degreeType: 'Bachelor of Science',
        institutionName: 'University of Washington',
        startDate: '2018-01-01',
        endDate: null,
        isCurrent: false,
      })
    })
  })

  it('handles save for later action', async () => {
    render(
      <EducationStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Associate of Applied Science, Carpentry'), {
      target: { value: 'Bachelor of Science' },
    })

    const user = userEvent.setup()
    const saveButton = screen.getByRole('button', { name: /save & continue later/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(onSaveForLater).toHaveBeenCalled()
    })
  })

  it('handles skip action', async () => {
    render(
      <EducationStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const user = userEvent.setup()
    const skipButton = screen.getByRole('button', { name: /skip this step/i })
    await user.click(skipButton)

    await waitFor(() => {
      expect(onSkip).toHaveBeenCalledTimes(1)
    })
  })

  it('disables end date when currently enrolled is checked', async () => {
    render(
      <EducationStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const user = userEvent.setup()
    const toggle = screen.getByTestId('toggle-current-enrollment')
    expect(toggle).not.toBeChecked()

    const endDateInput = screen.getByTestId('input-end-date')
    expect(endDateInput).not.toBeDisabled()

    await user.click(toggle)
    await waitFor(() => {
      expect(endDateInput).toBeDisabled()
    })
  })

  it('sets endDate to null when isCurrent is true', async () => {
    render(
      <EducationStep
        initialData={{
          degreeType: 'Bachelor',
          institutionName: 'University',
          startDate: '2018-01-01',
          endDate: '2022-12-01',
          isCurrent: false,
        }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const user = userEvent.setup()
    const toggle = screen.getByTestId('toggle-current-enrollment')
    await user.click(toggle)

    const finishButton = screen.getByRole('button', { name: /finish/i })
    await user.click(finishButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({
          endDate: null,
          isCurrent: true,
        })
      )
    })
  })

  it('updates step state when form values change', async () => {
    render(
      <EducationStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Associate of Applied Science, Carpentry'), {
      target: { value: 'Bachelor of Science' },
    })

    await waitFor(() => {
      expect(onStepStateChange).toHaveBeenCalled()
      const latestCall = onStepStateChange.mock.calls[onStepStateChange.mock.calls.length - 1]?.[0]
      expect(latestCall?.data.degreeType).toBe('Bachelor of Science')
      expect(latestCall?.isDirty).toBe(true)
    })
  })

  it('handles date formatting correctly', async () => {
    render(
      <EducationStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Associate of Applied Science, Carpentry'), {
      target: { value: 'Bachelor' },
    })

    const startDateInput = screen.getByTestId('input-start-date')
    fireEvent.change(startDateInput, { target: { value: '2018-06' } })

    const user = userEvent.setup()
    const finishButton = screen.getByRole('button', { name: /finish/i })
    await user.click(finishButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2018-06-01',
        })
      )
    })
  })

  it('handles empty optional fields', async () => {
    render(
      <EducationStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const user = userEvent.setup()
    const finishButton = screen.getByRole('button', { name: /finish/i })
    await user.click(finishButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith({
        degreeType: '',
        institutionName: '',
        startDate: null,
        endDate: null,
        isCurrent: false,
      })
    })
  })
})
