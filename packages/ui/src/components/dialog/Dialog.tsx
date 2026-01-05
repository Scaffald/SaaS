import { forwardRef } from 'react'
import type { ComponentType } from 'react'
// Import Dialog directly from tamagui to preserve static properties (Overlay, Content, etc.)
// The re-export through @unicornlove/ui doesn't preserve static properties
import { Dialog as TamaguiDialog, withStaticProperties } from 'tamagui'
import type { DialogProps, DialogOverlayProps, DialogContentProps } from 'tamagui'

/**
 * Custom Dialog.Overlay with default styling
 * Ensures consistent overlay appearance across all dialogs
 */
const DialogOverlay = forwardRef<HTMLDivElement, DialogOverlayProps>((props, ref) => (
  <TamaguiDialog.Overlay
    ref={ref}
    animation="quick"
    opacity={0.5}
    enterStyle={{ opacity: 0 } as const}
    exitStyle={{ opacity: 0 } as const}
    {...props}
  />
))

DialogOverlay.displayName = 'DialogOverlay'

/**
 * Custom Dialog.Content with default styling
 * Provides consistent dialog content appearance, animations, and layout
 */
const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>((props, ref) => (
  <TamaguiDialog.Content
    ref={ref}
    bordered
    elevate
    animateOnly={['transform', 'opacity']}
    animation={[
      'quick',
      {
        opacity: {
          overshootClamping: true,
        },
      },
    ]}
    enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 } as const}
    exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 } as const}
    gap="$4"
    backgroundColor="$background"
    minWidth={400}
    maxWidth="90vw"
    {...props}
  />
))

DialogContent.displayName = 'DialogContent'

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
  Portal: TamaguiDialog.Portal,
  Title: TamaguiDialog.Title,
  Description: TamaguiDialog.Description,
  Close: TamaguiDialog.Close,
}) as unknown as DialogComponent

export type { DialogProps }
