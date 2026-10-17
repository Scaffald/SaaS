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

  // Every line and ring here is drawn in a border or icon token, never a
  // background one (#1184). The connectors were bg.default / bg.muted: page
  // colour on the page, so the pending line was a faint smear in light and
  // near-black on near-black in dark, and a completed one was invisible. A
  // pending step is an outlined disc, not a grey fill, so it reads as
  // upcoming rather than disabled. icon.muted is >=3:1 on the ground in both
  // themes; border.active is the teal of an active/selected state.
  const pendingLine = colors.icon[theme].muted
  const doneLine = colors.border[theme].active

  return (
    <Row
      gap={8}
      align="center"
      wrap
      paddingVertical={8}
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

        // The line after a step is drawn as done once that step is.
        const isLineCompleted = status === 'completed'

        return (
          <Row key={step.id} gap={8} align="center" flex={1} minWidth={0}>
            {/* Step Circle */}
            <Stack gap={8} align="center" flexShrink={0}>
              <Stack
                width={32}
                height={32}
                borderRadius={16}
                style={{
                  backgroundColor: 'transparent',
                  borderColor:
                    status === 'completed'
                      ? doneLine
                      : status === 'current'
                        ? colors.text[theme].emphasis
                        : pendingLine,
                  borderWidth: status === 'upcoming' ? 1 : 2,
                }}
                align="center"
                justify="center"
              >
                {status === 'completed' ? (
                  <CheckCircle2 size={20} color={colors.text[theme].emphasis} />
                ) : (
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
                )}
              </Stack>

              {/* Step Label */}
              <Text
                style={{
                  color:
                    status === 'current'
                      ? colors.text[theme].emphasis
                      : status === 'completed'
                        ? colors.text[theme].secondary
                        : colors.text[theme].tertiary,
                  maxWidth: 100,
                }}
                align="center"
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
                style={{ backgroundColor: isLineCompleted ? doneLine : pendingLine }}
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
