/**
 * Button component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { shadows } from '../../tokens/shadows'
import type { ButtonColor, ButtonVariant, ButtonSize, ButtonStyleConfig } from './Button.types'
import { glassVibrantColors } from '../../tokens/glass'

/**
 * Button size configurations from Figma
 * - Small: 138x40 (with text), 40x40 (icon only)
 * - Medium: 152x44 (with text), 44x44 (icon only)
 * - Large: 160x48 (with text), 48x48 (icon only)
 */
const sizeConfig = {
  sm: {
    height: 40,
    minWidth: 40,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    gap: spacing[8],
    iconSize: 20,
    fontSize: typography.small.fontSize,
    lineHeight: typography.small.lineHeight,
  },
  md: {
    height: 44,
    minWidth: 44,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[10],
    gap: spacing[8],
    iconSize: 24,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
  lg: {
    height: 48,
    minWidth: 48,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[12],
    gap: spacing[8],
    iconSize: 24,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
} as const

/**
 * Icon/loading indicator size per button size (from Figma).
 * Use for start/end icons and loading indicator so they fit inside the button.
 */
export function getButtonIconSize(size: ButtonSize): number {
  const validSize: ButtonSize = sizeConfig[size] ? size : 'md'
  return sizeConfig[validSize].iconSize
}

/**
 * iOS 26 button size configurations from Figma
 * - Small: 28px height, 15px font, pill shape
 * - Medium: 34px height, 15px font, pill shape
 * - Large: 50px height, 17px font, 12px radius (text) or circle (icon-only)
 */
const iosSizeConfig = {
  sm: {
    height: 28,
    minWidth: 28,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 3,
    iconSize: 15,
    fontSize: 15,
    lineHeight: 20,
    borderRadius: 1000, // pill
  },
  md: {
    height: 34,
    minWidth: 34,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 3,
    iconSize: 15,
    fontSize: 15,
    lineHeight: 20,
    borderRadius: 1000, // pill
  },
  lg: {
    height: 50,
    minWidth: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 4,
    iconSize: 17,
    fontSize: 17,
    lineHeight: 22,
    borderRadius: 12, // rounded rect for text, 500 for icon-only
  },
} as const

/** Whether a variant is iOS 26 style */
function isIOSVariant(variant: ButtonVariant): boolean {
  return variant === 'bordered-prominent' || variant === 'bordered' || variant === 'borderless'
}

/**
 * Get button styles based on variant, color, size, state, and theme
 */
export function getButtonStyles(
  color: ButtonColor,
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  iconOnly: boolean,
  theme: ThemeMode = 'light',
  destructive: boolean = false
): ButtonStyleConfig {
  // Use iOS size config for iOS variants
  if (isIOSVariant(variant)) {
    const validSize: ButtonSize = iosSizeConfig[size] ? size : 'md'
    const sizeStyles = iosSizeConfig[validSize]

    const baseContainer: ViewStyle = {
      height: sizeStyles.height,
      minWidth: iconOnly ? sizeStyles.minWidth : undefined,
      paddingHorizontal: iconOnly ? 0 : sizeStyles.paddingHorizontal,
      paddingVertical: sizeStyles.paddingVertical,
      borderRadius: iconOnly && size === 'lg' ? 500 : sizeStyles.borderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sizeStyles.gap,
      borderWidth: 0,
    }

    const baseText: TextStyle = {
      fontFamily: typography.bodyMedium.fontFamily,
      fontSize: sizeStyles.fontSize,
      fontWeight: '400', // SF Pro Regular for iOS buttons
      lineHeight: sizeStyles.lineHeight,
      letterSpacing: size === 'lg' ? -0.43 : -0.23,
      textAlign: 'center',
    }

    return getIOSVariantStyles(variant, disabled, destructive, baseContainer, baseText, sizeStyles.iconSize, theme)
  }

  // Safety check: ensure size is valid, fallback to 'md' if invalid
  const validSize: ButtonSize = sizeConfig[size] ? size : 'md'
  const sizeStyles = sizeConfig[validSize]

  // Base container styles
  const baseContainer: ViewStyle = {
    height: sizeStyles.height,
    minWidth: iconOnly ? sizeStyles.minWidth : undefined,
    paddingHorizontal: iconOnly ? 0 : sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    borderRadius: borderRadius.max,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizeStyles.gap,
    borderWidth: 0,
  }

  // Base text styles
  const baseText: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: sizeStyles.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: sizeStyles.lineHeight,
    letterSpacing: 0, // React Native uses number for letterSpacing
    textAlign: 'center',
  }

  // Get variant-specific styles
  return getVariantStyles(
    color,
    variant,
    disabled,
    baseContainer,
    baseText,
    sizeStyles.iconSize,
    theme
  )
}

/**
 * Get variant-specific styles
 */
function getVariantStyles(
  color: ButtonColor,
  variant: ButtonVariant,
  disabled: boolean,
  baseContainer: ViewStyle,
  baseText: TextStyle,
  iconSize: number,
  theme: ThemeMode
): ButtonStyleConfig {
  // Filled variant
  if (variant === 'filled') {
    return getFilledStyles(color, disabled, baseContainer, baseText, iconSize, theme)
  }

  // Outline variant
  if (variant === 'outline') {
    return getOutlineStyles(color, disabled, baseContainer, baseText, iconSize, theme)
  }

  // Light variant
  if (variant === 'light') {
    return getLightStyles(color, disabled, baseContainer, baseText, iconSize, theme)
  }

  // Glass variant
  if (variant === 'glass') {
    return getGlassStyles(disabled, baseContainer, baseText, iconSize, theme)
  }

  // Text variant
  return getTextStyles(color, disabled, baseContainer, baseText, iconSize, theme)
}

/**
 * Glass variant styles — Liquid Glass button with backdrop-blur
 */
function getGlassStyles(
  disabled: boolean,
  baseContainer: ViewStyle,
  baseText: TextStyle,
  _iconSize: number,
  theme: ThemeMode
): ButtonStyleConfig {
  const vibrant = glassVibrantColors[theme]
  const container: ViewStyle = {
    ...baseContainer,
    borderWidth: 1,
    borderColor: colors.border[theme].ghost,
  }

  if (Platform.OS === 'web') {
    (container as Record<string, unknown>).backdropFilter = 'blur(20px)';
    (container as Record<string, unknown>).WebkitBackdropFilter = 'blur(20px)';
    container.backgroundColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.26)' : 'rgba(255, 255, 255, 0.4)';
  } else {
    container.backgroundColor = theme === 'dark' ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.45)';
  }

  return {
    container,
    text: {
      ...baseText,
      color: disabled ? vibrant.tertiaryText : vibrant.primaryText,
    },
    iconColor: disabled ? vibrant.tertiaryText : vibrant.primaryText,
    hover: {
      backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.55)',
    },
    pressed: {
      backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.65)',
    },
  }
}

