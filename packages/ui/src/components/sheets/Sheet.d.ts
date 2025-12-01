import type { ComponentType, ReactNode } from 'react'
import type { SheetProps, ViewProps } from 'tamagui'

type ViewPropsWithChildren = Omit<ViewProps, 'children'> & { children?: ReactNode }

declare const SheetFrame: ComponentType<ViewPropsWithChildren>
declare const SheetOverlay: ComponentType<ViewPropsWithChildren>
declare const TamaguiSheet: ComponentType<SheetProps> & {
  Handle: ComponentType<ViewPropsWithChildren>
}

export type SheetComponent = ComponentType<SheetProps> & {
  Frame: typeof SheetFrame
  Overlay: typeof SheetOverlay
  Handle: typeof TamaguiSheet.Handle
}

declare const Sheet: SheetComponent
export { Sheet }
export type { SheetProps }

