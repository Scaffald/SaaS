import { XStack } from 'tamagui'
import { Button, type ButtonProps } from '../buttons/Button'
import { Dialog } from './Dialog'

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
  const confirmVariantMap: Record<
    NonNullable<ConfirmationDialogProps['confirmTheme']>,
    NonNullable<ButtonProps['variant']>
  > = {
    blue: 'primary',
    green: 'secondary',
    red: 'danger',
  }
  const confirmVariant = confirmVariantMap[confirmTheme] ?? 'primary'

  const handleConfirm = () => {
    onConfirm()
    // Don't close here - let parent handle closing after async operations
  }

  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" />
        <Dialog.Content key="content" width={500}>
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{message}</Dialog.Description>
          <XStack gap="$3" items="center" justify="flex-end">
            <Dialog.Close asChild>
              <Button variant="outlined" disabled={isLoading}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button variant={confirmVariant} onPress={handleConfirm} disabled={isLoading}>
              {confirmLabel}
            </Button>
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
