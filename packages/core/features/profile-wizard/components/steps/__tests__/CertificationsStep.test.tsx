import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CertificationsStep } from '../CertificationsStep'

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

'@scaffald/tamagui-ui', () => ({
  MonthYearPicker: ({
    label,
    value,
    onChange,
  }: {
    label: string
    value: Date | null
    onChange: (date: Date | null) => void
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
          data-testid={inputId}
        />
      </div>
    )
  },
}))

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'test-uuid-123',
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
    id,
    ...rest
  }: {
    value?: string
    onChangeText?: (value: string) => void
    placeholder?: string
    id?: string
  } & Record<string, unknown>) => (
    <input
      id={id}
      value={value}
      onChange={(event) => onChangeText?.(event.target.value)}
      placeholder={placeholder}
      {...rest}
    />
  )

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
    <button type="button" onClick={onPress} disabled={disabled} {...rest}>
      {children}
    </button>
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

  const Label = ({
    children,
    htmlFor,
    ...rest
  }: {
    children?: ReactNode
    htmlFor?: string
  } & Record<string, unknown>) => (
    <label htmlFor={htmlFor} {...rest}>
      {children}
    </label>
  )

  const Card = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="certification-card" {...rest}>
      {children}
    </div>
  )

  Card.Header = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="card-header" {...rest}>
      {children}
    </div>
  )

  return {
    YStack: Stack,
    XStack: Stack,
    Input,
    Button,
    Text,
    Paragraph,
    Label,
    Card,
    CardHeader: Card.Header,
  }
})

