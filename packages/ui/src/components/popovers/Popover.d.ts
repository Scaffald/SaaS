import type { ComponentType, ReactNode } from 'react'
import type { PopoverProps, ViewProps } from '@unicornlove/ui'

declare const PopoverContent: ComponentType<ViewProps>
declare const TamaguiPopover: ComponentType<PopoverProps> & {
  Anchor: ComponentType<{ children?: ReactNode }>
  Trigger: ComponentType<ViewProps>
  Portal: ComponentType<{ children?: ReactNode }>
  Overlay: ComponentType<ViewProps>
  Title: ComponentType<ViewProps>
  Description: ComponentType<ViewProps>
  Close: ComponentType<ViewProps>
  Sheet: ComponentType<ViewProps>
  FocusScope: ComponentType<ViewProps>
  Adapt: ComponentType<ViewProps>
}

// Include all Popover static properties from Tamagui, override Content
export type PopoverComponent = typeof TamaguiPopover & {
  Content: typeof PopoverContent
}

declare const Popover: PopoverComponent
export { Popover }
export type { PopoverProps }
