/**
 * SidebarFooter component
 * Footer section with user profile and action buttons
 * Maps to Figma sidebar footer design
 *
 * @example
 * ```tsx
 * import { SidebarFooter } from '@scaffald/ui'
 * import { Avatar } from '@scaffald/ui'
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

import { View, Text, Pressable } from 'react-native'
import type { SidebarFooterProps } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { getSidebarFooterStyles } from './SidebarFooter.styles'
import { colors } from '../../tokens/colors'
import { Tooltip } from '../Tooltip/Tooltip'

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
  const collapsed = collapsedProp ?? contextCollapsed

  const styles = getSidebarFooterStyles(theme, collapsed)
  const actionIconSize = 20

  return (
    <View style={[styles.container, style]}>
      {/* Action buttons */}
      {actions.length > 0 && (
        <View style={styles.actionsWrapper}>
          <View style={styles.actions}>
            {actions.map((action) => {
              // Determine tooltip configuration
              const tooltipConfig = typeof action.tooltip === 'string'
                ? { content: action.tooltip, position: 'down-center' as const, delay: 200 }
                : action.tooltip
                ? { content: action.tooltip.content, position: action.tooltip.position || 'down-center' as const, delay: action.tooltip.delay || 200 }
                : null

              const actionButton = (
                <Pressable
                  key={action.id}
                  onPress={action.onPress}
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={action.label || action.id}
                >
                  <View style={{ width: actionIconSize, height: actionIconSize, position: 'relative' }}>
                    <action.icon size={actionIconSize} color={styles.iconColor} />
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
              )

              // Wrap with Tooltip if tooltip config is provided
              if (tooltipConfig) {
                return (
                  <Tooltip
                    key={action.id}
                    content={tooltipConfig.content}
                    arrowPosition={tooltipConfig.position}
                    delay={tooltipConfig.delay}
                  >
                    {actionButton}
                  </Tooltip>
                )
              }

              return actionButton
            })}
          </View>
        </View>
      )}

      {/* Divider */}
      <View style={styles.divider} />

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
                  style={styles.userName}
                  numberOfLines={1}
                >
                  {user.name}
                </Text>
              )}
              {user.email && (
                <Text
                  style={styles.userEmail}
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

