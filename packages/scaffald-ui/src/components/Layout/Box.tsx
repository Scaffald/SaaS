/**
 * Box component
 * Base container component providing a flexible layout primitive
 *
 * Replaces raw View usage and provides convenient props for common layout patterns.
 * Designed to be the building block for Stack, Row, and other layout components.
 *
 * @example
 * ```tsx
 * import { Box } from '@scaffald/ui'
 *
 * // Basic usage
 * <Box padding={16} gap={8}>
 *   <Text>Content</Text>
 * </Box>
 *
 * // With flex layout
 * <Box direction="row" justify="space-between" align="center">
 *   <Text>Left</Text>
 *   <Text>Right</Text>
 * </Box>
 *
 * // Using tokens
 * <Box padding="xl" gap="md">
 *   <Text>Tokenized spacing</Text>
 * </Box>
 *
 * // Responsive props
 * <Box
 *   padding={{ base: 8, md: 16, lg: 24 }}
 *   gap={{ base: 'sm', md: 'md', lg: 'lg' }}
 *   direction={{ base: 'column', md: 'row' }}
 * >
 *   <Text>Responsive layout</Text>
 * </Box>
 * ```
 */

import { useMemo } from 'react'
import { View, type ViewStyle, type DimensionValue } from 'react-native'
import type { BoxProps, SpacingValue, GapValue, PaddingValue } from './Box.types'
import { spacing, gap as gapTokens, padding as paddingTokens } from '../../tokens/spacing'
import { useResponsive } from '../../hooks/useResponsive'
import { resolveResponsiveValue } from '../../utils/responsive'

/**
 * Resolve a spacing value to a number
 * Supports both direct numbers and token keys
 */
function resolveSpacing(value: SpacingValue | undefined): number | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number') return value
  // TypeScript knows value is a string key at this point
  const key = value as keyof typeof spacing
  return spacing[key]
}

/**
 * Resolve a gap value to a number
 */
function resolveGap(value: GapValue | undefined): number | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number') return value
  const key = value as keyof typeof gapTokens
  return gapTokens[key]
}

/**
 * Resolve a padding value to a number
 */
function resolvePadding(value: PaddingValue | undefined): number | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number') return value
  const key = value as keyof typeof paddingTokens
  return paddingTokens[key]
}