describe('CertificationsStep', () => {
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
      certifications: [
        {
          id: 'cert-1',
          name: 'OSHA 30-Hour Construction Safety',
          issuer: 'OSHA',
          issuedOn: '2020-01-01',
          expiresOn: '2023-01-01',
        },
      ],
    }

    render(
      <CertificationsStep
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

    expect(screen.getByText('OSHA 30-Hour Construction Safety')).toBeInTheDocument()
    expect(screen.getByText('OSHA')).toBeInTheDocument()
  })

  it('allows adding a certification', async () => {
    render(
      <CertificationsStep
        initialData={{ certifications: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const nameInput = screen.getByPlaceholderText('OSHA 30-Hour Construction Safety')
    const issuerInput = screen.getByPlaceholderText('Occupational Safety and Health Administration')
    const addButton = screen.getByText('Add Certification')

    expect(addButton).toBeDisabled()

    fireEvent.change(nameInput, { target: { value: 'OSHA 30-Hour' } })
    fireEvent.change(issuerInput, { target: { value: 'OSHA' } })

    await waitFor(() => {
      expect(addButton).toBeEnabled()
    })

    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('OSHA 30-Hour')).toBeInTheDocument()
      expect(screen.getByText('OSHA')).toBeInTheDocument()
    })
  })

  it('clears form fields after adding certification', async () => {
    render(
      <CertificationsStep
        initialData={{ certifications: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const nameInput = screen.getByPlaceholderText('OSHA 30-Hour Construction Safety')
    const issuerInput = screen.getByPlaceholderText('Occupational Safety and Health Administration')

    fireEvent.change(nameInput, { target: { value: 'OSHA 30-Hour' } })
    fireEvent.change(issuerInput, { target: { value: 'OSHA' } })

    const addButton = screen.getByText('Add Certification')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(nameInput).toHaveValue('')
      expect(issuerInput).toHaveValue('')
    })
  })

  it('handles certification removal', async () => {
    const initialData = {
      certifications: [
        {
          id: 'cert-1',
          name: 'OSHA 30-Hour',
          issuer: 'OSHA',
        },
      ],
    }

    render(
      <CertificationsStep
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

    const removeButton = screen.getByRole('button', { name: /remove osha 30-hour/i })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText('OSHA 30-Hour')).not.toBeInTheDocument()
    })
  })

  it('submits certifications data on continue', async () => {
    const initialData = {
      certifications: [
        {
          id: 'cert-1',
          name: 'OSHA 30-Hour',
          issuer: 'OSHA',
          issuedOn: '2020-01-01',
        },
      ],
    }

    render(
      <CertificationsStep
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

    const continueButton = screen.getByRole('button', { name: /next: preferences/i })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalledWith({
        certifications: initialData.certifications,
      })
    })
  })

  it('handles save for later action', async () => {
    const initialData = {
      certifications: [
        {
          id: 'cert-1',
          name: 'OSHA 30-Hour',
          issuer: 'OSHA',
        },
      ],
    }

    render(
      <CertificationsStep
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

    const saveButton = screen.getByText('Save & Continue Later')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSaveForLater).toHaveBeenCalledWith({
        certifications: initialData.certifications,
      })
    })
  })

  it('handles skip action', async () => {
    render(
      <CertificationsStep
        initialData={{ certifications: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const skipButton = screen.getByRole('button', { name: /skip/i })
    fireEvent.click(skipButton)

    await waitFor(() => {
      expect(onSkip).toHaveBeenCalledTimes(1)
    })
  })

  it('handles dates when adding certification', async () => {
    render(
      <CertificationsStep
        initialData={{ certifications: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const nameInput = screen.getByPlaceholderText('OSHA 30-Hour Construction Safety')
    const issuerInput = screen.getByPlaceholderText('Occupational Safety and Health Administration')
    const issuedInput = screen.getByTestId('input-issued-on')
    const expiresInput = screen.getByTestId('input-expires-on')

    fireEvent.change(nameInput, { target: { value: 'OSHA 30-Hour' } })
    fireEvent.change(issuerInput, { target: { value: 'OSHA' } })
    fireEvent.change(issuedInput, { target: { value: '2020-01' } })
    fireEvent.change(expiresInput, { target: { value: '2023-01' } })

    const addButton = screen.getByText('Add Certification')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText(/Issued January 2020/i)).toBeInTheDocument()
      expect(screen.getByText(/Expires January 2023/i)).toBeInTheDocument()
    })
  })

  it('updates step state when certifications change', async () => {
    render(
      <CertificationsStep
        initialData={{ certifications: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const nameInput = screen.getByPlaceholderText('OSHA 30-Hour Construction Safety')
    const issuerInput = screen.getByPlaceholderText('Occupational Safety and Health Administration')

    fireEvent.change(nameInput, { target: { value: 'OSHA 30-Hour' } })
    fireEvent.change(issuerInput, { target: { value: 'OSHA' } })

    const addButton = screen.getByText('Add Certification')
    fireEvent.click(addButton)

    await waitFor(() => {
      const latestCall = onStepStateChange.mock.calls[onStepStateChange.mock.calls.length - 1]?.[0]
      expect(latestCall?.data.certifications).toHaveLength(1)
      expect(latestCall?.isValid).toBe(true)
    })
  })

  it('shows guidance message based on certification count', () => {
    const { rerender } = render(
      <CertificationsStep
        initialData={{ certifications: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    expect(screen.getByText(/Optional but recommended/i)).toBeInTheDocument()

    rerender(
      <CertificationsStep
        initialData={{
          certifications: [
            {
              id: 'cert-1',
              name: 'OSHA 30-Hour',
              issuer: 'OSHA',
            },
          ],
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

    expect(screen.getByText(/Looking great! Keep adding/i)).toBeInTheDocument()
  })

  it('trims certification name and issuer when adding', async () => {
    render(
      <CertificationsStep
        initialData={{ certifications: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />
    )

    const nameInput = screen.getByPlaceholderText('OSHA 30-Hour Construction Safety')
    const issuerInput = screen.getByPlaceholderText('Occupational Safety and Health Administration')

    fireEvent.change(nameInput, { target: { value: '  OSHA 30-Hour  ' } })
    fireEvent.change(issuerInput, { target: { value: '  OSHA  ' } })

    const addButton = screen.getByText('Add Certification')
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('OSHA 30-Hour')).toBeInTheDocument()
      expect(screen.getByText('OSHA')).toBeInTheDocument()
    })
  })
})
