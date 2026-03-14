import { Check } from 'lucide-react-native'
import { Text, Row, Stack, AssessmentProgressBar, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  orientation?: 'horizontal' | 'vertical'
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
  orientation = 'horizontal',
}: AssessmentProgressProps) {
  const { theme } = useThemeContext()
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order)

  const completedBg = colors.success[500]
  const currentBg = colors.primary[500]
  const inactiveBg = colors.bg[theme].subtle
  const currentBorder = colors.primary[700]
  const connectorActive = colors.primary[200]
  const inactiveText = colors.text[theme].tertiary

  if (orientation === 'vertical') {
    return (
      <Stack gap={20} width="100%">
        {completionScore !== undefined && (
          <Stack gap={8}>
            <Text style={{ color: colors.text[theme].secondary }}>Progress</Text>
            <Stack gap={4}>
              <AssessmentProgressBar value={completionScore} height={8} />
              <Text style={{ color: colors.primary[500], textAlign: 'right' }}>
                {completionScore}%
              </Text>
            </Stack>
          </Stack>
        )}

        <Stack gap={16}>
          {sortedSteps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id)
            const isCurrent = step.id === currentStep
            const isLast = index === sortedSteps.length - 1
            const currentStepIndex = sortedSteps.findIndex((s) => s.id === currentStep)
            const isPast = currentStepIndex > index

            const statusLabel = isCurrent
              ? 'In progress'
              : isCompleted || isPast
                ? 'Completed'
                : 'Pending'
            const statusColor = isCurrent
              ? colors.primary[500]
              : isCompleted || isPast
                ? colors.success[500]
                : colors.text[theme].tertiary

            return (
              <Row key={step.id} gap={12} align="flex-start">
                <Stack align="center" gap={4} style={{ minWidth: 32 }}>
                  <Stack
                    width={32}
                    height={32}
                    borderRadius={16}
                    align="center"
                    justify="center"
                    style={{
                      backgroundColor: isCompleted ? completedBg : isCurrent ? currentBg : inactiveBg,
                      borderWidth: 2,
                      borderColor: isCurrent ? currentBorder : 'transparent',
                    }}
                  >
                    {isCompleted ? (
                      <Check size={18} color="white" />
                    ) : (
                      <Text color={isCurrent ? 'white' : inactiveText}>{index + 1}</Text>
                    )}
                  </Stack>
                  {!isLast && (
                    <Stack
                      style={{
                        width: 2,
                        flexGrow: 1,
                        minHeight: 24,
                        backgroundColor: isCompleted || isPast ? connectorActive : inactiveBg,
                        opacity: isCompleted || isPast ? 0.85 : 0.4,
                      }}
                    />
                  )}
                </Stack>

                <Stack gap={4} flex={1}>
                  <Text style={{ color: isCurrent ? colors.text[theme].primary : colors.text[theme].secondary }}>{step.label}</Text>
                  <Text style={{ color: statusColor }}>{statusLabel}</Text>
                </Stack>
              </Row>
            )
          })}
        </Stack>
      </Stack>
    )
  }

  return (
    <Stack gap={12} width="100%">
      {/* Progress Bar */}
      {completionScore !== undefined && (
        <Stack gap={8}>
          <Row justify="space-between" align="center">
            <Text style={{ color: colors.text[theme].secondary }}>Progress</Text>
            <Text style={{ color: colors.primary[500] }}>{completionScore}%</Text>
          </Row>
          <AssessmentProgressBar value={completionScore} height={8} />
        </Stack>
      )}

      {/* Step Indicators */}
      <Row gap={8} wrap justify="center">
        {sortedSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id)
          const isCurrent = step.id === currentStep
          const currentStepIndex = sortedSteps.findIndex((s) => s.id === currentStep)
          const isPast = currentStepIndex > index

          return (
            <Row
              key={step.id}
              align="center"
              gap={8}
              style={{ opacity: isPast || isCurrent || isCompleted ? 1 : 0.5 }}
            >
              <Stack
                width={32}
                height={32}
                borderRadius={16}
                align="center"
                justify="center"
                style={{
                  backgroundColor: isCompleted ? completedBg : isCurrent ? currentBg : inactiveBg,
                  borderWidth: 2,
                  borderColor: isCurrent ? currentBorder : 'transparent',
                }}
              >
                {isCompleted ? (
                  <Check size={24} color="white" />
                ) : (
                  <Text color={isCurrent ? 'white' : inactiveText}>{index + 1}</Text>
                )}
              </Stack>
              <Text style={{ color: isCurrent ? colors.text[theme].primary : colors.text[theme].secondary }}>{step.label}</Text>
            </Row>
          )
        })}
      </Row>
    </Stack>
  )
}
