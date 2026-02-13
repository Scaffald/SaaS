/**
 * SidebarMenuItem component
 * Individual menu item for Sidebar navigation
 * Maps to Figma "Side Menu Item" component
 *
 * @example
 * ```tsx
 * import { SidebarMenuItem } from '@scaffald/ui'
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
import { View, Text, Pressable, Platform } from 'react-native'
import type { SidebarMenuItemProps, SidebarItemType } from './Sidebar.types'
import { useSidebarContext } from './Sidebar'
import { getSidebarMenuItemStyles, getIconColor } from './SidebarMenuItem.styles'
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
  const [isHovered, setIsHovered] = useState(false)

  // Determine actual state
  const actualState = disabled ? 'disabled' : stateProp || (isHovered ? 'hover' : 'default')

  // Use variant-specific active color if available
  const activeBackgroundColor = activeColor || '#000000'

  // Get styles from factory function
  const styles = getSidebarMenuItemStyles(type, actualState, theme, collapsed, activeBackgroundColor)

  // Handle item types that don't need interactive rendering
  if (type === 'heading') {
    return (
      <View style={[styles.headingContainer, style]}>
        {!collapsed && label && <Text style={styles.headingText}>{label}</Text>}
      </View>
    )
  }

  if (type === 'divider') {
    return <View style={[styles.dividerContainer, style]} />
  }


  const iconSize = 20

  // Render leading content (icon or avatar)
  const renderLeading = () => {
    if (avatar) {
      // For double type (user profile), don't constrain avatar size
      if (type === 'double') {
        return avatar
      }
      return <View style={{ width: iconSize, height: iconSize }}>{avatar}</View>
    }
    if (IconComponent) {
      const iconColor = getIconColor(actualState, theme)
      return (
        <View style={{ width: iconSize, height: iconSize }}>
          <IconComponent size={iconSize} color={iconColor} />
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
      const badgeStyle = {
        ...styles.badge,
        minWidth: typeof badge === 'number' && badge > 9 ? 20 : 16,
      }
      trailingItems.push(
        <View key="badge" style={badgeStyle}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )
    }

    if (count !== undefined && !collapsed) {
      trailingItems.push(
        <Text key="count" style={styles.countText}>
          {count}
        </Text>
      )
    }

    if (showExpandIcon && !collapsed) {
      const iconColor = getIconColor(actualState, theme)
      trailingItems.push(
        <View
          key="expand"
          style={{
            transform: [{ rotate: expanded ? '90deg' : '0deg' }],
            width: 16,
            height: 16,
          }}
        >
          <ChevronRight size={16} color={iconColor} />
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
    <View style={[styles.item, style]}>
      {/* Leading content */}
      {renderLeading()}

      {/* Text content */}
      {!collapsed && label && (
        <View style={styles.textContainer}>
          <Text
            style={[styles.label, type === 'double' ? styles.labelWithSupport : null, labelStyle]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {supportingText && type === 'double' && (
            <Text style={styles.supportingText} numberOfLines={1}>
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

  const accessibilityLabel = label || ((type as SidebarItemType) === 'heading' ? 'Heading' : 'Menu item')
  const accessibilityRole = (type as SidebarItemType) === 'heading' ? 'text' : 'button'
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
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => !disabled && setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
        id: id,
        'data-value': value,
      } as any)}
      style={({ pressed }) => [
        pressed && !disabled && actualState !== 'active' && {
          opacity: 0.8,
        },
      ]}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      accessibilityHint={showExpandIcon ? (expanded ? 'Collapse submenu' : 'Expand submenu') : undefined}
    >
      {wrappedContent}
    </Pressable>
  )
}


