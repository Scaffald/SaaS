/**
 * TableAddRecordModal – modal for adding new records from a table (form chrome + actions)
 */

import { Modal, ModalHeader, ModalContent, ModalActions } from '../Modal'
import { Stack } from '../Layout'
import { Paragraph, Text } from '../Typography'
import { spacing } from '../../tokens/spacing'
import type { TableAddRecordModalProps } from './TableAddRecordModal.types'

export function TableAddRecordModal({
  open,
  onOpenChange,
  title = 'Add Item',
  description = 'Provide the necessary information below to create a new entry.',
  children,
  primaryActionLabel = 'Save',
  onPrimaryAction,
  isPrimaryActionLoading = false,
  secondaryActionLabel = 'Cancel',
  onSecondaryAction,
}: TableAddRecordModalProps) {
  const handleClose = () => onOpenChange(false)

  return (
    <Modal visible={open} onClose={handleClose} width={520}>
      <ModalHeader title={title} showCloseButton onClose={handleClose} />
      <ModalContent>
        <Stack gap={spacing[4]}>
          <Paragraph color="secondary">{description}</Paragraph>
          {children ?? (
            <Stack gap={spacing[3]}>
              <Text size="lg" weight="semibold">
                Placeholder Form
              </Text>
              <Paragraph color="tertiary">
                Replace this placeholder with the actual create form when the flow is ready.
              </Paragraph>
            </Stack>
          )}
        </Stack>
      </ModalContent>
      <ModalActions
        orientation="right"
        secondaryAction={{
          label: secondaryActionLabel,
          onPress: () => {
            onSecondaryAction?.()
            onOpenChange(false)
          },
        }}
        primaryAction={
          onPrimaryAction
            ? {
                label: primaryActionLabel,
                onPress: onPrimaryAction,
                loading: isPrimaryActionLoading,
                disabled: isPrimaryActionLoading,
              }
            : undefined
        }
      />
    </Modal>
  )
}
