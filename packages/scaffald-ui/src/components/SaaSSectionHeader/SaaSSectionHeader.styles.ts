/**
 * SaaSSectionHeader component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography, lineHeight } from '../../tokens/typography'

/**
 * Get container styles
 * Height: 72px (default), 128px (with tabs below)
 */
export function getContainerStyles(tabsBelow: boolean, _theme: ThemeMode = 'light'): ViewStyle {
  return {
    flexDirection: 'column',
    gap: spacing[0],
    width: '100%',
    paddingVertical: spacing[0],
    minHeight: tabsBelow ? 128 : 72, // From Figma: 72px default, 128px with tabs
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
 * Matches Figma: gradient from bg-50 to bg-100 with double border effect
 */
export function getFeaturedIconStyles(_theme: ThemeMode = 'light'): ViewStyle {
  // Figma uses gradient from bg-50 (#f9fafb) to bg-100 (#f2f4f7)
  // With double border: 2px white, 3px gray-100
  return {
    width: 32,
    height: 32,
    borderRadius: borderRadius.s,
    backgroundColor: colors.gray[50], // Fallback
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    // Double border effect: outer ring (3px gray-100) + inner ring (2px white)
    shadowColor: colors.gray[100],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0,
    // For web, we'll use boxShadow with double shadow
    ...(typeof window !== 'undefined' && {
      boxShadow: '0 0 0 3px rgba(242, 244, 247, 1), 0 0 0 2px rgba(255, 255, 255, 1)',
    } as any),
    elevation: 0,
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
    lineHeight: lineHeight.lg,
  }
}

/**
 * Get description text styles
 */
export function getDescriptionStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typography.paragraphSRegular,
    color: colors.text[theme].secondary,
    lineHeight: lineHeight.sm,
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
    lineHeight: lineHeight.sm,
  }
}