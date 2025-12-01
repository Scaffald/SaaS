import type { ComponentType } from 'react'
import type { DialogProps } from 'tamagui'

declare const DialogOverlay: ComponentType<any>
declare const DialogContent: ComponentType<any>
declare const TamaguiDialog: ComponentType<DialogProps> & {
  Portal: ComponentType<any>
  Title: ComponentType<any>
  Description: ComponentType<any>
  Close: ComponentType<any>
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

