import type { ComponentType, ReactNode } from 'react'
import type { PopoverProps, ViewProps } from 'tamagui'

declare const PopoverContent: ComponentType<ViewProps>
declare const TamaguiPopover: ComponentType<PopoverProps> & {
  Anchor: ComponentType<{ children?: ReactNode }>
  Trigger: ComponentType<ViewProps>
  Close: ComponentType<ViewProps>
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

