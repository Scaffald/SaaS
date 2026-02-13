/**
 * TableAddRecordModal type definitions
 */

import type { ReactNode } from 'react'

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
