/**
 * Grid component
 * CSS Grid-based layout component with responsive breakpoints
 *
 * @example
 * ```tsx
 * import { Grid, GridItem } from '@unicornlove/beyond-ui'
 *
 * // Basic grid with 3 columns
 * <Grid columns={3} gap="md">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * // Responsive grid
 * <Grid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={{ base: 'sm', md: 'lg' }}>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * // Grid with auto-fit columns (minimum 200px per column)
 * <Grid minColumnWidth={200} gap="md">
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 *   <Card>Item 3</Card>
 * </Grid>
 *
 * // Grid with custom item spans
 * <Grid columns={12} gap="md">
 *   <GridItem colSpan={8}><Card>Main content</Card></GridItem>
 *   <GridItem colSpan={4}><Card>Sidebar</Card></GridItem>
 * </Grid>
 * ```
 */

import { View, Platform, StyleSheet } from 'react-native'
import { useResponsive } from '../../hooks/useResponsive'
import type { ResponsiveValue } from '../../hooks/useResponsive'
import { spacing } from '../../tokens/spacing'
import type { GridProps, GridItemProps, GapValue } from './Grid.types'

// Helper to resolve responsive values
function resolveResponsiveValue<T>(
  value: T | ResponsiveValue<T> | undefined,
  currentBreakpoint: string
): T | undefined {
  if (value === undefined) return undefined
  if (typeof value !== 'object' || value === null) return value as T

  const responsiveValue = value as ResponsiveValue<T>

  // Breakpoint priority order: exact match > smaller breakpoints
  const breakpoints = ['base', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = breakpoints.indexOf(currentBreakpoint)

  // Start from current breakpoint and work backwards
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpoints[i] as keyof ResponsiveValue<T>
    if (responsiveValue[bp] !== undefined) {
      return responsiveValue[bp]
    }
  }

  return undefined
}

// Helper to convert gap value to pixels
function getGapValue(gap: GapValue | undefined): number {
  if (gap === undefined) return 0
  if (typeof gap === 'number') return gap

  // Map gap names to spacing tokens
  const gapMap: Record<string, number> = {
    none: spacing[0],
    '3xs': spacing[1],
    '2xs': spacing[2],
    xs: spacing[4],
    sm: spacing[6],
    md: spacing[8],
    lg: spacing[12],
    xl: spacing[16],
    '2xl': spacing[20],
    '3xl': spacing[24],
    '4xl': spacing[32],
  }

  return gapMap[gap] || spacing[8] // default to 8px
}

export function Grid({
  columns = 12,
  rows,
  gap,
  columnGap,
  rowGap,
  autoFlow = 'row',
  justifyItems = 'stretch',
  alignItems = 'stretch',
  justifyContent,
  alignContent,
  minColumnWidth,
  children,
  style,
  testID,
}: GridProps) {
  const { breakpoint: currentBreakpoint } = useResponsive()

  // Resolve responsive values
  const resolvedColumns = resolveResponsiveValue(columns, currentBreakpoint) || 12
  const resolvedRows = resolveResponsiveValue(rows, currentBreakpoint)
  const resolvedGap = resolveResponsiveValue(gap, currentBreakpoint)
  const resolvedColumnGap = resolveResponsiveValue(columnGap, currentBreakpoint)
  const resolvedRowGap = resolveResponsiveValue(rowGap, currentBreakpoint)

  // Calculate gap values
  const gapValue = getGapValue(resolvedGap)
  const columnGapValue = getGapValue(resolvedColumnGap) || gapValue
  const rowGapValue = getGapValue(resolvedRowGap) || gapValue

  if (Platform.OS === 'web') {
    // Use CSS Grid on web
    const gridTemplateColumns = minColumnWidth
      ? `repeat(auto-fit, minmax(${typeof minColumnWidth === 'number' ? `${minColumnWidth}px` : minColumnWidth}, 1fr))`
      : `repeat(${resolvedColumns}, 1fr)`

    const gridTemplateRows = resolvedRows ? `repeat(${resolvedRows}, auto)` : undefined

    const webStyle = {
      display: 'grid',
      gridTemplateColumns,
      gridTemplateRows,
      gridAutoFlow: autoFlow,
      gap: `${rowGapValue}px ${columnGapValue}px`,
      justifyItems,
      alignItems,
      justifyContent,
      alignContent,
    } as any // Type assertion for CSS Grid properties not in React Native ViewStyle

    return (
      <View style={[webStyle, style]} testID={testID}>
        {children}
      </View>
    )
  }

  // Fallback to flexbox for React Native
  // This is a simplified layout - true grid behavior requires custom layout on native
  const nativeStyle = {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    marginHorizontal: -columnGapValue / 2,
    marginVertical: -rowGapValue / 2,
    alignItems: alignItems as any,
    justifyContent: justifyContent as any,
  }

  return (
    <View style={[nativeStyle, style]} testID={testID}>
      {children}
    </View>
  )
}

export function GridItem({
  colSpan,
  rowSpan,
  colStart,
  colEnd,
  rowStart,
  rowEnd,
  justifySelf,
  alignSelf,
  children,
  style,
  testID,
}: GridItemProps) {
  const { breakpoint: currentBreakpoint } = useResponsive()

  // Resolve responsive values
  const resolvedColSpan = resolveResponsiveValue(colSpan, currentBreakpoint)
  const resolvedRowSpan = resolveResponsiveValue(rowSpan, currentBreakpoint)
  const resolvedColStart = resolveResponsiveValue(colStart, currentBreakpoint)
  const resolvedColEnd = resolveResponsiveValue(colEnd, currentBreakpoint)
  const resolvedRowStart = resolveResponsiveValue(rowStart, currentBreakpoint)
  const resolvedRowEnd = resolveResponsiveValue(rowEnd, currentBreakpoint)

  if (Platform.OS === 'web') {
    // Use CSS Grid properties on web
    const webStyle = {
      gridColumn: resolvedColSpan
        ? `span ${resolvedColSpan}`
        : resolvedColStart && resolvedColEnd
          ? `${resolvedColStart} / ${resolvedColEnd}`
          : resolvedColStart
            ? `${resolvedColStart}`
            : undefined,
      gridRow: resolvedRowSpan
        ? `span ${resolvedRowSpan}`
        : resolvedRowStart && resolvedRowEnd
          ? `${resolvedRowStart} / ${resolvedRowEnd}`
          : resolvedRowStart
            ? `${resolvedRowStart}`
            : undefined,
      justifySelf,
      alignSelf,
    } as any // Type assertion for CSS Grid properties

    return (
      <View style={[webStyle, style]} testID={testID}>
        {children}
      </View>
    )
  }

  // Fallback for React Native
  // Calculate flex basis based on colSpan
  const flexBasis = resolvedColSpan ? `${(resolvedColSpan / 12) * 100}%` : undefined

  const nativeStyle = {
    flexBasis: flexBasis as any,
    flexGrow: 0,
    flexShrink: 0,
    alignSelf: alignSelf as any,
  }

  return (
    <View style={[nativeStyle, style]} testID={testID}>
      {children}
    </View>
  )
}

// Export types
export type { GridProps, GridItemProps, GridAutoFlow, GridJustifyItems, GridAlignItems, GridJustifyContent, GridAlignContent, GapValue } from './Grid.types'
