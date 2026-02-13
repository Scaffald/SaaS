import { memo } from 'react'
import { Circle, Text, Row, Stack } from '@unicornlove/beyond-ui'

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
    <Row gap={12} align="center">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex
        const variant = isActive ? '$color10' : isCompleted ? '$green9' : '$color6'

        return (
          <Stack key={step} align="center" gap={4}>
            <Circle
              size={36}
              backgroundColor={variant}
              borderWidth={2}
              borderColor={isActive ? '$color12' : '$color7'}
              align="center"
              justify="center"
            >
              <Text color="gray">
                {index + 1}
              </Text>
            </Circle>
            <Text color={isActive ? '$color12' : '$color10'}>
              {STEP_LABELS[step]}
            </Text>
          </Stack>
        )
      })}
    </Row>
  )
})
