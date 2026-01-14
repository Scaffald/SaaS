/**
 * DatePickerBase component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle } from 'react-native'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

/**
 * Get container styles
 */
export function getContainerStyles(_theme: ThemeMode = 'light'): ViewStyle {
  return {
    flex: 1,
    flexDirection: 'column',
    gap: spacing[4],
  }
}

/**
 * Get week row styles
 */
export function getWeekRowStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[4],
  }
}

/**
 * Get week header row styles
 */
export function getWeekHeaderRowStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[4],
  }
}
