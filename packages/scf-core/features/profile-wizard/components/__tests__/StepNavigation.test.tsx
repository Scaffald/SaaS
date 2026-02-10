import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StepNavigation } from '../StepNavigation'

vi.mock('tamagui', () => {
  const Stack = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <div {...rest}>{children}</div>

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

  return {
    Stack: Stack,
    Row: Stack,
    Button,
    Text,
  }
})

describe('StepNavigation', () => {
  const onNext = vi.fn()
  const onBack = vi.fn()
  const onSaveForLater = vi.fn()
  const onSkip = vi.fn()

  beforeEach(() => {
    onNext.mockReset()
    onBack.mockReset()
    onSaveForLater.mockReset()
    onSkip.mockReset()
  })

  it('renders next and back buttons', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
      />
    )

    expect(screen.getByText('Next')).toBeInTheDocument()
    expect(screen.getByText('Back')).toBeInTheDocument()
  })

  it('disables next button when canGoNext is false', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={false}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
      />
    )

    const nextButton = screen.getByText('Next')
    expect(nextButton).toBeDisabled()
  })

  it('disables back button when canGoBack is false', () => {
    render(
      <StepNavigation
        canGoBack={false}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
      />
    )

    const backButton = screen.getByText('Back')
    expect(backButton).toBeDisabled()
  })

  it('disables all buttons when isSaving is true', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={true}
        onBack={onBack}
        onNext={onNext}
      />
    )

    const nextButton = screen.getByText('Next')
    const backButton = screen.getByText('Back')
    expect(nextButton).toBeDisabled()
    expect(backButton).toBeDisabled()
  })

  it('shows "Finish" instead of "Next" on last step', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={true}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
      />
    )

    expect(screen.getByText('Finish')).toBeInTheDocument()
    expect(screen.queryByText('Next')).not.toBeInTheDocument()
  })

  it('uses custom next label when provided', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
        nextLabel="Next: Experience"
      />
    )

    expect(screen.getByText('Next: Experience')).toBeInTheDocument()
  })

  it('uses custom back label when provided', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
        backLabel="Previous"
      />
    )

    expect(screen.getByText('Previous')).toBeInTheDocument()
  })

  it('handles next button click', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
      />
    )

    const nextButton = screen.getByText('Next')
    fireEvent.click(nextButton)

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('handles back button click', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
      />
    )

    const backButton = screen.getByText('Back')
    fireEvent.click(backButton)

    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('shows save for later button when provided', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
        onSaveForLater={onSaveForLater}
      />
    )

    expect(screen.getByText('Save & Continue Later')).toBeInTheDocument()
  })

  it('handles save for later click', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
        onSaveForLater={onSaveForLater}
      />
    )

    const saveButton = screen.getByText('Save & Continue Later')
    fireEvent.click(saveButton)

    expect(onSaveForLater).toHaveBeenCalledTimes(1)
  })

  it('disables save for later when isSaving is true', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={true}
        onBack={onBack}
        onNext={onNext}
        onSaveForLater={onSaveForLater}
      />
    )

    const saveButton = screen.getByText('Save & Continue Later')
    expect(saveButton).toBeDisabled()
  })

  it('shows skip button when provided', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
      />
    )

    expect(screen.getByText('Skip This Step')).toBeInTheDocument()
  })

  it('uses custom skip label when provided', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
        skipLabel="Skip Certifications"
      />
    )

    expect(screen.getByText('Skip Certifications')).toBeInTheDocument()
  })

  it('handles skip click', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
      />
    )

    const skipButton = screen.getByText('Skip This Step')
    fireEvent.click(skipButton)

    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('disables skip when isSaving is true', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={true}
        onBack={onBack}
        onNext={onNext}
        onSkip={onSkip}
      />
    )

    const skipButton = screen.getByText('Skip This Step')
    expect(skipButton).toBeDisabled()
  })

  it('shows saving message when isSaving is true', () => {
    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={true}
        onBack={onBack}
        onNext={onNext}
      />
    )

    expect(screen.getByText('Saving your progress...')).toBeInTheDocument()
  })

  it('renders footer slot when provided', () => {
    const footerContent = <div data-testid="footer-slot">Footer Content</div>

    render(
      <StepNavigation
        canGoBack={true}
        canGoNext={true}
        isLastStep={false}
        isSaving={false}
        onBack={onBack}
        onNext={onNext}
        footerSlot={footerContent}
      />
    )

    expect(screen.getByTestId('footer-slot')).toBeInTheDocument()
  })
})
