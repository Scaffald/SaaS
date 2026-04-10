import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { ProgressIndicator } from '../ProgressIndicator'

vi.mock('@scaffald/ui', async () => {
  const actual = await vi.importActual('@scaffald/ui')

  const Stack = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <div {...rest}>{children}</div>

  const Text = ({
    children,
    ...rest
  }: {
    children?: ReactNode
  } & Record<string, unknown>) => <span {...rest}>{children}</span>

  const ProgressBar = ({
    value,
    max = 100,
    children,
    ...rest
  }: {
    value?: number
    max?: number
    children?: ReactNode
  } & Record<string, unknown>) => (
    <div data-testid="progress" data-value={value} data-max={max} {...rest}>
      {children}
    </div>
  )

  const Separator = ({
    orientation,
    ...rest
  }: {
    orientation?: string
  } & Record<string, unknown>) => (
    <div data-testid="separator" data-vertical={orientation === 'vertical'} {...rest} />
  )

  return {
    ...actual,
    Stack: Stack,
    Row: Stack,
    Text,
    ProgressBar,
    Separator,
  }
})

describe('ProgressIndicator', () => {
  it('renders current step and total steps', () => {
    render(
      <ProgressIndicator
        currentStep="skills"
        completedSteps={['general']}
        completionPercentage={25}
      />
    )

    expect(screen.getByText('Step 2 of 6')).toBeInTheDocument()
  })

  it('displays completion percentage', () => {
    render(
      <ProgressIndicator currentStep="general" completedSteps={[]} completionPercentage={42} />
    )

    expect(screen.getByText('42%')).toBeInTheDocument()
  })

  it('shows progress bar with correct value', () => {
    render(
      <ProgressIndicator currentStep="general" completedSteps={[]} completionPercentage={75} />
    )

    const progress = screen.getByTestId('progress')
    expect(progress).toHaveAttribute('data-value', '75')
    expect(progress).toHaveAttribute('data-max', '100')
  })

  it('displays all step labels when showStepLabels is true', () => {
    render(
      <ProgressIndicator
        currentStep="general"
        completedSteps={[]}
        completionPercentage={0}
        showStepLabels={true}
      />
    )

    expect(screen.getByText('General Info')).toBeInTheDocument()
    expect(screen.getByText('Core Skills')).toBeInTheDocument()
    expect(screen.getByText('Recent Experience')).toBeInTheDocument()
    expect(screen.getByText('Certifications')).toBeInTheDocument()
    expect(screen.getByText('Work Preferences')).toBeInTheDocument()
    expect(screen.getByText('Education')).toBeInTheDocument()
  })

  it('hides step labels when showStepLabels is false', () => {
    render(
      <ProgressIndicator
        currentStep="general"
        completedSteps={[]}
        completionPercentage={0}
        showStepLabels={false}
      />
    )

    expect(screen.queryByText('General Info')).not.toBeInTheDocument()
  })

  it('marks current step correctly', () => {
    render(
      <ProgressIndicator
        currentStep="skills"
        completedSteps={['general']}
        completionPercentage={25}
        showStepLabels={true}
      />
    )

    const stepElements = screen.getAllByRole('img')
    const currentStep = stepElements.find((el) => el.getAttribute('aria-current') === 'step')
    expect(currentStep).toBeInTheDocument()
    expect(currentStep?.getAttribute('aria-label')).toContain('Core Skills')
    expect(currentStep?.getAttribute('aria-label')).toContain('current step')
  })

  it('marks completed steps correctly', () => {
    render(
      <ProgressIndicator
        currentStep="skills"
        completedSteps={['general']}
        completionPercentage={25}
        showStepLabels={true}
      />
    )

    const stepElements = screen.getAllByRole('img')
    const completedStep = stepElements.find(
      (el) =>
        el.getAttribute('aria-label')?.includes('General Info') &&
        el.getAttribute('aria-label')?.includes('completed')
    )
    expect(completedStep).toBeInTheDocument()
  })

  it('shows estimated time for each step', () => {
    render(
      <ProgressIndicator
        currentStep="general"
        completedSteps={[]}
        completionPercentage={0}
        showStepLabels={true}
      />
    )

    expect(screen.getAllByText('2 min').length).toBeGreaterThan(0)
    expect(screen.getByText('3 min')).toBeInTheDocument()
  })

  it('displays separators between steps', () => {
    render(
      <ProgressIndicator
        currentStep="general"
        completedSteps={[]}
        completionPercentage={0}
        showStepLabels={true}
      />
    )

    const separators = screen.getAllByTestId('separator')
    expect(separators.length).toBeGreaterThan(0)
    for (const separator of separators) {
      expect(separator).toHaveAttribute('data-vertical', 'true')
    }
  })
})
