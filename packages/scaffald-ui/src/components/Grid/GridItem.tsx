/**
 * GridItem component
 * Optional wrapper for grid items with placement control
 *
 * @example
 * ```tsx
 * import { Grid, GridItem } from '@scaffald/ui'
 *
 * <Grid columns={4} gap={16}>
 *   <GridItem colSpan={2}>
 *     <Card>Spans 2 columns</Card>
 *   </GridItem>
 *   <GridItem>
 *     <Card>Normal item</Card>
 *   </GridItem>
 *   <GridItem rowSpan={2}>
 *     <Card>Spans 2 rows</Card>
 *   </GridItem>
 * </Grid>
 * ```
 */

import { View } from 'react-native'
import type { GridItemProps } from './Grid.types'
import { getGridItemStyles } from './Grid.styles'

export function GridItem({
  children,
  colStart,
  colEnd,
  colSpan,
  rowStart,
  rowEnd,
  rowSpan,
  justifySelf,
  alignSelf,
  style,
  ...viewProps
}: GridItemProps) {
  const styles = getGridItemStyles(
    colStart,
    colEnd,
    colSpan,
    rowStart,
    rowEnd,
    rowSpan,
    justifySelf,
    alignSelf
  )

  return (
    <View style={[styles.item, style]} {...viewProps}>
      {children}
    </View>
  )
}

export type { GridItemProps } from './Grid.types'
