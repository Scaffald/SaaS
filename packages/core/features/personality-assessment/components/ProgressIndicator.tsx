import { Circle, Text, XStack, YStack } from 'tamagui'
import type { AssessmentStep } from '../utils/assessment-steps'
import { STEP_INFO } from '../utils/assessment-steps'

export interface ProgressIndicatorProps {
  /**
   * Current active step
   */
  currentStep: AssessmentStep

  /**
   * Completion percentage (0-100)
   */
  completionScore: number
}

/**
 * ProgressIndicator - Visual progress tracker for personality assessment wizard
 */
export function ProgressIndicator({ currentStep, completionScore }: ProgressIndicatorProps) {
  const steps: AssessmentStep[] = ['luscher1', 'ipip', 'luscher2', 'acute']

  const getStepStatus = (stepId: AssessmentStep): 'completed' | 'current' | 'upcoming' => {
    const currentOrder = STEP_INFO[currentStep].order
    const stepOrder = STEP_INFO[stepId].order

    if (stepOrder < currentOrder) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <YStack gap="$3" width="100%">
      {/* Completion Percentage */}
      <YStack gap="$1">
        <XStack justify="space-between" items="center">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Progress
          </Text>
          <Text fontSize="$5" fontWeight="bold" color="$blue10">
            {completionScore}%
          </Text>
        </XStack>
        <YStack height={8} bg="$color5" rounded="$10" overflow="hidden">
          <YStack
            height="100%"
            bg="$blue9"
            width={`${completionScore}%`}
            transition="width 0.3s ease"
          />
        </YStack>
      </YStack>

      {/* Step Indicators */}
      <XStack gap="$2" items="center" flexWrap="wrap">
        {steps.map((step, index) => {
          const status = getStepStatus(step)
          const isLast = index === steps.length - 1
          const stepInfo = STEP_INFO[step]

          return (
            <XStack key={step} gap="$2" items="center">
              {/* Step Circle */}
              <YStack gap="$1" items="center">
                <Circle
                  size={40}
                  bg={
                    status === 'completed' ? '$green9' : status === 'current' ? '$blue9' : '$color5'
                  }
                  borderWidth={2}
                  borderColor={
                    status === 'completed'
                      ? '$green10'
                      : status === 'current'
                        ? '$blue10'
                        : '$color7'
                  }
                  justify="center"
                  items="center"
                >
                  {status === 'completed' ? (
                    <Text fontSize="$6" fontWeight="bold" color="$color12">
                      ✓
                    </Text>
                  ) : (
                    <Text
                      fontSize="$4"
                      fontWeight="bold"
                      color={status === 'current' ? '$color12' : '$color10'}
                    >
                      {index + 1}
                    </Text>
                  )}
                </Circle>

                {/* Step Label */}
                <Text
                  fontSize="$2"
                  fontWeight={status === 'current' ? 'bold' : 'normal'}
                  color={status === 'completed' || status === 'current' ? '$color12' : '$color10'}
                  text="center"
                  maxW={80}
                >
                  {stepInfo.label}
                </Text>
              </YStack>

              {/* Connector Line */}
              {!isLast && (
                <YStack
                  width={40}
                  height={2}
                  bg={status === 'completed' ? '$green9' : '$color5'}
                  mb={24}
                />
              )}
            </XStack>
          )
        })}
      </XStack>
    </YStack>
  )
}