/**
 * Filled variant styles
 */
function getFilledStyles(
  color: ButtonColor,
  disabled: boolean,
  baseContainer: ViewStyle,
  baseText: TextStyle,
  _iconSize: number,
  theme: ThemeMode
): ButtonStyleConfig {
  const colorMap = {
    gray: {
      bg: disabled ? colors.gray[200] : colors.gray[900],
      hoverBg: colors.gray[800],
      pressedBg: colors.gray[700],
      text: disabled ? colors.text[theme].disabled : colors.white,
      icon: disabled ? colors.text[theme].disabled : colors.white,
    },
    primary: {
      bg: disabled ? colors.primary[200] : colors.primary[600],
      hoverBg: colors.primary[700],
      pressedBg: colors.primary[800],
      text: disabled ? colors.white : colors.white,
      icon: disabled ? colors.white : colors.white,
    },
    success: {
      bg: disabled ? colors.success[200] : colors.success[600],
      hoverBg: colors.success[700],
      pressedBg: colors.success[800],
      text: disabled ? colors.white : colors.white,
      icon: disabled ? colors.white : colors.white,
    },
    error: {
      bg: disabled ? colors.error[200] : colors.error[600],
      hoverBg: colors.error[700],
      pressedBg: colors.error[800],
      text: disabled ? colors.white : colors.white,
      icon: disabled ? colors.white : colors.white,
    },
  }

  const styles = colorMap[color as keyof typeof colorMap]

  return {
    container: {
      ...baseContainer,
      backgroundColor: styles.bg,
      ...(!disabled && shadows.button),
    },
    text: {
      ...baseText,
      color: styles.text,
    },
    iconColor: styles.icon,
    hover: {
      backgroundColor: disabled ? styles.bg : styles.hoverBg,
    },
    pressed: {
      backgroundColor: disabled ? styles.bg : styles.pressedBg,
    },
  }
}

/**
 * Outline variant styles
 */
