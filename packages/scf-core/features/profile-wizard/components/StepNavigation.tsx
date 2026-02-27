import type { ReactNode } from 'react'
import { Button, Text, Row, Stack } from '@scaffald/ui'

export interface StepNavigationProps {
  canGoBack: boolean
  canGoNext: boolean
  isLastStep: boolean
  isSaving: boolean
  onBack: () => void
  onNext: () => void
  onSkip?: () => void
  onSaveForLater?: () => void
  nextLabel?: string
  backLabel?: string
  skipLabel?: string
  saveLabel?: string
  footerSlot?: ReactNode
}

export function StepNavigation({
  canGoBack,
  canGoNext,
  isLastStep,
  isSaving,
  onBack,
  onNext,
  onSkip,
  onSaveForLater,
  nextLabel = 'Next',
  backLabel = 'Back',
  skipLabel = 'Skip This Step',
  saveLabel = 'Save & Continue Later',
  footerSlot,
}: StepNavigationProps) {
  return (
    <Stack gap={12}>
      <Row gap={12} wrap>
        <Button size="md" style={{ flex: 1 }} onPress={onNext} disabled={!canGoNext || isSaving} variant="filled" color="primary">
          {isLastStep ? 'Finish' : nextLabel}
        </Button>
        <Button
          size="md"
          style={{ flex: 1 }}
          onPress={onBack}
          disabled={!canGoBack || isSaving}
          variant="outline"
        >
          {backLabel}
        </Button>
      </Row>

      <Row justify="space-between" wrap gap={8}>
        {onSkip && (
          <Button size="sm" variant="text" onPress={onSkip} disabled={isSaving}>
            {skipLabel}
          </Button>
        )}

        {onSaveForLater && (
          <Button size="sm" variant="text" onPress={onSaveForLater} disabled={isSaving}>
            {saveLabel}
          </Button>
        )}
      </Row>

      {isSaving && (
        <Text style={{ color: '#414e62' }} aria-live="polite">
          Saving your progress...
        </Text>
      )}

      {footerSlot}
    </Stack>
  )
}
