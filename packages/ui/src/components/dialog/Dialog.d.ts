import type { ComponentType, ReactNode } from 'react'
import type { DialogProps, ViewProps } from 'tamagui'

type ViewPropsWithChildren = Omit<ViewProps, 'children'> & { children?: ReactNode }

declare const DialogOverlay: ComponentType<ViewPropsWithChildren>
declare const DialogContent: ComponentType<ViewPropsWithChildren>
declare const TamaguiDialog: ComponentType<DialogProps> & {
  Portal: ComponentType<{ children?: ReactNode }>
  Title: ComponentType<ViewPropsWithChildren>
  Description: ComponentType<ViewPropsWithChildren>
  Close: ComponentType<ViewPropsWithChildren>
}

export type DialogComponent = ComponentType<DialogProps> & {
  Overlay: typeof DialogOverlay
  Content: typeof DialogContent
  Portal: typeof TamaguiDialog.Portal
  Title: typeof TamaguiDialog.Title
  Description: typeof TamaguiDialog.Description
  Close: typeof TamaguiDialog.Close
}

declare const Dialog: DialogComponent
export { Dialog }
export type { DialogProps }
