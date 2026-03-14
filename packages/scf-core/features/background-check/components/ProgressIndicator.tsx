import { memo } from 'react'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

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
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  const currentIndex = steps.indexOf(currentStep)

  return (
    <Row gap={12} align="center">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isActive = index === currentIndex
        const variant = isActive ? colors.primary[500] : isCompleted ? colors.success[500] : colors.bg[t].muted

        return (
          <Stack key={step} align="center" gap={4}>
            <Stack
              width={36}
              height={36}
              backgroundColor={variant}
              borderWidth={2}
              borderColor={isActive ? colors.text[t].primary : colors.border[t].default}
              borderRadius={18}
              align="center"
              justify="center"
            >
              <Text style={{ color: colors.text[t].secondary }}>{index + 1}</Text>
            </Stack>
            <Text style={{ color: isActive ? colors.text[t].primary : colors.primary[500] }}>{STEP_LABELS[step]}</Text>
          </Stack>
        )
      })}
    </Row>
  )
})
