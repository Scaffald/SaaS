import { ROUTES } from '@scf/core/constants/routes'
import { AssessmentTakingLayout, AssessmentWizard } from '@scf/core/features/assessments'
import { LuscherTestStep } from '@scf/core/features/personality-assessment/components/LuscherTestStep'
import {
  useAssessmentStatus,
  useLuscherTestAvailability,
  useSaveLuscher1Mutation,
  useSaveLuscherTestSessionMutation,
} from '@scf/core/utils/personality-assessment-sdk-hooks'
import { useQueryClient } from '@tanstack/react-query'
import { DashboardLayout } from '@scf/core/components/layouts'
import { useRouteScreenTitle } from '@scf/core/hooks/useRouteScreenTitle'
import { useToast } from '@scaffald/ui'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Stack } from '@scaffald/ui'
import { CooldownStep, ResultsSidebar, ResultsStep } from './components'

type TestStep = 'luscher1' | 'cooldown' | 'luscher2' | 'results'

/**
 * LuscherTestWizard - Unified wizard for Weekly Pulse
 * Combines Test 1 and Test 2 into a single flow with cooldown and results.
 *
 * It opens on the first swatch grid. There was an introduction step before
 * it: four feature tiles ("Mood Metrics — produces quantitative state
 * metrics", "Earn XP") and a callout promising the test "cannot be gamed"
 * and reveals "deeper truths". This is a reflective colour exercise, not a
 * psychometric instrument, so those claims went, and with them the step
 * that existed to make them (#1175). The instruction and the
 * not-a-clinical-instrument footnote live on the grid itself.
 */
export function LuscherTestWizard() {
  const toast = useToast()
  const router = useRouter()
  const { title: routeTitle } = useRouteScreenTitle()

  const [currentStep, setCurrentStep] = useState<TestStep>('luscher1')
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
  // This used to reach for `.data` with a fallback to the value itself, under a
  // comment noting the SDK type declared `{ data: AssessmentStatus }` while the
  // API returned it directly. That was correct, and is now fixed at the source:
  // getStatus() declares the payload (#744), so the fallback is what is left.
  const assessment = assessmentData

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
        // Test is completed but cooldown expired: a fresh retake, so the last
        // run's answers are not carried into it.
        startFresh()
      }
    }
  }, [availability, isLoadingAvailability])

  // Load existing progress if available. Only a run that is part-way through
  // (Part 1 saved, Part 2 not) is resumed. With no introduction step to pass
  // through, restoring a finished run's choices would open the grid with
  // all eight already picked; the introduction's Begin used to clear them.
  useEffect(() => {
    if (assessment) {
      const resuming =
        assessment.current_step === 'cooldown' || assessment.current_step === 'luscher2'
      if (!resuming) return
      if (assessment.luscher1_choices && assessment.luscher1_choices.length === 8) {
        setLuscher1Choices(assessment.luscher1_choices)
        // Part 1 is complete but Part 2 isn't: continue from cooldown or luscher2
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
      if (assessment.luscher2_choices && assessment.luscher2_choices.length === 8) {
        setLuscher2Choices(assessment.luscher2_choices)
      }
      if (assessment.diary_response) {
        setDiaryResponse(assessment.diary_response)
      }
    }
  }, [assessment])

  function startFresh() {
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
    { id: 'luscher1', label: 'First pass', order: 1 },
    { id: 'cooldown', label: 'Pause', order: 2 },
    { id: 'luscher2', label: 'Second pass', order: 3 },
    { id: 'results', label: 'Results', order: 4 },
  ]

  // Progress is passes done: none on the first grid, one through the pause
  // and the second grid, both at the results.
  const completionScore = currentStep === 'results' ? 100 : currentStep === 'luscher1' ? 0 : 50

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

  const showPrevious = !isCooldownResultsView && currentStep === 'luscher2'

  const handlePrevious = () => {
    directionRef.current = -1
    if (currentStep === 'luscher2') {
      setCurrentStep('luscher1')
    }
  }

  const showResultsSidebar = effectiveCurrentStep === 'results'

  // Only the results have a rail; in progress the test is a single column
  // and the counter on the kicker's hairline is its one progress readout.
  const railContent = (
    <Stack gap={20} padding="xs">
      <ResultsSidebar nextAvailableAt={availability?.nextAvailableAt || null} />
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
      {isCooldownResultsView ? (
        <ResultsStep
          luscher1Choices={assessment?.luscher1_choices || []}
          luscher2Choices={assessment?.luscher2_choices || []}
        />
      ) : (
        <>
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

  // While a pass or the pause is on screen the test is in progress: a
  // focused column with no section tabs and no rail (#1194). The results
  // keep the shell and their sidebar.
  if (!showResultsSidebar) {
    // Part 1 is saved when it is submitted, and a saved Part 1 resumes at
    // the pause or Part 2; picks on the first grid are not saved until then.
    const firstPassSaved = currentStep === 'cooldown' || currentStep === 'luscher2'
    const counter =
      currentStep === 'luscher1'
        ? 'Pass 1 of 2'
        : currentStep === 'cooldown'
          ? 'Pause'
          : 'Pass 2 of 2'
    return (
      <AssessmentTakingLayout
        kicker="Weekly pulse"
        counter={counter}
        instruction="Pick colours in the order you prefer them. Two passes of the same eight, a short pause apart."
        onExit={() => router.push(ROUTES.ASSESSMENTS.path)}
        exitLabel={firstPassSaved ? 'Save & exit' : 'Exit'}
      >
        {wizardContent}
      </AssessmentTakingLayout>
    )
  }

  return (
    <DashboardLayout
      leftContent={wizardContent}
      rightContent={railContent}
      breadcrumbItems={[{ label: 'Assessments', href: '/assessments' }, { label: 'Weekly Pulse' }]}
      screenKicker="Assessment"
      screenTitle={routeTitle}
      screenTip="Pick colours in the order you prefer them. It takes about two minutes, and it repeats."
    />
  )
}
