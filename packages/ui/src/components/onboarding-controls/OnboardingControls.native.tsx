import { ChevronRight } from '@tamagui/lucide-icons'
import { Theme, XStack } from '@unicornlove/ui'
import { Button } from '../buttons/Button'

import type { OnboardingControlsProps } from './OnboardingControls'

export const OnboardingControls = ({
  currentIdx,
  onChange,
  stepsCount,
  onFinish,
}: OnboardingControlsProps) => {
  const handleGoNext = () => {
    if (currentIdx + 1 > stepsCount - 1) {
      onFinish?.()
      return
    }
    onChange(currentIdx + 1)
  }

  const handleSkip = () => {
    onFinish?.()
  }

  return (
    <Theme name="primary">
      <XStack justifyContent="space-between" alignItems="center" padding="$5" gap="$5">
        <Button
          chromeless
          pressStyle={{
            backgroundColor: '$color4',
          }}
          borderRadius="$10"
          onPress={() => handleSkip()}
        >
          <Button.Text color="$color10" fontWeight="700">
            Skip
          </Button.Text>
        </Button>

        <Button
          flex={1}
          borderRadius="$10"
          borderWidth={0}
          backgroundColor="$color8"
          pressStyle={{
            backgroundColor: '$color9',
            scale: 0.98,
          }}
          onPress={() => handleGoNext()}
          iconAfter={ChevronRight}
        >
          <Button.Text color="$color1" fontWeight="700">
            Continue
          </Button.Text>
        </Button>
      </XStack>
    </Theme>
  )
}
