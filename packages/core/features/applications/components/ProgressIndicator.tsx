import { Circle, Text, XStack, YStack } from 'tamagui'
import type { ApplicationStepType } from '@app/schemas'

export interface ProgressIndicatorProps {
  /**
   * Current active step
   */
  currentStep: ApplicationStepType

  /**
   * Array of completed steps
   */
  completedSteps: ApplicationStepType[]

  /**
   * All available steps in order
   */
  steps: Array<{
    id: ApplicationStepType
    label: string
  }>
}

/**
 * ProgressIndicator - Visual progress tracker for application wizard
 *
 * Shows:
 * - Completed steps (checkmark)
 * - Current step (highlighted)
 * - Upcoming steps (inactive)
 */
export function ProgressIndicator({ currentStep, completedSteps, steps }: ProgressIndicatorProps) {
  const getStepStatus = (stepId: ApplicationStepType): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <XStack gap="$2" items="center" flexWrap="wrap" p="$4">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id)
        const isLast = index === steps.length - 1

        return (
          <XStack key={step.id} gap="$2" items="center">
            {/* Step Circle */}
            <YStack gap="$1" items="center">
              <Circle
                size={40}
                bg={
                  status === 'completed' ? '$green9' : status === 'current' ? '$blue9' : '$color5'
                }
                borderWidth={2}
                borderColor={
                  status === 'completed' ? '$green10' : status === 'current' ? '$blue10' : '$color7'
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
                {step.label}
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
  )
}
