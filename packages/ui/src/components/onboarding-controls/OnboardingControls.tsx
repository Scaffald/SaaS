import { ChevronLeft, ChevronRight } from '@tamagui/lucide-icons'
import { XStack } from 'tamagui'
import { Button } from '../buttons/Button'

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
        justifyContent="space-between"
        alignItems="center"
        padding="$5"
        gap="$5"
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        display="flex"
        $sm={{ display: 'none', position: 'relative' }}
      >
        <Button
          chromeless
          flex={1}
          borderRadius="$10"
          circular
          onPress={() => handleGoPrev()}
          iconAfter={ChevronLeft}
        />

        <Button
          chromeless
          flex={1}
          borderRadius="$10"
          circular
          onPress={() => handleGoNext()}
          iconAfter={ChevronRight}
        />
      </XStack>
      <XStack
        justifyContent="space-between"
        alignItems="center"
        padding="$5"
        gap="$5"
        display="none"
        $sm={{ display: 'flex' }}
      >
        <Button
          chromeless
          pressStyle={{
            backgroundColor: '$color6',
          }}
          borderRadius="$10"
          onPress={() => handleSkip()}
        >
          <Button.Text color="$blue8">Skip</Button.Text>
        </Button>

        <Button
          chromeless={!isLastStep}
          bordered={!isLastStep}
          borderColor={isLastStep ? 'transparent' : '$color'}
          backgroundColor={isLastStep ? '$blue7' : 'transparent'}
          pressStyle={{
            backgroundColor: isLastStep ? '$blue8' : '$color6',
            borderColor: isLastStep ? 'transparent' : '$color6',
          }}
          flex={1}
          borderRadius="$10"
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
