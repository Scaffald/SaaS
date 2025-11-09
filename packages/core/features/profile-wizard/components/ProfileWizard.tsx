import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Spinner, Text, YStack, Paragraph, ScrollView } from 'tamagui'
import type { ComponentType } from 'react'
import { ProgressIndicator } from './ProgressIndicator'
import { WizardSuccessModal } from './WizardSuccessModal'
import { useProfileWizard, type WizardStepPayloads } from '../hooks/useProfileWizard'
import type { ProfileWizardStepId } from '../utils/wizardSteps'
import { PROFILE_WIZARD_STEPS } from '../utils/wizardSteps'
import { useWizardAutoSave } from '../hooks/useWizardAutoSave'
import type { WizardStepComponentProps, StepStateChangePayload } from './steps/types'
import { GeneralInfoStep } from './steps/GeneralInfoStep'
import { SkillsStep } from './steps/SkillsStep'
import { ExperienceStep } from './steps/ExperienceStep'
import { CertificationsStep } from './steps/CertificationsStep'
import { EmploymentPrefsStep } from './steps/EmploymentPrefsStep'
import { EducationStep } from './steps/EducationStep'
import { WizardStartScreen } from './WizardStartScreen'

interface ProfileWizardProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialStep?: ProfileWizardStepId
  onViewProfile?: () => void
  onUploadResume?: () => void
}

type StepComponentMap = {
  [Step in ProfileWizardStepId]: ComponentType<WizardStepComponentProps<Step>>
}

const STEP_COMPONENTS: StepComponentMap = {
  general: GeneralInfoStep,
  skills: SkillsStep,
  experience: ExperienceStep,
  certifications: CertificationsStep,
  preferences: EmploymentPrefsStep,
  education: EducationStep,
}

interface StepSnapshot {
  data: WizardStepPayloads[ProfileWizardStepId]
  isValid: boolean
  isDirty: boolean
}

function getDefaultStepData(step: ProfileWizardStepId): WizardStepPayloads[ProfileWizardStepId] {
  switch (step) {
    case 'general':
      return {
        firstName: '',
        lastName: '',
        headline: '',
        bio: '',
      }
    case 'skills':
      return {
        skills: [],
      }
    case 'experience':
      return {
        jobTitle: '',
        companyName: '',
        startDate: null,
        endDate: null,
        isCurrent: true,
        summary: '',
      }
    case 'certifications':
      return {
        certifications: [],
      }
    case 'preferences':
      return {
        locationPreference: null,
        hourlyRate: null,
        availability: null,
        remotePreference: null,
      }
    case 'education':
      return {
        degreeType: '',
        institutionName: '',
        startDate: null,
        endDate: null,
        isCurrent: false,
      }
    default:
      return {
        firstName: '',
        lastName: '',
        headline: '',
        bio: '',
      } as WizardStepPayloads[ProfileWizardStepId]
  }
}

