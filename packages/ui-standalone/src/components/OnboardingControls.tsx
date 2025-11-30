import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { Button, XStack } from 'tamagui'

export type OnboardingControlsProps = {
  currentIdx: number
  onChange: (newIdx: number) => void
  stepsCount: number
  /**
   * optional callback when the onboarding flow finishes
   */
  onFinish?: () => void
}

export const OnboardingControls = ({
  currentIdx,
  onChange,
  stepsCount,
  onFinish,
}: OnboardingControlsProps) => {
  const isLastStep = currentIdx === stepsCount - 1

  const handleGoNext = () => {
    if (isLastStep) {
      onFinish?.()
      return
    }
    onChange(currentIdx + 1)
  }

  const handleGoPrev = () => {
    if (currentIdx - 1 < 0) {
      // onChange(stepsCount - 1)
      return
    }
    onChange(currentIdx - 1)
  }

  const handleSkip = () => {
    onFinish?.()
  }

  return (
    <>
      <XStack
        justify="space-between"
        items="center"
        p="$5"
        gap="$5"
        position="absolute"
        b={0}
        l={0}
        r={0}
        display="flex"
        $sm={{ display: 'none', position: 'relative' }}
      >
        <Button
          chromeless
          flex={1}
          rounded="$10"
          circular
          onPress={() => handleGoPrev()}
          iconAfter={ChevronLeft}
        />

        <Button
          chromeless
          flex={1}
          rounded="$10"
          circular
          onPress={() => handleGoNext()}
          iconAfter={ChevronRight}
        />
      </XStack>
      <XStack
        justify="space-between"
        items="center"
        p="$5"
        gap="$5"
        display="none"
        $sm={{ display: 'flex' }}
      >
        <Button
          chromeless
          pressStyle={{
            bg: '$color6',
          }}
          rounded="$10"
          onPress={() => handleSkip()}
        >
          <Button.Text color="$blue8">Skip</Button.Text>
        </Button>

        <Button
          chromeless={!isLastStep}
          bordered={!isLastStep}
          borderColor={isLastStep ? 'transparent' : '$color'}
          bg={isLastStep ? '$blue7' : 'transparent'}
          pressStyle={{
            bg: isLastStep ? '$blue8' : '$color6',
            borderColor: isLastStep ? 'transparent' : '$color6',
          }}
          flex={1}
          rounded="$10"
          onPress={() => handleGoNext()}
          iconAfter={ChevronRight}
        >
          <Button.Text color={isLastStep ? '$color1' : '$color'}>
            {isLastStep ? 'Get Started' : 'Continue'}
          </Button.Text>
        </Button>
      </XStack>
    </>
  )
}
