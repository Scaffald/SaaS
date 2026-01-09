/**
 * SidebarHeader component
 * Header section with logo/branding and collapse toggle
 * Maps to Figma sidebar header design
 *
 * @example
 * ```tsx
 * import { SidebarHeader } from '@unicornlove/beyond-ui'
 *
 * <SidebarHeader
 *   title="Forsured"
 *   logo={<LogoIcon />}
 *   collapsed={isCollapsed}
 *   onCollapse={() => setIsCollapsed(!isCollapsed)}
 * />
 * ```
 */

import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import type { SidebarHeaderProps } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
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
  const isLight = theme === 'light'
  const collapsed = collapsedProp ?? contextCollapsed

  const iconSize = 24
  const iconColor = isLight ? colors.icon.light.default : colors.icon.dark.default

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacing[16],
          paddingVertical: spacing[12],
          borderBottomWidth: borderWidth.thin,
          borderBottomColor: isLight ? colors.border.light.default : colors.border.dark.default,
        },
        style,
      ]}
    >
      {/* Logo and title */}
      <View style={styles.content}>
        {logo && <View style={styles.logoContainer}>{logo}</View>}
        {!collapsed && title && (
          <Text
            style={[
              styles.title,
              {
                color: isLight ? colors.text.light.primary : colors.text.dark.primary,
              },
            ]}
          >
            {title}
          </Text>
        )}
      </View>

      {/* Collapse toggle button */}
      {showCollapseButton && onCollapse && (
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
            <Menu size={iconSize} color={iconColor} />
          ) : (
            <X size={iconSize} color={iconColor} />
          )}
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    flex: 1,
  },
  logoContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  collapseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.s,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
})

