/**
 * SidebarMenuItem component
 * Individual menu item for Sidebar navigation
 * Maps to Figma "Side Menu Item" component
 *
 * @example
 * ```tsx
 * import { SidebarMenuItem } from '@unicornlove/beyond-ui'
 *
 * // Default item
 * <SidebarMenuItem icon={DashboardIcon} label="Dashboard" state="active" />
 *
 * // With badge
 * <SidebarMenuItem icon={NotificationsIcon} label="Notifications" badge={3} />
 *
 * // With toggle
 * <SidebarMenuItem
 *   icon={SettingsIcon}
 *   label="Dark Mode"
 *   showToggle
 *   toggleValue={darkMode}
 *   onToggleChange={setDarkMode}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import type { ViewStyle, } from 'react-native'
import type { SidebarMenuItemProps } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { Toggle } from '../Toggle'
import { ChevronRight } from 'lucide-react-native'

/**
 * SidebarMenuItem component
 */
export function SidebarMenuItem({
  type = 'default',
  state: stateProp,
  label,
  supportingText,
  icon: IconComponent,
  badge,
  showToggle = false,
  toggleValue = false,
  onToggleChange,
  count,
  avatar,
  showExpandIcon = false,
  expanded = false,
  onExpand,
  buttonText,
  onPress,
  disabled = false,
  children,
  style,
  labelStyle,
  id,
  value,
}: SidebarMenuItemProps) {
  const { collapsed, theme, activeColor } = useSidebarContext()
  const isLight = theme === 'light'
  const [isHovered, setIsHovered] = useState(false)

  // Determine actual state
  const actualState = disabled ? 'disabled' : stateProp || (isHovered ? 'hover' : 'default')

  // Use variant-specific active color if available
  const activeBackgroundColor = activeColor || colors.primary[500]

  // Handle item types that don't need interactive rendering
  if (type === 'heading') {
    return (
      <View style={[styles.headingContainer, { paddingHorizontal: collapsed ? spacing[12] : spacing[12] }, style]}>
        {!collapsed && label && (
          <Text style={[styles.headingText, { color: isLight ? colors.text.light.secondary : colors.text.dark.secondary }]}>
            {label}
          </Text>
        )}
      </View>
    )
  }

  if (type === 'divider') {
    return (
      <View
        style={[
          styles.dividerContainer,
          {
            marginHorizontal: spacing[12],
            marginVertical: spacing[8],
            borderTopWidth: 1,
            borderTopColor: isLight ? colors.border.light.default : colors.border.dark.default,
          },
          style,
        ]}
      />
    )
  }

  // Get styles based on state
  const getItemStyles = (): ViewStyle[] => {
    const baseStyles: ViewStyle[] = [
      styles.item,
      {
        paddingHorizontal: collapsed ? spacing[12] : spacing[12],
        paddingVertical: spacing[8],
        marginHorizontal: spacing[4],
        marginVertical: spacing[2],
        borderRadius: borderRadius.s,
      },
    ]

    // Background color based on state
    if (actualState === 'active') {
      baseStyles.push({
        backgroundColor: activeBackgroundColor,
      })
    } else if (actualState === 'hover' && !disabled) {
      baseStyles.push({
        backgroundColor: isLight ? colors.bg.light.subtle : colors.bg.dark.subtle,
      })
    }

    // Child type indentation
    if (type === 'child') {
      baseStyles.push({
        marginLeft: collapsed ? 0 : spacing[24],
      })
    }

    return baseStyles
  }

  // Get text color based on state
  const getTextColor = (): string => {
    if (actualState === 'disabled') {
      return isLight ? colors.text.light.disabled : colors.text.dark.disabled
    }
    if (actualState === 'active') {
      return colors.white
    }
    return isLight ? colors.text.light.primary : colors.text.dark.primary
  }

  // Get icon color based on state
  const getIconColor = (): string => {
    if (actualState === 'disabled') {
      return isLight ? colors.text.light.disabled : colors.text.dark.disabled
    }
    if (actualState === 'active') {
      return colors.white
    }
    return isLight ? colors.icon.light.default : colors.icon.dark.default
  }

  const iconSize = 20

  // Render leading content (icon or avatar)
  const renderLeading = () => {
    if (avatar) {
      return <View style={{ width: iconSize, height: iconSize }}>{avatar}</View>
    }
    if (IconComponent) {
      return (
        <View style={{ width: iconSize, height: iconSize }}>
          <IconComponent size={iconSize} color={getIconColor()} />
        </View>
      )
    }
    return null
  }

  // Render trailing content (badge, count, toggle, expand icon)
  const renderTrailing = () => {
    const trailingItems: React.ReactNode[] = []

    if (showToggle && !collapsed) {
      trailingItems.push(
        <Toggle
          key="toggle"
          checked={toggleValue}
          onChange={onToggleChange}
          size="sm"
          disabled={disabled}
        />
      )
    }

    if (badge !== undefined && !collapsed) {
      trailingItems.push(
        <View
          key="badge"
          style={[
            styles.badge,
            {
              backgroundColor: colors.error[500],
              minWidth: typeof badge === 'number' && badge > 9 ? 20 : 16,
            },
          ]}
        >
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )
    }

    if (count !== undefined && !collapsed) {
      trailingItems.push(
        <Text key="count" style={[styles.countText, { color: getTextColor() }]}>
          {count}
        </Text>
      )
    }

    if (showExpandIcon && !collapsed) {
      trailingItems.push(
        <View
          key="expand"
          style={[
            { transform: [{ rotate: expanded ? '90deg' : '0deg' }] },
            { width: 16, height: 16 },
          ]}
        >
          <ChevronRight size={16} color={getIconColor()} />
        </View>
      )
    }

    if (type === 'cta' && buttonText && !collapsed) {
      trailingItems.push(
        <Pressable
          key="button"
          onPress={onPress}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaButtonText}>{buttonText}</Text>
        </Pressable>
      )
    }

    return trailingItems.length > 0 ? <View style={styles.trailing}>{trailingItems}</View> : null
  }

  const itemContent = (
    <View style={[...getItemStyles(), style]}>
      {/* Leading content */}
      {renderLeading()}

      {/* Text content */}
      {!collapsed && (
        <View style={styles.textContainer} flex={1}>
          {label && (
            <Text
              style={[
                styles.label,
                { color: getTextColor() },
                type === 'double' ? styles.labelWithSupport : null,
                labelStyle,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          )}
          {supportingText && type === 'double' && (
            <Text
              style={[
                styles.supportingText,
                { color: actualState === 'active' ? colors.white : getTextColor() },
              ]}
              numberOfLines={1}
            >
              {supportingText}
            </Text>
          )}
        </View>
      )}

      {/* Trailing content */}
      {renderTrailing()}
    </View>
  )

  // Handle expand/collapse on press if item has children
  const handlePress = () => {
    if (children && showExpandIcon && onExpand) {
      onExpand()
    }
    if (onPress) {
      onPress()
    }
  }

  // Render with pressable wrapper if interactive
  if (type === 'cta' || disabled) {
    return itemContent
  }

  const wrappedContent = (
    <>
      {itemContent}
      {/* Submenu items */}
      {expanded && !collapsed && children && (
        <View style={styles.submenu}>{children}</View>
      )}
    </>
  )

  // If no onPress handler but has expand handler, still make it pressable
  if (!onPress && !onExpand) {
    return wrappedContent
  }

  const accessibilityLabel = label || (type === 'heading' ? 'Heading' : 'Menu item')
  const accessibilityRole = type === 'heading' ? 'text' : 'button'
  const accessibilityState = {
    disabled,
    selected: actualState === 'active',
    expanded: expanded && showExpandIcon,
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      onPressIn={() => !disabled && setIsHovered(true)}
      onPressOut={() => setIsHovered(false)}
      // @ts-expect-error - web-specific props
      onMouseEnter={Platform.OS === 'web' ? () => !disabled && setIsHovered(true) : undefined}
      // @ts-expect-error - web-specific props
      onMouseLeave={Platform.OS === 'web' ? () => setIsHovered(false) : undefined}
      style={({ pressed }) => [
        pressed && !disabled && actualState !== 'active' && {
          opacity: 0.8,
        },
      ]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      accessibilityHint={showExpandIcon ? (expanded ? 'Collapse submenu' : 'Expand submenu') : undefined}
      // @ts-expect-error - web-specific props
      id={id}
      // @ts-expect-error - web-specific props
      data-value={value}
    >
      {wrappedContent}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    minHeight: 40,
  },
  headingContainer: {
    paddingVertical: spacing[8],
  },
  headingText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.bodyMedium.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.bodyMedium.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dividerContainer: {
    height: 1,
  },
  textContainer: {
    flex: 1,
    gap: spacing[2],
  },
  label: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.body.lineHeight,
  },
  labelWithSupport: {
    fontWeight: typography.bodyMedium.fontWeight,
  },
  supportingText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  badge: {
    height: 16,
    paddingHorizontal: 4,
    borderRadius: borderRadius.max,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: typography.caption.fontFamily,
    fontSize: typography.caption.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.white,
    lineHeight: 16,
  },
  countText: {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
  },
  ctaButton: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.s,
    backgroundColor: colors.primary[500],
  },
  ctaButtonText: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    color: colors.white,
  },
  submenu: {
    marginLeft: spacing[24],
    gap: spacing[2],
  },
})

