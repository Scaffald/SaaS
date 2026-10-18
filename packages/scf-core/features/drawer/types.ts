import type { RouteKey } from '@scf/core/constants/routes'
import type { TranslationKey } from '@scf/core/locales'
import type { BarChart3 } from 'lucide-react-native'
import type { GestureResponderEvent } from 'react-native'

/**
 * One entry in the navigation tree.
 *
 * Top-level entries are the drawer's sections. Their `subItems` are not drawn
 * in the drawer: they become the section's tab strip (see `sectionTabs.ts`),
 * across the top of every screen the section owns.
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
  /** When true, the item is only highlighted when the path matches exactly (no prefix matching) */
  exact?: boolean
  /**
   * Pathname prefix that counts as "inside" this item when it differs from
   * `href` — a tab whose landing page is one of several it owns, like Office
   * Compliance landing on EEO reports.
   */
  matchPrefix?: string
  /**
   * Further pathname prefixes this item owns beyond its own — pages that live
   * at a sibling path but belong to this tab, like the background check under
   * Profile's Verification tab (its breadcrumbs say so).
   */
  alsoOwns?: string[]
  isCompleted?: boolean // Shows checkmark icon when true
  isOnCooldown?: boolean // Shows clock icon when true (overrides checkmark)
}

/**
 * Props for DrawerLink component
 */
export type DrawerLinkProps = {
  item: DrawerItemConfig
  pathname: string
  // Optional for drawer close functionality if needed
  onNavigate?: (href: string, event?: GestureResponderEvent) => void
  isCollapsed?: boolean
  /**
   * Whether this row is the page's section. Decided once for the whole list
   * (activeNavKey) — two rows can own one page, by a prefix and a longer
   * prefix inside it, and only the more specific one should light. Falls back to the row's own ownership when omitted.
   */
  active?: boolean
}
