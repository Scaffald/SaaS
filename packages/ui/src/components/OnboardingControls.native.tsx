import { ChevronRight } from '@tamagui/lucide-icons'
import { Button, Theme, XStack } from 'tamagui'

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
      <XStack justify="space-between" items="center" p="$5" gap="$5">
        <Button
          chromeless
          pressStyle={{
            bg: '$color4',
          }}
          rounded="$10"
          onPress={() => handleSkip()}
        >
          <Button.Text color="$color10" fontWeight="700">
            Skip
          </Button.Text>
        </Button>

        <Button
          flex={1}
          rounded="$10"
          borderWidth={0}
          bg="$color8"
          pressStyle={{
            bg: '$color9',
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
