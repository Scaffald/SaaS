import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SkillsStep } from '../SkillsStep'

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
    onNext: () => void | Promise<void>
    onBack: () => void
    onSaveForLater?: () => void
    onSkip?: () => void
  }) => (
    <div data-testid="step-navigation">
      <button
        type="button"
        data-testid="continue-button"
        disabled={!canGoNext || isSaving}
        onClick={async () => {
          const result = onNext()
          if (result instanceof Promise) {
            await result
          }
        }}
      >
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
          Skip This Step
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('@app/core/features/profile/components/InlineSkillSearch', () => ({
  InlineSkillSearch: ({
    existingSkillIds,
  }: {
    onSelectSkill: (skillId: string, proficiency: number, taxonomy: string) => void
    existingSkillIds: string[]
  }) => {
    return (
      <div data-testid="inline-skill-search">
        <div data-testid="existing-skill-ids">{existingSkillIds.join(',')}</div>
      </div>
    )
  },
}))

const mockSearchSkillsMutation = {
  mutateAsync: vi.fn().mockResolvedValue({
    skills: [
      {
        skill_id: 'skill-1',
        name: 'Test Skill',
        display_code: 'TSK-001',
        code: 'TSK-001',
        hierarchy_level: 0,
        taxonomy: 'onet',
      },
      {
        skill_id: 'skill-2',
        name: 'Another Skill',
        display_code: 'TSK-002',
        code: 'TSK-002',
        hierarchy_level: 0,
        taxonomy: 'csi',
      },
      {
        skill_id: 'skill-3',
        name: 'Third Skill',
        display_code: 'TSK-003',
        code: 'TSK-003',
        hierarchy_level: 0,
        taxonomy: 'onet',
      },
    ],
  }),
  isPending: false,
}

const mockGetPrimaryIndustry = {
  data: { industry: { slug: 'construction' } },
}

vi.mock('@app/core/utils/api', () => ({
  api: {
    profile: {
      skillsMultiTaxonomy: {
        searchSkills: {
          useMutation: () => mockSearchSkillsMutation,
        },
        getPrimaryIndustry: {
          useQuery: () => mockGetPrimaryIndustry,
        },
      },
    },
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
    Button,
    Text,
    Paragraph,
    Card,
    CardHeader: Card.Header,
  }
})

describe('SkillsStep', () => {
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
    mockSearchSkillsMutation.mutateAsync.mockReset()
    mockSearchSkillsMutation.isPending = false
  })

  it('renders with initial data', () => {
    const initialData = {
      skills: [
        {
          id: 'skill-1',
          name: 'Electrical Wiring',
          taxonomy: 'onet' as const,
          proficiency: 4,
        },
      ],
    }

    render(
      <SkillsStep
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

    expect(screen.getByText('Electrical Wiring')).toBeInTheDocument()
    expect(screen.getByText(/ONET • Proficiency 4\/5/i)).toBeInTheDocument()
  })

  it('disables continue button when less than 3 skills are selected', async () => {
    render(
      <SkillsStep
        initialData={{ skills: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    // Wait for component to fully render
    await waitFor(() => {
      expect(screen.getByText('Spotlight your strengths')).toBeInTheDocument()
    })

    // Wait for StepNavigation to render
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument()
    }, { timeout: 3000 })
    
    // The component initializes skills with useState(initialData?.skills ?? [])
    // So skills starts as [] immediately, hasMinimumSkills = false, canGoNext = false
    // The button should be disabled
    const continueButton = screen.getByRole('button', { name: /continue/i })
    
    // Note: The component might render with canGoNext=true initially before useEffect runs
    // But since we're passing initialData with empty array, skills should be [] from the start
    // So the button should be disabled. If it's not, there might be a timing issue.
    // Let's wait for the button to become disabled
    await waitFor(() => {
      expect(continueButton).toBeDisabled()
    }, { timeout: 2000 })
  })

  it('enables continue button when 3 or more skills are selected', () => {
    const initialData = {
      skills: [
        { id: 'skill-1', name: 'Skill 1', taxonomy: 'onet' as const, proficiency: 3 },
        { id: 'skill-2', name: 'Skill 2', taxonomy: 'csi' as const, proficiency: 4 },
        { id: 'skill-3', name: 'Skill 3', taxonomy: 'onet' as const, proficiency: 5 },
      ],
    }

    render(
      <SkillsStep
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

    const continueButton = screen.getByRole('button', { name: /continue/i })
    expect(continueButton).toBeEnabled()
  })

  it('displays skills from initial data', () => {
    const initialData = {
      skills: [
        { id: 'skill-1', name: 'Test Skill', taxonomy: 'onet' as const, proficiency: 3 },
      ],
    }

    render(
      <SkillsStep
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

    expect(screen.getByText('Test Skill')).toBeInTheDocument()
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('handles skill removal', async () => {
    const initialData = {
      skills: [
        {
          id: 'skill-1',
          name: 'Electrical Wiring',
          taxonomy: 'onet' as const,
          proficiency: 4,
        },
      ],
    }

    render(
      <SkillsStep
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

    const removeButton = screen.getByRole('button', { name: /remove electrical wiring/i })
    fireEvent.click(removeButton)

    await waitFor(() => {
      expect(screen.queryByText('Electrical Wiring')).not.toBeInTheDocument()
    })
  })

  it('prevents adding more than 5 skills', async () => {
    const initialData = {
      skills: [
        { id: 'skill-1', name: 'Skill 1', taxonomy: 'onet' as const, proficiency: 3 },
        { id: 'skill-2', name: 'Skill 2', taxonomy: 'onet' as const, proficiency: 3 },
        { id: 'skill-3', name: 'Skill 3', taxonomy: 'onet' as const, proficiency: 3 },
        { id: 'skill-4', name: 'Skill 4', taxonomy: 'onet' as const, proficiency: 3 },
        { id: 'skill-5', name: 'Skill 5', taxonomy: 'onet' as const, proficiency: 3 },
      ],
    }

    render(
      <SkillsStep
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

    expect(screen.getByText(/You've reached the maximum of 5 skills/i)).toBeInTheDocument()
    expect(screen.getAllByTestId('card')).toHaveLength(5)
  })

  it('submits skills data on continue', async () => {
    const initialData = {
      skills: [
        { id: 'skill-1', name: 'Skill 1', taxonomy: 'onet' as const, proficiency: 3 },
        { id: 'skill-2', name: 'Skill 2', taxonomy: 'csi' as const, proficiency: 4 },
        { id: 'skill-3', name: 'Skill 3', taxonomy: 'onet' as const, proficiency: 5 },
      ],
    }

    render(
      <SkillsStep
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

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Spotlight your strengths')).toBeInTheDocument()
    })

    // Wait for the continue button to appear and be enabled
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /continue/i })
      expect(btn).not.toBeDisabled()
    }, { timeout: 3000 })

    const continueButton = screen.getByRole('button', { name: /continue/i })
    fireEvent.click(continueButton)

    await waitFor(() => {
      expect(onContinue).toHaveBeenCalled()
    })

    expect(onContinue).toHaveBeenCalledWith({
      skills: initialData.skills,
    })
  })

  it('handles save for later action', async () => {
    const initialData = {
      skills: [
        { id: 'skill-1', name: 'Skill 1', taxonomy: 'onet' as const, proficiency: 3 },
        { id: 'skill-2', name: 'Skill 2', taxonomy: 'csi' as const, proficiency: 4 },
        { id: 'skill-3', name: 'Skill 3', taxonomy: 'onet' as const, proficiency: 5 },
      ],
    }

    render(
      <SkillsStep
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

    const saveButton = screen.getByText('Save & Continue Later')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onSaveForLater).toHaveBeenCalledWith({
        skills: initialData.skills,
      })
    })
  })

  it('handles skip action', async () => {
    render(
      <SkillsStep
        initialData={{ skills: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    await waitFor(() => {
      const skipButton = screen.getByText('Skip This Step')
      expect(skipButton).toBeInTheDocument()
    })

    const skipButton = screen.getByText('Skip This Step')
    fireEvent.click(skipButton)

    await waitFor(() => {
      expect(onSkip).toHaveBeenCalledTimes(1)
    })
  })

  it('updates step state when skills are provided', () => {
    const initialData = {
      skills: [
        { id: 'skill-1', name: 'Skill 1', taxonomy: 'onet' as const, proficiency: 3 },
        { id: 'skill-2', name: 'Skill 2', taxonomy: 'csi' as const, proficiency: 4 },
        { id: 'skill-3', name: 'Skill 3', taxonomy: 'onet' as const, proficiency: 5 },
      ],
    }

    render(
      <SkillsStep
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

    const latestCall = onStepStateChange.mock.calls[onStepStateChange.mock.calls.length - 1]?.[0]
    expect(latestCall?.isValid).toBe(true)
    expect(latestCall?.data.skills).toHaveLength(3)
  })

  it('shows guidance message based on skill count', () => {
    const { rerender } = render(
      <SkillsStep
        initialData={{ skills: [] }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    expect(screen.getByText(/Add 3 more skills/i)).toBeInTheDocument()

    rerender(
      <SkillsStep
        initialData={{
          skills: [
            { id: 'skill-1', name: 'Skill 1', taxonomy: 'onet' as const, proficiency: 3 },
            { id: 'skill-2', name: 'Skill 2', taxonomy: 'csi' as const, proficiency: 4 },
            { id: 'skill-3', name: 'Skill 3', taxonomy: 'onet' as const, proficiency: 5 },
          ],
        }}
        isSaving={false}
        isLastStep={false}
        onBack={onBack}
        onContinue={onContinue}
        onSaveForLater={onSaveForLater}
        onSkip={onSkip}
        onStepStateChange={onStepStateChange}
      />,
    )

    expect(screen.getByText(/Great! Add up to 5 skills/i)).toBeInTheDocument()
  })

  it('passes existing skill IDs to InlineSkillSearch', () => {
    const initialData = {
      skills: [
        { id: 'skill-1', name: 'Skill 1', taxonomy: 'onet' as const, proficiency: 3 },
        { id: 'skill-2', name: 'Skill 2', taxonomy: 'csi' as const, proficiency: 4 },
      ],
    }

    render(
      <SkillsStep
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

    const existingIds = screen.getByTestId('existing-skill-ids')
    expect(existingIds).toHaveTextContent('skill-1,skill-2')
  })
})

