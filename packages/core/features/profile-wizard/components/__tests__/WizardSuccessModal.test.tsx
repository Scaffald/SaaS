import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WizardSuccessModal } from '../WizardSuccessModal'

vi.mock('tamagui', () => {
  const Stack = ({
    children,
    testID,
    items,
    ...rest
  }: {
    children?: ReactNode
    testID?: string
    items?: string
  } & Record<string, unknown>) => (
    <div data-testid={testID} data-items={items} {...rest}>
      {children}
    </div>
  )

  const Button = ({
    children,
    onPress,
    iconAfter,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    iconAfter?: ReactNode
  } & Record<string, unknown>) => (
    <button type="button" onClick={onPress} {...rest}>
      {children}
      {iconAfter}
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
    text,
    ...rest
  }: {
    children?: ReactNode
    text?: string
  } & Record<string, unknown>) => <p data-align={text} {...rest}>{children}</p>

  const Card = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="card" {...rest}>
      {children}
    </div>
  )

  Card.Header = ({
    children,
    padded,
    ...rest
  }: {
    children?: ReactNode
    padded?: boolean
  } & Record<string, unknown>) => (
    <div data-testid="card-header" {...rest}>
      {children}
    </div>
  )

  const H3 = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <h3 {...rest}>{children}</h3>

  return {
    YStack: Stack,
    XStack: Stack,
    Button,
    Text,
    Paragraph,
    Card,
    CardHeader: Card.Header,
    H3,
  }
})

vi.mock('@tamagui/lucide-icons', () => ({
  Trophy: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="trophy-icon" data-size={size} data-color={color}>
      Trophy
    </span>
  ),
  Star: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="star-icon" data-size={size} data-color={color}>
      Star
    </span>
  ),
  ArrowRight: () => <span data-testid="arrow-right-icon">ArrowRight</span>,
}))

describe('WizardSuccessModal', () => {
  const onViewProfile = vi.fn()
  const onContinueEditing = vi.fn()

  beforeEach(() => {
    onViewProfile.mockReset()
    onContinueEditing.mockReset()
  })

  it('renders with completion percentage', () => {
    render(
      <WizardSuccessModal
        completionPercentage={85}
        unlockedBenefits={[]}
        onViewProfile={onViewProfile}
        onContinueEditing={onContinueEditing}
      />,
    )

    expect(screen.getByTestId('profile-wizard-success-modal')).toBeInTheDocument()
    expect(screen.getByText('Profile Complete!')).toBeInTheDocument()
    expect(screen.getByText(/your profile is 85% complete/i)).toBeInTheDocument()
  })

  it('shows default benefits when none provided', () => {
    render(
      <WizardSuccessModal
        completionPercentage={100}
        unlockedBenefits={[]}
        onViewProfile={onViewProfile}
        onContinueEditing={onContinueEditing}
      />,
    )

    expect(screen.getByText('Benefits Unlocked')).toBeInTheDocument()
    expect(screen.getByText('Profile now visible in search')).toBeInTheDocument()
    expect(screen.getByText('Eligible for personalized job recommendations')).toBeInTheDocument()
    expect(screen.getByText('Milestone badge unlocked')).toBeInTheDocument()
  })

  it('shows custom benefits when provided', () => {
    const customBenefits = ['Custom benefit 1', 'Custom benefit 2', 'Custom benefit 3']

    render(
      <WizardSuccessModal
        completionPercentage={90}
        unlockedBenefits={customBenefits}
        onViewProfile={onViewProfile}
        onContinueEditing={onContinueEditing}
      />,
    )

    expect(screen.getByText('Custom benefit 1')).toBeInTheDocument()
    expect(screen.getByText('Custom benefit 2')).toBeInTheDocument()
    expect(screen.getByText('Custom benefit 3')).toBeInTheDocument()
    expect(screen.queryByText('Profile now visible in search')).not.toBeInTheDocument()
  })

  it('handles view profile action', () => {
    render(
      <WizardSuccessModal
        completionPercentage={100}
        unlockedBenefits={[]}
        onViewProfile={onViewProfile}
        onContinueEditing={onContinueEditing}
      />,
    )

    const viewProfileButton = screen.getByText('View My Profile')
    fireEvent.click(viewProfileButton)

    expect(onViewProfile).toHaveBeenCalledTimes(1)
  })

  it('handles continue editing action', () => {
    render(
      <WizardSuccessModal
        completionPercentage={100}
        unlockedBenefits={[]}
        onViewProfile={onViewProfile}
        onContinueEditing={onContinueEditing}
      />,
    )

    const continueButton = screen.getByText('Continue Editing')
    fireEvent.click(continueButton)

    expect(onContinueEditing).toHaveBeenCalledTimes(1)
  })

  it('displays trophy icon', () => {
    render(
      <WizardSuccessModal
        completionPercentage={100}
        unlockedBenefits={[]}
        onViewProfile={onViewProfile}
        onContinueEditing={onContinueEditing}
      />,
    )

    expect(screen.getByTestId('trophy-icon')).toBeInTheDocument()
  })

  it('displays star icons for each benefit', () => {
    const benefits = ['Benefit 1', 'Benefit 2', 'Benefit 3']

    render(
      <WizardSuccessModal
        completionPercentage={100}
        unlockedBenefits={benefits}
        onViewProfile={onViewProfile}
        onContinueEditing={onContinueEditing}
      />,
    )

    const starIcons = screen.getAllByTestId('star-icon')
    expect(starIcons).toHaveLength(3)
  })
})

