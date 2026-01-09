/**
 * SaaSSectionHeader component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'

/**
 * Get container styles
 */
export function getContainerStyles(tabsBelow: boolean, theme: ThemeMode = 'light'): ViewStyle {
  return {
    flexDirection: 'column',
    gap: tabsBelow ? spacing[0] : spacing[0],
    width: '100%',
    paddingVertical: tabsBelow ? spacing[16] : spacing[0],
  }
}

/**
 * Get header row styles
 */
export function getHeaderRowStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    width: '100%',
    minHeight: 72, // Height from Figma
  }
}

/**
 * Get left section styles (icon + text)
 */
export function getLeftSectionStyles(): ViewStyle {
  return {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[10],
    minWidth: 0, // Allows flex shrinking
  }
}

/**
 * Get featured icon container styles
 */
export function getFeaturedIconStyles(theme: ThemeMode = 'light'): ViewStyle {
  return {
    width: 32,
    height: 32,
    borderRadius: borderRadius.s,
    backgroundColor: colors.bg[theme].subtle,
    borderWidth: 2,
    borderColor: colors.bg[theme].default,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gray[100],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 0, // React Native shadow
  }
}

/**
 * Get text container styles
 */
export function getTextContainerStyles(): ViewStyle {
  return {
    flex: 1,
    flexDirection: 'column',
    gap: spacing[4],
    minWidth: 0, // Allows flex shrinking
  }
}

/**
 * Get title text styles
 */
export function getTitleStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typography.paragraphLMedium,
    color: colors.text[theme].primary,
    lineHeight: typography.lineHeight.lg,
  }
}

/**
 * Get description text styles
 */
export function getDescriptionStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typography.paragraphSRegular,
    color: colors.text[theme].secondary,
    lineHeight: typography.lineHeight.sm,
  }
}

/**
 * Get actions container styles
 */
export function getActionsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
  }
}

/**
 * Get search container styles
 */
export function getSearchContainerStyles(): ViewStyle {
  return {
    width: '100%',
    maxWidth: 300,
  }
}

/**
 * Get time period container styles
 */
export function getTimePeriodContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[8],
    alignItems: 'center',
  }
}

/**
 * Get sub-header text styles (smaller variant)
 */
export function getSubHeaderTextStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typography.paragraphSMedium,
    color: colors.text[theme].primary,
    lineHeight: typography.lineHeight.sm,
  }
}