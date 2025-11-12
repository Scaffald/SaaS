import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PersonalizedBenefit } from '../../hooks/useCompletionNudges'
import type { CompletionStatus } from '../../hooks/useCompletionStatus'
import type { EnhancedProfileCompletionWidgetProps } from '../EnhancedProfileCompletionWidget'
import { EnhancedProfileCompletionWidget } from '../EnhancedProfileCompletionWidget'

type CompletionStatusHookReturn = {
  status: CompletionStatus | null
  isLoading: boolean
  isError: boolean
  refetch: () => unknown
  userType: 'worker' | 'employer'
}

const useCompletionStatusMock = vi.fn<[], CompletionStatusHookReturn>()

vi.mock('../../hooks/useCompletionStatus', () => ({
  useCompletionStatus: useCompletionStatusMock,
}))

vi.mock('../../constants/sectionMetadata', () => ({
  resolveSectionMetadata: (sectionId: string) => ({
    id: sectionId,
    title: sectionId === 'skills' ? 'Skills' : 'General Info',
    description: 'Section description',
    route: `/profile/${sectionId}`,
  }),
}))

vi.mock('../MilestoneBadge', () => ({
  MilestoneBadge: ({ milestone }: { milestone: { id: string; label: string } }) => (
    <div data-testid="milestone">{milestone.label}</div>
  ),
}))

vi.mock('@app/ui', () => ({
  DashboardWidget: ({ children }: { children?: ReactNode }) => (
    <div data-testid="dashboard-widget">{children}</div>
  ),
}))

vi.mock('@tamagui/linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: ReactNode }) => (
    <div data-testid="linear-gradient">{children}</div>
  ),
}))

vi.mock('tamagui', () => {
  const createStack = (dataTestId: string) =>
    function Stack({
      children,
      ...rest
    }: {
      children?: ReactNode
    } & Record<string, unknown>) {
      return (
        <div data-testid={dataTestId} {...rest}>
          {children}
        </div>
      )
    }

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

  const Progress = ({
    children,
    value,
    ...rest
  }: {
    children?: ReactNode
    value?: number
  } & Record<string, unknown>) => (
    <div data-testid="progress" data-value={value} {...rest}>
      {children}
    </div>
  )
  Progress.Indicator = ({ children }: { children?: ReactNode }) => (
    <div data-testid="progress-indicator">{children}</div>
  )

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
    YStack: createStack('ystack'),
    XStack: createStack('xstack'),
    Card,
    CardHeader: Card.Header,
    Button,
    Text,
    Progress,
  }
})

const baseStatus: CompletionStatus = {
  sections: [],
  completionPercentage: 42,
  milestoneBadges: [
    { id: '25', label: '25% Complete', threshold: 25, achieved: true, reachedAt: null },
  ],
  incompleteSections: ['skills'],
  lastCompletedAt: null,
  lastPromptedAt: null,
  shouldShowWizard: true,
  modalMode: 'progress-reminder' as const,
  milestoneHistory: {},
  summary: {
    completedWeight: 10,
    remainingWeight: 15,
    nextMilestone: 50,
  },
  updatedAt: new Date().toISOString(),
  nudgeStatus: {
    dismissed: {},
    lastDismissedAt: null,
    shouldPrompt: true,
  },
}

describe('EnhancedProfileCompletionWidget', () => {
  const onStartWizard = vi.fn()
  const onOpenImport = vi.fn()
  const advanceBenefit = vi.fn()
  const retreatBenefit = vi.fn()
  const goToBenefit = vi.fn()

  const baseBenefit: PersonalizedBenefit = {
    id: 'benefit-1',
    title: 'Add Skills',
    description: 'Users with more skills receive more matches.',
    relatedSection: 'skills',
    userType: 'worker',
    opportunityCount: 3,
  }

  const baseProps: EnhancedProfileCompletionWidgetProps = {
    onStartWizard,
    onOpenImport,
    currentBenefit: baseBenefit,
    advanceBenefit,
    retreatBenefit,
    goToBenefit,
    currentBenefitIndex: 0,
    totalBenefits: 3,
    hasMultipleBenefits: true,
    isBenefitLoading: false,
  }

  const renderWidget = (
    statusOverride?: Partial<CompletionStatusHookReturn>,
    propsOverride?: Partial<EnhancedProfileCompletionWidgetProps>,
  ) => {
    useCompletionStatusMock.mockReturnValue({
      status: baseStatus,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
      userType: 'worker',
      ...statusOverride,
    })

    return render(<EnhancedProfileCompletionWidget {...baseProps} {...propsOverride} />)
  }

  beforeEach(() => {
    useCompletionStatusMock.mockReset()
    onStartWizard.mockReset()
    onOpenImport.mockReset()
    advanceBenefit.mockReset()
    retreatBenefit.mockReset()
    goToBenefit.mockReset()
  })

  it('renders loading state while completion status loads', () => {
    renderWidget(
      {
        status: null,
        isLoading: true,
      },
      {
        currentBenefit: null,
        hasMultipleBenefits: false,
        isBenefitLoading: true,
        totalBenefits: 1,
      },
    )

    expect(screen.getByText('Loading profile insights...')).toBeInTheDocument()
  })

  it('returns null when status is unavailable after loading', () => {
    const { container } = renderWidget(
      {
        status: null,
      },
      {
        currentBenefit: null,
        hasMultipleBenefits: false,
        isBenefitLoading: false,
        totalBenefits: 1,
      },
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('shows progress details, benefit messaging, and milestone badges', () => {
    renderWidget()

    expect(screen.getByTestId('dashboard-widget')).toBeInTheDocument()
    expect(screen.getByText('Making great progress!')).toBeInTheDocument()
    expect(screen.getByText('42%')).toBeInTheDocument()
    expect(screen.getByText('1 sections remaining')).toBeInTheDocument()
    expect(screen.getByTestId('milestone')).toHaveTextContent('25% Complete')
    expect(screen.getByText('Show another tip')).toBeInTheDocument()
    expect(
      screen.getByText(/Suggested section: Skills • Unlock 3 new opportunities/i),
    ).toBeInTheDocument()
  })

  it('triggers action callbacks from CTA buttons', () => {
    renderWidget()

    fireEvent.click(screen.getByText('Complete Profile'))
    expect(onStartWizard).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Import Data'))
    expect(onOpenImport).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('Show another tip'))
    expect(advanceBenefit).toHaveBeenCalledTimes(1)
  })

  it('shows fallback messaging when benefit data is loading', () => {
    renderWidget(undefined, {
      currentBenefit: null,
      hasMultipleBenefits: false,
      isBenefitLoading: true,
      totalBenefits: 1,
    })

    expect(screen.getByText('Gathering personalized suggestions…')).toBeInTheDocument()
  })
})


