import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// TODO: Fix syntax error - vitest has trouble parsing z.infer<typeof employmentSchema>
// in the component file. This is a known issue with vitest's TypeScript transform.
// Possible solutions:
// 1. Update vitest config to handle typeof in type definitions
// 2. Refactor component to avoid z.infer<typeof> pattern
// 3. Use a different import strategy

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

vi.mock('@scf/core/forms', () => ({
  ControlledAddressForm: ({
    label,
    placeholder,
    onAddressSelect,
  }: {
    label?: string
    placeholder?: string
    onAddressSelect?: (address: {
      locality?: string
      administrativeAreaLevel1?: string
      stateAbbreviation?: string
    }) => void
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

  type SelectOption = { value: string; label: ReactNode }
  const SelectItem = ({ value, children }: { value: string; children?: ReactNode }) => (
    <span data-value={value}>{children}</span>
  )

  const isSelectItemElement = (element: ReactNode): boolean => {
    return isValidElement(element) && element.type === SelectItem
  }

  const extractOptions = (nodes: ReactNode): SelectOption[] => {
    const options: SelectOption[] = []
    Children.forEach(nodes, (child) => {
      if (!isValidElement(child)) {
        return
      }
      if (isSelectItemElement(child)) {
        const props = child.props as { value: string; children?: ReactNode }
        options.push({ value: props.value, label: props.children })
        return
      }
      const nestedChildren = (child.props as { children?: ReactNode }).children
      if (nestedChildren) {
        options.push(...extractOptions(nestedChildren))
      }
    })
    return options
  }

  const SelectComponent = ({
    value,
    onValueChange,
    children,
  }: {
    value?: string
    onValueChange?: (value: string) => void
    children?: ReactNode
  }) => {
    const options = extractOptions(children)

    return (
      <div data-testid="select-wrapper">
        <select value={value || ''} onChange={(e) => onValueChange?.(e.target.value)}>
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  SelectComponent.Trigger = () => null
  SelectComponent.Value = () => null
  SelectComponent.Content = ({ children }: { children?: ReactNode }) => <>{children}</>
  SelectComponent.Viewport = ({ children }: { children?: ReactNode }) => <>{children}</>
  SelectComponent.Item = SelectItem
  SelectComponent.ItemText = ({ children }: { children?: ReactNode }) => <>{children}</>
  SelectComponent.ScrollUpButton = () => null
  SelectComponent.ScrollDownButton = () => null

  const Adapt = ({ children }: { children?: ReactNode }) => <>{children}</>
  const Sheet = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  Sheet.Frame = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  Sheet.ScrollView = () => null
  Sheet.Overlay = () => null

  SelectComponent.Adapt = Adapt

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
    Select: SelectComponent,
    Adapt,
    Sheet,
    Button,
  }
})

vi.mock('@unicornlove/beyond-ui', () => ({
  ResponsiveSelect: ({
    value,
    onValueChange,
    options,
    placeholder,
  }: {
    value?: string | null
    onValueChange: (value: string) => void
    options: Array<{ value: string; label: string }>
    placeholder?: string
  }) => (
    <select value={value ?? ''} onChange={(event) => onValueChange(event.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}))

// Use dynamic import to avoid parsing issues with z.infer<typeof>
const { EmploymentPrefsStep } = await import('../EmploymentPrefsStep')

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
      />
    )

    expect(
      screen.getByPlaceholderText('e.g., Seattle, WA or Within 25 miles of 98101')
    ).toHaveValue('Seattle, WA')
    expect(screen.getByPlaceholderText('$35 / hour')).toHaveValue('$35')
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
      />
    )

    const nextButton = screen.getByRole('button', { name: /next: education/i })
    expect(nextButton).toBeEnabled()
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
      />
    )

    fireEvent.change(screen.getByPlaceholderText('e.g., Seattle, WA or Within 25 miles of 98101'), {
      target: { value: '  Seattle, WA  ' },
    })
    fireEvent.change(screen.getByPlaceholderText('$35 / hour'), {
      target: { value: '  $40  ' },
    })

    const availabilitySelect = screen.getAllByTestId('select-wrapper')[0]?.querySelector('select')
    if (availabilitySelect) {
      fireEvent.change(availabilitySelect, { target: { value: 'full_time' } })
    }

    const user = userEvent.setup()
    const nextButton = screen.getByRole('button', { name: /next: education/i })
    await user.click(nextButton)

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
      />
    )

    fireEvent.change(screen.getByPlaceholderText('e.g., Seattle, WA or Within 25 miles of 98101'), {
      target: { value: 'Seattle, WA' },
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
      <EmploymentPrefsStep
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
      />
    )

    const addressInput = screen.getByTestId('address-input')
    fireEvent.change(addressInput, { target: { value: 'Seattle, WA' } })

    await waitFor(() => {
      const locationInput = screen.getByPlaceholderText(
        'e.g., Seattle, WA or Within 25 miles of 98101'
      )
      expect(locationInput).toHaveValue('Seattle, Washington')
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
      />
    )

    const remoteSelects = screen.getAllByTestId('select-wrapper')
    const workEnvironmentSelect = remoteSelects[1]?.querySelector('select')
    if (workEnvironmentSelect) {
      fireEvent.change(workEnvironmentSelect, { target: { value: 'hybrid' } })
    }

    const user = userEvent.setup()
    const nextButton = screen.getByRole('button', { name: /next: education/i })
    await user.click(nextButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({
          remotePreference: 'hybrid',
        })
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
      />
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
      />
    )

    const user = userEvent.setup()
    const nextButton = screen.getByRole('button', { name: /next: education/i })
    await user.click(nextButton)

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
      />
    )

    fireEvent.change(screen.getByPlaceholderText('e.g., Seattle, WA or Within 25 miles of 98101'), {
      target: { value: '   ' },
    })

    const user = userEvent.setup()
    const nextButton = screen.getByRole('button', { name: /next: education/i })
    await user.click(nextButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith(
        expect.objectContaining({
          locationPreference: null,
        })
      )
    })
  })
})
