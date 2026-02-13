import { Check } from 'lucide-react-native'
import { Circle, Text, Row, Stack } from '@scaffald/ui'

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
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order)

  if (orientation === 'vertical') {
    return (
      <Stack gap={20} width="100%">
        {completionScore !== undefined && (
          <Stack gap={8}>
            <Text color="$gray11">Progress</Text>
            <Stack gap={4}>
              <Row
                height={8}
                backgroundColor="$color5"
                borderRadius="$10"
                overflow="hidden"
                width="100%"
              >
                <Row
                  height="100%"
                  backgroundColor="$blue9"
                  width={`${completionScore}%`}
                  animation="quick"
                />
              </Row>
              <Text color="$blue10" style={{ textAlign: 'right' }}>
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
              ? '$blue10'
              : isCompleted || isPast
                ? '$green10'
                : '$color10'

            return (
              <Row key={step.id} gap={12} align="flex-start">
                <Stack align="center" gap={4} style={{ minWidth: 32 }}>
                  <Circle
                    size={32}
                    backgroundColor={isCompleted ? '$green9' : isCurrent ? '$blue9' : '$color6'}
                    borderWidth={2}
                    borderColor={isCurrent ? '$blue11' : 'transparent'}
                    align="center"
                    justify="center"
                  >
                    {isCompleted ? (
                      <Check size={18} color="white" />
                    ) : (
                      <Text color={isCurrent ? 'white' : '$color11'}>{index + 1}</Text>
                    )}
                  </Circle>
                  {!isLast && (
                    <Stack
                      backgroundColor={isCompleted || isPast ? '$blue8' : '$color6'}
                      opacity={isCompleted || isPast ? 0.85 : 0.4}
                      style={{ width: 2, flexGrow: 1, minHeight: 24 }}
                    />
                  )}
                </Stack>

                <Stack gap={4} flex={1}>
                  <Text color={isCurrent ? '$color12' : '$color11'}>{step.label}</Text>
                  <Text color={statusColor}>{statusLabel}</Text>
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
            <Text color="$gray11">Progress</Text>
            <Text color="$blue10">{completionScore}%</Text>
          </Row>
          <Row
            height={8}
            backgroundColor="$color5"
            borderRadius="$10"
            overflow="hidden"
            width="100%"
          >
            <Row
              height="100%"
              backgroundColor="$blue9"
              width={`${completionScore}%`}
              animation="quick"
            />
          </Row>
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
              opacity={isPast || isCurrent || isCompleted ? 1 : 0.5}
            >
              <Circle
                size={32}
                backgroundColor={isCompleted ? '$green9' : isCurrent ? '$blue9' : '$color6'}
                borderWidth={2}
                borderColor={isCurrent ? '$blue11' : 'transparent'}
                align="center"
                justify="center"
              >
                {isCompleted ? (
                  <Check size="md" color="white" />
                ) : (
                  <Text color={isCurrent ? 'white' : '$color11'}>{index + 1}</Text>
                )}
              </Circle>
              <Text color={isCurrent ? '$color12' : '$color11'}>{step.label}</Text>
            </Row>
          )
        })}
      </Row>
    </Stack>
  )
}
