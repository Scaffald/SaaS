import { AssessmentProgress, AssessmentWizard } from '@scf/core/features/assessments'
import { LuscherTestStep } from '@scf/core/features/personality-assessment/components/LuscherTestStep'
import {
  useAssessmentStatus,
  useLuscherTestAvailability,
  useSaveLuscher1Mutation,
  useSaveLuscherTestSessionMutation,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@scf/core/components/layouts'
import { AssessmentProgressBar, useToast, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
import { useEffect, useRef, useState } from 'react'
import { Text, Stack } from '@scaffald/ui'
import { CooldownStep, IntroductionStep, ResultsSidebar, ResultsStep } from './components'

type TestStep = 'intro' | 'luscher1' | 'cooldown' | 'luscher2' | 'results'

/**
 * LuscherTestWizard - Unified wizard for Weekly Pulse
 * Combines Test 1 and Test 2 into a single flow with intro, cooldown, and results
 */
export function LuscherTestWizard() {
  const toast = useToast()
  const { theme } = useThemeContext()

  const [currentStep, setCurrentStep] = useState<TestStep>('intro')
  const [luscher1Choices, setLuscher1Choices] = useState<number[]>([])
  const [luscher2Choices, setLuscher2Choices] = useState<number[]>([])
  const [diaryResponse, setDiaryResponse] = useState<string>('')
  const [cooldownEndTime, setCooldownEndTime] = useState<string>('')
  const directionRef = useRef<1 | -1>(1)

  // Get assessment status and availability
  const { data: availabilityData, isLoading: isLoadingAvailability } = useLuscherTestAvailability()

  // Get existing assessment if available
  const { data: assessmentData } = useAssessmentStatus()

  const queryClient = useQueryClient()

  const availability = availabilityData
  // SDK type declares { data: AssessmentStatus } but API returns AssessmentStatus directly
  const assessment = assessmentData
    ? (assessmentData.data ?? (assessmentData as unknown as NonNullable<typeof assessmentData>['data']))
    : undefined

  // Save Part 1 mutation
  const savePart1Mutation = useSaveLuscher1Mutation({
    onSuccess: async () => {
      directionRef.current = 1
      // Fetch the updated assessment to get the cooldown_end_time from the database
      await queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      const updated = (await queryClient.fetchQuery({
        queryKey: ['personality-assessment', 'status'],
      })) as { data?: { cooldown_end_time?: string } } | undefined
      if (updated?.data?.cooldown_end_time) {
        setCooldownEndTime(updated.data.cooldown_end_time)
      } else {
        // Fallback: calculate cooldown end time (60 seconds from now)
        const endTime = new Date(Date.now() + 60 * 1000).toISOString()
        setCooldownEndTime(endTime)
      }
      setCurrentStep('cooldown')
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to save test. Please try again.',
        variant: 'error',
      })
    },
  })

  // Save Part 2 mutation (completes test)
  const savePart2Mutation = useSaveLuscherTestSessionMutation({
    onSuccess: () => {
      directionRef.current = 1
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: ['personality-assessment', 'luscher', 'availability'],
      })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'luscher-1', 'status'] })
      queryClient.invalidateQueries({ queryKey: ['personality-assessment', 'luscher-2', 'status'] })
      setCurrentStep('results')
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || 'Failed to save test. Please try again.',
        variant: 'error',
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
    directionRef.current = 1
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
    directionRef.current = 1
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
    directionRef.current = -1
    if (currentStep === 'luscher2') {
      setCurrentStep('luscher1')
    } else if (currentStep === 'luscher1') {
      setCurrentStep('intro')
    }
  }

  const showResultsSidebar = effectiveCurrentStep === 'results'

  const railContent = (
    <Stack gap={20} padding="xs">
      {!showResultsSidebar && (
        <>
          <Stack gap={4}>
            <Text style={{ fontWeight: '600', color: colors.text[theme].primary }}>Weekly Pulse</Text>
            <Text style={{ fontSize: 13, color: colors.text[theme].secondary, lineHeight: 20 }}>
              Two rounds of color selection to capture how you're feeling this week.
            </Text>
          </Stack>
          <AssessmentProgress
            steps={steps}
            currentStep={effectiveCurrentStep}
            completedSteps={completedSteps}
            completionScore={effectiveCompletionScore}
            orientation="vertical"
          />
        </>
      )}

      {showResultsSidebar && (
        <ResultsSidebar xpAwarded={5} nextAvailableAt={availability?.nextAvailableAt || null} />
      )}
    </Stack>
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
      animateTransitions
      transitionDirection={directionRef.current}
    >
      <Stack padding="md" paddingBottom="xs">
        <AssessmentProgressBar value={effectiveCompletionScore} height={4} />
      </Stack>
      {isCooldownResultsView ? (
        <ResultsStep
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

  return (
    <DashboardLayout
      leftContent={wizardContent}
      rightContent={railContent}
      breadcrumbItems={[
        { label: 'Assessments', href: '/dashboard/assessments' },
        { label: 'Weekly Pulse' },
      ]}
    />
  )
}
