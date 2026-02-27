/**
 * SidebarItemGroup component
 * Container for grouping related menu items with optional heading and divider
 *
 * @example
 * ```tsx
 * import { SidebarItemGroup, SidebarMenuItem } from '@scaffald/ui'
 *
 * <SidebarItemGroup heading="Navigation" showDivider>
 *   <SidebarMenuItem icon={DashboardIcon} label="Dashboard" />
 *   <SidebarMenuItem icon={ClientsIcon} label="Clients" />
 * </SidebarItemGroup>
 * ```
 */

import { View } from 'react-native'
import type { SidebarItemGroupProps } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { SidebarMenuItem } from './SidebarMenuItem'
import { getSidebarItemGroupStyles } from './SidebarItemGroup.styles'

/**
 * SidebarItemGroup component
 */
export function SidebarItemGroup({
  heading,
  showDivider = false,
  children,
  collapsed: collapsedProp,
  style,
}: SidebarItemGroupProps) {
  const { collapsed: contextCollapsed, theme } = useSidebarContext()
  const collapsed = collapsedProp ?? contextCollapsed

  const styles = getSidebarItemGroupStyles(theme)

  return (
    <View style={[styles.container, style]}>
      {/* Divider */}
      {showDivider && (
        <View style={styles.divider} />
      )}

      {/* Heading */}
      {heading && !collapsed && (
        <SidebarMenuItem type="heading" label={heading} />
      )}

      {/* Group content */}
      <View style={styles.content}>{children}</View>
    </View>
  )
}

