/**
 * NotificationListItem component styles
 * All styles mapped from Figma Forsured Design System
 */

import { Platform } from 'react-native'
import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography, lineHeight } from '../../tokens/typography'
import type { NotificationListItemVariant, NotificationState } from './NotificationListItem.types'

/**
 * Get container styles based on state
 */
export function getContainerStyles(
  state: NotificationState,
  disabled: boolean,
  theme: ThemeMode = 'light'
): ViewStyle {
  const baseContainer: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[12],
    gap: spacing[12],
    borderRadius: borderRadius.s,
    minHeight: state === 'new' ? 134 : 114, // Height varies by variant and state
  }

  if (disabled) {
    return {
      ...baseContainer,
      opacity: 0.5,
    }
  }

  // Background color based on state
  const backgroundColor =
    state === 'hover'
      ? colors.bg[theme].subtle
      : state === 'new'
        ? colors.bg[theme].selected
        : 'transparent'

  return {
    ...baseContainer,
    backgroundColor,
  }
}

/**
 * Get avatar container styles
 */
export function getAvatarContainerStyles(): ViewStyle {
  return {
    width: 40,
    height: 40,
    borderRadius: 20,
    position: 'relative',
  }
}

/**
 * Get avatar indicator styles
 */
export function getAvatarIndicatorStyles(indicatorColor: string): ViewStyle {
  return {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 2,
    borderColor: colors.bg.light.default,
    backgroundColor: indicatorColor,
  }
}

/**
 * Get content container styles
 */
export function getContentContainerStyles(_variant: NotificationListItemVariant): ViewStyle {
  return {
    flex: 1,
    flexDirection: 'column',
    gap: spacing[16],
    minWidth: 0, // Allows flex shrinking
  }
}

/**
 * Get text container styles
 */
export function getTextContainerStyles(): ViewStyle {
  return {
    flexDirection: 'column',
    gap: spacing[2],
  }
}

/**
 * Get content text styles
 */
export function getContentTextStyles(state: NotificationState, theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typography.paragraphSRegular,
    color: state === 'new' ? colors.text[theme].primary : colors.text[theme].secondary,
    lineHeight: lineHeight.sm,
  }
}

/**
 * Get timestamp text styles
 */
export function getTimestampTextStyles(theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typography.captionRegular,
    color: colors.text[theme].tertiary,
    lineHeight: lineHeight.xs,
  }
}

/**
 * Get actions container styles
 */
export function getActionsContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[8],
    alignItems: 'center',
  }
}

/**
 * Get action button styles (for CTA variant)
 */
export function getActionButtonStyles(
  variant: 'primary' | 'secondary',
  theme: ThemeMode = 'light'
): ViewStyle {
  const baseStyles: ViewStyle = {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[6],
    borderRadius: borderRadius.s,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (variant === 'primary') {
    return {
      ...baseStyles,
      backgroundColor: colors.primary[500],
      ...(Platform.OS === 'web' && {
        boxShadow: '0px 1px 2px 0px rgba(20, 28, 37, 0.04)',
      } as ViewStyle),
    }
  }

  return {
    ...baseStyles,
    backgroundColor: colors.bg[theme].default,
    borderWidth: 1,
    borderColor: colors.border[theme].default,
    ...(Platform.OS === 'web' && {
      boxShadow: '0px 1px 2px 0px rgba(20, 28, 37, 0.04)',
    } as ViewStyle),
  }
}

/**
 * Get action button text styles
 */
export function getActionButtonTextStyles(
  variant: 'primary' | 'secondary',
  theme: ThemeMode = 'light'
): TextStyle {
  return {
    ...typography.paragraphSMedium,
    color: variant === 'primary' ? colors.white : colors.text[theme].secondary,
  }
}

/**
 * Get link text styles
 */
export function getLinkTextStyles(state: NotificationState, theme: ThemeMode = 'light'): TextStyle {
  return {
    ...typography.paragraphSMedium,
    color: state === 'new' ? colors.primary[600] : colors.text[theme].secondary,
    textDecorationLine: 'underline',
  }
}

/**
 * Get links container styles
 */
export function getLinksContainerStyles(): ViewStyle {
  return {
    flexDirection: 'row',
    gap: spacing[8],
    alignItems: 'center',
  }
}