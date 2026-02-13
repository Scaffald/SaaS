import { Copy } from 'lucide-react-native'
import { useToast } from '@unicornlove/beyond-ui'
import { useState } from 'react'
import { Button, Spinner, Text, Row, Stack } from '@unicornlove/beyond-ui'
import { Dialog } from '@unicornlove/beyond-ui'

interface DuplicateButtonProps {
  /**
   * Name of the item being duplicated (displayed in confirmation)
   */
  itemName: string
  /**
   * Type of item (e.g., "job", "user", "university")
   */
  itemType: string
  /**
   * Async function to execute the duplicate operation
   */
  onDuplicate: () => Promise<void>
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
  size = '$2',
  variant = 'outlined',
}: DuplicateButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const toast = useToast()

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      await onDuplicate()
      toast.show('Success', {
        message: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} duplicated successfully`,
      })
      setIsOpen(false)
    } catch (error) {
      toast.show('Error', {
        message: error instanceof Error ? error.message : `Failed to duplicate ${itemType}`,
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

      <Dialog modal open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay key="overlay" />
          <Dialog.Content key="content" width={500}>
            <Dialog.Title>
              Duplicate {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
            </Dialog.Title>
            <Dialog.Description>
              Create a copy of <Text>"{itemName}"</Text>?
            </Dialog.Description>

            <Stack gap={8}>
              <Text color="$gray11">
                A new {itemType} will be created as a draft with "(Copy)" appended to the title. All
                settings, requirements, and team assignments will be copied.
              </Text>
            </Stack>

            <Row gap={12} align="center" justify="flex-end">
              <Dialog.Close asChild>
                <Button variant="outline" disabled={isDuplicating}>
                  Cancel
                </Button>
              </Dialog.Close>

              <Button
                onPress={handleDuplicate}
                disabled={isDuplicating}
                iconStart={isDuplicating ? <Spinner /> : Copy}
              >
                {isDuplicating ? 'Duplicating...' : 'Duplicate'}
              </Button>
            </Row>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  )
}
