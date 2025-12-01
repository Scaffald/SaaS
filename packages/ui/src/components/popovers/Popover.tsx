import type { ComponentType } from 'react'
import { styled, Popover as TamaguiPopover, withStaticProperties } from 'tamagui'
import type { PopoverProps } from 'tamagui'

/**
 * Custom Popover.Content with default background color
 * This ensures all popovers have a consistent background globally
 */
const PopoverContent = styled(TamaguiPopover.Content, {
  backgroundColor: '$gray1',
  borderWidth: 0,
  borderColor: 'transparent',
  boxShadow: '$shadowColor',
  elevate: true,
})

/**
 * Popover - Custom popover component with default background
 *
 * This is a wrapper around Tamagui's Popover component that ensures
 * all Popover.Content instances have a consistent background color by default.
 *
 * Usage: Import Popover from '@unicornlove/ui' and use it like Tamagui's Popover.
 * All Popover.Content components will automatically have backgroundColor="$color1" applied.
 */
// Type definition for Popover with static properties
type PopoverComponent = ComponentType<PopoverProps> & {
  Content: typeof PopoverContent
  // Include other Popover static properties from Tamagui
  Anchor: typeof TamaguiPopover.Anchor
  Trigger: typeof TamaguiPopover.Trigger
  Portal: typeof TamaguiPopover.Portal
  Overlay: typeof TamaguiPopover.Overlay
  Title: typeof TamaguiPopover.Title
  Description: typeof TamaguiPopover.Description
  Close: typeof TamaguiPopover.Close
  Sheet: typeof TamaguiPopover.Sheet
  FocusScope: typeof TamaguiPopover.FocusScope
  Adapt: typeof TamaguiPopover.Adapt
}

// Use double assertion to bypass type inference for declaration generation
export const Popover = withStaticProperties(TamaguiPopover, {
  Content: PopoverContent,
  Anchor: TamaguiPopover.Anchor,
  Trigger: TamaguiPopover.Trigger,
  Portal: TamaguiPopover.Portal,
  Overlay: TamaguiPopover.Overlay,
  Title: TamaguiPopover.Title,
  Description: TamaguiPopover.Description,
  Close: TamaguiPopover.Close,
  Sheet: TamaguiPopover.Sheet,
  FocusScope: TamaguiPopover.FocusScope,
  Adapt: TamaguiPopover.Adapt,
}) as unknown as PopoverComponent

export type { PopoverProps }
