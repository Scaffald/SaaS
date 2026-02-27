import { Trash2 } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useState } from 'react'
import { Button, Row, Stack, Modal, ModalContent, ModalHeader } from '@scaffald/ui'

interface DeleteButtonProps {
  itemName: string
  itemType: string
  onDelete: () => Promise<void>
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outline'
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
  size = 'md',
  variant = 'outline',
}: DeleteButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const toast = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
      toast.show({
        title: 'Success',
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`,
        variant: 'success',
      })
      setIsOpen(false)
    } catch (err) {
      toast.show({
        title: 'Error',
        message: err instanceof Error ? err.message : `Failed to delete ${itemType}`,
        variant: 'error',
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
        color="error"
        iconStart={Trash2}
        onPress={() => setIsOpen(true)}
        disabled={isDeleting}
      >
        Delete
      </Button>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)} width={500}>
        <ModalContent>
          <ModalHeader
            title="Confirm Delete"
            description={`Are you sure you want to delete "${itemName}"? This action cannot be undone. This will permanently delete the ${itemType} and all associated data.`}
            onClose={() => setIsOpen(false)}
          />
          <Stack gap={16}>
            <Row gap={12} align="center" justify="flex-end">
              <Button variant="outline" onPress={() => setIsOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                color="error"
                onPress={handleDelete}
                disabled={isDeleting}
                loading={isDeleting}
                iconStart={Trash2}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </Row>
          </Stack>
        </ModalContent>
      </Modal>
    </>
  )
}
