/**
 * Stepper component
 * Horizontal stepper showing progress through multiple steps
 *
 * @example
 * ```tsx
 * import { Stepper } from '@scaffald/ui'
 *
 * <Stepper
 *   steps={[
 *     { label: 'Step 1' },
 *     { label: 'Step 2', description: 'Optional description' },
 *     { label: 'Step 3' },
 *   ]}
 *   currentStep={1}
 *   showDescription
 * />
 * ```
 */

import { View, StyleSheet } from 'react-native'
import { spacing } from '../../tokens/spacing'
import type { StepperProps, StepStatus } from './Stepper.types'
import { Step } from './Step'
import { ArrowRightIcon } from './StepperIcons'
import { colors } from '../../tokens/colors'
import { useThemeContext } from '../../theme'

export function Stepper({
  steps,
  currentStep,
  color = 'primary',
  showDescription = false,
  interactive = false,
  onStepPress,
  style,
  stepStyle,
}: StepperProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  const getStepStatus = (index: number): StepStatus => {
    if (index < currentStep) {
      return 'completed'
    }
    if (index === currentStep) {
      return 'current'
    }
    return 'next'
  }

  const handleStepPress = (index: number) => {
    if (interactive && !steps[index]?.disabled) {
      // Call step-specific onPress if provided, otherwise call global onStepPress
      steps[index]?.onPress?.() || onStepPress?.(index)
    }
  }

  const arrowColor = isLight ? colors.text.light.tertiary : colors.text.dark.tertiary

  return (
    <View style={[styles.container, style]}>
      {steps.map((step, index) => {
        const status = getStepStatus(index)
        const isLast = index === steps.length - 1

        return (
          <View key={step.id ?? index} style={styles.stepWrapper}>
            <Step
              status={status}
              stepNumber={index + 1}
              label={step.label}
              description={step.description}
              color={color}
              showDescription={showDescription}
              interactive={interactive}
              onPress={() => handleStepPress(index)}
              disabled={step.disabled}
              style={stepStyle}
            />

            {!isLast && (
              <View style={styles.separator}>
                <ArrowRightIcon size={20} color={arrowColor} />
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 0,
    rowGap: spacing[12], // Vertical spacing when wrapping
  },
  stepWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    flexShrink: 0, // Prevent steps from shrinking
  },
  separator: {
    marginHorizontal: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Prevent separators from shrinking
  },
})

