import { Eye, Pencil, X } from 'lucide-react-native'
import { useEffect, useRef } from 'react'
import { Button, Row } from '@unicornlove/beyond-ui'
import { DeleteButton } from './DeleteButton'
import { DuplicateButton } from './DuplicateButton'

export interface RowActionOverlayProps<TData> {
  /** The row data */
  row: TData
  /** View action handler */
  onView?: (row: TData) => void
  /** Edit action handler */
  onEdit: (row: TData) => void
  /** Delete action handler */
  onDelete: (row: TData) => Promise<void>
  /** Duplicate action handler */
  onDuplicate?: (row: TData) => Promise<void>
  /** Position of the overlay */
  position: { x: number; y: number }
  /** Close handler */
  onClose: () => void
  /** Name of the item (for delete confirmation) */
  itemName: string
  /** Type of item (for delete confirmation) */
  itemType: string
}

/**
 * RowActionOverlay - Overlay that appears on table row click
 *
 * Shows View, Edit, Delete actions in an overlay positioned relative to the clicked row.
 * Dismisses on outside click or Escape key.
 *
 * @example
 * ```tsx
 * <RowActionOverlay
 *   row={selectedRow}
 *   position={{ x: 100, y: 200 }}
 *   onEdit={(row) => router.push(buildPath(ROUTES.OFFICE.CMS.JOBS.EDIT, { id: row.id }))}
 *   onDelete={async (row) => await deleteMutation.mutateAsync({ id: row.id })}
 *   onClose={() => setSelectedRow(null)}
 *   itemName={selectedRow.name}
 *   itemType="job"
 * />
 * ```
 */
export function RowActionOverlay<TData>({
  row,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  position,
  onClose,
  itemName,
  itemType,
}: RowActionOverlayProps<TData>) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    // Use setTimeout to avoid immediate dismissal on the click that opened the overlay
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [onClose])

  const handleDelete = async () => {
    await onDelete(row)
    onClose()
  }

  const handleDuplicate = async () => {
    if (onDuplicate) {
      await onDuplicate(row)
      onClose()
    }
  }

  return (
    <Row
      ref={overlayRef}
      position="absolute"
      backgroundColor="$color2"
      borderWidth={1}
      borderColor="$borderColor"
      borderRadius={16}
      padding="xs"
      gap={8}
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
      style={{
        zIndex: 1000,
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {onView && (
        <Button
          size="xs"
          variant="outline"
          icon={Eye}
          onPress={() => {
            onView(row)
            onClose()
          }}
        >
          View
        </Button>
      )}
      <Button
        size="xs"
        variant="outline"
        icon={Pencil}
        onPress={() => {
          onEdit(row)
          onClose()
        }}
      >
        Edit
      </Button>
      {onDuplicate && (
        <DuplicateButton
          itemName={itemName}
          itemType={itemType}
          onDuplicate={handleDuplicate}
          size="xs"
          variant="outline"
        />
      )}
      <DeleteButton
        itemName={itemName}
        itemType={itemType}
        onDelete={handleDelete}
        size="xs"
        variant="outline"
      />
      <Button size="xs" variant="outline" icon={X} onPress={onClose}>
        Close
      </Button>
    </Row>
  )
}
