import type { ViewStyle } from 'react-native'

export interface TabBarItem {
  key: string
  label?: string
  icon: React.ReactNode
  selectedIcon?: React.ReactNode
  badge?: number
}

export interface TabBarProps {
  items: TabBarItem[]
  selectedKey: string
  onSelectionChange: (key: string) => void
  leadingAction?: React.ReactNode
  trailingAction?: React.ReactNode
  style?: ViewStyle
}
