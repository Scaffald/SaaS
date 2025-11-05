import { Dialog, Button, XStack, YStack, Text } from 'tamagui'

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  message: string
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  confirmTheme?: 'red' | 'blue' | 'green'
  isLoading?: boolean
}

/**
 * Reusable confirmation dialog component
 *
 * Based on the pattern from DeleteButton.tsx but generalized for any confirmation use case
 *
 * @example
 * ```tsx
 * <ConfirmationDialog
 *   open={showDialog}
 *   onOpenChange={setShowDialog}
 *   title="Discard Changes?"
 *   message="You have unsaved changes. Are you sure you want to discard them?"
 *   confirmLabel="Discard Changes"
 *   cancelLabel="Keep Editing"
 *   confirmTheme="red"
 *   onConfirm={() => {
 *     reset(originalData)
 *   }}
 * />
 * ```
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTheme = 'blue',
  isLoading = false,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    // Don't close here - let parent handle closing after async operations
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="quick"
          opacity={0.5}
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
        />
        <Dialog.Content
          bordered
          elevate
          key="content"
          animateOnly={['transform', 'opacity']}
          animation={[
            'quick',
            {
              opacity: {
                overshootClamping: true,
              },
            },
          ]}
          enterStyle={{ x: 0, y: -20, opacity: 0, scale: 0.9 }}
          exitStyle={{ x: 0, y: 10, opacity: 0, scale: 0.95 }}
          gap="$4"
          width={500}
        >
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{message}</Dialog.Description>
          <XStack gap="$3" items="center" justify="flex-end">
            <Dialog.Close asChild>
              <Button variant="outlined" disabled={isLoading}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button theme={confirmTheme} onPress={handleConfirm} disabled={isLoading}>
              {confirmLabel}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
