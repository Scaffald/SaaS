/**
 * Button component styles
 * All styles mapped from Figma Forsured Design System
 */

import type { ViewStyle, TextStyle } from 'react-native'
import { colors } from '../../tokens/colors'
import type { ThemeMode } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { shadows } from '../../tokens/shadows'
import type { ButtonColor, ButtonVariant, ButtonSize, ButtonStyleConfig } from './Button.types'

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
 * Get button styles based on variant, color, size, state, and theme
 */
export function getButtonStyles(
  color: ButtonColor,
  variant: ButtonVariant,
  size: ButtonSize,
  disabled: boolean,
  iconOnly: boolean,
  theme: ThemeMode = 'light'
): ButtonStyleConfig {
  // Safety check: ensure size is valid, fallback to 'md' if invalid
  const validSize: ButtonSize = sizeConfig[size] ? size : 'md'
  const sizeStyles = sizeConfig[validSize]

  // Base container styles
  const baseContainer: ViewStyle = {
    height: sizeStyles.height,
    minWidth: iconOnly ? sizeStyles.minWidth : undefined,
    paddingHorizontal: iconOnly ? 0 : sizeStyles.paddingHorizontal,
    paddingVertical: sizeStyles.paddingVertical,
    borderRadius: borderRadius.m,
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

  // Text variant
  return getTextStyles(color, disabled, baseContainer, baseText, iconSize, theme)
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
      text: disabled ? colors.text[theme].disabled : colors.gray[700],
      icon: disabled ? colors.text[theme].disabled : colors.gray[700],
      bg: colors.bg[theme].default,
      hoverBg: theme === 'light' ? colors.gray[50] : colors.gray[900],
      pressedBg: theme === 'light' ? colors.gray[100] : colors.gray[800],
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
