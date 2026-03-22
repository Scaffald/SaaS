/**
 * Heading component
 *
 * Semantic heading component (H1-H6) with design system typography tokens.
 * Semantic headings H1–H6 with design system tokens.
 */

import { useMemo } from 'react'
import { Text, Platform, type TextStyle, type AccessibilityRole } from 'react-native'
import type {
  HeadingProps,
  HeadingLevel,
  H1Props,
  H2Props,
  H3Props,
  H4Props,
  H5Props,
  H6Props,
  TextWeight,
} from './Typography.types'
import {
  fontSize,
  lineHeight,
  letterSpacing,
  fontWeight as fontWeightTokens,
} from '../../tokens/typography'
import { colors } from '../../tokens/colors'
import { getFontFamily } from './Typography.styles'

/**
 * Get typography values for a heading level
 */
const getHeadingStyle = (
  level: HeadingLevel,
  weight: TextWeight = 'bold',
  serif?: boolean
): TextStyle => {
  const sizes: Record<HeadingLevel, number> = {
    1: fontSize.h1,
    2: fontSize.h2,
    3: fontSize.h3,
    4: fontSize.h4,
    5: fontSize.h5,
    6: fontSize.h6,
  }

  const lineHeights: Record<HeadingLevel, number> = {
    1: lineHeight.h1,
    2: lineHeight.h2,
    3: lineHeight.h3,
    4: lineHeight.h4,
    5: lineHeight.h5,
    6: lineHeight.h6,
  }

  // Per-heading letter spacing from Apple iOS HIG
  const letterSpacings: Record<HeadingLevel, number> = {
    1: letterSpacing.largeTitle, // 0.4
    2: letterSpacing.title1, // 0.38
    3: letterSpacing.title2, // -0.26
    4: letterSpacing.title3, // -0.45
    5: letterSpacing.headline, // -0.43
    6: letterSpacing.subheadline, // -0.23
  }

  // Default weights per level (can be overridden)
  const defaultWeights: Record<HeadingLevel, TextWeight> = {
    1: 'bold',
    2: 'bold',
    3: 'semibold',
    4: 'semibold',
    5: 'semibold',
    6: 'medium',
  }

  const resolvedWeight = weight || defaultWeights[level]

  return {
    fontFamily: getFontFamily(resolvedWeight, serif),
    fontSize: sizes[level],
    fontWeight: fontWeightTokens[resolvedWeight],
    lineHeight: lineHeights[level],
    letterSpacing: letterSpacings[level],
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
 * Heading component
 *
 * @example
 * <Heading level={1}>Page Title</Heading>
 * <Heading level={2} weight="medium">Section</Heading>
 */
export function Heading({
  level,
  weight,
  serif,
  color,
  align,
  selectable = false,
  style,
  children,
  accessibilityRole,
  ...textProps
}: HeadingProps) {
  const computedStyle = useMemo<TextStyle>(() => {
    const baseStyle = getHeadingStyle(level, weight, serif)

    return {
      ...baseStyle,
      color: resolveColor(color),
      textAlign: align,
    }
  }, [level, weight, serif, color, align])

  // On web, we use accessibilityRole to convey heading semantics
  // React Native Web will render this appropriately
  const role: AccessibilityRole = accessibilityRole || 'header'

  return (
    <Text
      style={[computedStyle, style]}
      selectable={selectable}
      accessibilityRole={role}
      // Web-specific: aria-level for heading hierarchy
      {...(Platform.OS === 'web' && { 'aria-level': level })}
      {...textProps}
    >
      {children}
    </Text>
  )
}

/**
 * H1 component - largest heading
 */
export function H1(props: H1Props) {
  return <Heading {...props} level={1} />
}

/**
 * H2 component
 */
export function H2(props: H2Props) {
  return <Heading {...props} level={2} />
}

/**
 * H3 component
 */
export function H3(props: H3Props) {
  return <Heading {...props} level={3} />
}

/**
 * H4 component
 */
export function H4(props: H4Props) {
  return <Heading {...props} level={4} />
}

/**
 * H5 component
 */
export function H5(props: H5Props) {
  return <Heading {...props} level={5} />
}

/**
 * H6 component - smallest heading
 */
export function H6(props: H6Props) {
  return <Heading {...props} level={6} />
}
