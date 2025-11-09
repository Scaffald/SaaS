import { Button, XStack, YStack, Text } from 'tamagui'
import type { ReactNode } from 'react'

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
    <YStack gap="$3">
      <XStack gap="$3" flexWrap="wrap">
        <Button
          size="$4"
          flex={1}
          onPress={onNext}
          disabled={!canGoNext || isSaving}
          themeInverse
        >
          {isLastStep ? 'Finish' : nextLabel}
        </Button>
        <Button size="$4" flex={1} onPress={onBack} disabled={!canGoBack || isSaving} variant="outlined">
          {backLabel}
        </Button>
      </XStack>

      <XStack justify="space-between" flexWrap="wrap" gap="$2">
        {onSkip && (
          <Button size="$3" variant="outlined" chromeless onPress={onSkip} disabled={isSaving}>
            {skipLabel}
          </Button>
        )}

        {onSaveForLater && (
          <Button size="$3" chromeless onPress={onSaveForLater} disabled={isSaving}>
            {saveLabel}
          </Button>
        )}
      </XStack>

      {isSaving && (
        <Text fontSize="$2" color="$color10">
          Saving your progress...
        </Text>
      )}

      {footerSlot}
    </YStack>
  )
}


