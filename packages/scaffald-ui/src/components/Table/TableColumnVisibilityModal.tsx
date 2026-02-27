/**
 * TableColumnVisibilityModal – modal to toggle which table columns are visible
 */

import { useMemo } from 'react'
import { Modal, ModalHeader, ModalContent } from '../Modal'
import { Stack, Row, Separator } from '../Layout'
import { Paragraph, Text } from '../Typography'
import { Checkbox } from '../Checkbox'
import { spacing } from '../../tokens/spacing'
import type {
  TableColumnVisibilityModalProps,
  TableColumnVisibilityOption,
} from './TableColumnVisibilityModal.types'

export function TableColumnVisibilityModal({
  open,
  onOpenChange,
  columns,
  visibility,
  onVisibilityChange,
  title = 'Show Columns',
  minimumVisibleColumns = 1,
}: TableColumnVisibilityModalProps) {
  const handleClose = () => onOpenChange(false)

  const visibleCount = useMemo(() => {
    return columns.reduce((count, column) => {
      const isVisible = visibility[column.id] ?? true
      return column.disabled || !isVisible ? count : count + 1
    }, 0)
  }, [columns, visibility])

  const canDisableMore = visibleCount > minimumVisibleColumns

  return (
    <Modal visible={open} onClose={handleClose} width={520}>
      <ModalHeader title={title} showCloseButton onClose={handleClose} />
      <ModalContent>
        <Stack gap={spacing[3]}>
          <Paragraph color="secondary">
            Toggle which columns are visible in the table. At least{' '}
            {minimumVisibleColumns} column
            {minimumVisibleColumns === 1 ? '' : 's'} must remain enabled.
          </Paragraph>
          <Separator />
          <Stack gap={spacing[3]}>
            {columns.map((column: TableColumnVisibilityOption) => {
              const isVisible = visibility[column.id] ?? true
              const disableToggle =
                column.disabled ||
                (isVisible && !canDisableMore && !column.disabled)

              return (
                <Row key={column.id} gap={spacing[3]} align="center">
                  <Checkbox
                    checked={isVisible}
                    disabled={disableToggle}
                    onChange={(checked) => onVisibilityChange(column.id, checked)}
                  />
                  <Stack gap={spacing[1]} style={{ flex: 1 }}>
                    <Text size="md" weight="semibold">
                      {column.label}
                    </Text>
                    {column.description ? (
                      <Paragraph size="sm" color="tertiary">
                        {column.description}
                      </Paragraph>
                    ) : null}
                  </Stack>
                </Row>
              )
            })}
          </Stack>
        </Stack>
      </ModalContent>
    </Modal>
  )
}
