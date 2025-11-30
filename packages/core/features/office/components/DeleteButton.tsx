import { Trash2 } from '@tamagui/lucide-icons'
import { useToastController } from '@tamagui/toast'
import { useState } from 'react'
import { Button, Spinner, Text, XStack, YStack } from 'tamagui'
import { Dialog } from '@scaffald/neue-ui'

interface DeleteButtonProps {
  /**
   * Name of the item being deleted (displayed in confirmation)
   */
  itemName: string
  /**
   * Type of item (e.g., "job", "user", "university")
   */
  itemType: string
  /**
   * Async function to execute the delete operation
   */
  onDelete: () => Promise<void>
  /**
   * Optional size for the button
   */
  size?: '$2' | '$3' | '$4'
  /**
   * Optional variant for the button
   */
  variant?: 'outlined'
}

/**
 * Reusable delete button with confirmation dialog
 *
 * Shows a confirmation dialog before executing the delete operation.
 * Displays loading state during deletion and shows success/error toasts.
 *
 * @example
 * ```tsx
 * <DeleteButton
 *   itemName="John Doe"
 *   itemType="user"
 *   onDelete={async () => {
 *     await deleteMutation.mutateAsync({ id: userId })
 *   }}
 * />
 * ```
 */
export function DeleteButton({
  itemName,
  itemType,
  onDelete,
  size = '$2',
  variant = 'outlined',
}: DeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const toast = useToastController()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
      toast.show('Success', {
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`,
      })
      setIsOpen(false)
    } catch (error) {
      toast.show('Error', {
        message: error instanceof Error ? error.message : `Failed to delete ${itemType}`,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        theme="error"
        icon={Trash2}
        onPress={() => setIsOpen(true)}
        disabled={isDeleting}
      >
        Delete
      </Button>

      <Dialog modal open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay key="overlay" />
          <Dialog.Content key="content" width={500}>
            <Dialog.Title>Confirm Delete</Dialog.Title>
            <Dialog.Description>
              Are you sure you want to delete <Text fontWeight="600">"{itemName}"</Text>?
            </Dialog.Description>

            <YStack gap="$2">
              <Text color="$red10" fontSize="$3">
                This action cannot be undone. This will permanently delete the {itemType} and all
                associated data.
              </Text>
            </YStack>

            <XStack gap="$3" items="center" justify="flex-end">
              <Dialog.Close asChild>
                <Button variant="outlined" disabled={isDeleting}>
                  Cancel
                </Button>
              </Dialog.Close>

              <Button
                theme="error"
                onPress={handleDelete}
                disabled={isDeleting}
                icon={isDeleting ? <Spinner /> : Trash2}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </XStack>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
