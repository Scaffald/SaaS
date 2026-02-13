/**
 * Stack component
 * Vertical flex container
 *
 * Stack arranges its children in a vertical column with consistent spacing.
 * It's the primary layout component for vertical arrangements.
 *
 * @example
 * ```tsx
 * import { Stack } from '@scaffald/ui'
 *
 * // Basic usage
 * <Stack gap={16}>
 *   <Text>First</Text>
 *   <Text>Second</Text>
 *   <Text>Third</Text>
 * </Stack>
 *
 * // With alignment
 * <Stack gap="md" align="center" justify="space-between">
 *   <Button>Top</Button>
 *   <Button>Middle</Button>
 *   <Button>Bottom</Button>
 * </Stack>
 *
 * // Responsive spacing
 * <Stack
 *   gap={{ base: 8, md: 16, lg: 24 }}
 *   padding={{ base: 12, md: 20, lg: 32 }}
 * >
 *   <Card>Responsive card 1</Card>
 *   <Card>Responsive card 2</Card>
 * </Stack>
 *
 * // Migration from YStack:
 * // Before: <YStack gap="$4" padding="$3">
 * // After:  <Stack gap={16} padding={12}>
 * ```
 */

import { Box } from './Box'
import type { StackProps } from './Stack.types'

export function Stack({
  children,
  gap,
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
}: StackProps) {
  return (
    <Box
      direction="column"
      gap={gap}
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

export type { StackProps } from './Stack.types'
