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
 * Matches Figma: Small (312px width), Expanded (822px width)
 */
export function getContainerStyles(
  size: DatePickerSize,
  theme: ThemeMode = 'light'
): ViewStyle {
  const baseContainer: ViewStyle = {
    backgroundColor: colors.bg[theme].default,
    borderRadius: borderRadius.m, // 10px
    padding: spacing[12], // 12px padding
    gap: spacing[12], // 12px gap
  }

  if (size === 'expanded') {
    return {
      ...baseContainer,
      width: 822, // From Figma expanded size
      flexDirection: 'row', // Horizontal layout for expanded (presets on left, calendars on right)
    }
  }

  // Small size
  return {
    ...baseContainer,
    width: 312, // From Figma small size (matches DatePickerBase width + padding)
  }
}

/**
 * Get calendars container styles (for expanded size with dual calendars)
 * Matches Figma: Two calendars side-by-side with proper spacing
 */
export function getCalendarsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[24], // 24px gap between calendars
    flex: 1,
  }
}

/**
 * Get preset buttons container styles
 * Matches Figma: Vertical layout, 155px width, proper spacing
 */
export function getPresetButtonsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'column',
    gap: spacing[4], // 4px gap between preset buttons
    width: 155, // From Figma
    marginRight: spacing[24], // 24px margin to calendars
  }
}

/**
 * Get actions container styles
 * Matches Figma: Horizontal layout, 180px width, 12px gap between buttons
 */
export function getActionsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[12], // 12px gap between Cancel and Apply buttons
    width: 180, // From Figma
    alignSelf: 'flex-end', // Align to right
  }
}
