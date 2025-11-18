import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ExperienceStep } from '../ExperienceStep'

vi.mock('../StepNavigation', () => ({
  StepNavigation: ({
    canGoNext,
    isSaving,
    onNext,
    onBack,
    onSaveForLater,
    onSkip,
  }: {
    canGoNext: boolean
    isSaving: boolean
    onNext: () => void
    onBack: () => void
    onSaveForLater?: () => void
    onSkip?: () => void
  }) => (
    <div>
      <button type="button" disabled={!canGoNext || isSaving} onClick={onNext}>
        Continue
      </button>
      <button type="button" onClick={onBack}>
        Back
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={onSaveForLater}>
          Save & Continue Later
        </button>
      ) : null}
      {onSkip ? (
        <button type="button" onClick={onSkip}>
          Skip
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('@app/ui', () => ({
  MonthYearPicker: ({
    label,
    value,
    onChange,
    disabled,
    error,
  }: {
    label: string
    value: Date | null
    onChange: (date: Date | null) => void
    disabled?: boolean
    error?: string
  }) => {
    const inputId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`
    return (
      <div data-testid={`month-year-picker-${label.toLowerCase().replace(/\s+/g, '-')}`}>
        <label htmlFor={inputId}>{label}</label>
        {error && <span data-testid="error">{error}</span>}
        <input
          id={inputId}
        type="month"
        value={value ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}` : ''}
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
      data-testid="toggle-current-job"
    />
  ),
}))

vi.mock('tamagui', () => {
  const Stack = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div {...rest}>
      {children}
    </div>
  )

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

  return {
    YStack: Stack,
    XStack: Stack,
    Input,
    Text,
    Paragraph,
  }
})

describe('ExperienceStep', () => {
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
      jobTitle: 'Lead Carpenter',
      companyName: 'Summit Builders',
      startDate: '2020-01-01',
      endDate: null,
      isCurrent: true,
      summary: 'Led construction projects',
    }

    render(
      <ExperienceStep
        initialData={initialData}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    expect(screen.getByDisplayValue('Lead Carpenter')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Summit Builders')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Led construction projects')).toBeInTheDocument()
  })

  it('disables continue button when required fields are empty', () => {
    render(
      <ExperienceStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    const continueButton = screen.getByRole('button', { name: /continue/i })
    expect(continueButton).toBeDisabled()
  })

  it('enables continue button when required fields are filled', async () => {
    render(
      <ExperienceStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Lead Carpenter'), {
      target: { value: 'Electrician' },
    })
    fireEvent.change(screen.getByPlaceholderText('Summit Builders'), {
      target: { value: 'City Power' },
    })

    const startDateInput = screen.getByTestId('input-start-date')
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })

    await waitFor(() => {
      const continueButton = screen.getByRole('button', { name: /continue/i })
      expect(continueButton).toBeEnabled()
    })
  })

  it('shows validation errors for empty required fields', async () => {
    render(
      <ExperienceStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    const continueButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(screen.getByText('Job title is required')).toBeInTheDocument()
      expect(screen.getByText('Company is required')).toBeInTheDocument()
      expect(screen.getByText('Start date is required')).toBeInTheDocument()
    })
  })

  it('submits trimmed values on continue', async () => {
    render(
      <ExperienceStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Lead Carpenter'), {
      target: { value: '  Electrician  ' },
    })
    fireEvent.change(screen.getByPlaceholderText('Summit Builders'), {
      target: { value: '  City Power  ' },
    })
    fireEvent.change(screen.getByPlaceholderText('Installed custom millwork across four high-rise projects...'), {
      target: { value: '  Led electrical installations  ' },
    })

    const startDateInput = screen.getByTestId('input-start-date')
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await waitFor(() => expect(continueButton).toBeEnabled())
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith({
        jobTitle: 'Electrician',
        companyName: 'City Power',
        startDate: '2020-01-01',
        endDate: null,
        isCurrent: true,
        summary: 'Led electrical installations',
      })
    })
  })

  it('handles save for later action', async () => {
    render(
      <ExperienceStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Lead Carpenter'), {
      target: { value: 'Electrician' },
    })
    fireEvent.change(screen.getByPlaceholderText('Summit Builders'), {
      target: { value: 'City Power' },
    })

    const startDateInput = screen.getByTestId('input-start-date')
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })

    const saveButton = screen.getByText('Save & Continue Later')
    await waitFor(() => expect(saveButton).not.toBeDisabled())
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSaveForLater).toHaveBeenCalled()
    })
  })

  it('handles skip action', async () => {
    render(
      <ExperienceStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    const skipButton = screen.getByText('Skip')
    fireEvent.click(skipButton)

    await waitFor(() => {
      expect(onSkip).toHaveBeenCalledTimes(1)
    })
  })

  it('disables end date when current job is checked', async () => {
    render(
      <ExperienceStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    const toggle = screen.getByTestId('toggle-current-job')
    expect(toggle).toBeChecked()

    const endDateInput = screen.getByTestId('input-end-date')
    expect(endDateInput).toBeDisabled()

    fireEvent.click(toggle)
    await waitFor(() => {
      expect(endDateInput).not.toBeDisabled()
    })
  })

  it('sets endDate to null when isCurrent is true', async () => {
    render(
      <ExperienceStep
        initialData={{
          jobTitle: 'Electrician',
          companyName: 'City Power',
          startDate: '2020-01-01',
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
      />,
    )

    const toggle = screen.getByTestId('toggle-current-job')
    fireEvent.click(toggle)

    const startDateInput = screen.getByTestId('input-start-date')
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await waitFor(() => expect(continueButton).toBeEnabled())
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({
          endDate: null,
          isCurrent: true,
        }),
      )
    })
  })

  it('updates step state when form values change', async () => {
    render(
      <ExperienceStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Lead Carpenter'), {
      target: { value: 'Electrician' },
    })

    await waitFor(() => {
      expect(onStepStateChange).toHaveBeenCalled()
      const latestCall = onStepStateChange.mock.calls[onStepStateChange.mock.calls.length - 1]?.[0]
      expect(latestCall?.data.jobTitle).toBe('Electrician')
      expect(latestCall?.isDirty).toBe(true)
    })
  })

  it('handles date formatting correctly', async () => {
    render(
      <ExperienceStep
        initialData={undefined}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText('Lead Carpenter'), {
      target: { value: 'Electrician' },
    })
    fireEvent.change(screen.getByPlaceholderText('Summit Builders'), {
      target: { value: 'City Power' },
    })

    const startDateInput = screen.getByTestId('input-start-date')
    fireEvent.change(startDateInput, { target: { value: '2020-06' } })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    await waitFor(() => expect(continueButton).toBeEnabled())
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2020-06-01',
        }),
      )
    })
  })
})

