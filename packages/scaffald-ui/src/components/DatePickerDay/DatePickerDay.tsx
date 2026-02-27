/**
 * DatePickerDay component
 * Individual day cell for date picker calendar
 * Maps to Figma "_Date Picker Date" component
 *
 * @example
 * ```tsx
 * import { DatePickerDay } from '@scaffald/ui'
 *
 * // Default day
 * <DatePickerDay day={15} onPress={() => console.log('Pressed')} />
 *
 * // Selected day
 * <DatePickerDay day={16} state="selected" onPress={() => console.log('Pressed')} />
 *
 * // Today with indicator
 * <DatePickerDay day={7} state="today" showIndicator onPress={() => console.log('Pressed')} />
 *
 * // Week day label
 * <DatePickerDay label="Mo" disabled />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import type { DatePickerDayProps, DatePickerDayState } from './DatePickerDay.types'
import {
  getContainerStyles,
  getTextStyles,
  getIndicatorStyles,
} from './DatePickerDay.styles'
import { useThemeContext } from '../../theme'

export function DatePickerDay({
  day,
  label,
  state: stateProp,
  disabled = false,
  showIndicator = false,
  onPress,
  style,
  textStyle,
  accessibilityLabel,
}: DatePickerDayProps) {
  const { theme } = useThemeContext()
  const [internalHovered, setInternalHovered] = useState(false)

  // Determine current state
  let currentState: DatePickerDayState = stateProp || 'default'
  if (!stateProp && !disabled) {
    if (internalHovered) {
      currentState = 'hover'
    }
  }

  // If disabled or empty, force empty state
  if (disabled && !label) {
    currentState = 'empty'
  }

  const isLabel = Boolean(label)
  const displayText = label || (day !== undefined ? String(day) : '')
  const containerStyles = getContainerStyles(currentState, disabled, theme)
  const textStyles = getTextStyles(currentState, disabled, isLabel, theme)

  const dayContent = (
    <View style={[containerStyles, style]} pointerEvents="box-none">
      <Text style={[textStyles, textStyle]}>{displayText}</Text>
      {showIndicator && !disabled && currentState !== 'empty' && (
        <View style={getIndicatorStyles()} />
      )}
    </View>
  )

  if (!onPress || disabled || isLabel) {
    return dayContent
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => setInternalHovered(true),
        onMouseLeave: () => setInternalHovered(false),
      } as Partial<{ onMouseEnter: () => void; onMouseLeave: () => void }>)}
      style={({ pressed }) => [
        styles.pressable,
        pressed && Platform.OS !== 'web' && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `Select date ${displayText}`}
      accessibilityState={{ disabled }}
    >
      {dayContent}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    position: 'relative',
  },
  pressed: {
    opacity: 0.8,
  },
})
