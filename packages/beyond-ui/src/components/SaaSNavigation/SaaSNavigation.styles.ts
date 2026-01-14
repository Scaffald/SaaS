/**
 * SaaSNavigation component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography, lineHeight } from '../../tokens/typography'

/**
 * Get container styles based on variant
 */
export function getContainerStyles(
  variant: string,
  showTabs: boolean,
  _theme: ThemeMode = 'light'
): ViewStyle {
  // Height mapping from Figma
  let minHeight = 96 // Default: Main Navigation without tabs
  
  if (showTabs && variant === 'main') {
    minHeight = 132 // Main Navigation with tabs
  } else if (variant === 'finance-banking') {
    minHeight = 138
  } else if (variant === 'left-side-links') {
    minHeight = 72
  } else if (variant === 'footer') {
    minHeight = 72
  } else if (variant === 'onboarding') {
    minHeight = 76
  }

  const baseContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: spacing[16],
    paddingVertical: spacing[0],
    minHeight,
  }

  return baseContainer
}

/**
 * Get main content wrapper styles
 */
export function getMainContentStyles(): ViewStyle {
  return {
    flex: 1,
    flexDirection: 'column',
    gap: spacing[6],
    minWidth: 0, // Allows flex shrinking
  }
}

/**
 * Get header content styles
 */
export function getHeaderContentStyles(): ViewStyle {
  return {
    flexDirection: 'column',
    gap: spacing[4],
    width: '100%',
  }
}

/**
 * Get featured icon styles
 * Matches Figma: gradient from bg-50 to bg-100 with double border effect
 */
export function getFeaturedIconStyles(theme: ThemeMode = 'light'): ViewStyle {
  // Figma uses gradient from bg-50 (#f9fafb) to bg-100 (#f2f4f7)
  // With double border: 2px white, 3px gray-100
  return {
    width: 32,
    height: 32,
    borderRadius: borderRadius.s,
    // Use gradient background - for React Native, we'll use LinearGradient component
    // For web, we can use CSS gradient
    backgroundColor: colors.gray[50], // Fallback
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    // Double border effect: outer ring (3px gray-100) + inner ring (2px white)
    // Using shadow to simulate outer ring
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
 * Get title text styles
 */
export function getTitleStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typography.h6Medium,
    color: colors.text[theme].primary,
    lineHeight: lineHeight.h6,
    letterSpacing: -0.24, // From Figma H6 Medium
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
 * Get actions menu styles
 */
export function getActionsMenuStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[16],
    alignItems: 'center',
  }
}

/**
 * Get notifications container styles
 */
export function getNotificationsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
  }
}

/**
 * Get CTAs container styles
 */
export function getCtasContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[12],
    alignItems: 'center',
  }
}