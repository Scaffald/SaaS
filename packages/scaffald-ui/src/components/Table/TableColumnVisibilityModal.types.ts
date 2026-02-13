/**
 * TableColumnVisibilityModal type definitions
 */

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
  minimumVisibleColumns?: number
}
