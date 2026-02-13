/**
 * DatePickerHeader component
 * Header for date picker with month/year display and navigation
 * Maps to Figma "_Date Picker Header" component
 *
 * @example
 * ```tsx
 * import { DatePickerHeader } from '@scaffald/ui'
 *
 * // Basic header with navigation
 * <DatePickerHeader
 *   month={3}
 *   year={2023}
 *   onPreviousMonth={() => console.log('Previous')}
 *   onNextMonth={() => console.log('Next')}
 * />
 *
 * // Dropdown variant
 * <DatePickerHeader
 *   month={3}
 *   year={2023}
 *   type="dropdown"
 *   position="center"
 *   onMonthYearChange={(month, year) => console.log(month, year)}
 * />
 * ```
 */

import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import type { DatePickerHeaderProps } from './DatePickerHeader.types'
import {
  getContainerStyles,
  getMonthYearTextStyles,
  getArrowsContainerStyles,
  getIconSize,
  getIconColor,
} from './DatePickerHeader.styles'
import { useThemeContext } from '../../theme'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function DatePickerHeader({
  month,
  year,
  type = 'current-month',
  position = 'left',
  disabled = false,
  onPreviousMonth,
  onNextMonth,
  onMonthYearChange,
  style,
  accessibilityLabel,
}: DatePickerHeaderProps) {
  const { theme } = useThemeContext()

  const monthName = MONTH_NAMES[month] || ''
  const monthYearText = `${monthName} ${year}`
  const containerStyles = getContainerStyles(type, position, theme)
  const textStyles = getMonthYearTextStyles(theme)
  const iconSize = getIconSize()
  const iconColor = getIconColor(disabled, theme)

  // For dropdown variant, we'll use a simple text display for now
  // Full dropdown implementation would require Dropdown component integration
  if (type === 'dropdown') {
    return (
      <View style={[containerStyles, style]}>
        <Text style={textStyles}>{monthYearText}</Text>
      </View>
    )
  }

  return (
    <View style={[containerStyles, style]}>
      {/* Month/Year Display */}
      <Text style={textStyles}>{monthYearText}</Text>

      {/* Navigation Arrows */}
      <View style={getArrowsContainerStyles()}>
        {onPreviousMonth && (
          <Pressable
            disabled={disabled}
            onPress={onPreviousMonth}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && Platform.OS !== 'web' && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            accessibilityState={{ disabled }}
          >
            <ChevronLeft size={iconSize} color={iconColor} />
          </Pressable>
        )}

        {onNextMonth && (
          <Pressable
            disabled={disabled}
            onPress={onNextMonth}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && Platform.OS !== 'web' && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityState={{ disabled }}
          >
            <ChevronRight size={iconSize} color={iconColor} />
          </Pressable>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  iconButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
})
