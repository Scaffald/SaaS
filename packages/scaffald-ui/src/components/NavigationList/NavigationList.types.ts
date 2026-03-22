/**
 * NavigationList types
 * iOS 26 sidebar navigation list with search, toolbar, sections, and hierarchical items
 */

import type { ReactNode } from 'react'
import type { ViewStyle } from 'react-native'

export interface NavigationListItem {
  key: string
  label: string
  icon?: ReactNode
  detail?: string
  accessoryType?: 'detail' | 'checkmark' | 'info' | 'disclosure' | 'toggle'
  accessoryChecked?: boolean
  onAccessoryToggle?: (value: boolean) => void
  disabled?: boolean
  /** Indentation level: 0 (default), 1, or 2 */
  indent?: number
  onPress?: () => void
}

export interface NavigationListSection {
  title?: string
  detail?: string
  showDisclosure?: boolean
  items: NavigationListItem[]
}

export interface NavigationListToolbarAction {
  label?: string
  icon?: ReactNode
  onPress: () => void
}

export interface NavigationListProps {
  sections: NavigationListSection[]
  selectedKey?: string
  onSelectionChange?: (key: string) => void
  searchValue?: string
  onSearchChange?: (text: string) => void
  searchPlaceholder?: string
  showSearch?: boolean
  toolbarActions?: NavigationListToolbarAction[]
  style?: ViewStyle
}
