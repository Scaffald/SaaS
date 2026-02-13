import { Check } from 'lucide-react-native'
import { Circle, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface ReviewProgressProps {
  currentStep: number
  totalSteps: number
}

export function ReviewProgress({ currentStep, totalSteps }: ReviewProgressProps) {
  return (
    <Stack gap={12}>
      {/* Step Counter */}
      <Row justify="center">
        <Text color="gray">
          Step {currentStep} of {totalSteps}
        </Text>
      </Row>

      {/* Progress Dots */}
      <Row gap={8} justify="center" align="center">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <Row key={stepNumber} align="center" gap={8}>
              <Circle
                size={32}
                backgroundColor={isCompleted ? '$green10' : isCurrent ? '$blue10' : '$color5'}
                align="center"
                justify="center"
              >
                {isCompleted ? (
                  <Check size={16} color="white" />
                ) : (
                  <Text color={isCurrent ? 'white' : '$color11'}>
                    {stepNumber}
                  </Text>
                )}
              </Circle>
              {index < totalSteps - 1 && (
                <Row
                  width={24}
                  height={2}
                  backgroundColor={isCompleted ? '$green10' : '$color5'}
                />
              )}
            </Row>
          )
        })}
      </Row>

      {/* Progress Bar */}
      <Stack width="100%" height={6} backgroundColor="$color3" borderRadius={8} overflow="hidden">
        <Row
          width={`${(currentStep / totalSteps) * 100}%`}
          height="100%"
          backgroundColor="$blue10"
        />
      </Stack>
    </Stack>
  )
}
