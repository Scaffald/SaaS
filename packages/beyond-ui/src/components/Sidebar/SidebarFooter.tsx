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

import { View, Text, Pressable, StyleSheet, } from 'react-native'
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
    <View style={[styles.container, style]}>
      {/* Action buttons */}
      {actions.length > 0 && (
        <View
          style={[
            styles.actionsWrapper,
            {
              paddingHorizontal: spacing[16],
              paddingVertical: 0,
              justifyContent: collapsed ? 'center' : 'space-between',
            },
          ]}
        >
          <View style={styles.actions}>
            {actions.map((action, index) => (
              <Pressable
                key={index}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    paddingHorizontal: spacing[12],
                    paddingVertical: spacing[8],
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
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: isLight ? colors.border.light.default : colors.border.dark.default,
          marginVertical: spacing[12],
        }}
      />

      {/* User profile section */}
      {user && (
        <View
          style={[
            styles.userSection,
            {
              paddingHorizontal: spacing[16],
              paddingBottom: spacing[10],
            },
          ]}
        >
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
                      color: isLight ? colors.text.light.secondary : colors.text.dark.secondary,
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[6],
  },
  avatarContainer: {
    width: 40,
    height: 40,
  },
  userInfo: {
    flex: 1,
    gap: spacing[2],
  },
  userName: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  userEmail: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.caption.lineHeight,
  },
})

