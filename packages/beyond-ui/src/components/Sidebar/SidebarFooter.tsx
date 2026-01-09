/**
 * SidebarFooter component
 * Footer section with user profile and action buttons
 * Maps to Figma sidebar footer design
 *
 * @example
 * ```tsx
 * import { SidebarFooter } from '@unicornlove/beyond-ui'
 * import { Avatar } from '@unicornlove/beyond-ui'
 *
 * <SidebarFooter
 *   user={{
 *     name: "John Doe",
 *     email: "john@example.com",
 *     avatar: <Avatar src="avatar.jpg" />
 *   }}
 *   actions={[
 *     { icon: MessageCircleIcon, onPress: () => {}, label: "Messages" },
 *     { icon: BellIcon, onPress: () => {}, badge: 3 },
 *     { icon: SettingsIcon, onPress: () => {} }
 *   ]}
 * />
 * ```
 */

import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import type { ViewStyle } from 'react-native'
import type { SidebarFooterProps } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderWidth } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { borderRadius } from '../../tokens/borders'

/**
 * SidebarFooter component
 */
export function SidebarFooter({
  user,
  actions = [],
  collapsed: collapsedProp,
  style,
}: SidebarFooterProps) {
  const { collapsed: contextCollapsed, theme } = useSidebarContext()
  const isLight = theme === 'light'
  const collapsed = collapsedProp ?? contextCollapsed

  const actionIconSize = 20
  const iconColor = isLight ? colors.icon.light.default : colors.icon.dark.default

  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: spacing[16],
          paddingVertical: spacing[12],
          borderTopWidth: borderWidth.thin,
          borderTopColor: isLight ? colors.border.light.default : colors.border.dark.default,
        },
        style,
      ]}
    >
      {/* User profile section */}
      {user && (
        <View style={styles.userSection}>
          {user.avatar && (
            <View style={styles.avatarContainer}>{user.avatar}</View>
          )}
          {!collapsed && (
            <View style={styles.userInfo}>
              {user.name && (
                <Text
                  style={[
                    styles.userName,
                    {
                      color: isLight ? colors.text.light.primary : colors.text.dark.primary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {user.name}
                </Text>
              )}
              {user.email && (
                <Text
                  style={[
                    styles.userEmail,
                    {
                      color: isLight ? colors.text.light.tertiary : colors.text.dark.tertiary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {user.email}
                </Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* Action buttons */}
      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((action, index) => (
            <Pressable
              key={index}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  width: collapsed ? 32 : 'auto',
                  height: 32,
                  paddingHorizontal: collapsed ? 0 : spacing[8],
                },
                pressed && { opacity: 0.7 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={action.label || `Action ${index + 1}`}
            >
              <View style={{ width: actionIconSize, height: actionIconSize, position: 'relative' }}>
                <action.icon size={actionIconSize} color={iconColor} />
                {action.badge !== undefined && action.badge > 0 && (
                  <View
                    style={[
                      styles.actionBadge,
                      {
                        backgroundColor: colors.error[500],
                        minWidth: action.badge > 9 ? 16 : 12,
                        height: action.badge > 9 ? 16 : 12,
                      },
                    ]}
                  >
                    <Text style={styles.actionBadgeText}>
                      {action.badge > 9 ? '9+' : action.badge}
                    </Text>
                  </View>
                )}
              </View>
              {!collapsed && action.label && (
                <Text
                  style={[
                    styles.actionLabel,
                    {
                      color: isLight ? colors.text.light.primary : colors.text.dark.primary,
                    },
                  ]}
                >
                  {action.label}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[12],
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  avatarContainer: {
    width: 32,
    height: 32,
  },
  userInfo: {
    flex: 1,
    gap: spacing[2],
  },
  userName: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
  userEmail: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[6],
    borderRadius: borderRadius.s,
  },
  actionBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  actionBadgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: 8,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.white,
    lineHeight: 10,
  },
  actionLabel: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
})

