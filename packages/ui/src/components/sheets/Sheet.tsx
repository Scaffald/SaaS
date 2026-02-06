import { forwardRef } from 'react'
import type { ComponentType } from 'react'
// Import Sheet directly from tamagui to preserve static properties (Frame, Overlay, etc.)
// The re-export through @unicornlove/ui doesn't preserve static properties
import { Sheet as TamaguiSheet, withStaticProperties } from 'tamagui'
import type { SheetProps } from 'tamagui'

/**
 * Custom Sheet.Frame with default background color
 * This ensures all action sheets have a consistent background globally
 */
const SheetFrame = forwardRef<unknown, React.ComponentProps<typeof TamaguiSheet.Frame>>(
  (props, _ref) => <TamaguiSheet.Frame background="$color1" {...props} />
)

SheetFrame.displayName = 'SheetFrame'

const SheetOverlay = forwardRef<unknown, React.ComponentProps<typeof TamaguiSheet.Overlay>>(
  (props, _ref) => <TamaguiSheet.Overlay background="$color12" opacity={0.7} {...props} />
)

SheetOverlay.displayName = 'SheetOverlay'

/**
 * Sheet - Custom action sheet component with default background
 *
 * This is a wrapper around Tamagui's Sheet component that ensures
 * all Sheet.Frame instances have a consistent background color by default.
 *
 * Usage: Import Sheet from '@unicornlove/ui' and use it like Tamagui's Sheet.
 * All Sheet.Frame components will automatically have background="$color1" applied.
 */
// Type definition for Sheet with static properties
type SheetComponent = ComponentType<SheetProps> & {
  Frame: typeof SheetFrame
  Overlay: typeof SheetOverlay
  // Include other Sheet static properties from Tamagui
  Handle: typeof TamaguiSheet.Handle
  ScrollView: typeof TamaguiSheet.ScrollView
  Controlled: typeof TamaguiSheet.Controlled
}

// Use double assertion to bypass type inference for declaration generation
export const Sheet = withStaticProperties(TamaguiSheet, {
  Frame: SheetFrame,
  Overlay: SheetOverlay,
  Handle: TamaguiSheet.Handle,
  ScrollView: TamaguiSheet.ScrollView,
  Controlled: TamaguiSheet.Controlled,
}) as unknown as SheetComponent

export type { SheetProps }
