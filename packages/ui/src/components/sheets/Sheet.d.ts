import type { ComponentType } from 'react'
import type { SheetProps, ViewProps } from 'tamagui'

declare const SheetFrame: ComponentType<ViewProps>
declare const SheetOverlay: ComponentType<ViewProps>
declare const TamaguiSheet: ComponentType<SheetProps> & {
  Handle: ComponentType<ViewProps>
}

export type SheetComponent = ComponentType<SheetProps> & {
  Frame: typeof SheetFrame
  Overlay: typeof SheetOverlay
  Handle: typeof TamaguiSheet.Handle
}

declare const Sheet: SheetComponent
export { Sheet }
export type { SheetProps }

