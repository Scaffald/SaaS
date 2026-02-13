import { AssessmentProgress } from '@scf/core/features/assessments'
import { useMemo } from 'react'
import { Text, Stack } from '@scaffald/ui'

import { useResumeWizardContext } from '../context/ResumeWizardProvider'

export function ResumeStepsSidebar() {
  const wizard = useResumeWizardContext()

  if (!wizard) {
    return null
  }

  const steps = useMemo(
    () =>
      wizard.steps.map((step, index) => ({
        id: step.id,
        label: step.label,
        order: index + 1,
      })),
    [wizard.steps]
  )

  const completedStepIds = useMemo(() => {
    const completed = new Set<string>()
    const indices = wizard.wizard?.completedSteps ?? []

    for (const index of indices) {
      const step = wizard.steps[index]
      if (step) {
        completed.add(step.id)
      }
    }

    return completed
  }, [wizard.steps, wizard.wizard?.completedSteps])

  const completionScore = useMemo(() => {
    if (steps.length === 0) {
      return 0
    }

    return Math.round((completedStepIds.size / steps.length) * 100)
  }, [completedStepIds, steps.length])

  return (
    <Stack gap={20} padding="xs">
      <Stack gap={4}>
        <Text>Resume Steps</Text>
        <Text color="$gray11">
          Keep track of each resume section as you merge data into your profile.
        </Text>
      </Stack>

      <AssessmentProgress
        steps={steps}
        currentStep={wizard.currentStep.id}
        completedSteps={completedStepIds}
        completionScore={completionScore}
        orientation="vertical"
      />
    </Stack>
  )
}
