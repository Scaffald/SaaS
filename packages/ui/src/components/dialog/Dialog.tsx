import type { ComponentType } from 'react'
import { styled, Dialog as TamaguiDialog, withStaticProperties } from 'tamagui'
import type { DialogProps } from 'tamagui'

/**
 * Custom Dialog.Overlay with default styling
 * Ensures consistent overlay appearance across all dialogs
 */
const DialogOverlay = styled(TamaguiDialog.Overlay, {
  animation: 'quick',
  opacity: 0.5,
  enterStyle: { opacity: 0 },
  exitStyle: { opacity: 0 },
})

/**
 * Custom Dialog.Content with default styling
 * Provides consistent dialog content appearance, animations, and layout
 */
const DialogContent = styled(TamaguiDialog.Content, {
  bordered: true,
  elevate: true,
  animateOnly: ['transform', 'opacity'],
  animation: [
    'quick',
    {
      opacity: {
        overshootClamping: true,
      },
    },
  ],
  enterStyle: { x: 0, y: -20, opacity: 0, scale: 0.9 },
  exitStyle: { x: 0, y: 10, opacity: 0, scale: 0.95 },
  gap: '$4',
  bg: '$background',
  minW: 400,
  maxW: '90vw',
})

/**
 * Dialog - Custom dialog component with default styling
 *
 * This is a wrapper around Tamagui's Dialog component that ensures
 * all Dialog.Overlay and Dialog.Content instances have consistent
 * styling, animations, and behavior by default.
 *
 * Usage: Import Dialog from '@unicornlove/ui' and use it like Tamagui's Dialog.
 * All Dialog.Overlay and Dialog.Content components will automatically
 * have standardized styling applied.
 *
 * @example
 * ```tsx
 * <Dialog modal open={open} onOpenChange={setOpen}>
 *   <Dialog.Portal>
 *     <Dialog.Overlay key="overlay" />
 *     <Dialog.Content key="content" width={500}>
 *       <Dialog.Title>Title</Dialog.Title>
 *       <Dialog.Description>Description</Dialog.Description>
 *     </Dialog.Content>
 *   </Dialog.Portal>
 * </Dialog>
 * ```
 */
// Type definition for Dialog with static properties
type DialogComponent = ComponentType<DialogProps> & {
  Overlay: typeof DialogOverlay
  Content: typeof DialogContent
  // Include other Dialog static properties from Tamagui
  Portal: typeof TamaguiDialog.Portal
  Title: typeof TamaguiDialog.Title
  Description: typeof TamaguiDialog.Description
  Close: typeof TamaguiDialog.Close
}

// Use double assertion to bypass type inference for declaration generation
export const Dialog = withStaticProperties(TamaguiDialog, {
  Overlay: DialogOverlay,
  Content: DialogContent,
}) as unknown as DialogComponent

export type { DialogProps }
