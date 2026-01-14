/**
 * Caption component
 *
 * Small helper/caption text for labels, timestamps, etc.
 */

import { useMemo } from 'react'
import { Text, type TextStyle } from 'react-native'
import type { CaptionProps, } from './Typography.types'
import {
  fontSize,
  lineHeight,
  letterSpacing,
  fontFamily,
  fontWeight as fontWeightTokens,
} from '../../tokens/typography'
import { colors } from '../../tokens/colors'

/**
 * Resolve color prop to actual color value
 */
const resolveColor = (color?: string): string => {
  // Caption defaults to secondary color (more muted)
  if (!color || color === 'inherit') return colors.text.light.secondary
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
 * Caption component
 *
 * @example
 * // Default caption (secondary color)
 * <Caption>Last updated 2 hours ago</Caption>
 *
 * // Primary color caption
 * <Caption color="primary">Important note</Caption>
 *
 * // Bold caption
 * <Caption weight="bold">Section label</Caption>
 */
export function Caption({
  weight = 'regular',
  color,
  align,
  selectable = false,
  style,
  children,
  ...textProps
}: CaptionProps) {
  const computedStyle = useMemo<TextStyle>(() => {
    return {
      fontFamily: fontFamily.body,
      fontSize: fontSize.xs, // 12px
      fontWeight: fontWeightTokens[weight],
      lineHeight: lineHeight.xs, // 16px
      letterSpacing: letterSpacing.normal,
      color: resolveColor(color),
      textAlign: align,
    }
  }, [weight, color, align])

  return (
    <Text style={[computedStyle, style]} selectable={selectable} {...textProps}>
      {children}
    </Text>
  )
}
