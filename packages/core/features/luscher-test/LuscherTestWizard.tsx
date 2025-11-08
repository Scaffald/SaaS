import { useState, useEffect } from 'react'
import { useToastController } from '@tamagui/toast'
import { AssessmentWizard, AssessmentProgress } from '@app/core/features/assessments'
import { LuscherTestStep } from '@app/core/features/personality-assessment/components/LuscherTestStep'
import { IntroductionStep, CooldownStep, ResultsStep } from './components'
import { api } from '@app/core/utils/api'
import { DashboardLayout } from '@app/ui'
import { Text, YStack } from 'tamagui'

type TestStep = 'intro' | 'luscher1' | 'cooldown' | 'luscher2' | 'results'

/**
 * LuscherTestWizard - Unified wizard for Weekly Pulse
 * Combines Test 1 and Test 2 into a single flow with intro, cooldown, and results
 */
export function LuscherTestWizard() {
  const toast = useToastController()

  const [currentStep, setCurrentStep] = useState<TestStep>('intro')
  const [luscher1Choices, setLuscher1Choices] = useState<number[]>([])
  const [luscher2Choices, setLuscher2Choices] = useState<number[]>([])
  const [diaryResponse, setDiaryResponse] = useState<string>('')
  const [cooldownEndTime, setCooldownEndTime] = useState<string>('')

  // Get assessment status and availability
  const { data: availability, isLoading: isLoadingAvailability } =
    api.personalityAssessment.getLuscherTestAvailability.useQuery()

  // Get existing assessment if available
  const { data: assessment } = api.personalityAssessment.getAssessmentStatus.useQuery()

  const utils = api.useUtils()

  // Save Part 1 mutation
  const savePart1Mutation = api.personalityAssessment.saveLuscher1.useMutation({
    onSuccess: async () => {
      // Fetch the updated assessment to get the cooldown_end_time from the database
      const updated = await utils.personalityAssessment.getAssessmentStatus.fetch()
      if (updated?.cooldown_end_time) {
        setCooldownEndTime(updated.cooldown_end_time)
      } else {
        // Fallback: calculate cooldown end time (60 seconds from now)
        const endTime = new Date(Date.now() + 60 * 1000).toISOString()
        setCooldownEndTime(endTime)
      }
      setCurrentStep('cooldown')
    },
    onError: (error: { message?: string }) => {
      toast.show('Error', {
        message: error.message || 'Failed to save test. Please try again.',
      })
    },
  })

  // Save Part 2 mutation (completes test)
  const savePart2Mutation = api.personalityAssessment.saveLuscherTestSession.useMutation({
    onSuccess: () => {
      // Invalidate all related queries
      utils.personalityAssessment.getLuscherTestAvailability.invalidate()
      utils.personalityAssessment.getAssessmentStatus.invalidate()
      utils.personalityAssessment.getLuscherTest1Status.invalidate()
      utils.personalityAssessment.getLuscherTest2Status.invalidate()
      setCurrentStep('results')
    },
    onError: (error: { message?: string }) => {
      toast.show('Error', {
        message: error.message || 'Failed to save test. Please try again.',
      })
    },
  })

  // Check if test is on cooldown - if so, show results view only
  useEffect(() => {
    if (!isLoadingAvailability && availability) {
      if (availability.isOnCooldown && availability.nextAvailableAt) {
        // User is on cooldown, show results view
        setCurrentStep('results')
      } else if (availability.isCompleted) {
        // Test is completed but cooldown expired, allow retake
        // Reset to intro
        setCurrentStep('intro')
      }
    }
  }, [availability, isLoadingAvailability])

  // Load existing progress if available
  useEffect(() => {
    if (assessment) {
      if (assessment.luscher1_choices && assessment.luscher1_choices.length === 8) {
        setLuscher1Choices(assessment.luscher1_choices)
        // If Part 1 is complete but Part 2 isn't, continue from cooldown or luscher2
        if (assessment.current_step === 'cooldown' || assessment.current_step === 'luscher2') {
          if (assessment.cooldown_end_time) {
            const cooldownEnd = new Date(assessment.cooldown_end_time).getTime()
            const now = Date.now()
            if (cooldownEnd > now) {
              // Still in cooldown
              setCooldownEndTime(assessment.cooldown_end_time)
              setCurrentStep('cooldown')
            } else {
              // Cooldown complete, proceed to Part 2
              setCurrentStep('luscher2')
            }
          } else {
            setCurrentStep('luscher2')
          }
        }
      }
      if (assessment.luscher2_choices && assessment.luscher2_choices.length === 8) {
        setLuscher2Choices(assessment.luscher2_choices)
      }
      if (assessment.diary_response) {
        setDiaryResponse(assessment.diary_response)
      }
    }
  }, [assessment])

  const handleBegin = () => {
    setCurrentStep('luscher1')
    setLuscher1Choices([])
    setLuscher2Choices([])
    setDiaryResponse('')
  }

  const handlePart1Save = (choices: number[]) => {
    setLuscher1Choices(choices)
    savePart1Mutation.mutate({ choices })
  }

  const handleCooldownComplete = () => {
    setCurrentStep('luscher2')
  }

  const handleSaveDiary = (response: string) => {
    setDiaryResponse(response)
  }

  const handlePart2Save = (choices: number[]) => {
    setLuscher2Choices(choices)
    // Save both parts together with diary response
    savePart2Mutation.mutate({
      luscher1Choices,
      luscher2Choices: choices,
      diaryResponse: diaryResponse || undefined,
    })
  }

  const steps = [
    { id: 'intro', label: 'Introduction', order: 1 },
    { id: 'luscher1', label: 'First Selection', order: 2 },
    { id: 'cooldown', label: 'Cooldown', order: 3 },
    { id: 'luscher2', label: 'Second Selection', order: 4 },
    { id: 'results', label: 'Results', order: 5 },
  ]

  const completionScore =
    currentStep === 'results'
      ? 100
      : currentStep === 'luscher2'
        ? 75
        : currentStep === 'cooldown'
          ? 50
          : currentStep === 'luscher1'
            ? 25
            : 0

  const currentStepOrder = steps.find((step) => step.id === currentStep)?.order ?? 0
  const completedSteps = new Set(
    steps.filter((step) => step.order < currentStepOrder).map((step) => step.id)
  )

  const isCooldownResultsView = availability?.isOnCooldown && currentStep === 'results'
  const effectiveCurrentStep = isCooldownResultsView ? 'results' : currentStep
  const effectiveCompletionScore = isCooldownResultsView ? 100 : completionScore

  const wizardIsLoading = isCooldownResultsView
    ? isLoadingAvailability
    : isLoadingAvailability || savePart1Mutation.isPending || savePart2Mutation.isPending

  const showPrevious =
    !isCooldownResultsView &&
    currentStep !== 'intro' &&
    currentStep !== 'cooldown' &&
    currentStep !== 'results'

  const handlePrevious = () => {
    if (currentStep === 'luscher2') {
      setCurrentStep('luscher1')
    } else if (currentStep === 'luscher1') {
      setCurrentStep('intro')
    }
  }

  const railContent = (
    <YStack gap="$4" p="$2" $gtSm={{ p: '$1' }}>
      <YStack gap="$1">
        <Text fontSize="$5" fontWeight="700" color="$color12">
          Weekly Pulse
        </Text>
        <Text fontSize="$3" color="$color10">
          Track your focus and readiness through five quick moments.
        </Text>
      </YStack>
      <AssessmentProgress
        steps={steps}
        currentStep={effectiveCurrentStep}
        completedSteps={completedSteps}
        completionScore={effectiveCompletionScore}
        orientation="vertical"
      />
    </YStack>
  )

  const wizardContent = (
    <AssessmentWizard
      steps={steps}
      currentStep={effectiveCurrentStep}
      completionScore={effectiveCompletionScore}
      isLoading={wizardIsLoading}
      showNext={false}
      showPrevious={showPrevious}
      onPrevious={showPrevious ? handlePrevious : undefined}
      completedSteps={completedSteps}
      showHeader={false}
      showProgressIndicator={false}
    >
      {isCooldownResultsView ? (
        <ResultsStep
          nextAvailableAt={availability?.nextAvailableAt || null}
          xpAwarded={5}
          feedbackMessage="You're showing signs of balanced focus — ideal for steady progress today."
          luscher1Choices={assessment?.luscher1_choices || []}
          luscher2Choices={assessment?.luscher2_choices || []}
        />
      ) : (
        <>
          {currentStep === 'intro' && <IntroductionStep onBegin={handleBegin} />}
          {currentStep === 'luscher1' && (
            <LuscherTestStep
              step="luscher1"
              initialChoices={luscher1Choices}
              onSave={handlePart1Save}
              isLoading={savePart1Mutation.isPending}
            />
          )}
          {currentStep === 'cooldown' && (
            <CooldownStep
              cooldownEndTime={cooldownEndTime}
              onCooldownComplete={handleCooldownComplete}
              onSaveDiary={handleSaveDiary}
              isLoading={savePart1Mutation.isPending}
            />
          )}
          {currentStep === 'luscher2' && (
            <LuscherTestStep
              step="luscher2"
              initialChoices={luscher2Choices}
              onSave={handlePart2Save}
              isLoading={savePart2Mutation.isPending}
            />
          )}
          {currentStep === 'results' && (
            <ResultsStep
              nextAvailableAt={availability?.nextAvailableAt || null}
              xpAwarded={5}
              feedbackMessage="You're showing signs of balanced focus — ideal for steady progress today."
              luscher1Choices={
                luscher1Choices.length === 8 ? luscher1Choices : assessment?.luscher1_choices || []
              }
              luscher2Choices={
                luscher2Choices.length === 8 ? luscher2Choices : assessment?.luscher2_choices || []
              }
            />
          )}
        </>
      )}
    </AssessmentWizard>
  )

  return <DashboardLayout leftContent={wizardContent} rightContent={railContent} />
}
