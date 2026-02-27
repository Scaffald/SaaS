/**
 * Layout components
 *
 * A collection of layout primitives for building flexible UI layouts.
 * Layout primitives: Box, Stack, Row, Spacer, Separator.
 *
 * @example
 * ```tsx
 * import { Box, Stack, Row, Spacer, Separator } from '@scaffald/ui'
 *
 * // Vertical layout
 * <Stack gap={16}>
 *   <Text>First</Text>
 *   <Text>Second</Text>
 * </Stack>
 *
 * // Horizontal layout with push
 * <Row>
 *   <Button>Left</Button>
 *   <Spacer />
 *   <Button>Right</Button>
 * </Row>
 * ```
 */

// Box - Base container component
export { Box } from './Box'
export type { BoxProps, SpacingValue, GapValue, PaddingValue, AlignItems, JustifyContent, FlexDirection, FlexWrap, Position } from './Box.types'

// Stack - Vertical flex container (YStack replacement)
export { Stack } from './Stack'
export type { StackProps } from './Stack.types'

// Row - Horizontal flex container (XStack replacement)
export { Row } from './Row'
export type { RowProps } from './Row.types'

// Spacer - Flexible space component
export { Spacer } from './Spacer'
export type { SpacerProps } from './Spacer.types'

// Separator - Visual divider component
export { Separator } from './Separator'
export type { SeparatorProps, SeparatorOrientation, SeparatorThickness } from './Separator.types'
