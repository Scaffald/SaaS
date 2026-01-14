/**
 * NavIconButton component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { fontWeight } from '../../tokens/typography'
import type {
  NavIconButtonBadge,
  NavIconButtonState,
  NavIconButtonVariant,
} from './NavIconButton.types'

/**
 * Icon size from Figma
 */
const ICON_SIZE = 22

/**
 * Badge sizes from Figma
 */
const BADGE_SIZES = {
  dot: {
    light: { size: 6, top: 4, right: 4 },
    outline: { size: 8, top: -2, right: -2 },
  },
  number: {
    light: { size: 6, top: 4, right: 4 },
    outline: { size: 8, top: -2, right: -2 },
  },
} as const

/**
 * Get container styles based on variant and state
 */
export function getContainerStyles(
  variant: NavIconButtonVariant,
  state: NavIconButtonState,
  disabled: boolean,
  theme: ThemeMode = 'light'
): ViewStyle {
  const baseContainer: ViewStyle = {
    width: 30,
    height: 30,
    borderRadius: borderRadius.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    position: 'relative',
  }

  if (disabled) {
    return {
      ...baseContainer,
      opacity: 0.5,
    }
  }

  if (variant === 'outline') {
    // Outline variant has transparent background
    return baseContainer
  }

  // Light variant
  const backgroundColor =
    state === 'pressed'
      ? colors.bg[theme].muted
      : state === 'hover'
        ? colors.bg[theme].subtle
        : 'transparent'

  return {
    ...baseContainer,
    backgroundColor,
  }
}

/**
 * Get icon color based on variant and state
 */
export function getIconColor(
  _variant: NavIconButtonVariant,
  _state: NavIconButtonState,
  disabled: boolean,
  theme: ThemeMode = 'light'
): string {
  if (disabled) {
    return colors.icon[theme].disabled
  }

  // Icon color is consistent across states for navigation buttons
  return colors.icon[theme].muted
}

/**
 * Get badge styles
 */
export function getBadgeStyles(
  badge: NavIconButtonBadge,
  variant: NavIconButtonVariant,
  _state: NavIconButtonState
): ViewStyle {
  const badgeConfig = BADGE_SIZES[badge][variant]

  const baseStyles: ViewStyle = {
    position: 'absolute',
    top: badgeConfig.top,
    right: badgeConfig.right,
    width: badgeConfig.size,
    height: badgeConfig.size,
    borderRadius: badgeConfig.size / 2,
    backgroundColor: colors.primary[500],
    borderWidth: variant === 'outline' ? 2 : 0,
    borderColor: variant === 'outline' ? colors.white : 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  }

  return baseStyles
}

/**
 * Get badge text styles (for number badge)
 */
export function getBadgeTextStyles(badge: NavIconButtonBadge, variant: NavIconButtonVariant): TextStyle {
  const size = BADGE_SIZES[badge][variant].size

  return {
    fontSize: size * 0.7,
    fontWeight: fontWeight.medium,
    color: colors.white,
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  }
}

/**
 * Get icon size
 */
export function getIconSize(): number {
  return ICON_SIZE
}