/**
 * SidebarHeader component
 * Header section with logo/branding and collapse toggle
 * Maps to Figma sidebar header design
 *
 * @example
 * ```tsx
 * import { SidebarHeader } from '@scaffald/ui'
 *
 * <SidebarHeader
 *   title="Forsured"
 *   logo={<LogoIcon />}
 *   collapsed={isCollapsed}
 *   onCollapse={() => setIsCollapsed(!isCollapsed)}
 * />
 * ```
 */

import { View, Text, Pressable } from 'react-native'
import type { SidebarHeaderProps } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { getSidebarHeaderStyles } from './SidebarHeader.styles'
import { Menu, X } from 'lucide-react-native'

/**
 * SidebarHeader component
 */
export function SidebarHeader({
  logo,
  title,
  collapsed: collapsedProp,
  onCollapse,
  showCollapseButton = true,
  style,
}: SidebarHeaderProps) {
  const { collapsed: contextCollapsed, theme } = useSidebarContext()
  const collapsed = collapsedProp ?? contextCollapsed

  const styles = getSidebarHeaderStyles(theme, collapsed)
  const iconSize = 24

  return (
    <View style={[styles.container, style]}>
      {/* Logo */}
      {logo && <View style={styles.logoContainer}>{logo}</View>}

      {/* Title (optional) */}
      {!collapsed && title && (
        <Text style={styles.title}>
          {title}
        </Text>
      )}

      {/* Collapse toggle button */}
      {showCollapseButton && onCollapse && !collapsed && (
        <Pressable
          onPress={onCollapse}
          style={({ pressed }) => [
            styles.collapseButton,
            pressed && { opacity: 0.7 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <Menu size={iconSize} color={styles.iconColor} />
          ) : (
            <X size={iconSize} color={styles.iconColor} />
          )}
        </Pressable>
      )}
    </View>
  )
}