export function Box({
  children,
  // Spacing
  gap: gapProp,
  rowGap,
  columnGap,
  padding: paddingProp,
  paddingHorizontal,
  paddingVertical,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  margin,
  marginHorizontal,
  marginVertical,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  // Flexbox
  direction,
  align,
  justify,
  wrap,
  flex,
  flexGrow,
  flexShrink,
  flexBasis,
  alignSelf,
  // Dimensions
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  // Position
  position,
  top,
  bottom,
  left,
  right,
  zIndex,
  // Appearance
  backgroundColor,
  borderRadius,
  overflow,
  // Style
  style,
  ...viewProps
}: BoxProps) {
  const { width: screenWidth } = useResponsive()

  const computedStyle = useMemo<ViewStyle>(() => {
    const styles: ViewStyle = {}

    // Resolve responsive values first
    const resolvedDirection = resolveResponsiveValue(direction, screenWidth)
    const resolvedGapProp = resolveResponsiveValue(gapProp, screenWidth)
    const resolvedRowGap = resolveResponsiveValue(rowGap, screenWidth)
    const resolvedColumnGap = resolveResponsiveValue(columnGap, screenWidth)
    const resolvedPaddingProp = resolveResponsiveValue(paddingProp, screenWidth)
    const resolvedPaddingH = resolveResponsiveValue(paddingHorizontal, screenWidth)
    const resolvedPaddingV = resolveResponsiveValue(paddingVertical, screenWidth)
    const resolvedPaddingTop = resolveResponsiveValue(paddingTop, screenWidth)
    const resolvedPaddingBottom = resolveResponsiveValue(paddingBottom, screenWidth)
    const resolvedPaddingLeft = resolveResponsiveValue(paddingLeft, screenWidth)
    const resolvedPaddingRight = resolveResponsiveValue(paddingRight, screenWidth)
    const resolvedMargin = resolveResponsiveValue(margin, screenWidth)
    const resolvedMarginH = resolveResponsiveValue(marginHorizontal, screenWidth)
    const resolvedMarginV = resolveResponsiveValue(marginVertical, screenWidth)
    const resolvedMarginTop = resolveResponsiveValue(marginTop, screenWidth)
    const resolvedMarginBottom = resolveResponsiveValue(marginBottom, screenWidth)
    const resolvedMarginLeft = resolveResponsiveValue(marginLeft, screenWidth)
    const resolvedMarginRight = resolveResponsiveValue(marginRight, screenWidth)

    // Gap
    const finalGap = resolveGap(resolvedGapProp)
    if (finalGap !== undefined) styles.gap = finalGap
    const finalRowGap = resolveGap(resolvedRowGap)
    if (finalRowGap !== undefined) styles.rowGap = finalRowGap
    const finalColumnGap = resolveGap(resolvedColumnGap)
    if (finalColumnGap !== undefined) styles.columnGap = finalColumnGap

    // Padding
    const finalPadding = resolvePadding(resolvedPaddingProp)
    if (finalPadding !== undefined) styles.padding = finalPadding
    const finalPaddingH = resolvePadding(resolvedPaddingH)
    if (finalPaddingH !== undefined) styles.paddingHorizontal = finalPaddingH
    const finalPaddingV = resolvePadding(resolvedPaddingV)
    if (finalPaddingV !== undefined) styles.paddingVertical = finalPaddingV
    const finalPaddingTop = resolvePadding(resolvedPaddingTop)
    if (finalPaddingTop !== undefined) styles.paddingTop = finalPaddingTop
    const finalPaddingBottom = resolvePadding(resolvedPaddingBottom)
    if (finalPaddingBottom !== undefined) styles.paddingBottom = finalPaddingBottom
    const finalPaddingLeft = resolvePadding(resolvedPaddingLeft)
    if (finalPaddingLeft !== undefined) styles.paddingLeft = finalPaddingLeft
    const finalPaddingRight = resolvePadding(resolvedPaddingRight)
    if (finalPaddingRight !== undefined) styles.paddingRight = finalPaddingRight

    // Margin
    const finalMargin = resolveSpacing(resolvedMargin)
    if (finalMargin !== undefined) styles.margin = finalMargin
    const finalMarginH = resolveSpacing(resolvedMarginH)
    if (finalMarginH !== undefined) styles.marginHorizontal = finalMarginH
    const finalMarginV = resolveSpacing(resolvedMarginV)
    if (finalMarginV !== undefined) styles.marginVertical = finalMarginV
    const finalMarginTop = resolveSpacing(resolvedMarginTop)
    if (finalMarginTop !== undefined) styles.marginTop = finalMarginTop
    const finalMarginBottom = resolveSpacing(resolvedMarginBottom)
    if (finalMarginBottom !== undefined) styles.marginBottom = finalMarginBottom
    const finalMarginLeft = resolveSpacing(resolvedMarginLeft)
    if (finalMarginLeft !== undefined) styles.marginLeft = finalMarginLeft
    const finalMarginRight = resolveSpacing(resolvedMarginRight)
    if (finalMarginRight !== undefined) styles.marginRight = finalMarginRight

    // Flexbox
    if (resolvedDirection !== undefined) styles.flexDirection = resolvedDirection
    if (align !== undefined) styles.alignItems = align
    if (justify !== undefined) styles.justifyContent = justify
    if (wrap !== undefined) styles.flexWrap = wrap
    if (flex !== undefined) styles.flex = flex
    if (flexGrow !== undefined) styles.flexGrow = flexGrow
    if (flexShrink !== undefined) styles.flexShrink = flexShrink
    if (flexBasis !== undefined) styles.flexBasis = flexBasis as DimensionValue
    if (alignSelf !== undefined) styles.alignSelf = alignSelf

    // Dimensions - cast to DimensionValue for React Native compatibility
    if (width !== undefined) styles.width = width as DimensionValue
    if (height !== undefined) styles.height = height as DimensionValue
    if (minWidth !== undefined) styles.minWidth = width as DimensionValue
    if (maxWidth !== undefined) styles.maxWidth = maxWidth as DimensionValue
    if (minHeight !== undefined) styles.minHeight = minHeight as DimensionValue
    if (maxHeight !== undefined) styles.maxHeight = maxHeight as DimensionValue

    // Position
    if (position !== undefined) styles.position = position
    if (top !== undefined) styles.top = top as DimensionValue
    if (bottom !== undefined) styles.bottom = bottom as DimensionValue
    if (left !== undefined) styles.left = left as DimensionValue
    if (right !== undefined) styles.right = right as DimensionValue
    if (zIndex !== undefined) styles.zIndex = zIndex

    // Appearance
    if (backgroundColor !== undefined) styles.backgroundColor = backgroundColor
    if (borderRadius !== undefined) styles.borderRadius = borderRadius
    if (overflow !== undefined) styles.overflow = overflow

    return styles
  }, [
    screenWidth,
    gapProp,
    rowGap,
    columnGap,
    paddingProp,
    paddingHorizontal,
    paddingVertical,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
    margin,
    marginHorizontal,
    marginVertical,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    direction,
    align,
    justify,
    wrap,
    flex,
    flexGrow,
    flexShrink,
    flexBasis,
    alignSelf,
    width,
    height,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    position,
    top,
    bottom,
    left,
    right,
    zIndex,
    backgroundColor,
    borderRadius,
    overflow,
  ])

  return (
    <View style={[computedStyle, style]} {...viewProps}>
      {children}
    </View>
  )
}

export type { BoxProps } from './Box.types'
