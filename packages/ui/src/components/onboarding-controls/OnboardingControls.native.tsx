import { ChevronRight } from '@tamagui/lucide-icons'
import { Theme } from '@tamagui/core'
import { XStack } from '@tamagui/stacks'

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
      <XStack style={{ justifyContent: 'space-between', alignItems: 'center' }} p="$5" gap="$5">
        <Button
          chromeless
          pressStyle={{
            background: '$color4',
          }}
          style={{ borderRadius: 40 }}
          onPress={() => handleSkip()}
        >
          <Button.Text color="$color10" fontWeight="700">
            Skip
          </Button.Text>
        </Button>

        <Button
          flex={1}
          style={{ borderRadius: 40 }}
          borderWidth={0}
          background="$color8"
          pressStyle={{
            background: '$color9',
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
