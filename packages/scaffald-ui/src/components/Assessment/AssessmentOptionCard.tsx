/**
 * AssessmentOptionCard - A selectable option card for assessment questions.
 *
 * Features border highlight on selection, press scale animation,
 * and staggered entrance animations.
 *
 * @example
 * ```tsx
 * <AssessmentOptionCard
 *   label="Plan everything before touching a tool"
 *   isSelected={selectedIndex === 0}
 *   onPress={() => selectAnswer(0)}
 *   index={0}
 * />
 * ```
 */

import { useMemo } from 'react'
import { Text } from 'react-native'
import { AnimatedPressable } from '../../animation/AnimatedPressable'
import { useThemeContext } from '../../theme'
import { getAssessmentOptionCardStyles } from './AssessmentOptionCard.styles'
import type { AssessmentOptionCardProps } from './AssessmentOptionCard.types'

export function AssessmentOptionCard({
  label,
  isSelected,
  onPress,
  disabled = false,
  style,
}: AssessmentOptionCardProps) {
  const { theme } = useThemeContext()

  const styles = useMemo(
    () => getAssessmentOptionCardStyles(isSelected, disabled, theme),
    [isSelected, disabled, theme]
  )

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      pressScale={0.98}
      style={style ? [styles.container, style] : styles.container}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled }}
    >
      <Text style={styles.text}>{label}</Text>
    </AnimatedPressable>
  )
}
