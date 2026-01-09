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
  _variant: string,
  showTabs: boolean,
  _theme: ThemeMode = 'light'
): ViewStyle {
  const baseContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: spacing[16],
    paddingVertical: showTabs ? spacing[16] : spacing[0],
    minHeight: showTabs ? 132 : 96, // Height varies by variant and tabs
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