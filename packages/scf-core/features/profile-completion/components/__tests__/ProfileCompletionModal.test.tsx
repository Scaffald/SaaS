import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProfileCompletionModal } from '../ProfileCompletionModal'

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const Stack = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <div {...rest}>{children}</div>

  const Button = ({
    children,
    onPress,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
  } & Record<string, unknown>) => (
    <button type="button" onClick={onPress} {...rest}>
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

  const ResponsiveModal = ({
    open,
    onOpenChange,
    title,
    children,
  }: {
    open: boolean
    onOpenChange: (value: boolean) => void
    title: string
    children?: ReactNode
  }) =>
    open ? (
      <div data-testid="responsive-modal">
        <h1>{title}</h1>
        <button type="button" onClick={() => onOpenChange(false)}>
          Close Modal
        </button>
        {children}
      </div>
    ) : null

  return {
    ...actual,
    Stack: Stack,
    Row: Stack,
    Button,
    Text,
    Paragraph,
    ResponsiveModal,
  }
})

describe('ProfileCompletionModal', () => {
  it('renders first-login mode with onboarding copy and CTAs', () => {
    const onStartWizard = vi.fn()
    const onUploadResume = vi.fn()
    const onDismiss = vi.fn()

    render(
      <ProfileCompletionModal
        open
        mode="first-login"
        completionPercentage={0}
        benefitMessage="Benefit message"
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByTestId('responsive-modal')).toBeInTheDocument()
    expect(screen.getByText("Welcome! Let's build your profile")).toBeInTheDocument()
    expect(screen.getByText('Finish in 5 minutes')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Start Wizard'))
    expect(onStartWizard).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Upload Resume'))
    expect(onUploadResume).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Skip and continue later'))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('renders returning-user mode with progress reminder messaging', () => {
    const onStartWizard = vi.fn()
    const onUploadResume = vi.fn()
    const onDismiss = vi.fn()

    render(
      <ProfileCompletionModal
        open
        mode="progress-reminder"
        completionPercentage={64}
        benefitMessage="Keep going to unlock new opportunities."
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByText("Keep going — you're close!")).toBeInTheDocument()
    expect(screen.getByText("You're 64% complete")).toBeInTheDocument()
    expect(screen.getByText('Keep going to unlock new opportunities.')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Continue Profile'))
    expect(onStartWizard).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Remind me later'))
    expect(onDismiss).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Close Modal'))
    expect(onDismiss).toHaveBeenCalledTimes(2)
  })
})