function getOutlineStyles(
  color: ButtonColor,
  disabled: boolean,
  baseContainer: ViewStyle,
  baseText: TextStyle,
  _iconSize: number,
  theme: ThemeMode
): ButtonStyleConfig {
  const colorMap = {
    gray: {
      border: disabled ? colors.border[theme].disabled : colors.gray[300],
      // Dark: use light text so outline buttons (e.g. "Manage") are visible on dark backgrounds
      text: disabled ? colors.text[theme].disabled : (theme === 'dark' ? colors.text.dark.primary : colors.gray[700]),
      icon: disabled ? colors.text[theme].disabled : (theme === 'dark' ? colors.text.dark.primary : colors.gray[700]),
      // Dark: same as input (bg.dark.subtle) so "Continue with Google/Apple" match input treatment
      bg: theme === 'dark' ? colors.bg.dark.subtle : colors.bg[theme].default,
      hoverBg: theme === 'light' ? colors.gray[50] : colors.bg.dark.default,
      pressedBg: theme === 'light' ? colors.gray[100] : colors.bg.dark.default,
    },
    primary: {
      border: disabled ? colors.primary[200] : colors.primary[600],
      text: disabled ? colors.primary[300] : colors.primary[600],
      icon: disabled ? colors.primary[300] : colors.primary[600],
      bg: colors.bg[theme].default,
      hoverBg: theme === 'light' ? colors.primary[50] : colors.primary[950],
      pressedBg: theme === 'light' ? colors.primary[100] : colors.primary[900],
    },
    success: {
      border: disabled ? colors.success[200] : colors.success[600],
      text: disabled ? colors.success[300] : colors.success[600],
      icon: disabled ? colors.success[300] : colors.success[600],
      bg: colors.bg[theme].default,
      hoverBg: theme === 'light' ? colors.success[50] : colors.success[900],
      pressedBg: theme === 'light' ? colors.success[100] : colors.success[800],
    },
    error: {
      border: disabled ? colors.error[200] : colors.error[600],
      text: disabled ? colors.error[300] : colors.error[600],
      icon: disabled ? colors.error[300] : colors.error[600],
      bg: colors.bg[theme].default,
      hoverBg: theme === 'light' ? colors.error[50] : colors.error[950],
      pressedBg: theme === 'light' ? colors.error[100] : colors.error[900],
    },
  }

  const styles = colorMap[color as keyof typeof colorMap]

  return {
    container: {
      ...baseContainer,
      backgroundColor: styles.bg,
      borderWidth: 1,
      borderColor: styles.border,
    },
    text: {
      ...baseText,
      color: styles.text,
    },
    iconColor: styles.icon,
    hover: {
      backgroundColor: disabled ? styles.bg : styles.hoverBg,
    },
    pressed: {
      backgroundColor: disabled ? styles.bg : styles.pressedBg,
    },
  }
}

/**
 * Light variant styles
 */
function getLightStyles(
  color: ButtonColor,
  disabled: boolean,
  baseContainer: ViewStyle,
  baseText: TextStyle,
  _iconSize: number,
  theme: ThemeMode
): ButtonStyleConfig {
  const colorMap = {
    gray: {
      bg: disabled ? colors.gray[50] : colors.gray[100],
      hoverBg: colors.gray[200],
      pressedBg: colors.gray[300],
      text: disabled ? colors.text[theme].disabled : colors.gray[700],
      icon: disabled ? colors.text[theme].disabled : colors.gray[700],
    },
    primary: {
      bg: disabled ? colors.primary[50] : colors.primary[100],
      hoverBg: colors.primary[200],
      pressedBg: colors.primary[300],
      text: disabled ? colors.primary[300] : colors.primary[700],
      icon: disabled ? colors.primary[300] : colors.primary[700],
    },
    success: {
      bg: disabled ? colors.success[50] : colors.success[100],
      hoverBg: colors.success[200],
      pressedBg: colors.success[300],
      text: disabled ? colors.success[300] : colors.success[700],
      icon: disabled ? colors.success[300] : colors.success[700],
    },
    error: {
      bg: disabled ? colors.error[50] : colors.error[100],
      hoverBg: colors.error[200],
      pressedBg: colors.error[300],
      text: disabled ? colors.error[300] : colors.error[700],
      icon: disabled ? colors.error[300] : colors.error[700],
    },
  }

  const styles = colorMap[color as keyof typeof colorMap]

  return {
    container: {
      ...baseContainer,
      backgroundColor: styles.bg,
    },
    text: {
      ...baseText,
      color: styles.text,
    },
    iconColor: styles.icon,
    hover: {
      backgroundColor: disabled ? styles.bg : styles.hoverBg,
    },
    pressed: {
      backgroundColor: disabled ? styles.bg : styles.pressedBg,
    },
  }
}

