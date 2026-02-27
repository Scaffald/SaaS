import type { RouteKey } from '@scf/core/constants/routes'
import type { TranslationKey } from '@scf/core/locales'
import type { BarChart3 } from 'lucide-react-native'
import type { GestureResponderEvent } from 'react-native'

/**
 * Configuration for individual drawer menu items
 */
export type DrawerItemConfig = {
  key: string
  title?: string
  titleKey?: TranslationKey
  href: string
  routeKey?: RouteKey
  icon?: typeof BarChart3
  description?: string
  badge?: string
  disabled?: boolean
  subItems?: DrawerItemConfig[]
  hasChevron?: boolean
  isExpandable?: boolean
  /**
   * When true, the item's sub-items will be shown automatically when the route is active,
   * allowing the parent to act as a normal navigational link instead of relying on manual toggles.
   */
  expandOnActive?: boolean
  isCompleted?: boolean // Shows checkmark icon when true
  isOnCooldown?: boolean // Shows clock icon when true (overrides checkmark)
}

/**
 * Props for DrawerLink component
 */
export type DrawerLinkProps = {
  item: DrawerItemConfig
  pathname: string
  depth?: number
  expandedItems?: Set<string>
  onToggleExpanded?: (key: string) => void
  // Optional for drawer close functionality if needed
  onNavigate?: (href: string, event: GestureResponderEvent) => void
  isCollapsed?: boolean
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
