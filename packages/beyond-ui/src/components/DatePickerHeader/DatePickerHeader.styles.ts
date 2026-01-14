/**
 * DatePickerHeader component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import type {
  DatePickerHeaderType,
  DatePickerHeaderPosition,
} from './DatePickerHeader.types'

/**
 * Icon size from Figma
 */
const ICON_SIZE = 18

/**
 * Get container styles based on type and position
 */
export function getContainerStyles(
  type: DatePickerHeaderType,
  position: DatePickerHeaderPosition,
  _theme: ThemeMode = 'light'
): ViewStyle {
  const baseContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[8],
    paddingVertical: 0,
    gap: spacing[4],
  }

  if (type === 'dropdown') {
    // Dropdown variant has different layout
    return {
      ...baseContainer,
      justifyContent: position === 'center' ? 'center' : 'flex-start',
    }
  }

  // Current month variant
  return {
    ...baseContainer,
    justifyContent: 'space-between',
  }
}

/**
 * Get month/year text styles
 */
export function getMonthYearTextStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typography.smallMedium,
    color: colors.text[theme].secondary,
    textAlign: 'center',
    includeFontPadding: false,
  }
}

/**
 * Get navigation arrows container styles
 */
export function getArrowsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  }
}

/**
 * Get icon size
 */
export function getIconSize(): number {
  return ICON_SIZE
}

/**
 * Get icon color
 */
export function getIconColor(disabled: boolean, theme: ThemeMode = 'light'): string {
  if (disabled) {
    return colors.icon[theme].disabled
  }
  return colors.icon[theme].muted
}