// ============================================================================
// iOS 26 Variant Styles
// ============================================================================

/**
 * Get iOS 26 variant-specific styles (bordered-prominent, bordered, borderless)
 */
function getIOSVariantStyles(
  variant: ButtonVariant,
  disabled: boolean,
  destructive: boolean,
  baseContainer: ViewStyle,
  baseText: TextStyle,
  iconSize: number,
  theme: ThemeMode
): ButtonStyleConfig {
  const accent = destructive
    ? colors.accents[theme].red
    : colors.accents[theme].blue

  if (variant === 'bordered-prominent') {
    // Solid accent background, white text
    const bg = disabled
      ? (theme === 'light' ? 'rgba(120, 120, 128, 0.16)' : 'rgba(120, 120, 128, 0.32)')
      : accent
    const textColor = disabled
      ? colors.labelsVibrant[theme].tertiary
      : colors.white

    return {
      container: { ...baseContainer, backgroundColor: bg },
      text: { ...baseText, color: textColor, fontWeight: '510' as TextStyle['fontWeight'] },
      iconColor: textColor,
      hover: { backgroundColor: disabled ? bg : (destructive ? '#E0303E' : '#0077E0'), opacity: disabled ? 1 : 0.9 },
      pressed: { backgroundColor: disabled ? bg : (destructive ? '#CC2A35' : '#006ACC'), opacity: disabled ? 1 : 0.85 },
    }
  }

  if (variant === 'bordered') {
    // Subtle fill background, accent text
    const bg = colors.fills[theme].secondary
    const textColor = disabled ? colors.labelsVibrant[theme].tertiary : accent

    return {
      container: { ...baseContainer, backgroundColor: bg },
      text: { ...baseText, color: textColor, fontWeight: '510' as TextStyle['fontWeight'] },
      iconColor: textColor,
      hover: { backgroundColor: disabled ? bg : colors.fills[theme].primary },
      pressed: { backgroundColor: disabled ? bg : colors.fills[theme].primary, opacity: 0.85 },
    }
  }

  // borderless — no background, accent text
  const textColor = disabled ? colors.labelsVibrant[theme].tertiary : accent

  return {
    container: { ...baseContainer, backgroundColor: 'transparent' },
    text: { ...baseText, color: textColor },
    iconColor: textColor,
    hover: { backgroundColor: disabled ? 'transparent' : (theme === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.06)') },
    pressed: { backgroundColor: disabled ? 'transparent' : (theme === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)') },
  }
}

/**
 * Text variant styles
 */
function getTextStyles(
  color: ButtonColor,
  disabled: boolean,
  baseContainer: ViewStyle,
  baseText: TextStyle,
  _iconSize: number,
  theme: ThemeMode
): ButtonStyleConfig {
  const colorMap = {
    gray: {
      text: disabled ? colors.text[theme].disabled : colors.gray[700],
      icon: disabled ? colors.text[theme].disabled : colors.gray[700],
      hoverBg: theme === 'light' ? colors.gray[50] : colors.gray[900],
      pressedBg: theme === 'light' ? colors.gray[100] : colors.gray[800],
    },
    primary: {
      text: disabled ? colors.primary[300] : colors.primary[600],
      icon: disabled ? colors.primary[300] : colors.primary[600],
      hoverBg: theme === 'light' ? colors.primary[50] : colors.primary[950],
      pressedBg: theme === 'light' ? colors.primary[100] : colors.primary[900],
    },
    success: {
      text: disabled ? colors.success[300] : colors.success[600],
      icon: disabled ? colors.success[300] : colors.success[600],
      hoverBg: theme === 'light' ? colors.success[50] : colors.success[900],
      pressedBg: theme === 'light' ? colors.success[100] : colors.success[800],
    },
    error: {
      text: disabled ? colors.error[300] : colors.error[600],
      icon: disabled ? colors.error[300] : colors.error[600],
      hoverBg: theme === 'light' ? colors.error[50] : colors.error[950],
      pressedBg: theme === 'light' ? colors.error[100] : colors.error[900],
    },
  }

  const styles = colorMap[color as keyof typeof colorMap]

  return {
    container: {
      ...baseContainer,
      backgroundColor: 'transparent',
    },
    text: {
      ...baseText,
      color: styles.text,
    },
    iconColor: styles.icon,
    hover: {
      backgroundColor: disabled ? 'transparent' : styles.hoverBg,
    },
    pressed: {
      backgroundColor: disabled ? 'transparent' : styles.pressedBg,
    },
  }
}
