import { memo } from 'react'
import { Circle, Text, XStack, YStack } from 'tamagui'

import type { BackgroundCheckWizardStep } from '../hooks/useBackgroundCheckForm'

const STEP_LABELS: Record<BackgroundCheckWizardStep, string> = {
  packages: 'Package',
  consent: 'Consent',
  documents: 'Documents',
  payment: 'Payment',
  confirmation: 'Confirmation',
}

interface ProgressIndicatorProps {
  steps: BackgroundCheckWizardStep[]
  currentStep: BackgroundCheckWizardStep
}

export const ProgressIndicator = memo(function ProgressIndicator({
  steps,
  currentStep,
}: ProgressIndicatorProps) {
  const currentIndex = steps.indexOf(currentStep)

  return (
    <XStack gap="$3" items="center">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex
        const variant = isActive ? '$color10' : isCompleted ? '$green9' : '$color6'

        return (
          <YStack key={step} items="center" gap="$1">
            <Circle
              size={36}
              bg={variant}
              borderWidth={2}
              borderColor={isActive ? '$color12' : '$color7'}
              items="center"
              justify="center"
            >
              <Text color="$color1" fontWeight="bold">
                {index + 1}
              </Text>
            </Circle>
            <Text fontSize="$2" color={isActive ? '$color12' : '$color10'}>
              {STEP_LABELS[step]}
            </Text>
          </YStack>
        )
      })}
    </XStack>
  )
})
