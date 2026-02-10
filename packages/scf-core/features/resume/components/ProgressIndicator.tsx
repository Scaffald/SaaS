import { Button, Circle, Text, Row, Stack } from '@unicornlove/beyond-ui'

import type { ResumeWizardStep } from '../hooks/useResumeWizard'

interface ProgressIndicatorProps {
  steps: ResumeWizardStep[]
  currentIndex: number
  completedSteps: number[]
  onStepChange?: (index: number) => void
}

export function ProgressIndicator({
  steps,
  currentIndex,
  completedSteps,
  onStepChange,
}: ProgressIndicatorProps) {
  return (
    <Row flexWrap="wrap" gap="$3">
      {steps.map((step, index) => {
        const isActive = index === currentIndex
        const isCompleted = completedSteps.includes(index) || index < currentIndex

        return (
          <Button
            key={step.id}
            size="$3"
            variant="outlined"
            theme={isActive ? 'blue' : undefined}
            onPress={() => onStepChange?.(index)}
            aria-pressed={isActive}
          >
            <Row gap="$2" alignItems="center">
              <Circle
                size={18}
                backgroundColor={isCompleted ? '$green4' : isActive ? '$blue4' : '$color4'}
              >
                <Text color="$color12" fontSize="$1" fontWeight="700">
                  {index + 1}
                </Text>
              </Circle>
              <Stack>
                <Text fontSize="$2" fontWeight="600">
                  {step.label}
                </Text>
                <Text fontSize="$1" color="$color11">
                  {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                </Text>
              </Stack>
            </Row>
          </Button>
        )
      })}
    </Row>
  )
}
