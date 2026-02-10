import { Circle, Text, Row, Stack } from '@unicornlove/beyond-ui'
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
    <Stack gap="$3" width="100%">
      {/* Completion Percentage */}
      <Stack gap="$1">
        <Row justifyContent="space-between" alignItems="center">
          <Text fontSize="$4" fontWeight="600" color="$color12">
            Progress
          </Text>
          <Text fontSize="$5" fontWeight="bold" color="$blue10">
            {completionScore}%
          </Text>
        </Row>
        <Stack height={8} backgroundColor="$color5" borderRadius="$10" overflow="hidden">
          <Stack
            height="100%"
            backgroundColor="$blue9"
            width={`${completionScore}%`}
            transition="width 0.3s ease"
          />
        </Stack>
      </Stack>

      {/* Step Indicators */}
      <Row gap="$2" alignItems="center" flexWrap="wrap">
        {steps.map((step, index) => {
          const status = getStepStatus(step)
          const isLast = index === steps.length - 1
          const stepInfo = STEP_INFO[step]

          return (
            <Row key={step} gap="$2" alignItems="center">
              {/* Step Circle */}
              <Stack gap="$1" alignItems="center">
                <Circle
                  size={40}
                  backgroundColor={
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
                  justifyContent="center"
                  alignItems="center"
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
                  textAlign="center"
                  maxWidth={80}
                >
                  {stepInfo.label}
                </Text>
              </Stack>

              {/* Connector Line */}
              {!isLast && (
                <Stack
                  width={40}
                  height={2}
                  backgroundColor={status === 'completed' ? '$green9' : '$color5'}
                  marginBottom={24}
                />
              )}
            </Row>
          )
        })}
      </Row>
    </Stack>
  )
}
