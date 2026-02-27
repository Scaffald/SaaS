/**
 * MergeProgress - Step progress indicator for merge workflow
 * Merge progress
 * Merge workflow progress
 */
import { Row, Text, Stack } from '@scaffald/ui'
import { Check } from 'lucide-react'

interface MergeProgressProps {
  currentStep: number
  totalSteps: number
  steps: string[]
}

export function MergeProgress({ currentStep, totalSteps, steps }: MergeProgressProps) {
  return (
    <Stack gap={8}>
      {/* Step indicators */}
      <Row alignItems="center" justifyContent="center" gap={4}>
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <Row key={step} alignItems="center" gap={4}>
              {/* Step circle */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted
                    ? 'var(--color-green-10)'
                    : isCurrent
                      ? 'var(--color-blue-10)'
                      : 'var(--color-gray-4)',
                  color: isCompleted || isCurrent ? 'white' : 'var(--color-text-muted)',
                  fontSize: 14,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? <Check size={16} /> : stepNumber}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  style={{
                    width: 40,
                    height: 2,
                    backgroundColor:
                      stepNumber < currentStep ? 'var(--color-green-10)' : 'var(--color-gray-4)',
                    transition: 'background-color 0.2s ease',
                  }}
                />
              )}
            </Row>
          )
        })}
      </Row>

      {/* Step labels (mobile-hidden) */}
      <Row
        justifyContent="space-between"
        style={
          {
            display: 'none',
            '@media (min-width: 640px)': {
              display: 'flex',
            },
          } as any
        }
      >
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <Text
              key={step}
              size="xs"
              style={{
                textAlign: 'center',
                flex: 1,
                color: isCompleted
                  ? 'var(--color-green-10)'
                  : isCurrent
                    ? 'var(--color-blue-10)'
                    : 'var(--color-text-muted)',
                fontWeight: isCurrent ? 600 : 400,
              }}
            >
              {step}
            </Text>
          )
        })}
      </Row>

      {/* Current step label (mobile) */}
      <Text
        size="sm"
        weight="medium"
        style={{
          textAlign: 'center',
          color: 'var(--color-blue-10)',
        }}
      >
        Step {currentStep} of {totalSteps}: {steps[currentStep - 1]}
      </Text>
    </Stack>
  )
}

export default MergeProgress
