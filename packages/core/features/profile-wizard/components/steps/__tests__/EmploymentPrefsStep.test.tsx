import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EmploymentPrefsStep } from '../EmploymentPrefsStep'

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

vi.mock('@app/core/forms', () => ({
  ControlledAddressForm: ({
    label,
    placeholder,
    onAddressSelect,
  }: {
    label?: string
    placeholder?: string
    onAddressSelect?: (address: { locality?: string; administrativeAreaLevel1?: string; stateAbbreviation?: string }) => void
  }) => {
    const inputId = 'address-input'
    return (
      <div data-testid="controlled-address-form">
        {label && <label htmlFor={inputId}>{label}</label>}
        <input
          id={inputId}
        type="text"
        placeholder={placeholder}
        data-testid="address-input"
        onChange={(e) => {
          if (e.target.value === 'Seattle, WA' && onAddressSelect) {
            onAddressSelect({
              locality: 'Seattle',
              administrativeAreaLevel1: 'Washington',
              stateAbbreviation: 'WA',
            })
          }
        }}
        />
      </div>
    )
  },
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
    keyboardType,
    ...rest
  }: {
    value?: string
    onChangeText?: (value: string) => void
    placeholder?: string
    keyboardType?: string
  } & Record<string, unknown>) => (
    <input
      value={value}
      onChange={(event) => onChangeText?.(event.target.value)}
      placeholder={placeholder}
      type={keyboardType === 'numeric' ? 'number' : 'text'}
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

  const Select = ({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (value: string) => void
    children?: ReactNode
  }) => (
    <div data-testid="select-wrapper">
      <select value={value || ''} onChange={(e) => onValueChange?.(e.target.value)}>
        {children}
      </select>
    </div>
  )

  Select.Trigger = ({ children }: { children?: ReactNode }) => (
    <div data-testid="select-trigger">{children}</div>
  )

  Select.Value = ({ placeholder }: { placeholder?: string }) => (
    <span data-testid="select-value">{placeholder || 'Select...'}</span>
  )

  Select.Content = ({ children }: { children?: ReactNode }) => (
    <div data-testid="select-content">{children}</div>
  )

  Select.Viewport = ({ children }: { children?: ReactNode }) => (
    <div data-testid="select-viewport">{children}</div>
  )

  Select.Item = ({
    value,
    children,
  }: {
    value: string
    children?: ReactNode
  }) => (
    <option value={value}>{children}</option>
  )

  Select.ItemText = ({ children }: { children?: ReactNode }) => <>{children}</>

  Select.ScrollUpButton = () => null
  Select.ScrollDownButton = () => null

  const Adapt = ({ children }: { children?: ReactNode }) => <>{children}</>
  const Sheet = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  Sheet.Frame = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  Sheet.ScrollView = () => null
  Sheet.Overlay = () => null

  Select.Adapt = Adapt

  return {
    YStack: Stack,
    XStack: Stack,
    Input,
    Text,
    Paragraph,
    Select,
    Adapt,
    Sheet,
  }
})

describe('EmploymentPrefsStep', () => {
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
      locationPreference: 'Seattle, WA',
      hourlyRate: '$35',
      availability: 'full_time',
      remotePreference: 'remote' as const,
    }

    render(
      <EmploymentPrefsStep
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

    expect(screen.getByDisplayValue('Seattle, WA')).toBeInTheDocument()
    expect(screen.getByDisplayValue('$35')).toBeInTheDocument()
  })

  it('allows continue button to be enabled (step is optional)', () => {
    render(
      <EmploymentPrefsStep
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
    expect(continueButton).toBeEnabled()
  })

  it('submits trimmed values on continue', async () => {
    render(
      <EmploymentPrefsStep
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

    fireEvent.change(screen.getByPlaceholderText('e.g., Seattle, WA or Within 25 miles of 98101'), {
      target: { value: '  Seattle, WA  ' },
    })
    fireEvent.change(screen.getByPlaceholderText('$35 / hour'), {
      target: { value: '  $40  ' },
    })

    const availabilitySelect = screen.getByTestId('select-wrapper').querySelector('select')
    if (availabilitySelect) {
      fireEvent.change(availabilitySelect, { target: { value: 'full_time' } })
    }

    const continueButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith({
        locationPreference: 'Seattle, WA',
        hourlyRate: '$40',
        availability: 'full_time',
        remotePreference: null,
      })
    })
  })

  it('handles save for later action', async () => {
    render(
      <EmploymentPrefsStep
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

    fireEvent.change(screen.getByPlaceholderText('e.g., Seattle, WA or Within 25 miles of 98101'), {
      target: { value: 'Seattle, WA' },
    })

    const saveButton = screen.getByText('Save & Continue Later')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSaveForLater).toHaveBeenCalled()
    })
  })

  it('handles skip action', async () => {
    render(
      <EmploymentPrefsStep
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

  it('handles address selection from ControlledAddressForm', async () => {
    render(
      <EmploymentPrefsStep
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

    const addressInput = screen.getByTestId('address-input')
    fireEvent.change(addressInput, { target: { value: 'Seattle, WA' } })

    await waitFor(() => {
      const locationInput = screen.getByPlaceholderText('e.g., Seattle, WA or Within 25 miles of 98101')
      expect(locationInput).toHaveValue('Seattle, WA')
    })
  })

  it('handles remote preference selection', async () => {
    render(
      <EmploymentPrefsStep
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

    const remoteSelects = screen.getAllByTestId('select-wrapper')
    const workEnvironmentSelect = remoteSelects[1]?.querySelector('select')
    if (workEnvironmentSelect) {
      fireEvent.change(workEnvironmentSelect, { target: { value: 'hybrid' } })
    }

    const continueButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({
          remotePreference: 'hybrid',
        }),
      )
    })
  })

  it('updates step state when form values change', async () => {
    render(
      <EmploymentPrefsStep
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

    fireEvent.change(screen.getByPlaceholderText('e.g., Seattle, WA or Within 25 miles of 98101'), {
      target: { value: 'Seattle, WA' },
    })

    await waitFor(() => {
      expect(onStepStateChange).toHaveBeenCalled()
      const latestCall = onStepStateChange.mock.calls[onStepStateChange.mock.calls.length - 1]?.[0]
      expect(latestCall?.data.locationPreference).toBe('Seattle, WA')
      expect(latestCall?.isDirty).toBe(true)
    })
  })

  it('handles empty optional fields', async () => {
    render(
      <EmploymentPrefsStep
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
      expect(onContinue).toHaveBeenCalledWith({
        locationPreference: null,
        hourlyRate: null,
        availability: null,
        remotePreference: null,
      })
    })
  })

  it('normalizes empty strings to null', async () => {
    render(
      <EmploymentPrefsStep
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

    fireEvent.change(screen.getByPlaceholderText('e.g., Seattle, WA or Within 25 miles of 98101'), {
      target: { value: '   ' },
    })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({
          locationPreference: null,
        }),
      )
    })
  })
})