export function ProfileWizard({
  onSuccess,
  onCancel,
  initialStep,
  onViewProfile,
  onUploadResume,
}: ProfileWizardProps) {
  const {
    state,
    orderedSteps,
    goBack,
    goNext,
    saveStep,
    completeWizard,
    isLoading,
    isError,
  } = useProfileWizard(initialStep)

  const [stepSnapshots, setStepSnapshots] = useState<Partial<Record<ProfileWizardStepId, StepSnapshot>>>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [showStartScreen, setShowStartScreen] = useState(false)
  const [hasAcknowledgedStart, setHasAcknowledgedStart] = useState(false)

  const currentStep = state.currentStep
  const StepComponent = STEP_COMPONENTS[currentStep] as ComponentType<WizardStepComponentProps<ProfileWizardStepId>>
  const isLastStep = currentStep === orderedSteps[orderedSteps.length - 1]

  const initialDataForStep = useMemo(() => {
    const existing = state.stepData[currentStep]
    if (existing) {
      return existing as WizardStepPayloads[ProfileWizardStepId]
    }
    return getDefaultStepData(currentStep)
  }, [currentStep, state.stepData])

  useEffect(() => {
    if (isLoading || isError) {
      return
    }

    if (hasAcknowledgedStart) {
      setShowStartScreen(false)
      return
    }

    if (initialStep) {
      setShowStartScreen(false)
      return
    }

    const hasProgress =
      state.progress.completedSteps.length > 0 ||
      Object.values(state.stepData).some((value) => value && Object.keys(value).length > 0)

    setShowStartScreen(!hasProgress)
  }, [hasAcknowledgedStart, initialStep, isError, isLoading, state.progress.completedSteps, state.stepData])

  const currentSnapshot = stepSnapshots[currentStep] ?? {
    data: initialDataForStep,
    isValid: false,
    isDirty: false,
  }

  useWizardAutoSave({
    step: currentStep,
    payload: currentSnapshot.data,
    enabled: currentSnapshot.isValid && currentSnapshot.isDirty,
    isDirty: currentSnapshot.isDirty,
    onSave: async (input) => {
      await saveStep(input)
    },
  })

  const handleStepStateChange = useCallback(
    (step: ProfileWizardStepId, snapshot: StepStateChangePayload<ProfileWizardStepId>) => {
      setStepSnapshots((prev) => ({
        ...prev,
        [step]: {
          data: snapshot.data,
          isValid: snapshot.isValid,
          isDirty: snapshot.isDirty,
        },
      }))
    },
    [],
  )

  const handleContinue = useCallback(
    async (step: ProfileWizardStepId, payload: WizardStepPayloads[ProfileWizardStepId]) => {
      await saveStep({ step, data: payload })

      if (step === PROFILE_WIZARD_STEPS[PROFILE_WIZARD_STEPS.length - 1]) {
        await completeWizard()
        setShowSuccess(true)
        onSuccess?.()
      } else {
        goNext()
      }
    },
    [saveStep, goNext, completeWizard, onSuccess],
  )

  const handleSaveForLater = useCallback(
    async (step: ProfileWizardStepId, payload: WizardStepPayloads[ProfileWizardStepId]) => {
      await saveStep({ step, data: payload })
    },
    [saveStep],
  )

  const handleSkip = useCallback(
    async (step: ProfileWizardStepId) => {
      await saveStep({
        step,
        data: getDefaultStepData(step),
        skip: true,
      })
      goNext()
    },
    [saveStep, goNext],
  )

  const handleBack = useCallback(() => {
    goBack()
  }, [goBack])

  if (showStartScreen) {
    return (
      <ScrollView>
        <YStack p="$6">
          <WizardStartScreen
            completionPercentage={state.progress.completionPercentage}
            onStartWizard={() => {
              setHasAcknowledgedStart(true)
              setShowStartScreen(false)
            }}
            onUploadResume={() => {
              setHasAcknowledgedStart(true)
              setShowStartScreen(false)
              onUploadResume?.()
            }}
            onSkip={() => {
              setHasAcknowledgedStart(true)
              setShowStartScreen(false)
              onCancel?.()
            }}
          />
        </YStack>
      </ScrollView>
    )
  }

  if (isLoading) {
    return (
      <YStack gap="$4" items="center" justify="center" flex={1} p="$6">
        <Spinner size="large" />
        <Text color="$color11">Loading your profile wizard...</Text>
      </YStack>
    )
  }

  if (isError) {
    return (
      <YStack gap="$3" items="center" justify="center" flex={1} p="$6">
        <Text fontSize="$4" fontWeight="600">
          We couldn't load your wizard
        </Text>
        <Paragraph color="$color11" text="center">
          Please refresh and try again. If the issue persists, contact support.
        </Paragraph>
        <Button onPress={onCancel}>Close</Button>
      </YStack>
    )
  }

  if (state.isCompleting) {
    return (
      <YStack gap="$4" items="center" justify="center" flex={1} p="$6">
        <Spinner size="large" />
        <Text color="$color11">Wrapping up your profile...</Text>
      </YStack>
    )
  }

  if (showSuccess) {
    return (
      <WizardSuccessModal
        completionPercentage={state.progress.completionPercentage}
        unlockedBenefits={[
          'Profile now visible in search results',
          'Eligible for curated opportunities',
          'Milestone badge earned',
        ]}
        onViewProfile={() => {
          onViewProfile?.()
          onSuccess?.()
        }}
        onContinueEditing={() => {
          setShowSuccess(false)
          goBack()
        }}
      />
    )
  }

  if (orderedSteps.length === 0) {
    return (
      <YStack items="center" justify="center" flex={1} p="$4">
        <Paragraph color="$color11">Loading wizard...</Paragraph>
      </YStack>
    )
  }

  return (
    <ScrollView>
      <YStack gap="$5" p="$6">
        <ProgressIndicator
          currentStep={state.progress.currentStep}
          completedSteps={state.progress.completedSteps}
          completionPercentage={state.progress.completionPercentage}
        />

        <StepComponent
          initialData={initialDataForStep}
          isSaving={state.isSaving}
          isLastStep={isLastStep}
          onBack={handleBack}
          onContinue={async (data) => {
            await handleContinue(currentStep, data)
          }}
          onSaveForLater={(payload) => handleSaveForLater(currentStep, payload)}
          onSkip={PROFILE_WIZARD_STEPS.includes(currentStep) ? () => handleSkip(currentStep) : undefined}
          onStepStateChange={(snapshot) =>
            handleStepStateChange(currentStep, snapshot as StepStateChangePayload<ProfileWizardStepId>)
          }
        />

        <YStack gap="$2">
          <ButtonRow onCancel={onCancel} />
        </YStack>
      </YStack>
    </ScrollView>
  )
}

interface ButtonRowProps {
  onCancel?: () => void
}

function ButtonRow({ onCancel }: ButtonRowProps) {
  if (!onCancel) return null

  return (
    <YStack>
      <Button size="$3" variant="outlined" onPress={onCancel}>
        Save & exit wizard
      </Button>
      <Text fontSize="$2" color="$color10" mt="$1">
        You can resume anytime from your dashboard.
      </Text>
    </YStack>
  )
}


