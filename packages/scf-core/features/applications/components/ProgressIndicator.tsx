import type { ApplicationStepType } from '@scf/schemas'
import { CheckCircle2 } from '@tamagui/lucide-icons'
import { Text, XStack, YStack } from '@unicornlove/ui'

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
 * - Completed steps (checkmark icon)
 * - Current step (highlighted in blue)
 * - Upcoming steps (gray, inactive)
 *
 * Features:
 * - Step numbers (1, 2, 3, 4) or checkmarks for completed
 * - Step labels below numbers
 * - Connecting lines between steps
 * - Responsive design
 * - Accessibility support
 */
export function ProgressIndicator({ currentStep, completedSteps, steps }: ProgressIndicatorProps) {
  const getStepStatus = (stepId: ApplicationStepType): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <XStack
      gap="$2"
      alignItems="center"
      flexWrap="wrap"
      padding="$4"
      role="progressbar"
      aria-label="Application progress"
      aria-valuenow={steps.findIndex((s) => s.id === currentStep) + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
    >
      {steps.map((step, index) => {
        const status = getStepStatus(step.id)
        const isLast = index === steps.length - 1
        const stepNumber = index + 1

        // Determine if connecting line should be blue (completed) or gray (future)
        // Line is blue if current step or any previous step is completed/current
        const isLineCompleted =
          status === 'completed' ||
          status === 'current' ||
          steps.slice(0, index).some((s) => {
            const prevStatus = getStepStatus(s.id)
            return prevStatus === 'completed' || prevStatus === 'current'
          })

        return (
          <XStack key={step.id} gap="$2" alignItems="center" flex={1} minWidth={0}>
            {/* Step Circle */}
            <YStack gap="$2" alignItems="center" flexShrink={0}>
              {status === 'completed' ? (
                <YStack
                  width={32}
                  height={32}
                  borderRadius="$10"
                  backgroundColor="$blue9"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={2}
                  borderColor="$blue10"
                  shadowColor="$blue9"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.2}
                  shadowRadius={4}
                >
                  <CheckCircle2 size={20} color="$color12" />
                </YStack>
              ) : (
                <YStack
                  width={32}
                  height={32}
                  borderRadius="$10"
                  backgroundColor={status === 'current' ? '$blue9' : '$gray4'}
                  alignItems="center"
                  justifyContent="center"
                  borderWidth={status === 'current' ? 2 : 1}
                  borderColor={status === 'current' ? '$blue10' : '$gray7'}
                  shadowColor={status === 'current' ? '$blue9' : undefined}
                  shadowOffset={status === 'current' ? { width: 0, height: 2 } : undefined}
                  shadowOpacity={status === 'current' ? 0.2 : undefined}
                  shadowRadius={status === 'current' ? 4 : undefined}
                >
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    color={status === 'current' ? '$color12' : '$gray11'}
                  >
                    {stepNumber}
                  </Text>
                </YStack>
              )}

              {/* Step Label */}
              <Text
                fontSize="$3"
                fontWeight={status === 'current' ? '600' : '400'}
                color={
                  status === 'current' ? '$blue10' : status === 'completed' ? '$gray11' : '$gray10'
                }
                textAlign="center"
                maxWidth={100}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {step.label}
              </Text>
            </YStack>

            {/* Connector Line */}
            {!isLast && (
              <YStack
                flex={1}
                height={2}
                backgroundColor={isLineCompleted ? '$blue9' : '$gray4'}
                marginHorizontal="$2"
                minWidth={20}
              />
            )}
          </XStack>
        )
      })}
    </XStack>
  )
}
