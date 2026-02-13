/**
 * Row component
 * Horizontal flex container
 *
 * Row arranges its children in a horizontal row with consistent spacing.
 * It's the primary layout component for horizontal arrangements.
 *
 * @example
 * ```tsx
 * import { Row } from '@scaffald/ui'
 *
 * // Basic usage
 * <Row gap={16}>
 *   <Text>Left</Text>
 *   <Text>Center</Text>
 *   <Text>Right</Text>
 * </Row>
 *
 * // With alignment
 * <Row gap="md" align="center" justify="space-between">
 *   <Button>Left</Button>
 *   <Button>Right</Button>
 * </Row>
 *
 * // With wrapping
 * <Row gap={8} wrap>
 *   <Chip>Tag 1</Chip>
 *   <Chip>Tag 2</Chip>
 *   <Chip>Tag 3</Chip>
 * </Row>
 *
 * // Migration from XStack:
 * // Before: <XStack gap="$4" justifyContent="space-between">
 * // After:  <Row gap={16} justify="space-between">
 * ```
 */

import { Box } from './Box'
import type { RowProps } from './Row.types'

export function Row({
  children,
  gap,
  rowGap,
  padding,
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
  align,
  justify,
  wrap,
  flex,
  flexGrow,
  flexShrink,
  alignSelf,
  width,
  height,
  minWidth,
  maxWidth,
  minHeight,
  maxHeight,
  backgroundColor,
  borderRadius,
  style,
  ...viewProps
}: RowProps) {
  // Convert boolean wrap to FlexWrap value
  const flexWrap = wrap === true ? 'wrap' : wrap === false ? undefined : wrap

  return (
    <Box
      direction="row"
      gap={gap}
      rowGap={rowGap}
      padding={padding}
      paddingHorizontal={paddingHorizontal}
      paddingVertical={paddingVertical}
      paddingTop={paddingTop}
      paddingBottom={paddingBottom}
      paddingLeft={paddingLeft}
      paddingRight={paddingRight}
      margin={margin}
      marginHorizontal={marginHorizontal}
      marginVertical={marginVertical}
      marginTop={marginTop}
      marginBottom={marginBottom}
      marginLeft={marginLeft}
      marginRight={marginRight}
      align={align}
      justify={justify}
      wrap={flexWrap}
      flex={flex}
      flexGrow={flexGrow}
      flexShrink={flexShrink}
      alignSelf={alignSelf}
      width={width}
      height={height}
      minWidth={minWidth}
      maxWidth={maxWidth}
      minHeight={minHeight}
      maxHeight={maxHeight}
      backgroundColor={backgroundColor}
      borderRadius={borderRadius}
      style={style}
      {...viewProps}
    >
      {children}
    </Box>
  )
}

export type { RowProps } from './Row.types'
