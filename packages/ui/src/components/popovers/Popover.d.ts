import type { ComponentType } from 'react'
import type { PopoverProps } from 'tamagui'

declare const PopoverContent: ComponentType<any>
declare const TamaguiPopover: ComponentType<PopoverProps> & {
  Anchor: ComponentType<any>
  Trigger: ComponentType<any>
  Close: ComponentType<any>
}

export type PopoverComponent = ComponentType<PopoverProps> & {
  Content: typeof PopoverContent
  Anchor: typeof TamaguiPopover.Anchor
  Trigger: typeof TamaguiPopover.Trigger
  Close: typeof TamaguiPopover.Close
}

declare const Popover: PopoverComponent
export { Popover }
export type { PopoverProps }

