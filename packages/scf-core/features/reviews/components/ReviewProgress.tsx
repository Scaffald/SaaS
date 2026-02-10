import { Check } from '@tamagui/lucide-icons'
import { Circle, Text, Row, Stack } from '@unicornlove/beyond-ui'

interface ReviewProgressProps {
  currentStep: number
  totalSteps: number
}

export function ReviewProgress({ currentStep, totalSteps }: ReviewProgressProps) {
  return (
    <Stack gap="$3">
      {/* Step Counter */}
      <Row justifyContent="center">
        <Text fontSize="$5" fontWeight="600" color="$color11">
          Step {currentStep} of {totalSteps}
        </Text>
      </Row>

      {/* Progress Dots */}
      <Row gap="$2" justifyContent="center" alignItems="center">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <Row key={stepNumber} alignItems="center" gap="$2">
              <Circle
                size={32}
                backgroundColor={isCompleted ? '$green10' : isCurrent ? '$blue10' : '$color5'}
                alignItems="center"
                justifyContent="center"
              >
                {isCompleted ? (
                  <Check size={16} color="white" />
                ) : (
                  <Text fontSize="$3" fontWeight="700" color={isCurrent ? 'white' : '$color11'}>
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
      <Stack width="100%" height={6} backgroundColor="$color3" borderRadius="$2" overflow="hidden">
        <Row
          width={`${(currentStep / totalSteps) * 100}%`}
          height="100%"
          backgroundColor="$blue10"
        />
      </Stack>
    </Stack>
  )
}
