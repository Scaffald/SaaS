import type { ComponentType, ReactNode } from 'react'
import type { DialogProps, ViewProps } from 'tamagui'

declare const DialogOverlay: ComponentType<ViewProps>
declare const DialogContent: ComponentType<ViewProps>
declare const TamaguiDialog: ComponentType<DialogProps> & {
  Portal: ComponentType<{ children?: ReactNode }>
  Title: ComponentType<ViewProps>
  Description: ComponentType<ViewProps>
  Close: ComponentType<ViewProps>
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

