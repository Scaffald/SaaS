import type { ReactNode } from 'react'
import { Button, Paragraph, Text, XStack, YStack } from 'tamagui'
import { ResponsiveModal } from '../ResponsiveModal'

export interface TableAddRecordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  children?: ReactNode
  primaryActionLabel?: string
  onPrimaryAction?: () => void
  isPrimaryActionLoading?: boolean
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
}

/**
 * A general purpose modal for creating new entities from a data table.
 * Provides a consistent chrome for add flows, while allowing callers to supply
 * custom form content. Includes a default placeholder that can be replaced
 * later with a real form.
 */
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
  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={title} size="medium">
      <YStack gap="$4">
        <Paragraph size="$4" color="$color11">
          {description}
        </Paragraph>

        {children ?? (
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600">
              Placeholder Form
            </Text>
            <Paragraph size="$3" color="$color10">
              Replace this placeholder with the actual create form when the flow is ready.
            </Paragraph>
          </YStack>
        )}

        <XStack gap="$3" justify="flex-end">
          <Button
            variant="outlined"
            onPress={() => {
              onSecondaryAction?.()
              onOpenChange(false)
            }}
          >
            {secondaryActionLabel}
          </Button>
          <Button onPress={onPrimaryAction} disabled={isPrimaryActionLoading}>
            {primaryActionLabel}
          </Button>
        </XStack>
      </YStack>
    </ResponsiveModal>
  )
}
