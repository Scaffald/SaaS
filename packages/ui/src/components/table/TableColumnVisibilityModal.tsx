import { useMemo } from 'react'
import { Paragraph, Separator, Text, XStack, YStack } from 'tamagui'
import { Checkbox } from '../inputs/Checkbox'
import { ResponsiveModal } from '../ResponsiveModal'

export interface TableColumnVisibilityOption {
  id: string
  label: string
  description?: string
  disabled?: boolean
}

export interface TableColumnVisibilityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: TableColumnVisibilityOption[]
  visibility: Record<string, boolean>
  onVisibilityChange: (columnId: string, visible: boolean) => void
  title?: string
  /**
   * Minimum number of columns that must remain visible. Defaults to 1.
   */
  minimumVisibleColumns?: number
}

export function TableColumnVisibilityModal({
  open,
  onOpenChange,
  columns,
  visibility,
  onVisibilityChange,
  title = 'Show Columns',
  minimumVisibleColumns = 1,
}: TableColumnVisibilityModalProps) {
  const visibleCount = useMemo(() => {
    return columns.reduce((count, column) => {
      const isVisible = visibility[column.id] ?? true
      return column.disabled || !isVisible ? count : count + 1
    }, 0)
  }, [columns, visibility])

  const canDisableMore = visibleCount > minimumVisibleColumns

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} title={title} size="medium">
      <YStack gap="$3">
        <Paragraph size="$4" color="$color11">
          Toggle which columns are visible in the table. At least {minimumVisibleColumns} column
          {minimumVisibleColumns === 1 ? '' : 's'} must remain enabled.
        </Paragraph>

        <Separator />

        <YStack gap="$3">
          {columns.map((column) => {
            const isVisible = visibility[column.id] ?? true
            const disableToggle =
              column.disabled || (!isVisible ? false : !canDisableMore && !column.disabled)

            return (
              <XStack key={column.id} gap="$3" items="center">
                <Checkbox
                  checked={isVisible}
                  disabled={disableToggle}
                  onCheckedChange={(checked) => onVisibilityChange(column.id, checked)}
                  aria-label={column.label}
                />
                <YStack gap="$1" flex={1}>
                  <Text fontSize="$4" fontWeight="600">
                    {column.label}
                  </Text>
                  {column.description ? (
                    <Paragraph size="$3" color="$color10">
                      {column.description}
                    </Paragraph>
                  ) : null}
                </YStack>
              </XStack>
            )
          })}
        </YStack>
      </YStack>
    </ResponsiveModal>
  )
}
