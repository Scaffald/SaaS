import { Circle, Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'
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
  const { theme } = useThemeContext()
  const steps: AssessmentStep[] = ['luscher1', 'ipip', 'luscher2', 'acute']

  const getStepStatus = (stepId: AssessmentStep): 'completed' | 'current' | 'upcoming' => {
    const currentOrder = STEP_INFO[currentStep].order
    const stepOrder = STEP_INFO[stepId].order

    if (stepOrder < currentOrder) return 'completed'
    if (stepId === currentStep) return 'current'
    return 'upcoming'
  }

  return (
    <Stack gap={12} width="100%">
      {/* Completion Percentage */}
      <Stack gap={4}>
        <Row justify="space-between" align="center">
          <Text style={{ color: colors.text[theme].secondary }}>Progress</Text>
          <Text style={{ color: theme === "light" ? colors.blue[700] : colors.blue[300] }}>{completionScore}%</Text>
        </Row>
        <Stack
          style={{
            height: 8,
            backgroundColor: colors.bg[theme].inactive,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <Stack
            style={{
              height: '100%',
              backgroundColor: colors.bg[theme].primary,
              width: `${completionScore}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </Stack>
      </Stack>

      {/* Step Indicators */}
      <Row gap={8} align="center" wrap>
        {steps.map((step, index) => {
          const status = getStepStatus(step)
          const isLast = index === steps.length - 1
          const stepInfo = STEP_INFO[step]

          return (
            <Row key={step} gap={8} align="center">
              {/* Step Circle */}
              <Stack gap={4} align="center">
                <Circle
                  size={40}
                  style={{
                    backgroundColor:
                      status === 'completed'
                        ? theme === "light" ? colors.green[50] : colors.green[900]
                        : status === 'current'
                          ? colors.bg[theme].primary
                          : colors.bg[theme].inactive,
                    borderWidth: 2,
                    borderColor:
                      status === 'completed'
                        ? theme === "light" ? colors.green[300] : colors.green[700]
                        : status === 'current'
                          ? theme === "light" ? colors.blue[300] : colors.blue[700]
                          : colors.border[theme].subtle,
                  }}
                  justify="center"
                  align="center"
                >
                  {status === 'completed' ? (
                    <Text style={{ color: colors.text[theme].secondary }}>✓</Text>
                  ) : (
                    <Text
                      style={{
                        color:
                          status === 'current'
                            ? colors.text[theme].primary
                            : colors.text[theme].tertiary,
                      }}
                    >
                      {index + 1}
                    </Text>
                  )}
                </Circle>

                {/* Step Label */}
                <Text
                  style={{
                    color:
                      status === 'completed' || status === 'current'
                        ? colors.text[theme].primary
                        : colors.text[theme].tertiary,
                    textAlign: 'center',
                    maxWidth: 80,
                  }}
                >
                  {stepInfo.label}
                </Text>
              </Stack>

              {/* Connector Line */}
              {!isLast && (
                <Stack
                  style={{
                    width: 40,
                    height: 2,
                    backgroundColor:
                      status === 'completed' ? theme === "light" ? colors.green[50] : colors.green[900] : colors.bg[theme].inactive,
                    marginBottom: 24,
                  }}
                />
              )}
            </Row>
          )
        })}
      </Row>
    </Stack>
  )
}
