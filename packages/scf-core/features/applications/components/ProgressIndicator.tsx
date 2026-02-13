import type { ApplicationStepType } from '@scf/schemas'
import { CheckCircle2 } from 'lucide-react-native'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()

  const getStepStatus = (stepId: ApplicationStepType): 'completed' | 'current' | 'upcoming' => {
    if (completedSteps.includes(stepId)) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <Row
      gap={8}
      align="center"
      flexWrap="wrap"
      padding="md"
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
          <Row key={step.id} gap={8} align="center" flex={1} minWidth={0}>
            {/* Step Circle */}
            <Stack gap={8} align="center" flexShrink={0}>
              {status === 'completed' ? (
                <Stack
                  width={32}
                  height={32}
                  borderRadius="$10"
                  style={{
                    backgroundColor: colors.bg[theme].primary,
                    borderColor: colors.border[theme].info,
                    shadowColor: colors.bg[theme].primary,
                  }}
                  align="center"
                  justify="center"
                  borderWidth={2}
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.2}
                  shadowRadius={4}
                >
                  <CheckCircle2 size="lg" style={{ color: colors.text[theme].secondary }} />
                </Stack>
              ) : (
                <Stack
                  width={32}
                  height={32}
                  borderRadius="$10"
                  style={{
                    backgroundColor:
                      status === 'current' ? colors.bg[theme].primary : colors.bg[theme].muted,
                    borderColor:
                      status === 'current'
                        ? colors.border[theme].info
                        : colors.border[theme].subtle,
                    shadowColor: status === 'current' ? colors.bg[theme].primary : undefined,
                  }}
                  align="center"
                  justify="center"
                  borderWidth={status === 'current' ? 2 : 1}
                  shadowOffset={status === 'current' ? { width: 0, height: 2 } : undefined}
                  shadowOpacity={status === 'current' ? 0.2 : undefined}
                  shadowRadius={status === 'current' ? 4 : undefined}
                >
                  <Text
                    style={{
                      color:
                        status === 'current'
                          ? colors.text[theme].primary
                          : colors.text[theme].secondary,
                    }}
                  >
                    {stepNumber}
                  </Text>
                </Stack>
              )}

              {/* Step Label */}
              <Text
                style={{
                  color:
                    status === 'current'
                      ? colors.text[theme].info
                      : status === 'completed'
                        ? colors.text[theme].secondary
                        : colors.text[theme].tertiary,
                }}
                textAlign="center"
                maxWidth={100}
                ellipsizeMode="tail"
              >
                {step.label}
              </Text>
            </Stack>

            {/* Connector Line */}
            {!isLast && (
              <Stack
                flex={1}
                height={2}
                style={{
                  backgroundColor: isLineCompleted
                    ? colors.bg[theme].primary
                    : colors.bg[theme].muted,
                }}
                marginHorizontal={8}
                minWidth={20}
              />
            )}
          </Row>
        )
      })}
    </Row>
  )
}
