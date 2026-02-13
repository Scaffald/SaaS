/**
 * Separator component
 * Visual divider for separating content
 *
 * Separator creates a horizontal or vertical line to visually separate
 * content sections. It uses the design system's divider tokens for
 * consistent styling.
 *
 * @example
 * ```tsx
 * import { Stack, Separator, Text } from '@scaffald/ui'
 *
 * // Basic horizontal separator
 * <Stack>
 *   <Text>Section 1</Text>
 *   <Separator marginVertical={16} />
 *   <Text>Section 2</Text>
 * </Stack>
 *
 * // Vertical separator in a row
 * <Row align="center" height={40}>
 *   <Text>Left</Text>
 *   <Separator orientation="vertical" marginHorizontal={16} />
 *   <Text>Right</Text>
 * </Row>
 *
 * // Custom styled separator
 * <Separator thickness="medium" color="#000" />
 *
 * // Vertical: <Separator orientation="vertical" />
 * ```
 */

import { useMemo } from 'react'
import { View, type ViewStyle, type DimensionValue } from 'react-native'
import type { SeparatorProps, SeparatorThickness } from './Separator.types'
import type { SpacingValue } from './Box.types'
import { dividerColor, dividerWidth } from '../../tokens/dividers'
import { spacing } from '../../tokens/spacing'

/**
 * Resolve thickness to a number
 */
function resolveThickness(thickness: SeparatorThickness): number {
  if (typeof thickness === 'number') return thickness
  return dividerWidth[thickness]
}

/**
 * Resolve a spacing value to a number
 */
function resolveSpacing(value: SpacingValue | undefined): number | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number') return value
  const key = value as keyof typeof spacing
  return spacing[key]
}

export function Separator({
  orientation = 'horizontal',
  thickness = 'thin',
  color,
  length = '100%',
  margin,
  marginVertical,
  marginHorizontal,
  style,
  ...viewProps
}: SeparatorProps) {
  const computedStyle = useMemo<ViewStyle>(() => {
    const resolvedThickness = resolveThickness(thickness)
    const separatorColor = color ?? dividerColor

    const styles: ViewStyle = {
      backgroundColor: separatorColor,
    }

    if (orientation === 'horizontal') {
      styles.height = resolvedThickness
      styles.width = length as DimensionValue
    } else {
      styles.width = resolvedThickness
      styles.height = length as DimensionValue
    }

    // Margins
    const resolvedMargin = resolveSpacing(margin)
    if (resolvedMargin !== undefined) styles.margin = resolvedMargin

    const resolvedMarginV = resolveSpacing(marginVertical)
    if (resolvedMarginV !== undefined) styles.marginVertical = resolvedMarginV

    const resolvedMarginH = resolveSpacing(marginHorizontal)
    if (resolvedMarginH !== undefined) styles.marginHorizontal = resolvedMarginH

    return styles
  }, [orientation, thickness, color, length, margin, marginVertical, marginHorizontal])

  return (
    <View
      accessibilityRole="none"
      aria-hidden
      style={[computedStyle, style]}
      {...viewProps}
    />
  )
}

export type { SeparatorProps, SeparatorOrientation, SeparatorThickness } from './Separator.types'
