/**
 * Grid component styles
 * Style factory for Grid component
 */

import type { ViewStyle } from 'react-native'
import type { GridAutoFlow, GridTemplateColumns, GridTemplateRows } from './Grid.types'

/**
 * Convert columns value to grid-template-columns CSS value
 */
function getTemplateColumns(columns: GridTemplateColumns | undefined): string | undefined {
  if (columns === undefined) return undefined
  if (typeof columns === 'number') {
    return `repeat(${columns}, 1fr)`
  }
  return columns
}

/**
 * Convert rows value to grid-template-rows CSS value
 */
function getTemplateRows(rows: GridTemplateRows | undefined): string | undefined {
  if (rows === undefined) return undefined
  if (typeof rows === 'number') {
    return `repeat(${rows}, 1fr)`
  }
  return rows
}

/**
 * Convert autoFlow to grid-auto-flow CSS value
 */
function getAutoFlow(autoFlow: GridAutoFlow | undefined): string | undefined {
  if (autoFlow === undefined) return undefined

  switch (autoFlow) {
    case 'row-dense':
      return 'row dense'
    case 'column-dense':
      return 'column dense'
    default:
      return autoFlow
  }
}

export interface GridStyleConfig {
  container: ViewStyle
}

/**
 * Get Grid component styles
 */
export function getGridStyles(
  columns: GridTemplateColumns | undefined,
  rows: GridTemplateRows | undefined,
  gap: number | undefined,
  rowGap: number | undefined,
  columnGap: number | undefined,
  autoFlow: GridAutoFlow | undefined,
  justifyItems: string | undefined,
  alignItems: string | undefined,
  justifyContent: string | undefined,
  alignContent: string | undefined
): GridStyleConfig {
  const webStyles: Record<string, unknown> = {
    display: 'grid',
  }

  // Template columns
  const templateColumns = getTemplateColumns(columns)
  if (templateColumns) {
    webStyles.gridTemplateColumns = templateColumns
  }

  // Template rows
  const templateRows = getTemplateRows(rows)
  if (templateRows) {
    webStyles.gridTemplateRows = templateRows
  }

  // Gaps
  if (gap !== undefined) {
    webStyles.gap = gap
  }
  if (rowGap !== undefined) {
    webStyles.rowGap = rowGap
  }
  if (columnGap !== undefined) {
    webStyles.columnGap = columnGap
  }

  // Auto flow
  const flow = getAutoFlow(autoFlow)
  if (flow) {
    webStyles.gridAutoFlow = flow
  }

  // Alignment
  if (justifyItems) {
    webStyles.justifyItems = justifyItems
  }
  if (alignItems) {
    webStyles.alignItems = alignItems
  }
  if (justifyContent) {
    webStyles.justifyContent = justifyContent
  }
  if (alignContent) {
    webStyles.alignContent = alignContent
  }

  return {
    container: webStyles as ViewStyle,
  }
}

export interface GridItemStyleConfig {
  item: ViewStyle
}

/**
 * Get GridItem component styles
 */
export function getGridItemStyles(
  colStart: number | undefined,
  colEnd: number | undefined,
  colSpan: number | undefined,
  rowStart: number | undefined,
  rowEnd: number | undefined,
  rowSpan: number | undefined,
  justifySelf: string | undefined,
  alignSelf: string | undefined
): GridItemStyleConfig {
  const webStyles: Record<string, unknown> = {}

  // Column placement
  if (colStart !== undefined) {
    webStyles.gridColumnStart = colStart
  }
  if (colEnd !== undefined) {
    webStyles.gridColumnEnd = colEnd
  }
  if (colSpan !== undefined) {
    webStyles.gridColumn = `span ${colSpan}`
  }

  // Row placement
  if (rowStart !== undefined) {
    webStyles.gridRowStart = rowStart
  }
  if (rowEnd !== undefined) {
    webStyles.gridRowEnd = rowEnd
  }
  if (rowSpan !== undefined) {
    webStyles.gridRow = `span ${rowSpan}`
  }

  // Self alignment
  if (justifySelf) {
    webStyles.justifySelf = justifySelf
  }
  if (alignSelf) {
    webStyles.alignSelf = alignSelf
  }

  return {
    item: webStyles as ViewStyle,
  }
}
