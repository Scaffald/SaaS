import { Copy } from 'lucide-react-native'
import { useToast } from '@scaffald/ui'
import { useState } from 'react'
import { Button, Row, Stack, Modal, ModalContent, ModalHeader } from '@scaffald/ui'

interface DuplicateButtonProps {
  itemName: string
  itemType: string
  onDuplicate: () => Promise<void>
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outline'
}

/**
 * Reusable duplicate button with confirmation dialog
 *
 * Shows a confirmation dialog before executing the duplicate operation.
 * Displays loading state during duplication and shows success/error toasts.
 *
 * @example
 * ```tsx
 * <DuplicateButton
 *   itemName="Software Engineer"
 *   itemType="job"
 *   onDuplicate={async () => {
 *     await duplicateMutation.mutateAsync({ id: jobId })
 *   }}
 * />
 * ```
 */
export function DuplicateButton({
  itemName,
  itemType,
  onDuplicate,
  size = 'md',
  variant = 'outline',
}: DuplicateButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const toast = useToast()

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      await onDuplicate()
      toast.show({
        title: 'Success',
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} duplicated successfully`,
        variant: 'success',
      })
      setIsOpen(false)
    } catch (err) {
      toast.show({
        title: 'Error',
        message: err instanceof Error ? err.message : `Failed to duplicate ${itemType}`,
        variant: 'error',
      })
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        iconStart={Copy}
        onPress={() => setIsOpen(true)}
        disabled={isDuplicating}
      >
        Duplicate
      </Button>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)} width={500}>
        <ModalContent>
          <ModalHeader
            title={`Duplicate ${itemType.charAt(0).toUpperCase() + itemType.slice(1)}`}
            description={`Create a copy of "${itemName}"? A new ${itemType} will be created as a draft with "(Copy)" appended to the title. All settings, requirements, and team assignments will be copied.`}
            onClose={() => setIsOpen(false)}
          />
          <Stack gap={16}>
            <Row gap={12} align="center" justify="flex-end">
              <Button variant="outline" onPress={() => setIsOpen(false)} disabled={isDuplicating}>
                Cancel
              </Button>
              <Button
                onPress={handleDuplicate}
                disabled={isDuplicating}
                loading={isDuplicating}
                iconStart={Copy}
              >
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </Button>
            </Row>
          </Stack>
        </ModalContent>
      </Modal>
    </>
  )
}
