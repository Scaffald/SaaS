import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GeneralInfoStep } from '../GeneralInfoStep'

vi.mock('../StepNavigation', () => ({
  StepNavigation: ({
    canGoNext,
    isSaving,
    onNext,
    onSaveForLater,
    nextLabel = 'Next',
    saveLabel = 'Save & Continue Later',
  }: {
    canGoNext: boolean
    isSaving: boolean
    onNext: () => void
    onSaveForLater?: () => void
    nextLabel?: string
    saveLabel?: string
  }) => (
    <div>
      <button type="button" disabled={!canGoNext || isSaving} onClick={onNext}>
        {nextLabel}
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={onSaveForLater}>
          {saveLabel}
        </button>
      ) : null}
    </div>
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
    ...rest
  }: {
    value?: string
    onChangeText?: (value: string) => void
  } & Record<string, unknown>) => (
    <input value={value} onChange={(event) => onChangeText?.(event.target.value)} {...rest} />
  )

  const TextArea = ({
    value = '',
    onChangeText,
    ...rest
  }: {
    value?: string
    onChangeText?: (value: string) => void
  } & Record<string, unknown>) => (
    <textarea value={value} onChange={(event) => onChangeText?.(event.target.value)} {...rest} />
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
    Text,
    Input,
    TextArea,
    Paragraph,
    Button,
  }
})

describe('GeneralInfoStep', () => {
  const onContinue = vi.fn()
  const onSaveForLater = vi.fn()
  const onBack = vi.fn()
  const onStepStateChange = vi.fn()

  beforeEach(() => {
    onContinue.mockReset()
    onSaveForLater.mockReset()
    onBack.mockReset()
    onStepStateChange.mockReset()
  })

  it('keeps continue disabled until required fields are complete', async () => {
    render(
      <GeneralInfoStep
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={async (data) => {
          await onContinue(data)
        }}
        onSaveForLater={async (data) => {
          await onSaveForLater(data)
        }}
        onStepStateChange={onStepStateChange}
      />
    )

    const nextButton = screen.getByRole('button', { name: /next: skills/i })

    await waitFor(() => {
      expect(nextButton).toBeDisabled()
    })

    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: '  Jane ' } })
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: ' Doe ' } })
    fireEvent.change(screen.getByPlaceholderText('Licensed electrician with 8+ years experience'), {
      target: { value: '  Master Electrician  ' },
    })
    fireEvent.change(
      screen.getByPlaceholderText(
        'Share a quick summary of your experience, strengths, and goals.'
      ),
      { target: { value: ' Experienced and reliable. ' } }
    )

    await waitFor(() => expect(nextButton).toBeEnabled())

    const latestSnapshot =
      onStepStateChange.mock.calls[onStepStateChange.mock.calls.length - 1]?.[0]

    expect(latestSnapshot).toMatchObject({
      data: {
        firstName: '  Jane ',
        lastName: ' Doe ',
        headline: '  Master Electrician  ',
        bio: ' Experienced and reliable. ',
      },
      isValid: true,
      isDirty: true,
    })
  })

  it('submits trimmed values on continue and save for later actions', async () => {
    render(
      <GeneralInfoStep
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={async (data) => {
          await onContinue(data)
        }}
        onSaveForLater={async (data) => {
          await onSaveForLater(data)
        }}
      />
    )

    fireEvent.change(screen.getByPlaceholderText('First name'), { target: { value: '  Jane ' } })
    fireEvent.change(screen.getByPlaceholderText('Last name'), { target: { value: ' Doe ' } })
    fireEvent.change(screen.getByPlaceholderText('Licensed electrician with 8+ years experience'), {
      target: { value: '  Master Electrician  ' },
    })
    fireEvent.change(
      screen.getByPlaceholderText(
        'Share a quick summary of your experience, strengths, and goals.'
      ),
      { target: { value: ' Experienced and reliable. ' } }
    )

    const user = userEvent.setup()
    const nextButton = screen.getByRole('button', { name: /next: skills/i })

    await waitFor(() => {
      expect(nextButton).toBeEnabled()
    })

    await user.click(nextButton)

    await waitFor(
      () => {
        expect(onContinue).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
          headline: 'Master Electrician',
          bio: 'Experienced and reliable.',
        })
      },
      { timeout: 3000 }
    )

    await user.click(screen.getByRole('button', { name: /save & continue later/i }))

    await waitFor(() =>
      expect(onSaveForLater).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        headline: 'Master Electrician',
        bio: 'Experienced and reliable.',
      })
    )
  })
})
