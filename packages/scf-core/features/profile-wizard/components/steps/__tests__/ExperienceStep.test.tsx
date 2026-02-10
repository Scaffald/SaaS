import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
      data-testid="toggle-current-job"
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
      />
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
      />
    )

    const nextButton = screen.getByRole('button', { name: /next: certifications/i })
    expect(nextButton).toBeDisabled()
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
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Lead Carpenter'), {
      target: { value: 'Electrician' },
    })
    fireEvent.change(screen.getByPlaceholderText('Summit Builders'), {
      target: { value: 'City Power' },
    })

    const startDateInput = screen.getByTestId('input-start-date-*')
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })

    await waitFor(() => {
      const nextButton = screen.getByRole('button', { name: /next: certifications/i })
      expect(nextButton).toBeEnabled()
    })
  })

  it('shows validation errors for empty required fields after interaction', async () => {
    const user = userEvent.setup()
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
      />
    )

    const jobTitleInput = screen.getByPlaceholderText('Lead Carpenter')
    await user.type(jobTitleInput, 'Electrician')
    await user.clear(jobTitleInput)

    const companyInput = screen.getByPlaceholderText('Summit Builders')
    await user.type(companyInput, 'Summit')
    await user.clear(companyInput)

    const startDateInput = screen.getByTestId('input-start-date-*')
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })
    fireEvent.change(startDateInput, { target: { value: '' } })

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
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Lead Carpenter'), {
      target: { value: '  Electrician  ' },
    })
    fireEvent.change(screen.getByPlaceholderText('Summit Builders'), {
      target: { value: '  City Power  ' },
    })
    fireEvent.change(
      screen.getByPlaceholderText('Installed custom millwork across four high-rise projects...'),
      {
        target: { value: '  Led electrical installations  ' },
      }
    )

    const startDateInput = screen.getByTestId('input-start-date-*')
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })

    const user = userEvent.setup()
    const nextButton = screen.getByRole('button', { name: /next: certifications/i })
    await waitFor(() => expect(nextButton).toBeEnabled())
    await user.click(nextButton)

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
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Lead Carpenter'), {
      target: { value: 'Electrician' },
    })
    fireEvent.change(screen.getByPlaceholderText('Summit Builders'), {
      target: { value: 'City Power' },
    })

    const startDateInput = screen.getByTestId('input-start-date-*')
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })

    const user = userEvent.setup()
    const saveButton = screen.getByRole('button', { name: /save & continue later/i })
    await waitFor(() => expect(saveButton).not.toBeDisabled())
    await user.click(saveButton)

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
      />
    )

    const user = userEvent.setup()
    const skipButton = screen.getByRole('button', { name: /skip this step/i })
    await user.click(skipButton)

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
      />
    )

    const user = userEvent.setup()
    const toggle = screen.getByTestId('toggle-current-job')
    expect(toggle).toBeChecked()

    const endDateInput = screen.getByTestId('input-end-date')
    expect(endDateInput).toBeDisabled()

    await user.click(toggle)
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
      />
    )

    const user = userEvent.setup()
    const toggle = screen.getByTestId('toggle-current-job')
    await user.click(toggle)

    const startDateInput = screen.getByTestId('input-start-date-*')
    fireEvent.change(startDateInput, { target: { value: '2020-01' } })

    const nextButton = screen.getByRole('button', { name: /next: certifications/i })
    await waitFor(() => expect(nextButton).toBeEnabled())
    await user.click(nextButton)

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
      <ExperienceStep
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
      />
    )

    fireEvent.change(screen.getByPlaceholderText('Lead Carpenter'), {
      target: { value: 'Electrician' },
    })
    fireEvent.change(screen.getByPlaceholderText('Summit Builders'), {
      target: { value: 'City Power' },
    })

    const startDateInput = screen.getByTestId('input-start-date-*')
    fireEvent.change(startDateInput, { target: { value: '2020-06' } })

    const user = userEvent.setup()
    const nextButton = screen.getByRole('button', { name: /next: certifications/i })
    await waitFor(() => expect(nextButton).toBeEnabled())
    await user.click(nextButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2020-06-01',
        })
      )
    })
  })
})
