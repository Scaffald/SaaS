import { XStack, YStack, Text, Circle } from 'tamagui'
import { Check } from '@tamagui/lucide-icons'

export interface AssessmentStep {
  id: string
  label: string
  order: number
}

export interface AssessmentProgressProps {
  steps: AssessmentStep[]
  currentStep: string
  completedSteps?: Set<string>
  completionScore?: number
}

/**
 * AssessmentProgress - Reusable progress indicator for assessments
 * Shows step indicators with checkmarks for completed steps
 */
export function AssessmentProgress({
  steps,
  currentStep,
  completedSteps = new Set(),
  completionScore,
}: AssessmentProgressProps) {
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order)

  return (
    <YStack gap="$3" width="100%">
      {/* Progress Bar */}
      {completionScore !== undefined && (
        <YStack gap="$2">
          <XStack justify="space-between" items="center">
            <Text fontSize="$3" color="$color11">
              Progress
            </Text>
            <Text fontSize="$4" fontWeight="600" color="$blue10">
              {completionScore}%
            </Text>
          </XStack>
          <XStack height={8} bg="$color5" rounded="$10" overflow="hidden" width="100%">
            <XStack height="100%" bg="$blue9" width={`${completionScore}%`} animation="quick" />
          </XStack>
        </YStack>
      )}

      {/* Step Indicators */}
      <XStack gap="$2" flexWrap="wrap" justify="center" $gtXs={{ gap: '$6' }}>
        {sortedSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = step.id === currentStep
          const currentStepIndex = sortedSteps.findIndex((s) => s.id === currentStep)
          const isPast = currentStepIndex > index

          return (
            <XStack
              key={step.id}
              items="center"
              gap="$2"
              opacity={isPast || isCurrent || isCompleted ? 1 : 0.5}
            >
              <Circle
                size={32}
                bg={isCompleted ? '$green9' : isCurrent ? '$blue9' : '$color6'}
                borderWidth={2}
                borderColor={isCurrent ? '$blue11' : 'transparent'}
                items="center"
                justify="center"
              >
                {isCompleted ? (
                  <Check size={16} color="white" />
                ) : (
                  <Text fontSize="$2" fontWeight="600" color={isCurrent ? 'white' : '$color11'}>
                    {index + 1}
                  </Text>
                )}
              </Circle>
              <Text
                fontSize="$2"
                fontWeight={isCurrent ? '600' : '400'}
                color={isCurrent ? '$color12' : '$color11'}
              >
                {step.label}
              </Text>
            </XStack>
          )
        })}
      </XStack>
    </YStack>
  )
}
