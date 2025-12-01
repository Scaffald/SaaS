import { styled, Popover as TamaguiPopover, withStaticProperties } from 'tamagui'

/**
 * Custom Popover.Content with default background color
 * This ensures all popovers have a consistent background globally
 */
const PopoverContent = styled(TamaguiPopover.Content, {
  bg: '$gray1',
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
 * All Popover.Content components will automatically have bg="$color1" applied.
 */
export const Popover = withStaticProperties(TamaguiPopover, {
  Content: PopoverContent,
})

export type { PopoverProps } from 'tamagui'
