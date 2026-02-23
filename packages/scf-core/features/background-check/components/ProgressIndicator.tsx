import { memo } from 'react'
import { Text, Row, Stack } from '@scaffald/ui'

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
            <Stack
              width={36}
              height={36}
              backgroundColor={variant}
              borderWidth={2}
              borderColor={isActive ? '$color12' : '$color7'}
              borderRadius={18}
              align="center"
              justify="center"
            >
              <Text color="$gray11">{index + 1}</Text>
            </Stack>
            <Text color={isActive ? '$color12' : '$color10'}>{STEP_LABELS[step]}</Text>
          </Stack>
        )
      })}
    </Row>
  )
})
