/**
 * Alert component utility functions
 * Color configuration and style helpers
 */

import { colors } from '../../tokens/colors'
import type { AlertType, AlertVariant } from './Alert.types'
import type { ThemeMode } from '../../tokens/colors'

interface AlertColors {
  icon: string
  border: string
  bgLight: string
  bgFilled: string
}

/**
 * Get color configuration for each alert type
 */
export const getAlertColors = (type: AlertType): AlertColors => {
  switch (type) {
    case 'info':
      return {
        icon: colors.primary[500],
        border: colors.primary[500],
        bgLight: colors.primary[50],
        bgFilled: colors.primary[500],
      }
    case 'success':
      return {
        icon: colors.success[500],
        border: colors.success[500],
        bgLight: colors.success[50],
        bgFilled: colors.success[500],
      }
    case 'warning':
      return {
        icon: colors.warning[600],
        border: colors.warning[600],
        bgLight: colors.warning[50],
        bgFilled: colors.warning[600],
      }
    case 'error':
      return {
        icon: colors.error[600],
        border: colors.error[600],
        bgLight: colors.error[50],
        bgFilled: colors.error[600],
      }
    case 'ai':
      return {
        icon: colors.purple[600],
        border: colors.purple[600],
        bgLight: colors.purple[50],
        bgFilled: colors.purple[600],
      }
    default:
      return {
        icon: colors.primary[500],
        border: colors.primary[500],
        bgLight: colors.primary[50],
        bgFilled: colors.primary[500],
      }
  }
}

/**
 * Get background color based on variant and type
 */
export const getBackgroundColor = (
  variant: AlertVariant,
  type: AlertType,
  theme: ThemeMode
): string => {
  const alertColors = getAlertColors(type)

  switch (variant) {
    case 'linear':
      return theme === 'light' ? colors.white : colors.bg.dark.default
    case 'light':
      return alertColors.bgLight
    case 'filled':
      return alertColors.bgFilled
    default:
      return theme === 'light' ? colors.white : colors.bg.dark.default
  }
}

/**
 * Get text color based on variant and theme
 */
export const getTextColor = (
  variant: AlertVariant,
  theme: ThemeMode,
  type: 'title' | 'description'
): string => {
  if (variant === 'filled') {
    return colors.white
  }

  if (type === 'title') {
    return theme === 'light' ? colors.text.light.primary : colors.text.dark.primary
  }

  return theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary
}

/**
 * Get icon color based on variant
 */
export const getIconColor = (variant: AlertVariant, type: AlertType): string => {
  if (variant === 'filled') {
    return colors.white
  }

  const alertColors = getAlertColors(type)
  return alertColors.icon
}

/**
 * Get close icon color based on variant and theme
 */
export const getCloseIconColor = (variant: AlertVariant, theme: ThemeMode): string => {
  if (variant === 'filled') {
    return colors.white
  }

  return theme === 'light' ? colors.icon.light.muted : colors.icon.dark.muted
}

/**
 * Get action text color based on variant and type
 */
export const getActionTextColor = (
  variant: AlertVariant,
  type: AlertType,
  _theme: ThemeMode
): string => {
  if (variant === 'filled') {
    return colors.white
  }

  // For linear and light variants, use the alert type color
  const alertColors = getAlertColors(type)
  return alertColors.icon
}
