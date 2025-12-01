import type { ComponentType } from 'react'
import { styled, Sheet as TamaguiSheet, withStaticProperties } from 'tamagui'
import type { SheetProps } from 'tamagui'

/**
 * Custom Sheet.Frame with default background color
 * This ensures all action sheets have a consistent background globally
 */
const SheetFrame = styled(TamaguiSheet.Frame, {
  bg: '$color1',
})

const SheetOverlay = styled(TamaguiSheet.Overlay, {
  bg: '$color12',
  opacity: 0.7,
})

/**
 * Sheet - Custom action sheet component with default background
 *
 * This is a wrapper around Tamagui's Sheet component that ensures
 * all Sheet.Frame instances have a consistent background color by default.
 *
 * Usage: Import Sheet from '@unicornlove/ui' and use it like Tamagui's Sheet.
 * All Sheet.Frame components will automatically have bg="$color1" applied.
 */
// Type definition for Sheet with static properties
type SheetComponent = ComponentType<SheetProps> & {
  Frame: typeof SheetFrame
  Overlay: typeof SheetOverlay
  // Include other Sheet static properties from Tamagui
  Handle: typeof TamaguiSheet.Handle
}

// Use double assertion to bypass type inference for declaration generation
export const Sheet = withStaticProperties(TamaguiSheet, {
  Frame: SheetFrame,
  Overlay: SheetOverlay,
}) as unknown as SheetComponent

export type { SheetProps }
