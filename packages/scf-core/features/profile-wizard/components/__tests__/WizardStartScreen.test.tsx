import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WizardStartScreen } from '../WizardStartScreen'

// Beyond UI mock: Card.Header used by component; beyond-ui exports CardHeader separately
vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const Stack = ({
    children,
    testID,
    ...rest
  }: {
    children?: ReactNode
    testID?: string
  } & Record<string, unknown>) => (
    <div data-testid={testID} {...rest}>
      {children}
    </div>
  )

  const React = require('react') as typeof import('react')
  const Button = ({
    children,
    onPress,
    icon,
    iconAfter,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
    icon?: ReactNode
    iconAfter?: ReactNode
  } & Record<string, unknown>) => (
    <button type="button" onClick={onPress} {...rest}>
      {icon != null && typeof icon === 'function' ? React.createElement(icon, {}) : icon}
      {children}
      {iconAfter != null && typeof iconAfter === 'function' ? React.createElement(iconAfter, {}) : iconAfter}
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
    ...actual,
    Stack,
    Row: Stack,
    Button,
    Text,
    Paragraph,
    Card,
    CardHeader: Card.Header,
    H3,
  }
})

vi.mock('lucide-react-native', () => ({
  Zap: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="zap-icon" data-size={size} data-color={color}>
      Zap
    </span>
  ),
  Clock: ({ size, color }: { size?: number; color?: string }) => (
    <span data-testid="clock-icon" data-size={size} data-color={color}>
      Clock
    </span>
  ),
  ChevronRight: () => <span data-testid="chevron-right-icon">ChevronRight</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  UserRound: () => <span data-testid="user-icon">UserRound</span>,
  Sparkles: () => <span data-testid="sparkles-icon">Sparkles</span>,
  Briefcase: () => <span data-testid="briefcase-icon">Briefcase</span>,
  Award: () => <span data-testid="award-icon">Award</span>,
  SlidersHorizontal: () => <span data-testid="sliders-icon">SlidersHorizontal</span>,
  GraduationCap: () => <span data-testid="graduation-icon">GraduationCap</span>,
}))

describe('WizardStartScreen', () => {
  const onStartWizard = vi.fn()
  const onUploadResume = vi.fn()
  const onSkip = vi.fn()

  beforeEach(() => {
    onStartWizard.mockReset()
    onUploadResume.mockReset()
    onSkip.mockReset()
  })

  it('renders with default completion percentage', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
      />
    )

    expect(screen.getByTestId('profile-wizard-start-screen')).toBeInTheDocument()
    expect(screen.getByText('Complete Your Profile in Minutes')).toBeInTheDocument()
    expect(screen.getByText(/You're 0% complete/i)).toBeInTheDocument()
  })

  it('renders with custom completion percentage', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
        completionPercentage={42}
      />
    )

    expect(screen.getByText(/You're 42% complete/i)).toBeInTheDocument()
  })

  it('renders all wizard steps with icons', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
      />
    )

    expect(screen.getByText('General Info')).toBeInTheDocument()
    expect(screen.getByText('Core Skills')).toBeInTheDocument()
    expect(screen.getByText('Recent Experience')).toBeInTheDocument()
    expect(screen.getByText('Certifications')).toBeInTheDocument()
    expect(screen.getByText('Work Preferences')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
  })

  it('shows estimated time for each step', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
      />
    )

    expect(screen.getAllByText('2 min').length).toBeGreaterThan(0)
    expect(screen.getByText('3 min')).toBeInTheDocument()
  })

  it('handles start wizard action', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
      />
    )

    const startButton = screen.getByText('Start Wizard')
    fireEvent.click(startButton)

    expect(onStartWizard).toHaveBeenCalledTimes(1)
  })

  it('handles upload resume action', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
      />
    )

    const uploadButton = screen.getByText('Upload Resume')
    fireEvent.click(uploadButton)

    expect(onUploadResume).toHaveBeenCalledTimes(1)
  })

  it('handles skip action', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
      />
    )

    const skipButton = screen.getByText('Skip and Edit Later')
    fireEvent.click(skipButton)

    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('shows total estimated time', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
        totalEstimatedMinutes={13}
      />
    )

    expect(screen.getByText('13 minutes')).toBeInTheDocument()
  })

  it('calculates total estimated time from steps if not provided', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
      />
    )

    // Total should be sum of all step times: 2+2+3+2+2+2 = 13
    expect(screen.getByText('13 minutes')).toBeInTheDocument()
    expect(screen.getByText(/6 guided steps/i)).toBeInTheDocument()
  })

  it('displays step descriptions', () => {
    render(
      <WizardStartScreen
        onStartWizard={onStartWizard}
        onUploadResume={onUploadResume}
        onSkip={onSkip}
      />
    )

    expect(screen.getByText(/Introduce yourself with your name/i)).toBeInTheDocument()
    expect(screen.getByText(/Highlight the top skills/i)).toBeInTheDocument()
  })
})
