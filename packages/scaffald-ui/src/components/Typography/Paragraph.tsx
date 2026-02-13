/**
 * Paragraph component
 *
 * Body text component with size and weight variants.
 * Body text with size and weight variants.
 */

import { useMemo } from 'react'
import { Text, type TextStyle } from 'react-native'
import type { ParagraphProps, TextSize, TextWeight } from './Typography.types'
import {
  fontSize,
  lineHeight,
  letterSpacing,
  fontFamily,
  fontWeight as fontWeightTokens,
} from '../../tokens/typography'
import { colors } from '../../tokens/colors'

/**
 * Get typography values for paragraph size
 */
const getParagraphStyle = (
  size: TextSize = 'md',
  weight: TextWeight = 'regular',
  serif?: boolean
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
    '2xl': 32, // Approximate for 2xl
  }

  return {
    fontFamily: serif ? fontFamily.serif : fontFamily.body,
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
 * Paragraph component
 *
 * @example
 * // Default paragraph (md size, regular weight)
 * <Paragraph>This is body text content.</Paragraph>
 *
 * // Large paragraph with medium weight
 * <Paragraph size="lg" weight="medium">Important information.</Paragraph>
 *
 * // Small muted paragraph
 * <Paragraph size="sm" color="secondary">Helper text here.</Paragraph>
 */
export function Paragraph({
  size = 'md',
  weight = 'regular',
  serif,
  color,
  align,
  selectable = true,
  style,
  children,
  ...textProps
}: ParagraphProps) {
  const computedStyle = useMemo<TextStyle>(() => {
    const baseStyle = getParagraphStyle(size, weight, serif)

    return {
      ...baseStyle,
      color: resolveColor(color),
      textAlign: align,
    }
  }, [size, weight, serif, color, align])

  return (
    <Text style={[computedStyle, style]} selectable={selectable} {...textProps}>
      {children}
    </Text>
  )
}
