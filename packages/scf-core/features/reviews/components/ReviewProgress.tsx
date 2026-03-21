import { Check } from 'lucide-react-native'
import { Text, Row, Stack, useThemeContext } from '@scaffald/ui'
import { colors } from '@scaffald/ui/tokens'

interface ReviewProgressProps {
  currentStep: number
  totalSteps: number
}

export function ReviewProgress({ currentStep, totalSteps }: ReviewProgressProps) {
  const { theme } = useThemeContext()
  const t = theme === 'dark' ? 'dark' : 'light'
  return (
    <Stack gap={12}>
      {/* Step Counter */}
      <Row justify="center">
        <Text style={{ color: colors.text[t].secondary }}>
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
                backgroundColor={isCompleted ? colors.success[600] : isCurrent ? colors.info[600] : colors.text[t].tertiary}
                align="center"
                justify="center"
              >
                {isCompleted ? (
                  <Check size={16} color="white" />
                ) : (
                  <Text style={{ color: isCurrent ? 'white' : colors.text[t].secondary }}>{stepNumber}</Text>
                )}
              </Stack>
              {index < totalSteps - 1 && (
                <Row width={24} height={2} backgroundColor={isCompleted ? colors.success[600] : colors.text[t].tertiary} />
              )}
            </Row>
          )
        })}
      </Row>

      {/* Progress Bar */}
      <Stack width="100%" height={6} backgroundColor={colors.border[t].default} borderRadius={8} style={{ overflow: 'hidden' }}>
        <Row
          width={`${(currentStep / totalSteps) * 100}%`}
          height="100%"
          backgroundColor={colors.info[600]}
        />
      </Stack>
    </Stack>
  )
}
