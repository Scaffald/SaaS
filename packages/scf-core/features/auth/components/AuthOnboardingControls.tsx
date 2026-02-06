import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { Row, Button, Stack } from '@unicornlove/beyond-ui'

export type AuthOnboardingControlsProps = {
  currentIdx: number
  onChange: (newIdx: number) => void
  stepsCount: number
  onFinish?: () => void
  skipLabel?: string
  continueLabel?: string
  getStartedLabel?: string
}

export function AuthOnboardingControls({
  currentIdx,
  onChange,
  stepsCount,
  onFinish,
  skipLabel = 'Skip',
  continueLabel = 'Continue',
  getStartedLabel = 'Get Started',
}: AuthOnboardingControlsProps) {
  const isLastStep = currentIdx === stepsCount - 1

  const handleGoNext = () => {
    if (isLastStep) {
      onFinish?.()
      return
    }
    onChange(currentIdx + 1)
  }

  const handleGoPrev = () => {
    if (currentIdx > 0) {
      onChange(currentIdx - 1)
    }
  }

  return (
    <Stack padding={20} gap={16}>
      <Row justify="space-between" align="center">
        <Button variant="text" onPress={handleGoPrev} iconStart={ChevronLeft} />
        <Button variant="text" onPress={handleGoNext} iconEnd={ChevronRight} />
      </Row>
      <Row justify="space-between" align="center" gap={16}>
        <Button variant="text" onPress={() => onFinish?.()}>
          {skipLabel}
        </Button>
        <Button
          color="primary"
          variant={isLastStep ? 'filled' : 'outline'}
          onPress={handleGoNext}
          style={{ flex: 1 }}
          iconEnd={ChevronRight}
        >
          {isLastStep ? getStartedLabel : continueLabel}
        </Button>
      </Row>
    </Stack>
  )
}
