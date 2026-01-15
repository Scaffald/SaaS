/**
 * Card component styles
 * Style factory functions for card components
 */

import type { ViewStyle, ImageStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { shadows, boxShadows } from '../../tokens/shadows'
import type { CardPadding, CardRadius, CardElevation, CardVariant } from './Card.types'

// ============================================================================
// Types
// ============================================================================

/** Shadow style properties for React Native */
interface ShadowStyle {
  shadowColor: string
  shadowOffset: { width: number; height: number }
  shadowOpacity: number
  shadowRadius: number
  elevation: number
}

export interface CardStyleConfig {
  container: ViewStyle
  pressed?: ViewStyle
  disabled?: ViewStyle
}

export interface CardHeaderStyleConfig {
  header: ViewStyle
  headerText: ViewStyle
  subtitle: ViewStyle
  headerAction: ViewStyle
}

export interface CardContentStyleConfig {
  content: ViewStyle
}

export interface CardFooterStyleConfig {
  footer: ViewStyle
  footerInner: ViewStyle
}

export interface CardMediaStyleConfig {
  media: ImageStyle
}

// ============================================================================
// Constants
// ============================================================================

const PADDING_MAP: Record<CardPadding, number> = {
  none: 0,
  sm: spacing[8],
  md: spacing[12],
  lg: spacing[16],
  xl: spacing[24],
}

const RADIUS_MAP: Record<CardRadius, number> = {
  sm: borderRadius.s,
  md: borderRadius.m,
  lg: borderRadius.l,
  xl: borderRadius.xl,
}

const SHADOW_MAP: Record<CardElevation, ShadowStyle> = {
  sm: shadows.s as ShadowStyle,
  md: shadows.m as ShadowStyle,
  lg: shadows.l as ShadowStyle,
}

const BOX_SHADOW_MAP: Record<CardElevation, string> = {
  sm: boxShadows.s,
  md: boxShadows.m,
  lg: boxShadows.l,
}

// ============================================================================
// Style Factory Functions
// ============================================================================

/**
 * Get card styles based on variant, padding, radius, elevation, and state
 */
export function getCardStyles(
  variant: CardVariant,
  padding: CardPadding,
  radius: CardRadius,
  elevation: CardElevation,
  isPressed: boolean,
  disabled: boolean
): CardStyleConfig {
  const baseStyle: ViewStyle = {
    backgroundColor: colors.bg.light.default,
    borderRadius: RADIUS_MAP[radius],
    padding: PADDING_MAP[padding],
    overflow: 'hidden',
  }

  // Variant-specific styles
  let container: ViewStyle
  switch (variant) {
    case 'elevated': {
      container = {
        ...baseStyle,
        ...SHADOW_MAP[elevation],
      }
      // Add web-specific box-shadow
      if (Platform.OS === 'web') {
        ;(container as Record<string, unknown>).boxShadow = BOX_SHADOW_MAP[elevation]
      }
      break
    }
    case 'outlined':
      container = {
        ...baseStyle,
        borderWidth: 1,
        borderColor: colors.border.light.default,
      }
      break
    case 'filled':
      container = {
        ...baseStyle,
        backgroundColor: colors.bg.light.subtle,
      }
      break
    default:
      container = baseStyle
  }

  // Pressed state
  const pressed: ViewStyle | undefined =
    isPressed && !disabled
      ? {
          opacity: 0.9,
          transform: [{ scale: 0.98 }],
        }
      : undefined

  // Disabled state
  const disabledStyle: ViewStyle | undefined = disabled
    ? {
        opacity: 0.6,
      }
    : undefined

  return {
    container,
    pressed,
    disabled: disabledStyle,
  }
}

/**
 * Get card header styles
 */
export function getCardHeaderStyles(): CardHeaderStyleConfig {
  return {
    header: {
      padding: spacing[16],
      paddingBottom: spacing[8],
    },
    headerText: {
      flex: 1,
    },
    subtitle: {
      marginTop: spacing[4],
    },
    headerAction: {
      marginLeft: spacing[12],
    },
  }
}

/**
 * Get card content styles based on padding
 */
export function getCardContentStyles(padding: CardPadding): CardContentStyleConfig {
  return {
    content: {
      padding: PADDING_MAP[padding],
    },
  }
}

/**
 * Get card footer styles based on alignment
 */
export function getCardFooterStyles(
  align: 'left' | 'center' | 'right' | 'space-between'
): CardFooterStyleConfig {
  const alignMap: Record<string, ViewStyle['justifyContent']> = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
    'space-between': 'space-between',
  }

  return {
    footer: {
      padding: spacing[16],
      paddingTop: spacing[8],
      borderTopWidth: 1,
      borderTopColor: colors.border.light.subtle,
    },
    footerInner: {
      flexDirection: 'row',
      justifyContent: alignMap[align],
      alignItems: 'center',
      gap: spacing[8],
    },
  }
}

/**
 * Get card media styles based on height
 */
export function getCardMediaStyles(height: number): CardMediaStyleConfig {
  return {
    media: {
      width: '100%' as unknown as number, // 100% works on web, cast for RN types
      height,
    },
  }
}
