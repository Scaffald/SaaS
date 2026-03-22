/**
 * NumericStepper component
 * iOS 26 minus/plus segmented increment control
 *
 * @example
 * ```tsx
 * <NumericStepper value={count} onChange={setCount} min={0} max={10} />
 * ```
 */

import { useMemo, useCallback } from 'react'
import { View, Text, Pressable } from 'react-native'
import type { NumericStepperProps } from './NumericStepper.types'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'

export function NumericStepper({
  value,
  min = -Infinity,
  max = Infinity,
  step = 1,
  onChange,
  disabled = false,
  style,
}: NumericStepperProps) {
  const { theme } = useThemeContext()

  const canDecrement = !disabled && value - step >= min
  const canIncrement = !disabled && value + step <= max

  const handleDecrement = useCallback(() => {
    if (canDecrement) onChange(value - step)
  }, [canDecrement, onChange, value, step])

  const handleIncrement = useCallback(() => {
    if (canIncrement) onChange(value + step)
  }, [canIncrement, onChange, value, step])

  const styles = useMemo(() => {
    const bgColor = theme === 'light'
      ? colors.fills.light.secondary
      : colors.fills.dark.secondary
    const textColor = disabled
      ? colors.labels[theme].tertiary
      : colors.labels[theme].primary
    const separatorColor = colors.separators[theme].vibrant

    return {
      container: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        backgroundColor: bgColor,
        borderRadius: borderRadius.pill,
        height: 32,
        overflow: 'hidden' as const,
      },
      button: {
        width: 46,
        height: 32,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
      },
      buttonPressed: {
        opacity: 0.5,
      },
      separator: {
        width: 1,
        height: 18,
        backgroundColor: separatorColor,
      },
      text: {
        fontSize: 20,
        fontWeight: '400' as const,
        color: textColor,
        textAlign: 'center' as const,
        lineHeight: 24,
      },
      disabledText: {
        color: colors.labels[theme].tertiary,
      },
    }
  }, [theme, disabled])

  return (
    <View style={[styles.container, style]}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && canDecrement && styles.buttonPressed,
        ]}
        onPress={handleDecrement}
        disabled={!canDecrement}
        accessibilityRole="button"
        accessibilityLabel="Decrease"
      >
        <Text style={[styles.text, !canDecrement && styles.disabledText]}>
          −
        </Text>
      </Pressable>

      <View style={styles.separator} />

      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && canIncrement && styles.buttonPressed,
        ]}
        onPress={handleIncrement}
        disabled={!canIncrement}
        accessibilityRole="button"
        accessibilityLabel="Increase"
      >
        <Text style={[styles.text, !canIncrement && styles.disabledText]}>
          +
        </Text>
      </Pressable>
    </View>
  )
}

NumericStepper.displayName = 'NumericStepper'
