/**
 * FileUpload component styles
 * Style factory functions for file upload component
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'

export interface FileUploadStyleConfig {
  container: ViewStyle
  label: TextStyle
  listContainer: ViewStyle
  error: TextStyle
}

/**
 * Get file upload styles based on theme and disabled state
 */
export function getFileUploadStyles(
  theme: ThemeMode,
  disabled: boolean
): FileUploadStyleConfig {
  const isLight = theme === 'light'

  // Get label color
  const labelColor = disabled
    ? isLight
      ? colors.text.light.disabled
      : colors.text.dark.disabled
    : isLight
      ? colors.text.light.primary
      : colors.text.dark.primary

  // Container styles
  const container: ViewStyle = {
    gap: spacing[16],
  }

  // Label styles
  const label: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight as any,
    lineHeight: typography.body.lineHeight,
    color: labelColor,
  }

  // List container styles
  const listContainer: ViewStyle = {
    // Gap is handled by FileUploadList
  }

  // Error styles
  const error: TextStyle = {
    fontFamily: typography.small.fontFamily,
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
    color: colors.error[500],
  }

  return {
    container,
    label,
    listContainer,
    error,
  }
}
