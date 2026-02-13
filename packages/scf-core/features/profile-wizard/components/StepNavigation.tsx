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
      <Row gap={12} flexWrap="wrap">
        <Button size="md" flex={1} onPress={onNext} disabled={!canGoNext || isSaving} themeInverse>
          {isLastStep ? 'Finish' : nextLabel}
        </Button>
        <Button
          size="md"
          flex={1}
          onPress={onBack}
          disabled={!canGoBack || isSaving}
          variant="outline"
        >
          {backLabel}
        </Button>
      </Row>

      <Row justify="space-between" flexWrap="wrap" gap={8}>
        {onSkip && (
          <Button size="sm" variant="outline" chromeless onPress={onSkip} disabled={isSaving}>
            {skipLabel}
          </Button>
        )}

        {onSaveForLater && (
          <Button size="sm" chromeless onPress={onSaveForLater} disabled={isSaving}>
            {saveLabel}
          </Button>
        )}
      </Row>

      {isSaving && (
        <Text color="$gray11" aria-live="polite">
          Saving your progress...
        </Text>
      )}

      {footerSlot}
    </Stack>
  )
}
