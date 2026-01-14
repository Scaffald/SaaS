/**
 * DatePickerBase component styles
 * All styles mapped from Figma Forsured Design System
 * Matches Figma "_Date Picker Base" component: 280px width, 312px height, 12px gap
 */

import type { ViewStyle } from 'react-native'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'

/**
 * Get container styles
 * Matches Figma: 280px width, 312px height, 12px gap between header and calendar
 */
export function getContainerStyles(_theme: ThemeMode = 'light'): ViewStyle {
  return {
    width: 280, // From Figma
    height: 312, // From Figma
    flexDirection: 'column',
    gap: spacing[12], // 12px gap between header and calendar
  }
}

/**
 * Get week row styles
 * 7 columns with equal distribution
 */
export function getWeekRowStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    flex: 1,
    gap: 0, // No gap between cells - they fill the width equally
  }
}

/**
 * Get week header row styles
 * Week day labels (Mo, Tu, We, etc.) with proper spacing
 */
export function getWeekHeaderRowStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    flex: 1,
    gap: 0, // No gap between cells - they fill the width equally
  }
}
