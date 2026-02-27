import { Check } from 'lucide-react-native'
import { Text, Row, Stack } from '@scaffald/ui'

interface ReviewProgressProps {
  currentStep: number
  totalSteps: number
}

export function ReviewProgress({ currentStep, totalSteps }: ReviewProgressProps) {
  return (
    <Stack gap={12}>
      {/* Step Counter */}
      <Row justify="center">
        <Text style={{ color: '#414e62' }}>
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
              <Stack
                width={32}
                height={32}
                borderRadius={16}
                backgroundColor={isCompleted ? '#16a34a' : isCurrent ? '#2563eb' : '#6b7280'}
                align="center"
                justify="center"
              >
                {isCompleted ? (
                  <Check size={16} color="white" />
                ) : (
                  <Text style={{ color: isCurrent ? 'white' : '#414e62' }}>{stepNumber}</Text>
                )}
              </Stack>
              {index < totalSteps - 1 && (
                <Row width={24} height={2} backgroundColor={isCompleted ? '#16a34a' : '#6b7280'} />
              )}
            </Row>
          )
        })}
      </Row>

      {/* Progress Bar */}
      <Stack width="100%" height={6} backgroundColor="#e5e7eb" borderRadius={8} style={{ overflow: 'hidden' }}>
        <Row
          width={`${(currentStep / totalSteps) * 100}%`}
          height="100%"
          backgroundColor="#2563eb"
        />
      </Stack>
    </Stack>
  )
}
