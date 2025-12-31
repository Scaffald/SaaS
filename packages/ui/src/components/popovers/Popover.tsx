import { styled, Popover as TamaguiPopover, withStaticProperties } from '@unicornlove/ui'
import type { PopoverProps } from '@unicornlove/ui'

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
// Type definition: include all Popover static properties from Tamagui, override Content
type PopoverComponent = typeof TamaguiPopover & {
  Content: typeof PopoverContent
}

// Use type assertion to access static properties that TypeScript doesn't see on the base type
// These properties exist at runtime but aren't in the TypeScript type definition
const TamaguiPopoverWithStatics = TamaguiPopover as typeof TamaguiPopover & Record<string, unknown>

// Use double assertion to bypass type inference for declaration generation
export const Popover = withStaticProperties(TamaguiPopover, {
  Content: PopoverContent,
  Anchor: TamaguiPopoverWithStatics.Anchor,
  Trigger: TamaguiPopoverWithStatics.Trigger,
  Portal: TamaguiPopoverWithStatics.Portal,
  Overlay: TamaguiPopoverWithStatics.Overlay,
  Title: TamaguiPopoverWithStatics.Title,
  Description: TamaguiPopoverWithStatics.Description,
  Close: TamaguiPopoverWithStatics.Close,
  Sheet: TamaguiPopoverWithStatics.Sheet,
  FocusScope: TamaguiPopoverWithStatics.FocusScope,
  Adapt: TamaguiPopoverWithStatics.Adapt,
}) as unknown as PopoverComponent

export type { PopoverProps }
