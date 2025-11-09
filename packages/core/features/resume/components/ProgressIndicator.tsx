import { Button, Circle, Text, XStack, YStack } from 'tamagui'

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
    <XStack flexWrap="wrap" gap="$3">
      {steps.map((step, index) => {
        const isActive = index === currentIndex
        const isCompleted = completedSteps.includes(index) || index < currentIndex

        return (
          <Button
            key={step.id}
            size="$3"
            variant={isActive ? 'solid' : 'outlined'}
            theme={isActive ? 'blue' : isCompleted ? 'green' : 'gray'}
            onPress={() => onStepChange?.(index)}
            aria-pressed={isActive}
          >
            <XStack gap="$2" items="center">
              <Circle size={18} bg={isCompleted ? '$green9' : isActive ? '$blue9' : '$gray7'}>
                <Text color="$color1" fontSize="$1" fontWeight="700">
                  {index + 1}
                </Text>
              </Circle>
              <YStack>
                <Text fontSize="$2" fontWeight="600">
                  {step.label}
                </Text>
                <Text fontSize="$1" color="$color11">
                  {isCompleted ? 'Completed' : isActive ? 'In Progress' : 'Pending'}
                </Text>
              </YStack>
            </XStack>
          </Button>
        )
      })}
    </XStack>
  )
}

