import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileWizard } from '../components/ProfileWizard'
import type { ProfileWizardStepId } from '../utils/wizardSteps'
import { PROFILE_WIZARD_STEP_META, PROFILE_WIZARD_STEPS } from '../utils/wizardSteps'

const useProfileWizardMock = vi.fn()
const useWizardAutoSaveMock = vi.fn()

vi.mock('../hooks/useProfileWizard', () => ({
  useProfileWizard: (initialStep?: ProfileWizardStepId) => useProfileWizardMock(initialStep),
}))

vi.mock('../hooks/useWizardAutoSave', () => ({
  useWizardAutoSave: (options: unknown) => useWizardAutoSaveMock(options),
}))

vi.mock('../components/WizardStartScreen', () => ({
  WizardStartScreen: ({
    onStartWizard,
    onUploadResume,
    onSkip,
    completionPercentage,
  }: {
    onStartWizard: () => void
    onUploadResume: () => void
    onSkip: () => void
    completionPercentage?: number
  }) => (
    <div data-testid="wizard-start-screen">
      <p data-testid="start-screen-progress">Progress {completionPercentage ?? 0}%</p>
      <button type="button" onClick={onStartWizard}>
        Start Wizard
      </button>
      <button type="button" onClick={onUploadResume}>
        Upload Resume
      </button>
      <button type="button" onClick={onSkip}>
        Skip
      </button>
    </div>
  ),
}))

vi.mock('../components/WizardSuccessModal', () => ({
  WizardSuccessModal: ({
    completionPercentage,
    onViewProfile,
    onContinueEditing,
  }: {
    completionPercentage: number
    onViewProfile: () => void
    onContinueEditing: () => void
  }) => (
    <div data-testid="wizard-success-modal">
      <span>Success {completionPercentage}%</span>
      <button type="button" onClick={onViewProfile}>
        View Profile
      </button>
      <button type="button" onClick={onContinueEditing}>
        Continue Editing
      </button>
    </div>
  ),
}))

vi.mock('../components/ProgressIndicator', () => ({
  ProgressIndicator: ({
    currentStep,
    completionPercentage,
  }: {
    currentStep: ProfileWizardStepId
    completionPercentage: number
  }) => (
    <div data-testid="progress-indicator">
      Step {currentStep} — {completionPercentage}%
    </div>
  ),
}))

const makeStepMock = (stepId: ProfileWizardStepId) => ({
  [`${stepId.charAt(0).toUpperCase()}${stepId.slice(1)}Step`]: ({
    onContinue,
    onSaveForLater,
    onSkip,
  }: {
    onContinue: (data: unknown) => void
    onSaveForLater?: (data: unknown) => void
    onSkip?: () => void
  }) => (
    <div data-testid={`mock-step-${stepId}`}>
      <button
        type="button"
        onClick={() => onContinue?.({ step: stepId, payload: `${stepId}-payload` })}
      >
        Continue {stepId}
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={() => onSaveForLater({ step: stepId })}>
          Save {stepId}
        </button>
      ) : null}
      {onSkip ? (
        <button type="button" onClick={() => onSkip()}>
          Skip {stepId}
        </button>
      ) : null}
    </div>
  ),
})

for (const step of PROFILE_WIZARD_STEPS) {
  vi.mock(`../components/steps/${step.charAt(0).toUpperCase()}${step.slice(1)}Step`, () =>
    makeStepMock(step),
  )
}

vi.mock('tamagui', () => {
  const Stack = ({
    children,
    onPress,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
  } & Record<string, unknown>) => (
    <div {...rest} onClick={onPress}>
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

  return {
    YStack: Stack,
    XStack: Stack,
    ScrollView: Stack,
    Text: ({
      children,
      ...rest
    }: {
      children?: ReactNode
    } & Record<string, unknown>) => <span {...rest}>{children}</span>,
    Paragraph: ({
      children,
      ...rest
    }: {
      children?: ReactNode
    } & Record<string, unknown>) => <p {...rest}>{children}</p>,
    Button,
    Spinner: () => <div data-testid="spinner">Loading…</div>,
  }
})

describe('ProfileWizard', () => {
  const defaultProgress = {
    currentStep: 'general' as ProfileWizardStepId,
    completedSteps: [] as ProfileWizardStepId[],
    completionPercentage: 0,
    lastSavedAt: null,
    requiredSteps: PROFILE_WIZARD_STEPS.filter((step) => !PROFILE_WIZARD_STEP_META[step]?.optional),
  }

  let defaultState: ReturnType<typeof useProfileWizardMock>
  const goNext = vi.fn()
  const goBack = vi.fn()
  const saveStep = vi.fn()
  const completeWizard = vi.fn()
  const markStepSkipped = vi.fn()
  const refresh = vi.fn()
  const _createState = (overrides?: Partial<typeof defaultState>) => ({
    ...defaultState,
    ...overrides,
  })

  beforeEach(() => {
    goNext.mockReset()
    goBack.mockReset()
    saveStep.mockReset()
    completeWizard.mockReset()
    markStepSkipped.mockReset()
    refresh.mockReset()
    useWizardAutoSaveMock.mockReset()

    saveStep.mockResolvedValue({
      ...defaultProgress,
      stepData: {},
    })
    completeWizard.mockResolvedValue({
      ...defaultProgress,
      completionPercentage: 100,
      stepData: {},
    })

    defaultState = {
      state: {
        currentStep: 'general',
        stepData: {},
        progress: defaultProgress,
        isSaving: false,
        isCompleting: false,
        lastSavedAt: null,
      },
      orderedSteps: PROFILE_WIZARD_STEPS,
      goToStep: vi.fn(),
      goNext,
      goBack,
      saveStep,
      completeWizard,
      markStepSkipped,
      refresh,
      isLoading: false,
      isError: false,
    }

    useProfileWizardMock.mockImplementation(() => defaultState)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows the start screen until the user begins the wizard', async () => {
    render(<ProfileWizard />)

    expect(screen.getByTestId('wizard-start-screen')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Start Wizard'))

    await waitFor(() =>
      expect(screen.queryByTestId('wizard-start-screen')).not.toBeInTheDocument(),
    )

    expect(screen.getByTestId('mock-step-general')).toBeInTheDocument()
    expect(goNext).not.toHaveBeenCalled()
  })

  it('saves the current step and advances when continue is triggered', async () => {
    render(<ProfileWizard />)

    fireEvent.click(screen.getByText('Start Wizard'))
    await waitFor(() => screen.getByTestId('mock-step-general'))

    fireEvent.click(screen.getByText('Continue general'))

    await waitFor(() =>
      expect(saveStep).toHaveBeenCalledWith({
        step: 'general',
        data: { step: 'general', payload: 'general-payload' },
      }),
    )

    expect(goNext).toHaveBeenCalledTimes(1)
    expect(completeWizard).not.toHaveBeenCalled()
  })

  it('completes the wizard on the final step and shows success modal', async () => {
    const progress = {
      ...defaultProgress,
      currentStep: 'education' as ProfileWizardStepId,
      completedSteps: PROFILE_WIZARD_STEPS.slice(0, -1),
      completionPercentage: 85,
    }

    useProfileWizardMock.mockReturnValue({
      ...defaultState,
      state: {
        ...defaultState.state,
        currentStep: 'education',
        progress,
      },
    })

    render(<ProfileWizard />)

    expect(screen.queryByTestId('wizard-start-screen')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Continue education'))

    await waitFor(() => expect(saveStep).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(completeWizard).toHaveBeenCalledTimes(1))

    expect(screen.getByTestId('wizard-success-modal')).toBeInTheDocument()
  })
})


