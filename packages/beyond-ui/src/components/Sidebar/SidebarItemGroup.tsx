/**
 * SidebarItemGroup component
 * Container for grouping related menu items with optional heading and divider
 *
 * @example
 * ```tsx
 * import { SidebarItemGroup, SidebarMenuItem } from '@unicornlove/beyond-ui'
 *
 * <SidebarItemGroup heading="Navigation" showDivider>
 *   <SidebarMenuItem icon={DashboardIcon} label="Dashboard" />
 *   <SidebarMenuItem icon={ClientsIcon} label="Clients" />
 * </SidebarItemGroup>
 * ```
 */

import { View, StyleSheet } from 'react-native'
import type { ViewStyle } from 'react-native'
import type { SidebarItemGroupProps } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { SidebarMenuItem } from './SidebarMenuItem'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'

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
  const { collapsed: contextCollapsed } = useSidebarContext()
  const collapsed = collapsedProp ?? contextCollapsed

  return (
    <View style={[styles.container, style]}>
      {/* Divider */}
      {showDivider && (
        <View
          style={[
            styles.divider,
            {
              marginHorizontal: spacing[12],
              marginVertical: spacing[8],
              borderTopWidth: borderWidth.thin,
              borderTopColor: colors.border.light.default,
            },
          ]}
        />
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

const styles = StyleSheet.create({
  container: {
    gap: spacing[4],
  },
  divider: {
    height: 1,
  },
  content: {
    gap: spacing[2],
  },
})

