import { memo, useMemo } from 'react'
import { XStack, YStack, Text, Progress, Separator } from 'tamagui'
import type { ProfileWizardStepId } from '../utils/wizardSteps'
import { PROFILE_WIZARD_STEP_META, PROFILE_WIZARD_STEPS } from '../utils/wizardSteps'

export interface WizardProgressIndicatorProps {
  currentStep: ProfileWizardStepId
  completedSteps: ProfileWizardStepId[]
  completionPercentage: number
  showStepLabels?: boolean
}

export const ProgressIndicator = memo(function ProgressIndicator({
  currentStep,
  completedSteps,
  completionPercentage,
  showStepLabels = true,
}: WizardProgressIndicatorProps) {
  const orderedSteps = useMemo(() => PROFILE_WIZARD_STEPS, [])

  return (
    <YStack gap="$3">
      <XStack justify="space-between" items="center">
        <Text fontSize="$4" fontWeight="700">
          Step {orderedSteps.indexOf(currentStep) + 1} of {orderedSteps.length}
        </Text>
        <Text fontSize="$3" color="$color11">
          {completionPercentage}%
        </Text>
      </XStack>

      <Progress size="$2" value={completionPercentage} max={100} backgroundColor="$color3">
        <Progress.Indicator animation="bouncy" backgroundColor="$blue10" />
      </Progress>

      {showStepLabels && (
        <XStack gap="$3" items="flex-start" mt="$2" flexWrap="wrap">
          {orderedSteps.map((stepId, index) => {
            const meta = PROFILE_WIZARD_STEP_META[stepId]
            const isCompleted = completedSteps.includes(stepId)
            const isCurrent = currentStep === stepId

            return (
              <XStack key={stepId} gap="$2" items="center">
                <YStack
                  minWidth={32}
                  minHeight={32}
                  bg={isCurrent ? '$blue10' : isCompleted ? '$green9' : '$color5'}
                  items="center"
                  justify="center"
                  rounded="$3"
                >
                  <Text fontWeight="600" color="$color1">
                    {index + 1}
                  </Text>
                </YStack>
                <YStack maxWidth={160}>
                  <Text fontSize="$3" fontWeight={isCurrent ? '700' : '600'} color="$color12">
                    {meta.title}
                  </Text>
                  <Text fontSize="$2" color="$color10">
                    {meta.estimatedTimeMinutes} min
                  </Text>
                </YStack>
                {index < orderedSteps.length - 1 && <Separator vertical />}
              </XStack>
            )
          })}
        </XStack>
      )}
    </YStack>
  )
})


