/**
 * Label component
 *
 * Form field label with accessibility support.
 * Provides proper semantics for form fields.
 */

import { useMemo } from 'react'
import { Text, Platform, type TextStyle } from 'react-native'
import type { LabelProps, TextWeight } from './Typography.types'
import {
  fontSize,
  lineHeight,
  letterSpacing,
  fontFamily,
  fontWeight as fontWeightTokens,
} from '../../tokens/typography'
import { colors } from '../../tokens/colors'

/**
 * Get typography values for label size
 */
const getLabelStyle = (
  size: 'sm' | 'md' | 'lg' = 'md',
  weight: TextWeight = 'medium'
): TextStyle => {
  const sizes = {
    sm: fontSize.xs,
    md: fontSize.sm,
    lg: fontSize.md,
  }

  const lineHeights = {
    sm: lineHeight.xs,
    md: lineHeight.sm,
    lg: lineHeight.md,
  }

  return {
    fontFamily: fontFamily.body,
    fontSize: sizes[size],
    fontWeight: fontWeightTokens[weight],
    lineHeight: lineHeights[size],
    letterSpacing: letterSpacing.normal,
  }
}

/**
 * Resolve color prop to actual color value
 */
const resolveColor = (color?: string, disabled?: boolean): string => {
  if (disabled) return colors.text.light.disabled
  if (!color || color === 'inherit') return colors.text.light.primary
  if (color === 'primary') return colors.text.light.primary
  if (color === 'secondary') return colors.text.light.secondary
  if (color === 'tertiary') return colors.text.light.tertiary
  if (color === 'disabled') return colors.text.light.disabled
  if (color === 'error') return colors.error[500]
  if (color === 'success') return colors.success[500]
  if (color === 'warning') return colors.warning[500]
  return color // Custom color string
}

/**
 * Label component
 *
 * @example
 * // Basic form label
 * <Label htmlFor="email">Email Address</Label>
 *
 * // Required field label
 * <Label htmlFor="name" required>Full Name</Label>
 *
 * // Disabled label
 * <Label htmlFor="disabled-field" disabled>Unavailable Field</Label>
 */
export function Label({
  htmlFor,
  size = 'md',
  weight = 'medium',
  required,
  disabled,
  color,
  align,
  style,
  children,
  ...textProps
}: LabelProps) {
  const computedStyle = useMemo<TextStyle>(() => {
    const baseStyle = getLabelStyle(size, weight)

    return {
      ...baseStyle,
      color: resolveColor(color, disabled),
      textAlign: align,
    }
  }, [size, weight, color, disabled, align])

  // On web, we add nativeID to associate with form elements
  const webProps =
    Platform.OS === 'web'
      ? {
          nativeID: htmlFor,
          // Add accessibilityRole for screen readers
          accessibilityRole: 'text' as const,
        }
      : {}

  return (
    <Text style={[computedStyle, style]} {...webProps} {...textProps}>
      {children}
      {required && (
        <Text style={{ color: colors.error[500] }}> *</Text>
      )}
    </Text>
  )
}
