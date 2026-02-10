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

// Create mocks for each step component (must be inline due to vi.mock hoisting)
vi.mock('../components/steps/GeneralStep', () => ({
  GeneralInfoStep: ({
    onContinue,
    onSaveForLater,
    onSkip,
  }: {
    onContinue: (data: unknown) => void
    onSaveForLater?: (data: unknown) => void
    onSkip?: () => void
  }) => (
    <div data-testid="mock-step-general">
      <button
        type="button"
        onClick={() => onContinue?.({ step: 'general', payload: 'general-payload' })}
      >
        Continue general
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={() => onSaveForLater({ step: 'general' })}>
          Save general
        </button>
      ) : null}
      {onSkip ? (
        <button type="button" onClick={() => onSkip()}>
          Skip general
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('../components/steps/SkillsStep', () => ({
  SkillsStep: ({
    onContinue,
    onSaveForLater,
    onSkip,
  }: {
    onContinue: (data: unknown) => void
    onSaveForLater?: (data: unknown) => void
    onSkip?: () => void
  }) => (
    <div data-testid="mock-step-skills">
      <button
        type="button"
        onClick={() => onContinue?.({ step: 'skills', payload: 'skills-payload' })}
      >
        Continue skills
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={() => onSaveForLater({ step: 'skills' })}>
          Save skills
        </button>
      ) : null}
      {onSkip ? (
        <button type="button" onClick={() => onSkip()}>
          Skip skills
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('../components/steps/ExperienceStep', () => ({
  ExperienceStep: ({
    onContinue,
    onSaveForLater,
    onSkip,
  }: {
    onContinue: (data: unknown) => void
    onSaveForLater?: (data: unknown) => void
    onSkip?: () => void
  }) => (
    <div data-testid="mock-step-experience">
      <button
        type="button"
        onClick={() => onContinue?.({ step: 'experience', payload: 'experience-payload' })}
      >
        Continue experience
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={() => onSaveForLater({ step: 'experience' })}>
          Save experience
        </button>
      ) : null}
      {onSkip ? (
        <button type="button" onClick={() => onSkip()}>
          Skip experience
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('../components/steps/CertificationsStep', () => ({
  CertificationsStep: ({
    onContinue,
    onSaveForLater,
    onSkip,
  }: {
    onContinue: (data: unknown) => void
    onSaveForLater?: (data: unknown) => void
    onSkip?: () => void
  }) => (
    <div data-testid="mock-step-certifications">
      <button
        type="button"
        onClick={() => onContinue?.({ step: 'certifications', payload: 'certifications-payload' })}
      >
        Continue certifications
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={() => onSaveForLater({ step: 'certifications' })}>
          Save certifications
        </button>
      ) : null}
      {onSkip ? (
        <button type="button" onClick={() => onSkip()}>
          Skip certifications
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('../components/steps/EmploymentPrefsStep', () => ({
  EmploymentPrefsStep: ({
    onContinue,
    onSaveForLater,
    onSkip,
  }: {
    onContinue: (data: unknown) => void
    onSaveForLater?: (data: unknown) => void
    onSkip?: () => void
  }) => (
    <div data-testid="mock-step-preferences">
      <button
        type="button"
        onClick={() => onContinue?.({ step: 'preferences', payload: 'preferences-payload' })}
      >
        Continue preferences
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={() => onSaveForLater({ step: 'preferences' })}>
          Save preferences
        </button>
      ) : null}
      {onSkip ? (
        <button type="button" onClick={() => onSkip()}>
          Skip preferences
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('../components/steps/EducationStep', () => ({
  EducationStep: ({
    onContinue,
    onSaveForLater,
    onSkip,
  }: {
    onContinue: (data: unknown) => void
    onSaveForLater?: (data: unknown) => void
    onSkip?: () => void
  }) => (
    <div data-testid="mock-step-education">
      <button
        type="button"
        onClick={() => onContinue?.({ step: 'education', payload: 'education-payload' })}
      >
        Continue education
      </button>
      {onSaveForLater ? (
        <button type="button" onClick={() => onSaveForLater({ step: 'education' })}>
          Save education
        </button>
      ) : null}
      {onSkip ? (
        <button type="button" onClick={() => onSkip()}>
          Skip education
        </button>
      ) : null}
    </div>
  ),
}))

vi.mock('tamagui', () => {
  const Stack = ({
    children,
    onPress,
    ...rest
  }: {
    children?: ReactNode
    onPress?: () => void
  } & Record<string, unknown>) => (
    <button type="button" {...rest} onClick={onPress}>
      {children}
    </button>
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

  const Input = ({
    value,
    onChangeText,
    placeholder,
    ...rest
  }: {
    value?: string
    onChangeText?: (text: string) => void
    placeholder?: string
  } & Record<string, unknown>) => (
    <input
      value={value ?? ''}
      onChange={(e) => onChangeText?.((e.target as HTMLInputElement).value)}
      placeholder={placeholder}
      {...rest}
    />
  )

  const TextArea = ({
    value,
    onChangeText,
    placeholder,
    ...rest
  }: {
    value?: string
    onChangeText?: (text: string) => void
    placeholder?: string
  } & Record<string, unknown>) => (
    <textarea
      value={value ?? ''}
      onChange={(e) => onChangeText?.((e.target as HTMLTextAreaElement).value)}
      placeholder={placeholder}
      {...rest}
    />
  )

  return {
    Stack: Stack,
    Row: Stack,
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
    Input,
    TextArea,
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

    await waitFor(
      () => expect(screen.queryByTestId('wizard-start-screen')).not.toBeInTheDocument(),
      { timeout: 1500 }
    )

    expect(screen.getByTestId('mock-step-general')).toBeInTheDocument()
    expect(goNext).not.toHaveBeenCalled()
  })

  it('saves the current step and advances when continue is triggered', async () => {
    render(<ProfileWizard />)

    fireEvent.click(screen.getByText('Start Wizard'))
    await waitFor(() => screen.getByTestId('mock-step-general'), { timeout: 1500 })

    fireEvent.click(screen.getByText('Continue general'))

    await waitFor(
      () =>
        expect(saveStep).toHaveBeenCalledWith({
          step: 'general',
          data: { step: 'general', payload: 'general-payload' },
        }),
      { timeout: 1500 }
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

    await waitFor(() => expect(saveStep).toHaveBeenCalledTimes(1), { timeout: 1500 })
    await waitFor(() => expect(completeWizard).toHaveBeenCalledTimes(1), { timeout: 1500 })

    expect(screen.getByTestId('wizard-success-modal')).toBeInTheDocument()
  })
})
