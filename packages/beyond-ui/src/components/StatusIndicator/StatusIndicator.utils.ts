/**
 * StatusIndicator utility functions
 * Color configuration and style helpers
 */

import { colors } from '../../tokens/colors'
import type { StatusIndicatorType, StatusIndicatorStyle } from './StatusIndicator.types'
import type { ThemeMode } from '../../tokens/colors'

interface StatusColors {
  icon: string
  bg: string
  border: string
  text: string
}

/**
 * Get color configuration for each status type
 */
export const getStatusColors = (
  type: StatusIndicatorType,
  variant: StatusIndicatorStyle,
  theme: ThemeMode
): StatusColors => {
  // Base colors for each type
  const typeColors = {
    caution: {
      icon: colors.warning[500], // #f59e0b
      bgLight: colors.warning[50],
      bgFilled: colors.warning[500],
      border: colors.warning[500],
    },
    success: {
      icon: colors.success[500], // #10b978
      bgLight: colors.success[50],
      bgFilled: colors.success[500],
      border: colors.success[500],
    },
    error: {
      icon: colors.error[600], // #f62c2c
      bgLight: colors.error[50],
      bgFilled: colors.error[600],
      border: colors.error[600],
    },
    'in-progress': {
      icon: colors.primary[500], // #fb612a (orange)
      bgLight: colors.primary[50],
      bgFilled: colors.primary[500],
      border: colors.primary[500],
    },
    help: {
      icon: colors.gray[500], // #637083
      bgLight: colors.gray[100],
      bgFilled: colors.gray[500],
      border: colors.gray[500],
    },
    undefined: {
      icon: colors.purple[500], // #a855f7
      bgLight: colors.purple[50],
      bgFilled: colors.purple[500],
      border: colors.purple[500],
    },
  }

  const baseColors = typeColors[type]

  // Determine colors based on variant
  switch (variant) {
    case 'blank':
      return {
        icon: baseColors.icon,
        bg: 'transparent',
        border: 'transparent',
        text: theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary,
      }
    case 'light':
      return {
        icon: baseColors.icon,
        bg: baseColors.bgLight,
        border: 'transparent',
        text: theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary,
      }
    case 'outline':
      return {
        icon: baseColors.icon,
        bg: 'transparent',
        border: baseColors.border,
        text: theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary,
      }
    case 'filled':
      return {
        icon: colors.white,
        bg: baseColors.bgFilled,
        border: 'transparent',
        text: colors.white,
      }
    default:
      return {
        icon: baseColors.icon,
        bg: 'transparent',
        border: 'transparent',
        text: theme === 'light' ? colors.text.light.secondary : colors.text.dark.secondary,
      }
  }
}
