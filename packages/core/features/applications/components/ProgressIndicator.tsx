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
    <XStack gap="$2" alignItems="center" flexWrap="wrap" padding="$4">
      {steps.map((step, index) => {
        const status = getStepStatus(step.id)
        const isLast = index === steps.length - 1

        return (
          <XStack key={step.id} gap="$2" alignItems="center">
            {/* Step Circle */}
            <YStack gap="$1" alignItems="center">
              <Circle
                size={40}
                backgroundColor={
                  status === 'completed' ? '$green9' : status === 'current' ? '$blue9' : '$gray5'
                }
                borderWidth={2}
                borderColor={
                  status === 'completed' ? '$green10' : status === 'current' ? '$blue10' : '$gray7'
                }
                justifyContent="center"
                alignItems="center"
              >
                {status === 'completed' ? (
                  <Text fontSize="$6" fontWeight="bold" color="$white">
                    ✓
                  </Text>
                ) : (
                  <Text
                    fontSize="$4"
                    fontWeight="bold"
                    color={status === 'current' ? '$white' : '$gray10'}
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
                textAlign="center"
                maxWidth={80}
              >
                {step.label}
              </Text>
            </YStack>

            {/* Connector Line */}
            {!isLast && (
              <YStack
                width={40}
                height={2}
                backgroundColor={status === 'completed' ? '$green9' : '$gray5'}
                marginBottom={24}
              />
            )}
          </XStack>
        )
      })}
    </XStack>
  )
}
