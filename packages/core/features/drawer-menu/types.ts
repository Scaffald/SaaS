import type { JSX } from 'react'
import type { GestureResponderEvent } from 'react-native'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'

/**
 * Configuration for individual drawer menu items
 */
export type DrawerItemConfig = {
  key: string
  title: string
  href: string
  icon?: (props: { size?: number; color?: string }) => JSX.Element
  description?: string
  badge?: string
  disabled?: boolean
  subItems?: DrawerItemConfig[]
  hasChevron?: boolean
  isExpandable?: boolean
}

/**
 * Props for DrawerLink component
 */
export type DrawerLinkProps = {
  item: DrawerItemConfig
  pathname: string
  collapsed?: boolean
  depth?: number
  expandedItems?: Set<string>
  onToggleExpanded?: (key: string) => void
  // Optional for drawer close functionality if needed
  onNavigate?: (href: string, event: GestureResponderEvent) => void
}

/**
 * Configuration for drawer menu sections
 */
export type DrawerSectionConfig = {
  key: string
  title: string
  items: DrawerItemConfig[]
}

/**
 * Props for DrawerSection component
 */
export type DrawerSectionProps = {
  section: DrawerSectionConfig
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
  expandedItems?: Set<string>
  onToggleExpanded?: (key: string) => void
}

/**
 * Props for DrawerContent component
 */
export type DrawerContentProps = {
  pathname: string
  collapsed?: boolean
  onNavigate?: (href: string, event: GestureResponderEvent) => void
  expandedItems?: Set<string>
  onToggleExpanded?: (key: string) => void
  drawerProps?: DrawerContentComponentProps
}
