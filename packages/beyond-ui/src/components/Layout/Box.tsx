/**
 * Box component
 * Base container component providing a flexible layout primitive
 *
 * Replaces raw View usage and provides convenient props for common layout patterns.
 * Designed to be the building block for Stack, Row, and other layout components.
 *
 * @example
 * ```tsx
 * import { Box } from '@unicornlove/beyond-ui'
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
 * ```
 */

import { useMemo } from 'react'
import { View, type ViewStyle, type DimensionValue } from 'react-native'
import type { BoxProps, SpacingValue, GapValue, PaddingValue } from './Box.types'
import { spacing, gap as gapTokens, padding as paddingTokens } from '../../tokens/spacing'

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
  const computedStyle = useMemo<ViewStyle>(() => {
    const styles: ViewStyle = {}

    // Gap
    const resolvedGap = resolveGap(gapProp)
    if (resolvedGap !== undefined) styles.gap = resolvedGap
    const resolvedRowGap = resolveGap(rowGap)
    if (resolvedRowGap !== undefined) styles.rowGap = resolvedRowGap
    const resolvedColumnGap = resolveGap(columnGap)
    if (resolvedColumnGap !== undefined) styles.columnGap = resolvedColumnGap

    // Padding
    const resolvedPadding = resolvePadding(paddingProp)
    if (resolvedPadding !== undefined) styles.padding = resolvedPadding
    const resolvedPaddingH = resolvePadding(paddingHorizontal)
    if (resolvedPaddingH !== undefined) styles.paddingHorizontal = resolvedPaddingH
    const resolvedPaddingV = resolvePadding(paddingVertical)
    if (resolvedPaddingV !== undefined) styles.paddingVertical = resolvedPaddingV
    const resolvedPaddingTop = resolvePadding(paddingTop)
    if (resolvedPaddingTop !== undefined) styles.paddingTop = resolvedPaddingTop
    const resolvedPaddingBottom = resolvePadding(paddingBottom)
    if (resolvedPaddingBottom !== undefined) styles.paddingBottom = resolvedPaddingBottom
    const resolvedPaddingLeft = resolvePadding(paddingLeft)
    if (resolvedPaddingLeft !== undefined) styles.paddingLeft = resolvedPaddingLeft
    const resolvedPaddingRight = resolvePadding(paddingRight)
    if (resolvedPaddingRight !== undefined) styles.paddingRight = resolvedPaddingRight

    // Margin
    const resolvedMargin = resolveSpacing(margin)
    if (resolvedMargin !== undefined) styles.margin = resolvedMargin
    const resolvedMarginH = resolveSpacing(marginHorizontal)
    if (resolvedMarginH !== undefined) styles.marginHorizontal = resolvedMarginH
    const resolvedMarginV = resolveSpacing(marginVertical)
    if (resolvedMarginV !== undefined) styles.marginVertical = resolvedMarginV
    const resolvedMarginTop = resolveSpacing(marginTop)
    if (resolvedMarginTop !== undefined) styles.marginTop = resolvedMarginTop
    const resolvedMarginBottom = resolveSpacing(marginBottom)
    if (resolvedMarginBottom !== undefined) styles.marginBottom = resolvedMarginBottom
    const resolvedMarginLeft = resolveSpacing(marginLeft)
    if (resolvedMarginLeft !== undefined) styles.marginLeft = resolvedMarginLeft
    const resolvedMarginRight = resolveSpacing(marginRight)
    if (resolvedMarginRight !== undefined) styles.marginRight = resolvedMarginRight

    // Flexbox
    if (direction !== undefined) styles.flexDirection = direction
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
