/**
 * Text component
 *
 * Flexible text component with size and weight variants.
 * Flexible text with size and weight variants.
 */

import { useMemo } from 'react'
import { Text as RNText, type TextStyle } from 'react-native'
import type { TextProps, TextSize, TextWeight } from './Typography.types'
import {
  fontSize,
  lineHeight,
  letterSpacing,
  fontFamily,
  fontWeight as fontWeightTokens,
} from '../../tokens/typography'
import { colors } from '../../tokens/colors'

/**
 * Get typography values for text size
 */
const getTextStyle = (
  size: TextSize = 'md',
  weight: TextWeight = 'regular',
  serif?: boolean,
  mono?: boolean
): TextStyle => {
  const sizes: Record<TextSize, number> = {
    xs: fontSize.xs,
    sm: fontSize.sm,
    md: fontSize.md,
    lg: fontSize.lg,
    xl: fontSize.xl,
    '2xl': fontSize['2xl'],
  }

  const lineHeights: Record<TextSize, number> = {
    xs: lineHeight.xs,
    sm: lineHeight.sm,
    md: lineHeight.md,
    lg: lineHeight.lg,
    xl: lineHeight.xl,
    '2xl': 32,
  }

  // Determine font family - cast to string to allow different fonts
  let font: string = fontFamily.body
  if (mono) font = fontFamily.mono
  else if (serif) font = fontFamily.serif

  return {
    fontFamily: font,
    fontSize: sizes[size],
    fontWeight: fontWeightTokens[weight],
    lineHeight: lineHeights[size],
    letterSpacing: letterSpacing.normal,
  }
}

/**
 * Resolve color prop to actual color value
 */
const resolveColor = (color?: string): string => {
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
 * Text component (SizableText replacement)
 *
 * @example
 * // Default text (md size, regular weight)
 * <Text>Regular body text</Text>
 *
 * // Small secondary text
 * <Text size="sm" color="secondary">Helper text</Text>
 *
 * // Large bold text
 * <Text size="lg" weight="bold">Important text</Text>
 *
 * // Monospace code text
 * <Text mono size="sm">const x = 42</Text>
 */
export function Text({
  size = 'md',
  weight = 'regular',
  serif,
  mono,
  color,
  align,
  selectable = false,
  style,
  children,
  ...textProps
}: TextProps) {
  const computedStyle = useMemo<TextStyle>(() => {
    const baseStyle = getTextStyle(size, weight, serif, mono)

    return {
      ...baseStyle,
      color: resolveColor(color),
      textAlign: align,
    }
  }, [size, weight, serif, mono, color, align])

  return (
    <RNText style={[computedStyle, style]} selectable={selectable} {...textProps}>
      {children}
    </RNText>
  )
}
