import type { ComponentType } from 'react'
import type { SheetProps } from 'tamagui'

declare const SheetFrame: ComponentType<any>
declare const SheetOverlay: ComponentType<any>
declare const TamaguiSheet: ComponentType<SheetProps> & {
  Handle: ComponentType<any>
}

export type SheetComponent = ComponentType<SheetProps> & {
  Frame: typeof SheetFrame
  Overlay: typeof SheetOverlay
  Handle: typeof TamaguiSheet.Handle
}

declare const Sheet: SheetComponent
export { Sheet }
export type { SheetProps }

