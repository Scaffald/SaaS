/**
 * DatePicker component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import type { DatePickerSize } from './DatePicker.types'

/**
 * Get container styles based on size
 */
export function getContainerStyles(
  size: DatePickerSize,
  theme: ThemeMode = 'light'
): ViewStyle {
  const baseContainer: ViewStyle = {
    backgroundColor: colors.bg[theme].default,
    borderRadius: borderRadius.m,
    padding: spacing[12],
    gap: spacing[12],
  }

  if (size === 'expanded') {
    return {
      ...baseContainer,
      width: 822, // From Figma expanded size
    }
  }

  // Small size
  return {
    ...baseContainer,
    width: 312, // From Figma small size
  }
}

/**
 * Get calendars container styles (for expanded size with dual calendars)
 */
export function getCalendarsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[24],
  }
}

/**
 * Get preset buttons container styles
 */
export function getPresetButtonsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'column',
    gap: spacing[4],
    width: 155, // From Figma
  }
}

/**
 * Get actions container styles
 */
export function getActionsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[12],
    width: 180, // From Figma
  }
}
