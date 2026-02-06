/**
 * TableActionBar type definitions
 */

import type { ReactNode } from 'react'

export interface TableActionBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  addLabel?: string
  onAddPress?: () => void
  leftAccessory?: ReactNode
  rightAccessory?: ReactNode
  addDisabled?: boolean
  showLabel?: string
  onShowPress?: () => void
  showDisabled?: boolean
  helperText?: string
}
