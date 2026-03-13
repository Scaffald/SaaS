/**
 * Grid component
 * CSS Grid layout component for responsive layouts
 *
 * @example
 * ```tsx
 * import { Grid } from '@scaffald/ui'
 *
 * // Basic grid with 3 columns
 * <Grid columns={3} gap={16}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * // Responsive grid
 * <Grid
 *   columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
 *   gap={{ base: 12, md: 16, lg: 20 }}
 * >
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 *   <Card>Item 4</Card>
 * </Grid>
 *
 * // Custom template with different gap values
 * <Grid
 *   columns="200px 1fr 1fr"
 *   rowGap={20}
 *   columnGap={40}
 *   autoFlow="row-dense"
 * >
 *   <Card>Sidebar</Card>
 *   <Card>Main content</Card>
 *   <Card>Secondary content</Card>
 * </Grid>
 * ```
 */

import { useMemo } from 'react'
import { View } from 'react-native'
import type { GridProps } from './Grid.types'
import { getGridStyles } from './Grid.styles'
import { useResponsive } from '../../hooks/useResponsive'
import { resolveResponsiveValue } from '../../utils/responsive'
import { gap as gapTokens } from '../../tokens/spacing'
import type { GapValue } from '../Layout/Box.types'

/**
 * Resolve a gap value to a number
 */
function resolveGap(value: GapValue | undefined): number | undefined {
  if (value === undefined) return undefined
  if (typeof value === 'number') return value
  const key = value as keyof typeof gapTokens
  return gapTokens[key]
}

export function Grid({
  children,
  columns,
  rows,
  gap: gapProp,
  rowGap,
  columnGap,
  autoFlow,
  justifyItems,
  alignItems,
  justifyContent,
  alignContent,
  style,
  ...viewProps
}: GridProps) {
  const { width: screenWidth } = useResponsive()

  const computedStyle = useMemo(() => {
    // Resolve responsive values
    const resolvedColumns = resolveResponsiveValue(columns, screenWidth)
    const resolvedRows = resolveResponsiveValue(rows, screenWidth)
    const resolvedGapProp = resolveResponsiveValue(gapProp, screenWidth)
    const resolvedRowGap = resolveResponsiveValue(rowGap, screenWidth)
    const resolvedColumnGap = resolveResponsiveValue(columnGap, screenWidth)

    // Resolve gap tokens to numbers
    const finalGap = resolveGap(resolvedGapProp)
    const finalRowGap = resolveGap(resolvedRowGap)
    const finalColumnGap = resolveGap(resolvedColumnGap)

    // Get styles from factory
    const styles = getGridStyles(
      resolvedColumns,
      resolvedRows,
      finalGap,
      finalRowGap,
      finalColumnGap,
      autoFlow,
      justifyItems,
      alignItems,
      justifyContent,
      alignContent
    )

    return styles.container
  }, [
    screenWidth,
    columns,
    rows,
    gapProp,
    rowGap,
    columnGap,
    autoFlow,
    justifyItems,
    alignItems,
    justifyContent,
    alignContent,
  ])

  return (
    <View style={[computedStyle, style]} {...viewProps}>
      {children}
    </View>
  )
}

export type { GridProps } from './Grid.types'
